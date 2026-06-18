import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tv, MonitorPlay, Sparkles } from 'lucide-react';

const QUOTES = [
  "Every movie is better when watched with your favorite person. 💖",
  "Pookies who watch together, stay together! 🎀",
  "Grab the popcorn and snuggle up, movie night is starting! 🍿",
  "You, me, and a really good movie. What more could I ask for? 💕",
  "Distance means so little when someone means so much. Let's watch! 🌐✨",
  "You are the butter to my popcorn and the cherry to my shake! 🍒🥤"
];

export default function WelcomeScreen({ roomName, onStart, onBack }) {
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState('viewer'); // 'host' or 'viewer'
  const [quote, setQuote] = useState('');

  useEffect(() => {
    // Select a random quote
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setQuote(randomQuote);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userName.trim()) return;
    onStart({ userName: userName.trim(), role });
  };

  return (
    <div style={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.6 }}
        className="glass-panel"
        style={styles.card}
      >
        <span style={styles.roomBadge}>Room: {roomName}</span>

        {/* Cute Quote Section */}
        <div style={styles.quoteCard}>
          <p style={styles.quoteText}>{quote}</p>
        </div>

        <h3 style={styles.title}>Join the Movie Night 🎬</h3>
        <p style={styles.subtitle}>Fill in your pookie details below</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Your Cute Nickname</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="glass-input"
              placeholder="e.g. Honey Bunny, Sweetie, Pookie"
              required
              maxLength={15}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Your Role Tonight</label>
            <div style={styles.roleGrid}>
              {/* Host option */}
              <div
                onClick={() => setRole('host')}
                style={{
                  ...styles.roleCard,
                  borderColor: role === 'host' ? '#ff4d6d' : 'transparent',
                  backgroundColor: role === 'host' ? 'rgba(255, 77, 109, 0.08)' : 'rgba(255,255,255,0.4)',
                }}
              >
                <MonitorPlay size={32} color={role === 'host' ? '#ff4d6d' : '#ff8fa3'} />
                <span style={styles.roleTitle}>Host (Screen Share)</span>
                <span style={styles.roleDesc}>You stream the movie from your desktop browser or player.</span>
              </div>

              {/* Viewer option */}
              <div
                onClick={() => setRole('viewer')}
                style={{
                  ...styles.roleCard,
                  borderColor: role === 'viewer' ? '#ff4d6d' : 'transparent',
                  backgroundColor: role === 'viewer' ? 'rgba(255, 77, 109, 0.08)' : 'rgba(255,255,255,0.4)',
                }}
              >
                <Tv size={32} color={role === 'viewer' ? '#ff4d6d' : '#ff8fa3'} />
                <span style={styles.roleTitle}>Viewer (Watch)</span>
                <span style={styles.roleDesc}>You sit back, eat popcorn, and watch the host's screen stream.</span>
              </div>
            </div>
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              onClick={onBack}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Go Back
            </button>
            <button
              type="submit"
              disabled={!userName.trim()}
              className="btn-primary"
              style={{ flex: 2 }}
            >
              Start Watching <Sparkles size={16} />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '560px',
    padding: '40px 30px',
    position: 'relative',
  },
  roomBadge: {
    position: 'absolute',
    top: '15px',
    right: '20px',
    backgroundColor: '#ffccd5',
    color: '#ff4d6d',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  quoteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: '16px',
    padding: '20px',
    border: '1.5px dashed #ffccd5',
    marginBottom: '25px',
    marginTop: '10px',
    boxShadow: '0 4px 15px rgba(255, 143, 163, 0.05)',
  },
  quoteText: {
    fontFamily: 'var(--font-headers)',
    fontSize: '1.1rem',
    color: '#ff4d6d',
    textAlign: 'center',
    lineHeight: '1.4',
    fontStyle: 'italic',
  },
  title: {
    fontSize: '1.6rem',
    color: '#4a3c31',
    textAlign: 'center',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#6c584c',
    textAlign: 'center',
    marginBottom: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#ff4d6d',
    fontFamily: 'var(--font-headers)',
    paddingLeft: '4px',
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  roleCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '16px',
    borderRadius: '16px',
    border: '2px solid transparent',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
    boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
  },
  roleTitle: {
    fontFamily: 'var(--font-headers)',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#4a3c31',
    marginTop: '12px',
    marginBottom: '6px',
  },
  roleDesc: {
    fontSize: '0.75rem',
    color: '#6c584c',
    lineHeight: '1.35',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '10px',
  },
};
