import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Maximize, Play, Square, Signal, SignalHigh, SignalMedium, Power, Tv } from 'lucide-react';

export default function VideoPlayer({
  role,
  stream,
  streamState,
  onStartShare,
  onStopShare,
  onEndSession,
  stats,
  localVolume,
  onVolumeChange,
  isLocalMuted,
  onToggleLocalMute,
  isHostMuted,
  onToggleHostMute
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
    }
  };

  // Helper to get signal icon based on quality
  const renderSignalIcon = () => {
    if (!stats) return <SignalHigh size={16} color="#4caf50" />;
    
    switch (stats.quality) {
      case 'good':
        return (
          <div style={styles.statBadge} title={`Latency: ${stats.rtt}ms, Loss: ${stats.packetLoss}%`}>
            <SignalHigh size={16} color="#4caf50" />
            <span>Good ({stats.rtt || 0}ms)</span>
          </div>
        );
      case 'fair':
        return (
          <div style={styles.statBadge} title={`Latency: ${stats.rtt}ms, Loss: ${stats.packetLoss}%`}>
            <SignalMedium size={16} color="#ff9800" />
            <span>Fair ({stats.rtt}ms)</span>
          </div>
        );
      case 'poor':
        return (
          <div style={styles.statBadge} title={`Latency: ${stats.rtt}ms, Loss: ${stats.packetLoss}%`}>
            <Signal size={16} color="#f44336" />
            <span>Poor ({stats.rtt}ms)</span>
          </div>
        );
      default:
        return <SignalHigh size={16} color="#4caf50" />;
    }
  };

  const isStreaming = role === 'host' ? !!stream : streamState.isStreaming;

  return (
    <div className="glass-panel" style={styles.container}>
      <div style={styles.playerArea}>
        <AnimatePresence mode="wait">
          {isStreaming && stream ? (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: '100%', height: '100%', position: 'relative' }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={role === 'host' ? true : isLocalMuted || streamState.isMuted} // Host is always muted locally to prevent echo loop
                className="video-element"
                style={styles.video}
              />
              
              {/* Top info badge overlaid */}
              <div style={styles.topOverlay}>
                <div style={styles.liveBadge}>
                  <span style={styles.liveDot}></span>
                  LIVE
                </div>
                {renderSignalIcon()}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={styles.placeholder}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={styles.placeholderIcon}
              >
                <Tv size={64} color="#ff8fa3" />
              </motion.div>
              <h3 style={styles.placeholderTitle}>
                {role === 'host' ? "Ready to start the show, Pookie? 🍿" : "Waiting for pookie to start sharing... 🌸"}
              </h3>
              <p style={styles.placeholderSubtitle}>
                {role === 'host' 
                  ? "Click 'Start Screen Share' below. Select a tab/window and tick 'Share system audio' to watch together!"
                  : "Grab some snacks, sit back and get cozy. The movie will start soon!"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controller Bar */}
      <div style={styles.controlBar}>
        {role === 'host' ? (
          // Host controls
          <div style={styles.controlsRow}>
            <div style={styles.controlsGroup}>
              {!stream ? (
                <button onClick={onStartShare} className="btn-primary" style={styles.ctrlBtn}>
                  <Play size={16} /> Start Screen Share
                </button>
              ) : (
                <button onClick={onStopShare} className="btn-secondary" style={{ ...styles.ctrlBtn, color: '#ff4d6d' }}>
                  <Square size={16} /> Stop Sharing
                </button>
              )}

              {stream && (
                <button 
                  onClick={onToggleHostMute} 
                  className="btn-secondary" 
                  style={styles.iconBtn}
                  title={isHostMuted ? "Unmute Stream Audio" : "Mute Stream Audio"}
                >
                  {isHostMuted ? <VolumeX size={18} color="#ff4d6d" /> : <Volume2 size={18} />}
                </button>
              )}
            </div>

            <div style={styles.controlsGroup}>
              <button onClick={handleFullscreen} disabled={!stream} className="btn-secondary" style={styles.iconBtn}>
                <Maximize size={18} />
              </button>
              <button onClick={onEndSession} className="btn-secondary" style={{ ...styles.iconBtn, borderColor: '#ff4d6d' }} title="End Session">
                <Power size={18} color="#ff4d6d" />
              </button>
            </div>
          </div>
        ) : (
          // Viewer controls
          <div style={styles.controlsRow}>
            <div style={styles.controlsGroup}>
              <button 
                onClick={onToggleLocalMute} 
                className="btn-secondary" 
                style={styles.iconBtn}
                disabled={!stream}
              >
                {isLocalMuted || streamState.isMuted ? <VolumeX size={18} color="#ff4d6d" /> : <Volume2 size={18} />}
              </button>
              
              <div style={styles.volumeContainer}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={localVolume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  style={styles.volumeSlider}
                  disabled={!stream || isLocalMuted || streamState.isMuted}
                />
              </div>
              
              {streamState.isMuted && (
                <span style={styles.mutedBanner}>Host muted the stream 🤐</span>
              )}
            </div>

            <div style={styles.controlsGroup}>
              <button onClick={handleFullscreen} disabled={!stream} className="btn-secondary" style={styles.iconBtn}>
                <Maximize size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#1a1818',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  playerArea: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    minHeight: '280px',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  topOverlay: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    right: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 5,
  },
  liveBadge: {
    backgroundColor: '#ff4d6d',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  liveDot: {
    width: '6px',
    height: '6px',
    backgroundColor: '#fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'pulse-heart 1.5s infinite',
  },
  statBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backdropFilter: 'blur(4px)',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '40px 20px',
    color: '#e5e5e5',
  },
  placeholderIcon: {
    marginBottom: '20px',
  },
  placeholderTitle: {
    fontSize: '1.4rem',
    color: '#fff',
    marginBottom: '10px',
    fontFamily: 'var(--font-headers)',
  },
  placeholderSubtitle: {
    fontSize: '0.9rem',
    color: '#aaa',
    maxWidth: '440px',
    lineHeight: '1.4',
  },
  controlBar: {
    backgroundColor: 'rgba(25, 23, 23, 0.95)',
    padding: '12px 16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  ctrlBtn: {
    padding: '10px 18px',
    fontSize: '0.9rem',
  },
  iconBtn: {
    padding: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#eee',
    borderRadius: '12px',
  },
  volumeContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '80px',
  },
  volumeSlider: {
    width: '100%',
    accentColor: '#ff8fa3',
    cursor: 'pointer',
  },
  mutedBanner: {
    fontSize: '0.8rem',
    color: '#ff8fa3',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 77, 109, 0.1)',
    padding: '4px 10px',
    borderRadius: '8px',
  }
};
