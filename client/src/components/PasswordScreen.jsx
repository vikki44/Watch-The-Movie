import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Heart } from 'lucide-react';

export default function PasswordScreen({ onVerified, serverUrl }) {
  const [roomName, setRoomName] = useState('default-room');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isWrong, setIsWrong] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the secret code! 🥺');
      return;
    }

    setLoading(true);
    setError('');
    setIsWrong(false);

    try {
      const response = await fetch(`${serverUrl}/api/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomName: roomName.trim().toLowerCase(), password }),
      });

      const data = await response.json();

      if (data.success) {
        // Successful login
        onVerified({ roomName: roomName.trim().toLowerCase(), password });
      } else {
        setError(data.message || 'Oops! Wrong code, try again pookie! 😭🎀');
        setIsWrong(true);
        setTimeout(() => setIsWrong(false), 500); // clear shake
      }
    } catch (err) {
      console.error(err);
      setError('Cannot reach pookie server. Is it running? 🔌');
      setIsWrong(true);
      setTimeout(() => setIsWrong(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-wrapper" style={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.95 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`glass-panel ${isWrong ? 'shake-animation' : ''}`}
        style={styles.card}
      >
        <div style={styles.logoWrapper}>
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <Heart size={48} color="#ff4d6d" fill="#ff4d6d" />
          </motion.div>
        </div>

        <h2 style={styles.title}>Watch with Pookie</h2>
        <p style={styles.subtitle}>Enter the secret movie night code 🔒✨</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Room Name</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="glass-input"
              placeholder="e.g. default-room"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Secret Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input"
                placeholder="Enter password..."
                required
                style={{ ...styles.input, paddingLeft: '44px' }}
              />
              <Lock size={18} color="#ff8fa3" style={styles.inputIcon} />
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              style={styles.errorText}
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={styles.button}
          >
            {loading ? 'Verifying... 🌸' : 'Enter Room 🎀'}
          </button>
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
    maxWidth: '420px',
    padding: '40px 30px',
    textAlign: 'center',
  },
  logoWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '2rem',
    color: '#ff4d6d',
    fontFamily: 'var(--font-title)',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#6c584c',
    marginBottom: '30px',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    textAlign: 'left',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#ff4d6d',
    paddingLeft: '4px',
    fontFamily: 'var(--font-headers)',
  },
  input: {
    boxShadow: 'inset 0 1px 3px rgba(255, 143, 163, 0.05)',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  errorText: {
    color: '#ff4d6d',
    fontSize: '0.9rem',
    fontWeight: 600,
    textAlign: 'center',
    marginTop: '5px',
    backgroundColor: '#fff0f2',
    padding: '8px',
    borderRadius: '12px',
    border: '1px solid #ffccd5',
  },
  button: {
    marginTop: '10px',
    width: '100%',
  },
};
