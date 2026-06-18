import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, ThumbsUp, Heart, HelpCircle, Gift } from 'lucide-react';

const QUICK_EMOJIS = ['🩷', '🎀', '🌷', '🍓', '✨', '🥺', '😭', '🍿', '💌', '💕', '🌙', '⭐'];

const KAOMOJIS = [
  '૮ ˶ᵔ ᵕ ᵔ˶ ა',
  '(｡♥‿♥｡)',
  '(づ｡◕‿‿◕｡)づ',
  '૮₍ ˃ ⤙ ˂ ₎ა',
  '૮꒰ ˶• ༝ •˶꒱ა ♡',
  '(╥﹏╥)'
];

export default function ChatPanel({
  messages,
  userName,
  typingStatus,
  onSendMessage,
  onSendTyping,
  onTriggerAction,
  isMobile
}) {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingStatus]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
    onSendTyping(false);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    onSendTyping(e.target.value.length > 0);
  };

  const handleInputBlur = () => {
    onSendTyping(false);
  };

  const addEmoji = (emoji) => {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Helper to check who sent the message
  const getMessageStyle = (msg) => {
    if (msg.sender === 'System') {
      return styles.systemMsg;
    }
    if (msg.sender === userName) {
      return styles.myMsg;
    }
    return styles.theirMsg;
  };

  // Format message timestamps
  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // Render text for different message types
  const renderMessageContent = (msg) => {
    if (msg.type === 'system' || msg.type !== 'text') {
      return <span style={styles.systemText}>{msg.text}</span>;
    }

    return (
      <div>
        {msg.sender !== userName && (
          <span style={styles.senderLabel}>{msg.sender}</span>
        )}
        <p style={styles.bubbleText}>{msg.text}</p>
        <span style={styles.timestamp}>{formatTime(msg.timestamp)}</span>
      </div>
    );
  };

  return (
    <div style={isMobile ? styles.mobileContainer : styles.desktopContainer} className="glass-panel">
      {/* Pookie Interaction Panel (Quick Action Buttons) */}
      <div style={styles.interactionHeader}>
        <span style={styles.sectionTitle}>Pookie Actions ✨</span>
        <div style={styles.actionGrid}>
          <button onClick={() => onTriggerAction('popcorn')} style={styles.actionBtn} title="Send Popcorn">
            🍿 Popcorn
          </button>
          <button onClick={() => onTriggerAction('heart-burst')} style={styles.actionBtn} title="Heart Burst">
            💕 Love
          </button>
          <button onClick={() => onTriggerAction('hug')} style={styles.actionBtn} title="Virtual Hug">
            🤗 Hug
          </button>
          <button onClick={() => onTriggerAction('bonk')} style={styles.actionBtn} title="Bonk Pookie">
            🔨 Bonk
          </button>
          <button onClick={() => onTriggerAction('wakeup')} style={styles.actionBtn} title="Wake Up Pookie">
            😴 Wake Up
          </button>
        </div>
      </div>

      {/* Message Area */}
      <div style={styles.messageList}>
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div
              key={msg._id || index}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              style={{
                ...styles.messageWrapper,
                justifyContent: msg.sender === 'System' ? 'center' : (msg.sender === userName ? 'flex-end' : 'flex-start')
              }}
            >
              <div style={getMessageStyle(msg)}>
                {renderMessageContent(msg)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing status indicator */}
        {typingStatus && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={styles.typingWrapper}
          >
            <div className="typing-indicator">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span style={{ marginLeft: '4px' }}>Pookie is typing... 🎀</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emojis & Kaomojis */}
      <div style={styles.quickEmojiBar}>
        <div style={styles.emojiRow}>
          {QUICK_EMOJIS.map((emo) => (
            <button key={emo} onClick={() => addEmoji(emo)} style={styles.quickEmojiBtn}>
              {emo}
            </button>
          ))}
        </div>
        <div style={styles.kaomojiRow}>
          {KAOMOJIS.map((kao) => (
            <button key={kao} onClick={() => addEmoji(` ${kao} `)} style={styles.kaomojiBtn}>
              {kao}
            </button>
          ))}
        </div>
      </div>

      {/* Message input form */}
      <form onSubmit={handleSend} style={styles.inputForm}>
        <div style={styles.inputContainer}>
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="Type a cute message, pookie..."
            className="glass-input"
            style={styles.chatInput}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="btn-primary"
            style={styles.sendButton}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  desktopContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    maxHeight: 'calc(100vh - 40px)',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  mobileContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    border: 'none',
    boxShadow: 'none',
    backgroundColor: 'transparent',
  },
  interactionHeader: {
    padding: '12px',
    borderBottom: '1px solid rgba(255, 143, 163, 0.15)',
    backgroundColor: 'rgba(255, 240, 242, 0.4)',
  },
  sectionTitle: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#ff4d6d',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'block',
    marginBottom: '8px',
    fontFamily: 'var(--font-headers)',
  },
  actionGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  actionBtn: {
    padding: '6px 12px',
    borderRadius: '20px',
    border: '1px solid #ffccd5',
    backgroundColor: '#fff',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#6c584c',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 5px rgba(255,143,163,0.05)',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  messageWrapper: {
    display: 'flex',
    width: '100%',
  },
  myMsg: {
    backgroundColor: '#ff8fa3',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: '18px 18px 2px 18px',
    maxWidth: '75%',
    boxShadow: '0 4px 12px rgba(255, 143, 163, 0.2)',
    position: 'relative',
    wordBreak: 'break-word',
  },
  theirMsg: {
    backgroundColor: '#fff',
    color: 'var(--pookie-text)',
    padding: '10px 14px',
    borderRadius: '18px 18px 18px 2px',
    maxWidth: '75%',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
    border: '1px solid #ffccd5',
    position: 'relative',
    wordBreak: 'break-word',
  },
  systemMsg: {
    backgroundColor: 'rgba(255, 240, 242, 0.8)',
    color: '#ff4d6d',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '600',
    maxWidth: '90%',
    textAlign: 'center',
    border: '1px solid #ffccd5',
    boxShadow: '0 2px 8px rgba(255,143,163,0.05)',
  },
  bubbleText: {
    fontSize: '0.95rem',
    lineHeight: '1.4',
    fontFamily: 'var(--font-body)',
  },
  senderLabel: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#ff4d6d',
    marginBottom: '4px',
    fontFamily: 'var(--font-headers)',
  },
  timestamp: {
    display: 'block',
    fontSize: '0.7rem',
    textAlign: 'right',
    marginTop: '4px',
    opacity: 0.75,
  },
  systemText: {
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
  },
  typingWrapper: {
    display: 'flex',
    width: '100%',
    justifyContent: 'flex-start',
    marginTop: '4px',
  },
  quickEmojiBar: {
    padding: '8px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderTop: '1px solid rgba(255, 143, 163, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  emojiRow: {
    display: 'flex',
    overflowX: 'auto',
    gap: '8px',
    paddingBottom: '2px',
  },
  quickEmojiBtn: {
    fontSize: '1.25rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    transition: 'transform 0.1s',
  },
  kaomojiRow: {
    display: 'flex',
    overflowX: 'auto',
    gap: '6px',
    paddingBottom: '2px',
  },
  kaomojiBtn: {
    fontSize: '0.75rem',
    backgroundColor: '#fff',
    border: '1px solid #ffccd5',
    borderRadius: '12px',
    padding: '4px 8px',
    color: '#ff4d6d',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  inputForm: {
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderTop: '1px solid rgba(255, 143, 163, 0.15)',
  },
  inputContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: '20px',
    fontSize: '0.9rem',
    backgroundColor: '#fff',
    border: '1.5px solid #ffccd5',
  },
  sendButton: {
    padding: '10px',
    borderRadius: '50%',
    width: '38px',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }
};
