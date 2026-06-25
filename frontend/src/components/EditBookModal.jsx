import { useState } from 'react';

function EditBookModal({ book, loading, error, onSave, onClose }) {
  const [title, setTitle] = useState(book.title);
  const [authorsText, setAuthorsText] = useState(book.authors || '');
  const [genresText, setGenresText] = useState(book.genres || '');

  const handleSubmit = () => {
    onSave({
      title: title.trim(),
      authors: authorsText.split(',').map((a) => a.trim()).filter(Boolean),
      genres: genresText.split(',').map((g) => g.trim()).filter(Boolean),
    });
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <p style={styles.modalTitle}>Edit book</p>

        <label style={styles.label}>Title</label>
        <input style={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} />

        <label style={styles.label}>Authors (comma separated)</label>
        <input style={styles.input} value={authorsText} onChange={(e) => setAuthorsText(e.target.value)} />

        <label style={styles.label}>Genres (comma separated)</label>
        <input style={styles.input} value={genresText} onChange={(e) => setGenresText(e.target.value)} />

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.modalActions}>
          <button style={styles.btnSecondary} onClick={onClose} type="button">Cancel</button>
          <button style={styles.btn} onClick={handleSubmit} disabled={loading} type="button">
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
	iconBtn: {
  background: 'none',
  border: '1px solid #e4e2db',
  borderRadius: 5,
  width: 28,
  height: 28,
  cursor: 'pointer',
  fontSize: 13,
  color: '#6b6860',
},
revalidating: {
  fontSize: 13,
  color: '#a09d97',
  marginLeft: 6,
},
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
label: {
  fontFamily: "'Lora', Georgia, serif",
  fontSize: 14,
  fontWeight: 500,
  color: '#1a1917',
  margin: 0,
  marginBottom: 3,
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
modalTitle: {
  fontFamily: "'Lora', Georgia, serif",
  fontSize: 16,
  fontWeight: 500,
  color: '#1a1917',
  margin: '0 0 12px',
},
modalActions: {
  display: 'flex',
  gap: 8,
  justifyContent: 'flex-end',
  marginTop: '1rem',
},
btnDanger: {
  height: 36,
  padding: '0 14px',
  background: '#c0392b',
  color: '#fff',
  border: 'none',
  borderRadius: 7,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
},
btn: {
  height: 36,
  padding: '0 18px',
  background: '#3d5a3e',
  color: '#fff',
  border: 'none',
  borderRadius: 7,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
},
btnSecondary: {
  height: 36,
  padding: '0 14px',
  background: 'none',
  color: '#6b6860',
  border: '1px solid #e4e2db',
  borderRadius: 7,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
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
  marginBottom: 10,
},
}

export default EditBookModal;