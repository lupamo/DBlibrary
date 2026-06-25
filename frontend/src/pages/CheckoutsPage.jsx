import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import BorrowerModal from '../components/BorrowerModal';

function formatEdition(year) {
  return year ? `${year} edition` : 'Edition (no year)';
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function CheckoutsPage({ librarian }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [barcode, setBarcode] = useState('');
  const [scannedCopy, setScannedCopy] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [lookingUp, setLookingUp] = useState(false);

  const [borrowerQuery, setBorrowerQuery] = useState('');
  const [borrowers, setBorrowers] = useState([]);
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newBorrower, setNewBorrower] = useState({
    name: '', phone: '', username: ''
  });

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [returnModal, setReturnModal] = useState(null);
  const [justAddedId, setJustAddedId] = useState(null);
  const barcodeInputRef = useRef(null);

  const loadLoans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getActiveCheckouts();
      setLoans(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

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

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const handleLookup = async () => {
    const code = barcode.trim();
    if (!code) return;
    setLookingUp(true);
    setLookupError('');
    setScannedCopy(null);
    try {
      const copy = await api.lookupBarcode(code);
      if (!copy.is_available) {
        setLookupError('This copy is already checked out.');
        return;
      }
      setScannedCopy(copy);
      setFieldErrors((f) => ({ ...f, barcode: undefined }))
    } catch (err) {
      setLookupError(err.message);
    } finally {
      setLookingUp(false);
    }
  };

  const handleCreateBorrower = async () => {
    if (!newBorrower.name || !newBorrower.phone || !newBorrower.username) {
      return setCheckoutError('All borrower fields are required.');
    }
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      const created = await api.createBorrower(newBorrower);
      setSelectedBorrower(created);
      setShowCreate(false);
      setBorrowerQuery(created.name);
      setBorrowers([]);
      setNewBorrower({ name: '', phone: '', username: ''});
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCheckout = async () => {
    const errs = {};
    if (!scannedCopy) errs.barcode = 'Enter a valid barcode first.';
    if (!selectedBorrower) errs.borrower = 'Select or create a borrower.';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setCheckoutLoading(true);
    setCheckoutError('');
    setCheckoutSuccess('');
    try {
      await api.checkoutBooks({
        librarian_id: librarian.id,
        borrower_id: selectedBorrower.id,
        physical_book_ids: [scannedCopy.id],
      });
      setCheckoutSuccess(`"${scannedCopy.book_title}" checked out to ${selectedBorrower.name}.`);
      setJustAddedId(scannedCopy.id);
      setBarcode('');
      setScannedCopy(null);
      setSelectedBorrower(null);
      setBorrowerQuery('');
      loadLoans();
      barcodeInputRef.current?.focus();
      setTimeout(() => setJustAddedId(null), 1200);
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      @keyframes loanRowSlideIn {
        from { opacity: 0; transform: translateY(-8px); background-color: #eef3ee; }
        to { opacity: 1; transform: translateY(0); background-color: #fff; }
      }
    `;
    document.head.appendChild(styleTag);
    return () => document.head.removeChild(styleTag);
  }, []);

  return (
    <div>
      <h2 style={styles.pageTitle}>Checkouts</h2>

      <div style={styles.grid}>
        {/* Check out */}
        <div style={styles.card}>
          <p style={styles.cardLabel}>Check out a book</p>

          <div style={styles.field}>
            <label style={styles.label}>Barcode</label>
            <div style={styles.row}>
              <input
                ref={barcodeInputRef}
                style={fieldErrors.barcode ? { ...styles.input, ...styles.inputError } : styles.input}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                placeholder="Scan or enter barcode…"
              />
              <button style={styles.btn} onClick={handleLookup} disabled={lookingUp} type="button">
                {lookingUp ? '…' : 'Look up'}
              </button>
            </div>
            {fieldErrors.barcode && <p style={styles.fieldError}>{fieldErrors.barcode}</p>}
          </div>

          {lookupError && <p style={styles.error}>{lookupError}</p>}

          {scannedCopy && (
            <div style={styles.copyCard}>
              <p style={styles.copyTitle}>{scannedCopy.book_title}</p>
              <p style={styles.copyMeta}>
                {formatEdition(scannedCopy.published_year)} · {scannedCopy.barcode}
              </p>
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Borrower</label>
            <input
              style={fieldErrors.borrower ? { ...styles.input, ...styles.inputError } : styles.input}
              value={borrowerQuery}
              onChange={(e) => {
                setBorrowerQuery(e.target.value);
                setSelectedBorrower(null);
              }}
              placeholder="Search by name, phone, or username…"
            />
            {fieldErrors.borrower && <p style={styles.fieldError}>{fieldErrors.borrower}</p>}
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
                    setFieldErrors((f) => ({ ...f, borrower: undefined }))
                  }}
                  type="button"
                >
                  <p style={styles.resultName}>{b.name}</p>
                  <p style={styles.resultMeta}>{b.phone} · @{b.username}</p>
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
                <button style={styles.btnSecondary} onClick={handleCreateBorrower} disabled={checkoutLoading} type="button">
                  Create & select
                </button>
              </div>
            </div>
          )}

          {checkoutError && <p style={styles.error}>{checkoutError}</p>}
          {checkoutSuccess && <p style={styles.success}>{checkoutSuccess}</p>}

          <button
            style={styles.checkoutBtn}
            onClick={handleCheckout}
            disabled={checkoutLoading}
            type="button"
          >
            {checkoutLoading ? 'Processing…' : 'Check out book'}
          </button>
        </div>

        {/* Active loans */}
        <div style={styles.card}>
          <p style={styles.cardLabel}>Currently borrowed</p>

          {loading && <p style={styles.hint}>Loading…</p>}
          {error && <p style={styles.error}>{error}</p>}

          {!loading && loans.length === 0 && (
            <p style={styles.hint}>No books currently checked out.</p>
          )}

          {!loading && loans.length > 0 && (
            <div style={styles.loansList}>
              {loans.map((loan) => {
                const isNew = loan.physical_book_id === justAddedId;
                return (
                  <div
                    key={loan.physical_book_id}
                    style={{
                      ...styles.loanRow,
                      ...(isNew ? styles.loanRowNew : {}),
                    }}
                  >
                    <div style={styles.loanInfo}>
                      <p style={styles.loanTitle}>{loan.book_title}</p>
                      <p style={styles.loanMeta}>
                        {formatEdition(loan.published_year)} · {loan.barcode}
                      </p>
                      <p style={styles.loanBorrower}>
                        {loan.borrower_name} · {loan.borrower_phone}
                      </p>
                      <p style={styles.loanDate}>Checked out {formatDate(loan.checked_out_at)}</p>
                    </div>
                    <button
                      style={styles.checkinBtn}
                      onClick={() => setReturnModal({
                        physicalBookId: loan.physical_book_id,
                        barcode: loan.barcode,
                      })}
                      type="button"
                    >
                      Check in
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {returnModal && (
        <BorrowerModal
          physicalBookId={returnModal.physicalBookId}
          barcode={returnModal.barcode}
          onClose={() => setReturnModal(null)}
          onReturned={loadLoans}
        />
      )}
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
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.25rem',
    alignItems: 'start',
  },
  card: {
    background: '#fff',
    border: '1px solid #e4e2db',
    borderRadius: 10,
    padding: '1.25rem',
  },
  inputError: {
  borderColor: '#e53e3e',
  },
  loanRowNew: {
    animation: 'loanRowSlideIn 1s ease',
  },
  fieldError: {
    fontSize: 12,
    color: '#c0392b',
    margin: '0 0 8px',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: '#a09d97',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    margin: '0 0 1rem',
  },
  field: { marginBottom: '0.75rem' },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#6b6860',
    marginBottom: 5,
  },
  row: { display: 'flex', gap: 8 },
  input: {
    flex: 1,
    height: 36,
    padding: '0 10px',
    fontSize: 13,
    color: '#1a1917',
    background: '#f7f6f2',
    border: '1px solid #e4e2db',
    borderRadius: 5,
    outline: 'none',
    fontFamily: 'inherit',
    marginBottom: 6,
  },
  btn: {
    height: 36,
    padding: '0 14px',
    background: '#3d5a3e',
    color: '#fff',
    border: 'none',
    borderRadius: 5,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
  copyCard: {
    background: '#f0f4f8',
    border: '1px solid #d8dee9',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: '0.75rem',
  },
  copyTitle: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: 14,
    fontWeight: 500,
    color: '#1a1917',
    margin: 0,
  },
  copyMeta: {
    fontSize: 12,
    color: '#6b6860',
    margin: '2px 0 0',
    fontFamily: 'monospace',
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
    marginTop: 4,
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
  loansList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    border: '1px solid #e4e2db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  loanRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    padding: '12px 14px',
    background: '#fff',
    borderBottom: '1px solid #f0ede8',
  },
  loanInfo: { flex: 1 },
  loanTitle: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: 14,
    fontWeight: 500,
    color: '#1a1917',
    margin: 0,
  },
  loanMeta: {
    fontSize: 12,
    color: '#6b6860',
    margin: '2px 0',
    fontFamily: 'monospace',
  },
  loanBorrower: {
    fontSize: 13,
    color: '#1a1917',
    margin: '4px 0 2px',
  },
  loanDate: {
    fontSize: 12,
    color: '#a09d97',
    margin: 0,
  },
  checkinBtn: {
    height: 32,
    padding: '0 12px',
    background: '#fff',
    color: '#3d5a3e',
    border: '1px solid #c8d9c9',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  hint: { fontSize: 13, color: '#a09d97' },
  error: {
    fontSize: 13,
    color: '#c0392b',
    background: '#fdf2f1',
    border: '1px solid #f5c6c3',
    borderRadius: 6,
    padding: '8px 12px',
    marginBottom: '0.75rem',
  },
  success: {
    fontSize: 13,
    color: '#2a3f2b',
    background: '#eef3ee',
    border: '1px solid #c8d9c9',
    borderRadius: 6,
    padding: '8px 12px',
    marginBottom: '0.75rem',
  },
};
