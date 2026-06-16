import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';

function formatEdition(year, editionId, editions = []) {
  const label = year ? `${year} edition` : 'Edition (no year)';
  const duplicates = editions.filter((e) => e.published_year === year).length > 1;
  return duplicates ? `${label} #${editionId}` : label;
}

// ─── Tag Input ────────────────────────────────────────────────────────────────
function TagInput({ label, tags, onChange, placeholder }) {
  const [input, setInput] = useState('');
  const ref = useRef();

  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput('');
  };

  const remove = (tag) => onChange(tags.filter((t) => t !== tag));

  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <div style={s.tagBox} onClick={() => ref.current.focus()}>
        {tags.map((t) => (
          <span key={t} style={s.tag}>
            {t}
            <button style={s.tagX} onClick={() => remove(t)} type="button">×</button>
          </span>
        ))}
        <input
          ref={ref}
          style={s.tagInput}
          value={input}
          placeholder={tags.length === 0 ? placeholder : ''}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
            if (e.key === 'Backspace' && !input && tags.length) {
              onChange(tags.slice(0, -1));
            }
          }}
        />
      </div>
    </div>
  );
}

// ─── Step: Search ─────────────────────────────────────────────────────────────
function SearchStep({ onSelect, onCreate }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(() => {
      api.searchBooks(query)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <h2 style={s.stepTitle}>Add a book</h2>
      <p style={s.stepHint}>Search by title to find an existing book or create a new one.</p>

      <div style={s.field}>
        <label style={s.label}>Title</label>
        <input
          style={s.input}
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. The Talisman"
        />
      </div>

      {loading && <p style={s.hint}>Searching…</p>}

      {!loading && query.trim() && (
        <div style={s.resultsList}>
          {results.map((book) => (
            <button
              key={book.id}
              style={s.resultRow}
              onClick={() => onSelect(book)}
              type="button"
            >
              <div>
                <p style={s.resultTitle}>{book.title}</p>
                <p style={s.resultMeta}>{book.authors || 'No authors'}</p>
              </div>
              <span style={s.chip}>Select →</span>
            </button>
          ))}

          <button
            style={s.createRow}
            onClick={() => onCreate(query.trim())}
            type="button"
          >
            <span>＋ Create "<strong>{query.trim()}</strong>" as a new book</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Step: New Book Details ────────────────────────────────────────────────────
function NewBookStep({ initialTitle, onCreated, onBack }) {
  const [title, setTitle] = useState(initialTitle);
  const [authors, setAuthors] = useState([]);
  const [genres, setGenres] = useState([]);
  const [editionYear, setEditionYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = async () => {
    if (!title.trim()) return setError('Title is required.');
    if (!authors.length) return setError('Add at least one author.');
    if (!genres.length) return setError('Add at least one genre.');
    setError('');
    setLoading(true);
    try {
      const result = await api.addCompleteBook({
        title,
        authors,
        genres,
        editions: [{
          published_year: editionYear ? parseInt(editionYear, 10) : null,
          copies: [],
        }],
      });
      onCreated(result.bookId, title);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button style={s.back} onClick={onBack} type="button">← Back</button>
      <h2 style={s.stepTitle}>New book details</h2>

      <div style={s.field}>
        <label style={s.label}>Title</label>
        <input style={s.input} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <TagInput label="Authors" tags={authors} onChange={setAuthors} placeholder="e.g. Stephen King — press Enter" />
      <TagInput label="Genres" tags={genres} onChange={setGenres} placeholder="e.g. Horror — press Enter" />

      <div style={s.section}>
        <h3 style={s.sectionTitle}>Edition</h3>
        <p style={s.sectionHint}>Set the published year for the first edition of this book.</p>
        <div style={s.field}>
          <label style={s.label}>
            Published year <span style={s.optional}>(optional)</span>
          </label>
          <input
            style={{ ...s.input, maxWidth: 140 }}
            type="number"
            value={editionYear}
            onChange={(e) => setEditionYear(e.target.value)}
            placeholder="e.g. 1984"
          />
        </div>
      </div>

      {error && <p style={s.error}>{error}</p>}

      <div style={s.footer}>
        <button style={s.btn} onClick={handleNext} disabled={loading} type="button">
          {loading ? 'Creating…' : 'Create book →'}
        </button>
      </div>
    </div>
  );
}

// ─── Step: Pick Edition ────────────────────────────────────────────────────────
function PickEditionStep({ book, onPickEdition, onNewEdition, onBack }) {
  const [editions, setEditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('');
  const [showNewEdition, setShowNewEdition] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getBookEditions(book.id)
      .then(setEditions)
      .catch((err) => {
        setEditions([]);
        setError(err.message || 'Failed to load editions');
      })
      .finally(() => setLoading(false));
  }, [book.id]);

  const handleNewEdition = async () => {
    setCreating(true);
    setError('');
    try {
      const edition = await api.addEdition(book.id, {
        published_year: year ? parseInt(year, 10) : null,
      });
      onPickEdition(edition);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <button style={s.back} onClick={onBack} type="button">← Back</button>
      <h2 style={s.stepTitle}>{book.title}</h2>
      <p style={s.stepHint}>Pick an existing edition or create a new one before adding copies.</p>

      {loading && <p style={s.hint}>Loading editions…</p>}
      {error && !loading && !showNewEdition && <p style={s.error}>{error}</p>}

      {!loading && (
        <div style={s.resultsList}>
          {editions.map((ed) => (
            <button
              key={ed.id}
              style={s.resultRow}
              onClick={() => onPickEdition(ed)}
              type="button"
            >
              <div>
                <p style={s.resultTitle}>{formatEdition(ed.published_year, ed.id, editions)}</p>
                <p style={s.resultMeta}>
                  {ed.copy_count > 0
                    ? `${ed.copy_count} ${ed.copy_count === 1 ? 'copy' : 'copies'} in library`
                    : 'No copies yet'}
                </p>
              </div>
              <span style={s.chip}>Add copies →</span>
            </button>
          ))}

          {!showNewEdition && (
            <button style={s.createRow} onClick={() => setShowNewEdition(true)} type="button">
              ＋ Create a new edition
            </button>
          )}

          {showNewEdition && (
            <div style={{ ...s.section, marginTop: 8 }}>
              <h3 style={s.sectionTitle}>New edition</h3>
              <div style={s.field}>
                <label style={s.label}>Published year <span style={s.optional}>(optional)</span></label>
                <input
                  style={{ ...s.input, maxWidth: 140 }}
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g. 1984"
                />
              </div>
              {error && <p style={s.error}>{error}</p>}
              <div style={s.footer}>
                <button style={s.btnSecondary} onClick={() => setShowNewEdition(false)} type="button">Cancel</button>
                <button style={s.btn} onClick={handleNewEdition} disabled={creating} type="button">
                  {creating ? 'Creating…' : 'Create edition →'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step: Add Copies ─────────────────────────────────────────────────────────
function AddCopiesStep({ book, edition, onDone, onBack }) {
  const [copies, setCopies] = useState([{ barcode: '', condition: 'New' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const updateCopy = (i, field, value) => {
    setCopies((prev) => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  };

  const addRow = () => setCopies((prev) => [...prev, { barcode: '', condition: 'New' }]);
  const removeRow = (i) => setCopies((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    const valid = copies.filter((c) => c.barcode.trim());
    if (!valid.length) return setError('Add at least one barcode.');
    setError('');
    setLoading(true);
    try {
      await api.addCopies(edition.id, valid);
      setSuccess(`${valid.length} ${valid.length === 1 ? 'copy' : 'copies'} added successfully.`);
      setCopies([{ barcode: '', condition: 'New' }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button style={s.back} onClick={onBack} type="button">← Back</button>
      <h2 style={s.stepTitle}>{book.title}</h2>
      <p style={s.stepHint}>
        {formatEdition(edition.published_year, edition.id)} — add physical copies.
      </p>

      <div style={s.copiesHead}>
        <span style={s.label}>Barcode</span>
        <span style={s.label}>Condition</span>
        <span />
      </div>

      {copies.map((copy, i) => (
        <div key={i} style={s.copyRow}>
          <input
            style={s.input}
            value={copy.barcode}
            onChange={(e) => updateCopy(i, 'barcode', e.target.value)}
            placeholder="e.g. LIB-001"
          />
          <select
            style={s.select}
            value={copy.condition}
            onChange={(e) => updateCopy(i, 'condition', e.target.value)}
          >
            {['New', 'Good', 'Fair', 'Poor'].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button
            style={s.removeBtn}
            onClick={() => removeRow(i)}
            disabled={copies.length === 1}
            type="button"
          >✕</button>
        </div>
      ))}

      <button style={s.addRowBtn} onClick={addRow} type="button">＋ Add another copy</button>

      {error && <p style={s.error}>{error}</p>}
      {success && <p style={s.successMsg}>{success}</p>}

      <div style={s.footer}>
        <button style={s.btnSecondary} onClick={onDone} type="button">Done</button>
        <button style={s.btn} onClick={handleSubmit} disabled={loading} type="button">
          {loading ? 'Saving…' : 'Save copies'}
        </button>
      </div>
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────
export default function AddBookFlow() {
  const [step, setStep] = useState('search');
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedEdition, setSelectedEdition] = useState(null);
  const [newBookTitle, setNewBookTitle] = useState('');

  const reset = () => {
    setStep('search');
    setSelectedBook(null);
    setSelectedEdition(null);
    setNewBookTitle('');
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Progress indicator */}
        <div style={s.progress}>
          {['search', 'details', 'edition', 'copies'].map((st, i) => (
            <div key={st} style={{
              ...s.dot,
              background: step === st ? '#3d5a3e' : '#e4e2db',
            }} />
          ))}
        </div>

        {step === 'search' && (
          <SearchStep
            onSelect={(book) => { setSelectedBook(book); setStep('edition'); }}
            onCreate={(title) => { setNewBookTitle(title); setStep('details'); }}
          />
        )}

        {step === 'details' && (
          <NewBookStep
            initialTitle={newBookTitle}
            onCreated={(bookId, title) => {
              setSelectedBook({ id: bookId, title });
              setStep('edition');
            }}
            onBack={() => setStep('search')}
          />
        )}

        {step === 'edition' && selectedBook && (
          <PickEditionStep
            book={selectedBook}
            onPickEdition={(edition) => { setSelectedEdition(edition); setStep('copies'); }}
            onBack={() => setStep('search')}
          />
        )}

        {step === 'copies' && selectedBook && selectedEdition && (
          <AddCopiesStep
            book={selectedBook}
            edition={selectedEdition}
            onDone={reset}
            onBack={() => setStep('edition')}
          />
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page: {
    fontFamily: "'Inter', system-ui, sans-serif",
    maxWidth: 560,
  },
  card: {
    background: '#fff',
    border: '1px solid #e4e2db',
    borderRadius: 12,
    padding: '1.75rem',
  },
  progress: {
    display: 'flex',
    gap: 6,
    marginBottom: '1.5rem',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    transition: 'background 0.2s',
  },
  stepTitle: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: 18,
    fontWeight: 500,
    color: '#1a1917',
    margin: '0 0 4px',
  },
  stepHint: {
    fontSize: 13,
    color: '#a09d97',
    margin: '0 0 1.25rem',
  },
  section: {
    marginTop: '1.25rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid #f0ede8',
  },
  sectionTitle: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: 14,
    fontWeight: 500,
    color: '#1a1917',
    margin: '0 0 4px',
  },
  sectionHint: {
    fontSize: 12,
    color: '#a09d97',
    margin: '0 0 1rem',
  },
  back: {
    background: 'none',
    border: 'none',
    fontSize: 13,
    color: '#6b6860',
    cursor: 'pointer',
    padding: 0,
    marginBottom: '1rem',
    fontFamily: 'inherit',
  },
  field: { marginBottom: '1rem' },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#6b6860',
    marginBottom: 5,
  },
  optional: { fontWeight: 400, color: '#a09d97' },
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
  select: {
    width: '100%',
    height: 36,
    padding: '0 8px',
    fontSize: 13,
    color: '#1a1917',
    background: '#f7f6f2',
    border: '1px solid #e4e2db',
    borderRadius: 5,
    outline: 'none',
    fontFamily: 'inherit',
  },
  tagBox: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
    alignItems: 'center',
    padding: '5px 8px',
    background: '#f7f6f2',
    border: '1px solid #e4e2db',
    borderRadius: 5,
    minHeight: 36,
    cursor: 'text',
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    background: '#eef3ee',
    color: '#2a3f2b',
    border: '1px solid #c8d9c9',
    borderRadius: 4,
    padding: '2px 7px',
    fontSize: 12,
    fontWeight: 500,
  },
  tagX: {
    background: 'none',
    border: 'none',
    color: '#2a3f2b',
    cursor: 'pointer',
    fontSize: 14,
    padding: 0,
    lineHeight: 1,
    opacity: 0.6,
  },
  tagInput: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 13,
    color: '#1a1917',
    minWidth: 120,
    flex: 1,
    fontFamily: 'inherit',
  },
  resultsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    border: '1px solid #e4e2db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    background: '#fff',
    border: 'none',
    borderBottom: '1px solid #f0ede8',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    gap: 12,
  },
  resultTitle: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: 14,
    fontWeight: 500,
    color: '#1a1917',
    margin: 0,
  },
  resultMeta: {
    fontSize: 12,
    color: '#a09d97',
    margin: '2px 0 0',
  },
  chip: {
    fontSize: 12,
    color: '#3d5a3e',
    background: '#eef3ee',
    border: '1px solid #c8d9c9',
    borderRadius: 4,
    padding: '3px 8px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  createRow: {
    display: 'block',
    width: '100%',
    padding: '12px 14px',
    background: '#f7f6f2',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 13,
    color: '#6b6860',
    fontFamily: 'inherit',
  },
  copiesHead: {
    display: 'grid',
    gridTemplateColumns: '1fr 120px 32px',
    gap: 8,
    marginBottom: 6,
  },
  copyRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 120px 32px',
    gap: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  removeBtn: {
    background: 'none',
    border: '1px solid #e4e2db',
    borderRadius: 5,
    height: 36,
    width: 32,
    cursor: 'pointer',
    color: '#a09d97',
    fontSize: 12,
    fontFamily: 'inherit',
  },
  addRowBtn: {
    background: 'none',
    border: '1px dashed #c8c5bc',
    borderRadius: 5,
    padding: '6px 12px',
    fontSize: 12,
    color: '#6b6860',
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginBottom: '1rem',
    marginTop: 2,
  },
  hint: { fontSize: 13, color: '#a09d97' },
  error: {
    fontSize: 13,
    color: '#c0392b',
    background: '#fdf2f1',
    border: '1px solid #f5c6c3',
    borderRadius: 6,
    padding: '8px 12px',
    marginBottom: '1rem',
  },
  successMsg: {
    fontSize: 13,
    color: '#2a3f2b',
    background: '#eef3ee',
    border: '1px solid #c8d9c9',
    borderRadius: 6,
    padding: '8px 12px',
    marginBottom: '1rem',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: '1.25rem',
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
};