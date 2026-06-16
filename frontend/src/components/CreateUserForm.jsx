import { useState } from 'react';
import { api } from '../api/client';

export default function CreateUserForm() {
  const [role, setRole] = useState('borrower');
  const [form, setForm] = useState({ name: '', phone: '', username: '', password: '' });
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const fn = role === 'borrower' ? api.createBorrower : api.createLibrarian;
      const result = await fn(form);
      setStatus({
        type: 'success',
        message: `${role === 'borrower' ? 'Borrower' : 'Librarian'} "${result.name}" created successfully.`,
      });
      setForm({ name: '', phone: '', username: '', password: '' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={styles.pageTitle}>Borrowers</h2>

      <div style={styles.card}>
        <p style={styles.cardLabel}>Create account</p>

        {/* Role toggle */}
        <div style={styles.toggle}>
          {['borrower', 'librarian'].map((r) => (
            <button
              key={r}
              style={{ ...styles.toggleBtn, ...(role === r ? styles.toggleActive : {}) }}
              onClick={() => setRole(r)}
              type="button"
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.grid}>
            <div style={styles.field}>
              <label style={styles.label}>Full name</label>
              <input
                style={styles.input}
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Jane Doe"
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Phone</label>
              <input
                style={styles.input}
                type="text"
                value={form.phone}
                onChange={set('phone')}
                placeholder="e.g. 0711111111"
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input
                style={styles.input}
                type="text"
                value={form.username}
                onChange={set('username')}
                placeholder="e.g. janedoe"
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {status && (
            <p style={status.type === 'success' ? styles.success : styles.error}>
              {status.message}
            </p>
          )}

          <div style={styles.footer}>
            <button style={styles.btn} type="submit" disabled={loading}>
              {loading ? 'Creating…' : `Create ${role}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  pageTitle: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: 20,
    fontWeight: 500,
    color: '#1a1917',
    margin: '0 0 1.25rem',
  },
  card: {
    background: '#fff',
    border: '1px solid #e4e2db',
    borderRadius: 10,
    padding: '1.5rem',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: '#a09d97',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    margin: '0 0 1rem',
  },
  toggle: {
    display: 'flex',
    gap: 4,
    background: '#f7f6f2',
    border: '1px solid #e4e2db',
    borderRadius: 7,
    padding: 3,
    marginBottom: '1.25rem',
    width: 'fit-content',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    borderRadius: 5,
    padding: '5px 14px',
    fontSize: 13,
    color: '#6b6860',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.1s',
  },
  toggleActive: {
    background: '#fff',
    color: '#1a1917',
    fontWeight: 500,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1rem',
  },
  field: {},
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#6b6860',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    height: 36,
    padding: '0 10px',
    fontSize: 13,
    color: '#1a1917',
    background: '#f7f6f2',
    border: '1px solid #e4e2db',
    borderRadius: 5,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  success: {
    fontSize: 13,
    color: '#2a3f2b',
    background: '#eef3ee',
    border: '1px solid #c8d9c9',
    borderRadius: 6,
    padding: '8px 12px',
    marginBottom: '1rem',
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
  footer: { display: 'flex', justifyContent: 'flex-end' },
  btn: {
    height: 36,
    padding: '0 20px',
    background: '#3d5a3e',
    color: '#fff',
    border: 'none',
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};