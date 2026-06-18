import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, X, Info } from 'lucide-react';
import { createPeerConnection, monitorConnectionStats } from '../utils/webrtc';
import VideoPlayer from './VideoPlayer';
import ChatPanel from './ChatPanel';

export default function WatchRoom({ connectionDetails, serverUrl, onLeave }) {
  const { roomName, password, userName, role } = connectionDetails;
  
  // Connection / Socket State
  const [socket, setSocket] = useState(null);
  const [activeUsers, setActiveUsers] = useState({ host: null, viewer: null });
  const [peerConnected, setPeerConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // WebRTC Stream States
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [streamState, setStreamState] = useState({ isStreaming: false, isMuted: false });
  const [stats, setStats] = useState(null);

  // Local Controls
  const [localVolume, setLocalVolume] = useState(1);
  const [isLocalMuted, setIsLocalMuted] = useState(false);
  const [isHostMuted, setIsHostMuted] = useState(false);

  // Chat & Messaging
  const [messages, setMessages] = useState([]);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  // Interactive Action Effects Overlay States
  const [popcorns, setPopcorns] = useState([]);
  const [showBonk, setShowBonk] = useState(false);
  const [bonkSender, setBonkSender] = useState('');
  const [showHug, setShowHug] = useState(false);
  const [hugSender, setHugSender] = useState('');
  const [showWakeup, setShowWakeup] = useState(false);
  const [wakeupSender, setWakeupSender] = useState('');
  const [hearts, setHearts] = useState([]);

  // Mobile Drawer State
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // WebRTC Connection References
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);

  // Handle window resize for mobile check
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Set up Socket.IO Connection and event listeners
  useEffect(() => {
    const newSocket = io(serverUrl);
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      newSocket.emit('join-room', { roomName, password, userName, role });
    });

    newSocket.on('join-error', (msg) => {
      setErrorMsg(msg);
      // Clean up after 3 seconds and leave
      setTimeout(() => {
        onLeave();
      }, 3000);
    });

    newSocket.on('room-joined', ({ role: joinedRole, history, activeUsers: users, streamState: serverStreamState }) => {
      setMessages(history);
      setActiveUsers(users);
      setStreamState(serverStreamState);
    });

    newSocket.on('peer-joined', ({ socketId, userName: peerName, role: peerRole }) => {
      setActiveUsers((prev) => ({
        ...prev,
        [peerRole]: peerName
      }));
      setPeerConnected(true);

      // If we are the Host and we have a local stream, initiate connection
      if (role === 'host' && localStreamRef.current) {
        initiateWebRTCConnection(socketId);
      }
    });

    newSocket.on('peer-left', ({ role: leftRole, userName: leftName }) => {
      setActiveUsers((prev) => ({
        ...prev,
        [leftRole]: null
      }));
      setPeerConnected(false);
      
      if (role === 'viewer') {
        setRemoteStream(null);
        setStreamState({ isStreaming: false, isMuted: false });
      }
      cleanupPeerConnection();
    });

    // Signaling Relay
    newSocket.on('signal', async ({ from, signal }) => {
      try {
        if (signal.type === 'offer') {
          await handleRemoteOffer(from, signal);
        } else if (signal.type === 'answer') {
          await handleRemoteAnswer(signal);
        } else if (signal.type === 'candidate') {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        }
      } catch (err) {
        console.error('Error handling WebRTC signal:', err);
      }
    });

    // Chat Message
    newSocket.on('message-received', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Typing
    newSocket.on('user-typing', ({ userName: typingUser, isTyping }) => {
      if (typingUser !== userName) {
        setOtherUserTyping(isTyping);
      }
    });

    // Stream status update from Host
    newSocket.on('stream-state-updated', (state) => {
      setStreamState(state);
    });

    // End session command from Host
    newSocket.on('session-ended', () => {
      alert('The Host has ended this movie session. 🎀');
      onLeave();
    });

    // Interactive Action Effects Triggers
    newSocket.on('action-triggered', ({ actionType, senderName }) => {
      if (actionType === 'popcorn') {
        triggerPopcornEffect();
      } else if (actionType === 'heart-burst') {
        triggerHeartBurstEffect();
      } else if (actionType === 'bonk') {
        triggerBonkEffect(senderName);
      } else if (actionType === 'hug') {
        triggerHugEffect(senderName);
      } else if (actionType === 'wakeup') {
        triggerWakeupEffect(senderName);
      }
    });

    return () => {
      newSocket.close();
      cleanupPeerConnection();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomName, password, role]);

  // Clean up WebRTC peer connection
  const cleanupPeerConnection = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setStats(null);
  };

  // 2. WebRTC Logic - Host initiates
  const initiateWebRTCConnection = (viewerSocketId) => {
    cleanupPeerConnection();

    const pc = createPeerConnection(
      // onIceCandidate
      (candidate) => {
        socketRef.current.emit('signal', { to: viewerSocketId, signal: { type: 'candidate', candidate } });
      },
      // onTrack
      null, // Host doesn't receive tracks
      // onConnectionStateChange
      (state) => {
        console.log(`Connection state change: ${state}`);
        if (state === 'connected') setPeerConnected(true);
        if (state === 'disconnected' || state === 'failed') setPeerConnected(false);
      }
    );

    peerConnectionRef.current = pc;

    // Add Host's local screen share stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Create SDP Offer
    pc.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false })
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => {
        socketRef.current.emit('signal', {
          to: viewerSocketId,
          signal: { type: 'offer', sdp: pc.localDescription.sdp }
        });
      })
      .catch((err) => console.error('Failed to create offer:', err));

    // Monitor statistics
    monitorConnectionStats(pc, (webrtcStats) => {
      setStats(webrtcStats);
    });
  };

  // 2b. WebRTC Logic - Viewer handles offer
  const handleRemoteOffer = async (hostSocketId, signal) => {
    cleanupPeerConnection();

    const pc = createPeerConnection(
      // onIceCandidate
      (candidate) => {
        socketRef.current.emit('signal', { to: hostSocketId, signal: { type: 'candidate', candidate } });
      },
      // onTrack
      (remoteStreamObj) => {
        setRemoteStream(remoteStreamObj);
      },
      // onConnectionStateChange
      (state) => {
        console.log(`Connection state change: ${state}`);
        if (state === 'connected') setPeerConnected(true);
      }
    );

    peerConnectionRef.current = pc;

    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socketRef.current.emit('signal', {
      to: hostSocketId,
      signal: { type: 'answer', sdp: pc.localDescription.sdp }
    });

    monitorConnectionStats(pc, (webrtcStats) => {
      setStats(webrtcStats);
    });
  };

  // 2c. WebRTC Logic - Host handles answer
  const handleRemoteAnswer = async (signal) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
    }
  };

  // 3. Screen Sharing Trigger (Host)
  const startScreenShare = async () => {
    try {
      // Capture screen and system audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Handle stream end when user clicks "Stop sharing" default browser bar
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      // Update stream state on server
      const newStreamState = { isStreaming: true, isMuted: isHostMuted };
      setStreamState(newStreamState);
      socketRef.current.emit('update-stream-state', newStreamState);

      // If viewer is already connected in the room, negotiate right away
      if (activeUsers.viewer) {
        // Find viewer connection from server
        // We can just trigger negotiation
        socketRef.current.emit('update-stream-state', newStreamState);
      }
      
      // Forces re-sync by broadcasting join details
      socketRef.current.emit('join-room', { roomName, password, userName, role });

    } catch (err) {
      console.error('Error starting screen share:', err);
    }
  };

  const stopScreenShare = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    cleanupPeerConnection();

    const newStreamState = { isStreaming: false, isMuted: false };
    setStreamState(newStreamState);
    if (socketRef.current) {
      socketRef.current.emit('update-stream-state', newStreamState);
    }
  };

  const toggleHostMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const nextMuted = !isHostMuted;
      audioTracks.forEach(track => {
        track.enabled = !nextMuted;
      });
      setIsHostMuted(nextMuted);

      const nextState = { ...streamState, isMuted: nextMuted };
      setStreamState(nextState);
      socketRef.current.emit('update-stream-state', nextState);
    }
  };

  const toggleLocalMute = () => {
    setIsLocalMuted(!isLocalMuted);
  };

  const handleVolumeChange = (vol) => {
    setLocalVolume(vol);
    setIsLocalMuted(vol === 0);
    const video = document.querySelector('.video-element');
    if (video) {
      video.volume = vol;
    }
  };

  const handleEndSession = () => {
    if (window.confirm('Are you sure you want to end this movie night for everyone, pookie? 🥺')) {
      socketRef.current.emit('end-session');
      onLeave();
    }
  };

  // 4. Send Message & Typing Status
  const handleSendMessage = (text) => {
    if (socketRef.current) {
      socketRef.current.emit('send-message', { text });
    }
  };

  const handleSendTyping = (isTyping) => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { isTyping });
    }
  };

  const handleTriggerAction = (actionType) => {
    if (socketRef.current) {
      socketRef.current.emit('trigger-action', { actionType });
    }
  };

  // 5. Interactive Animation Triggers
  const triggerPopcornEffect = () => {
    const newPopcorns = Array.from({ length: 15 }).map((_, i) => ({
      id: Math.random() + i,
      left: Math.random() * 85 + 5, // Random X location %
      delay: Math.random() * 0.8
    }));
    setPopcorns((prev) => [...prev, ...newPopcorns]);
    // Clear popcorns from DOM after animation completes (approx 4s)
    setTimeout(() => {
      setPopcorns((prev) => prev.slice(15));
    }, 4500);
  };

  const triggerHeartBurstEffect = () => {
    const newHearts = Array.from({ length: 12 }).map((_, i) => ({
      id: Math.random() + i,
      left: Math.random() * 90 + 5,
      delay: Math.random() * 0.5,
      size: Math.random() * 20 + 20
    }));
    setHearts((prev) => [...prev, ...newHearts]);
    setTimeout(() => {
      setHearts((prev) => prev.slice(12));
    }, 4500);
  };

  const triggerBonkEffect = (sender) => {
    setBonkSender(sender);
    setShowBonk(true);
    setTimeout(() => setShowBonk(false), 900);
  };

  const triggerHugEffect = (sender) => {
    setHugSender(sender);
    setShowHug(true);
    setTimeout(() => setShowHug(false), 2500);
  };

  const triggerWakeupEffect = (sender) => {
    setWakeupSender(sender);
    setShowWakeup(true);
    setTimeout(() => setShowWakeup(false), 2000);
  };

  // Render loading error state
  if (errorMsg) {
    return (
      <div style={styles.errorContainer}>
        <div className="glass-panel" style={styles.errorCard}>
          <h2>Oops, sorry Pookie!</h2>
          <p>{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Interaction Overlays */}
      <div className="reaction-overlay">
        {/* Popcorns overlay */}
        {popcorns.map((p) => (
          <span
            key={p.id}
            className="falling-popcorn"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`
            }}
          >
            🍿
          </span>
        ))}

        {/* Hearts burst overlay */}
        {hearts.map((h) => (
          <span
            key={h.id}
            style={{
              position: 'fixed',
              left: `${h.left}%`,
              bottom: '-50px',
              fontSize: `${h.size}px`,
              opacity: 0,
              animationName: 'heartFloat',
              animationDuration: '3.5s',
              animationTimingFunction: 'ease-out',
              animationDelay: `${h.delay}s`,
              pointerEvents: 'none',
              zIndex: 999
            }}
          >
            💖
          </span>
        ))}

        {/* Bonk effect */}
        {showBonk && (
          <div style={styles.bonkOverlay}>
            <div className="bonk-hammer">🔨💥</div>
            <div style={styles.actionLabel}>{bonkSender} bonked you!</div>
          </div>
        )}

        {/* Hug effect */}
        {showHug && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            style={styles.actionOverlayBox}
          >
            <span style={{ fontSize: '72px' }}>🤗🧸💕</span>
            <div style={styles.actionLabel}>{hugSender} sent a giant warm hug!</div>
          </motion.div>
        )}

        {/* Wake up effect */}
        {showWakeup && (
          <motion.div
            animate={{
              x: [-8, 8, -6, 6, -4, 4, 0],
              y: [-4, 4, -3, 3, -2, 2, 0]
            }}
            transition={{ repeat: 3, duration: 0.4 }}
            style={styles.actionOverlayBox}
          >
            <span style={{ fontSize: '72px' }}>😴⏰📢💥</span>
            <div style={styles.actionLabel}>{wakeupSender} is screaming: WAKE UP!</div>
          </motion.div>
        )}
      </div>

      {/* Main Room Layout */}
      <div style={styles.layoutGrid}>
        {/* Main Video Section */}
        <div style={styles.videoSection}>
          <div style={styles.roomHeader}>
            <div style={styles.headerInfo}>
              <h2 style={styles.roomTitle}>Watching Together 🎬✨</h2>
              <div style={styles.usersOnline}>
                <Users size={16} color="#ff4d6d" />
                <span style={styles.userNames}>
                  {activeUsers.host ? `Host: ${activeUsers.host}` : 'No Host'} •{' '}
                  {activeUsers.viewer ? `Viewer: ${activeUsers.viewer}` : 'No Viewer'}
                </span>
              </div>
            </div>
            
            {isMobile && (
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="btn-secondary"
                style={styles.mobileChatToggle}
              >
                <MessageSquare size={18} />
                Chat
              </button>
            )}
          </div>

          <div style={styles.videoPlayerWrapper}>
            <VideoPlayer
              role={role}
              stream={role === 'host' ? localStream : remoteStream}
              streamState={streamState}
              onStartShare={startScreenShare}
              onStopShare={stopScreenShare}
              onEndSession={handleEndSession}
              stats={stats}
              localVolume={localVolume}
              onVolumeChange={handleVolumeChange}
              isLocalMuted={isLocalMuted}
              onToggleLocalMute={toggleLocalMute}
              isHostMuted={isHostMuted}
              onToggleHostMute={toggleHostMute}
            />
          </div>

          {/* Quick instructions / tips banner */}
          <div className="glass-panel" style={styles.tipsPanel}>
            <Info size={16} color="#ff4d6d" style={{ flexShrink: 0 }} />
            <span style={styles.tipsText}>
              {role === 'host' 
                ? "Pookie Host: To share audio, choose standard Chrome/Edge tab sharing and tick 'Share system audio'."
                : "Pookie Viewer: If the audio is quiet, use the slider under the player to boost volume!"}
            </span>
          </div>
        </div>

        {/* Desktop Sidebar Chat Panel */}
        {!isMobile && (
          <div style={styles.chatSection}>
            <ChatPanel
              messages={messages}
              userName={userName}
              typingStatus={otherUserTyping}
              onSendMessage={handleSendMessage}
              onSendTyping={handleSendTyping}
              onTriggerAction={handleTriggerAction}
              isMobile={false}
            />
          </div>
        )}
      </div>

      {/* Mobile Drawer Chat Panel (Bottom Sheet) */}
      <AnimatePresence>
        {isMobile && isChatOpen && (
          <>
            {/* Dark sheet background overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              style={styles.mobileOverlay}
            />
            {/* Sliding Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={styles.mobileDrawer}
            >
              <div style={styles.drawerHandleRow}>
                <div style={styles.drawerHandle} />
                <button
                  onClick={() => setIsChatOpen(false)}
                  style={styles.closeDrawerBtn}
                >
                  <X size={18} />
                </button>
              </div>
              <div style={styles.drawerChatContainer}>
                <ChatPanel
                  messages={messages}
                  userName={userName}
                  typingStatus={otherUserTyping}
                  onSendMessage={handleSendMessage}
                  onSendTyping={handleSendTyping}
                  onTriggerAction={handleTriggerAction}
                  isMobile={true}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    overflow: 'hidden',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    padding: '20px',
  },
  errorCard: {
    padding: '40px',
    maxWidth: '400px',
    textAlign: 'center',
    border: '2px solid #ffccd5',
  },
  layoutGrid: {
    display: 'flex',
    gap: '20px',
    width: '100%',
    height: '100%',
    flex: 1,
    overflow: 'hidden',
  },
  videoSection: {
    flex: 3,
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    height: '100%',
  },
  roomHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    padding: '12px 20px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: 'var(--glass-shadow)',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  roomTitle: {
    fontSize: '1.25rem',
    color: '#4a3c31',
    fontFamily: 'var(--font-headers)',
  },
  usersOnline: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.85rem',
    color: '#6c584c',
  },
  userNames: {
    fontWeight: '600',
  },
  mobileChatToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    fontSize: '0.85rem',
    borderRadius: '12px',
    borderColor: '#ffccd5',
    color: '#ff4d6d',
    backgroundColor: '#fff',
  },
  videoPlayerWrapper: {
    flex: 1,
    minHeight: 0, // critical for nested flex scroll
  },
  tipsPanel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: '12px',
  },
  tipsText: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#6c584c',
    lineHeight: '1.3',
  },
  chatSection: {
    flex: 1.1,
    minWidth: '320px',
    height: '100%',
  },
  bonkOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 77, 109, 0.1)',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  actionOverlayBox: {
    position: 'fixed',
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    border: '2px solid #ffccd5',
    borderRadius: '24px',
    padding: '24px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    boxShadow: '0 10px 30px rgba(255, 143, 163, 0.25)',
    zIndex: 9999,
    pointerEvents: 'none',
  },
  actionLabel: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#ff4d6d',
    fontFamily: 'var(--font-headers)',
    textAlign: 'center',
  },
  mobileOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: '#000',
    zIndex: 100,
  },
  mobileDrawer: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    height: '75vh',
    backgroundColor: '#fff9fa',
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px',
    boxShadow: '0 -8px 24px rgba(0,0,0,0.15)',
    zIndex: 101,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderTop: '2px solid #ffccd5',
  },
  drawerHandleRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '12px 16px',
    position: 'relative',
    borderBottom: '1px solid rgba(255, 143, 163, 0.1)',
  },
  drawerHandle: {
    width: '40px',
    height: '5px',
    borderRadius: '3px',
    backgroundColor: '#ffccd5',
  },
  closeDrawerBtn: {
    position: 'absolute',
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#6c584c',
    cursor: 'pointer',
  },
  drawerChatContainer: {
    flex: 1,
    overflow: 'hidden',
  }
};
