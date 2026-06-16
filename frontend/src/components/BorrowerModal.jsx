import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function BorrowerModal({ physicalBookId, barcode, onClose, onReturned }) {
  const [borrower, setBorrower] = useState(null);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getBorrower(physicalBookId)
      .then(setBorrower)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [physicalBookId]);

  const handleReturn = async () => {
    setReturning(true);
    try {
      await api.returnBook(physicalBookId);
      onReturned();
      onClose();
    } catch (err) {
      setError(err.message);
      setReturning(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <p style={styles.modalLabel}>Check in</p>
            {borrower?.book_title && (
              <p style={styles.modalTitle}>{borrower.book_title}</p>
            )}
            <p style={styles.modalBarcode}>{barcode}</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {loading && <p style={styles.hint}>Loading…</p>}

        {error && <p style={styles.error}>{error}</p>}

        {!loading && borrower && (
          <>
            <div style={styles.borrowerCard}>
              <div style={styles.avatar}>
                {borrower.borrower_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={styles.borrowerName}>{borrower.borrower_name}</p>
                <p style={styles.borrowerPhone}>{borrower.borrower_phone}</p>
                <p style={styles.checkedOutAt}>
                  Checked out {new Date(borrower.checked_out_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <button
              style={styles.returnBtn}
              onClick={handleReturn}
              disabled={returning}
            >
              {returning ? 'Processing…' : 'Check in book'}
            </button>
          </>
        )}
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
    maxWidth: 360,
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
    fontSize: 15,
    fontWeight: 500,
    color: '#1a1917',
    margin: '4px 0 2px',
  },
  modalBarcode: {
    fontSize: 15,
    fontWeight: 500,
    color: '#1a1917',
    margin: '3px 0 0',
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
  hint: {
    fontSize: 13,
    color: '#a09d97',
  },
  error: {
    fontSize: 13,
    color: '#c0392b',
    background: '#fdf2f1',
    border: '1px solid #f5c6c3',
    borderRadius: 6,
    padding: '8px 12px',
  },
  borrowerCard: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
    background: '#f7f6f2',
    border: '1px solid #e4e2db',
    borderRadius: 8,
    padding: '1rem',
    marginBottom: '1rem',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#eef3ee',
    color: '#2a3f2b',
    fontWeight: 600,
    fontSize: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  borrowerName: {
    fontSize: 14,
    fontWeight: 500,
    color: '#1a1917',
    margin: 0,
  },
  borrowerPhone: {
    fontSize: 13,
    color: '#6b6860',
    margin: '2px 0',
  },
  checkedOutAt: {
    fontSize: 12,
    color: '#a09d97',
    margin: 0,
  },
  returnBtn: {
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
};