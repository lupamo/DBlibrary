import { useState } from 'react';
import { api } from '../api/client';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(username, password);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.wordmark}>DBlibrary</h1>
          <p style={styles.subtitle}>Librarian portal</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              autoFocus
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f7f6f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  card: {
    background: '#fff',
    border: '1px solid #e4e2db',
    borderRadius: 12,
    padding: '2rem',
    width: '100%',
    maxWidth: 380,
  },
  header: {
    marginBottom: '1.75rem',
  },
  wordmark: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: 22,
    fontWeight: 500,
    color: '#3d5a3e',
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: '#a09d97',
    marginTop: 4,
  },
  field: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#6b6860',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    height: 38,
    padding: '0 10px',
    fontSize: 14,
    color: '#1a1917',
    background: '#f7f6f2',
    border: '1px solid #e4e2db',
    borderRadius: 5,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  error: {
    fontSize: 13,
    color: '#c0392b',
    background: '#fdf2f1',
    border: '1px solid #f5c6c3',
    borderRadius: 6,
    padding: '8px 12px',
    marginBottom: '1rem',
  },
  btn: {
    width: '100%',
    height: 38,
    background: '#3d5a3e',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: 4,
  },
};