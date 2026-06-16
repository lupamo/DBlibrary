import { useState, useEffect } from 'react';
import { api } from '../api/client';

function formatEdition(year) {
  return year ? `${year} edition` : 'Edition (no year)';
}

export default function CheckoutModal({ librarian, copy, onClose, onSuccess }) {
  const [borrowerQuery, setBorrowerQuery] = useState('');
  const [borrowers, setBorrowers] = useState([]);
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newBorrower, setNewBorrower] = useState({
    name: '', phone: '', username: '', password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!borrowerQuery.trim()) {
      setBorrowers([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      api.searchBorrowers(borrowerQuery)
        .then(setBorrowers)
        .catch(() => setBorrowers([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [borrowerQuery]);

  const handleCreateBorrower = async () => {
    if (!newBorrower.name || !newBorrower.phone || !newBorrower.username || !newBorrower.password) {
      return setError('All borrower fields are required.');
    }
    setLoading(true);
    setError('');
    try {
      const created = await api.createBorrower(newBorrower);
      setSelectedBorrower(created);
      setShowCreate(false);
      setBorrowerQuery(created.name);
      setBorrowers([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedBorrower) return setError('Select or create a borrower.');
    setLoading(true);
    setError('');
    try {
      await api.checkoutBooks({
        librarian_id: librarian.id,
        borrower_id: selectedBorrower.id,
        physical_book_ids: [copy.id],
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <p style={styles.modalLabel}>Check out</p>
            <p style={styles.modalTitle}>{copy.book_title}</p>
            <p style={styles.modalMeta}>
              {formatEdition(copy.published_year)} · {copy.barcode}
            </p>
          </div>
          <button style={styles.closeBtn} onClick={onClose} type="button">✕</button>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Borrower</label>
          <input
            style={styles.input}
            value={borrowerQuery}
            onChange={(e) => {
              setBorrowerQuery(e.target.value);
              setSelectedBorrower(null);
            }}
            placeholder="Search by name, phone, or username…"
          />
        </div>

        {searching && <p style={styles.hint}>Searching…</p>}

        {!selectedBorrower && borrowers.length > 0 && (
          <div style={styles.resultsList}>
            {borrowers.map((b) => (
              <button
                key={b.id}
                style={styles.resultRow}
                onClick={() => {
                  setSelectedBorrower(b);
                  setBorrowerQuery(b.name);
                  setBorrowers([]);
                }}
                type="button"
              >
                <div>
                  <p style={styles.resultName}>{b.name}</p>
                  <p style={styles.resultMeta}>{b.phone} · @{b.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedBorrower && (
          <div style={styles.selectedCard}>
            <p style={styles.selectedName}>{selectedBorrower.name}</p>
            <p style={styles.selectedMeta}>{selectedBorrower.phone}</p>
          </div>
        )}

        {!showCreate && !selectedBorrower && (
          <button style={styles.linkBtn} onClick={() => setShowCreate(true)} type="button">
            ＋ Create new borrower
          </button>
        )}

        {showCreate && (
          <div style={styles.createBox}>
            <p style={styles.createLabel}>New borrower</p>
            <input style={styles.input} placeholder="Full name" value={newBorrower.name}
              onChange={(e) => setNewBorrower((f) => ({ ...f, name: e.target.value }))} />
            <input style={styles.input} placeholder="Phone" value={newBorrower.phone}
              onChange={(e) => setNewBorrower((f) => ({ ...f, phone: e.target.value }))} />
            <input style={styles.input} placeholder="Username" value={newBorrower.username}
              onChange={(e) => setNewBorrower((f) => ({ ...f, username: e.target.value }))} />
            <input style={styles.input} type="password" placeholder="Password" value={newBorrower.password}
              onChange={(e) => setNewBorrower((f) => ({ ...f, password: e.target.value }))} />
            <div style={styles.createActions}>
              <button style={styles.btnSecondary} onClick={() => setShowCreate(false)} type="button">Cancel</button>
              <button style={styles.btnSecondary} onClick={handleCreateBorrower} disabled={loading} type="button">
                {loading ? 'Creating…' : 'Create & select'}
              </button>
            </div>
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={styles.checkoutBtn}
          onClick={handleCheckout}
          disabled={loading || !selectedBorrower}
          type="button"
        >
          {loading ? 'Processing…' : 'Check out book'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(26,25,23,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '1rem',
  },
  modal: {
    background: '#fff',
    border: '1px solid #e4e2db',
    borderRadius: 12,
    padding: '1.5rem',
    width: '100%',
    maxWidth: 420,
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.25rem',
  },
  modalLabel: {
    fontSize: 11,
    color: '#a09d97',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    margin: 0,
  },
  modalTitle: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: 16,
    fontWeight: 500,
    color: '#1a1917',
    margin: '4px 0 2px',
  },
  modalMeta: {
    fontSize: 12,
    color: '#6b6860',
    margin: 0,
    fontFamily: 'monospace',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 16,
    color: '#a09d97',
    cursor: 'pointer',
    padding: 4,
  },
  field: { marginBottom: '0.75rem' },
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
    marginBottom: 6,
  },
  resultsList: {
    border: '1px solid #e4e2db',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: '0.75rem',
  },
  resultRow: {
    display: 'block',
    width: '100%',
    padding: '10px 12px',
    background: '#fff',
    border: 'none',
    borderBottom: '1px solid #f0ede8',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
  },
  resultName: {
    fontSize: 13,
    fontWeight: 500,
    color: '#1a1917',
    margin: 0,
  },
  resultMeta: {
    fontSize: 12,
    color: '#a09d97',
    margin: '2px 0 0',
  },
  selectedCard: {
    background: '#eef3ee',
    border: '1px solid #c8d9c9',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: '0.75rem',
  },
  selectedName: {
    fontSize: 13,
    fontWeight: 500,
    color: '#2a3f2b',
    margin: 0,
  },
  selectedMeta: {
    fontSize: 12,
    color: '#6b6860',
    margin: '2px 0 0',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    fontSize: 13,
    color: '#3d5a3e',
    cursor: 'pointer',
    padding: 0,
    marginBottom: '1rem',
    fontFamily: 'inherit',
  },
  createBox: {
    background: '#f7f6f2',
    border: '1px solid #e4e2db',
    borderRadius: 8,
    padding: '12px',
    marginBottom: '1rem',
  },
  createLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: '#6b6860',
    margin: '0 0 8px',
  },
  createActions: {
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
  },
  hint: { fontSize: 13, color: '#a09d97', marginBottom: 8 },
  error: {
    fontSize: 13,
    color: '#c0392b',
    background: '#fdf2f1',
    border: '1px solid #f5c6c3',
    borderRadius: 6,
    padding: '8px 12px',
    marginBottom: '1rem',
  },
  checkoutBtn: {
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
  },
  btnSecondary: {
    height: 32,
    padding: '0 12px',
    background: '#fff',
    color: '#6b6860',
    border: '1px solid #e4e2db',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
