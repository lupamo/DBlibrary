import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import BorrowerModal from './BorrowerModal';

function formatEdition(year) {
  return year ? `${year} edition` : 'Edition (no year)';
}

function groupCopiesByEdition(copies) {
  const groups = new Map();
  for (const copy of copies) {
    const key = copy.edition_id;
    if (!groups.has(key)) {
      groups.set(key, {
        edition_id: copy.edition_id,
        published_year: copy.published_year,
        copies: [],
      });
    }
    groups.get(key).copies.push(copy);
  }
  return [...groups.values()];
}

export default function BookList() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [modal, setModal] = useState(null); 

  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getBooks();
      setBooks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const filtered = books.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      (b.authors && b.authors.toLowerCase().includes(q))
    );
  });

  if (loading) return <p style={styles.hint}>Loading books…</p>;
  if (error) return <p style={styles.error}>{error}</p>;

  return (
    <div>
      <div style={styles.topRow}>
        <h2 style={styles.pageTitle}>Books</h2>
        <input
          style={styles.search}
          type="text"
          placeholder="Search title or author…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <p style={styles.hint}>No books found.</p>
      )}

      <div style={styles.list}>
        {filtered.map((book) => {
          const available = (book.total_copies || 0) - (book.checked_out_copies || 0);
          const isExpanded = expanded === book.id;

          return (
            <div key={book.id} style={styles.bookCard}>
              {/* Book row */}
              <div
                style={styles.bookRow}
                onClick={() => setExpanded(isExpanded ? null : book.id)}
              >
                <div style={styles.bookInfo}>
                  <p style={styles.bookTitle}>{book.title}</p>
                  <p style={styles.bookAuthors}>
                    {book.authors || 'Unknown author'}
                  </p>
                  {book.genres && (
                    <div style={styles.tags}>
                      {book.genres.split(',').map((g) => (
                        <span key={g} style={styles.tag}>{g.trim()}</span>
                      ))}
                    </div>
                  )}
                  {book.editions?.length > 0 && (
                    <div style={styles.editionTags}>
                      {book.editions.map((edition) => (
                        <span key={edition.id} style={styles.editionTag}>
                          {formatEdition(edition.published_year)}
                          {edition.copy_count > 0 && ` · ${edition.copy_count}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={styles.copyStatus}>
                  <span style={{
                    ...styles.badge,
                    ...(available > 0 ? styles.badgeAvailable : styles.badgeOut),
                  }}>
                    {available}/{book.total_copies || 0} available
                  </span>
                  <span style={styles.chevron}>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded physical copies */}
              {isExpanded && book.copies && book.copies.length > 0 && (
                <div style={styles.copiesList}>
                  {groupCopiesByEdition(book.copies).map((group) => (
                    <div key={group.edition_id}>
                      <div style={styles.editionHeader}>
                        <span style={styles.editionLabel}>{formatEdition(group.published_year)}</span>
                        <span style={styles.editionCount}>
                          {group.copies.length} {group.copies.length === 1 ? 'copy' : 'copies'}
                        </span>
                      </div>
                      <div style={styles.copyTableHead}>
                        <span>Barcode</span>
                        <span>Condition</span>
                        <span>Status</span>
                      </div>
                      {group.copies.map((copy) => (
                        <div
                          key={copy.id}
                          style={styles.copyRow}
                          onClick={() => copy.is_checked_out && setModal({
                            physicalBookId: copy.id,
                            barcode: copy.barcode,
                          })}
                        >
                          <span style={styles.barcode}>{copy.barcode}</span>
                          <span style={styles.condition}>{copy.condition}</span>
                          <span style={{
                            ...styles.copyBadge,
                            ...(copy.is_checked_out ? styles.copyOut : styles.copyIn),
                          }}>
                            {copy.is_checked_out ? 'Checked out →' : 'Available'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {isExpanded && book.editions?.length > 0 && (!book.copies || book.copies.length === 0) && (
                <div style={styles.copiesList}>
                  {book.editions.map((edition) => (
                    <div key={edition.id} style={styles.editionHeader}>
                      <span style={styles.editionLabel}>{formatEdition(edition.published_year)}</span>
                      <span style={styles.editionCount}>No copies yet</span>
                    </div>
                  ))}
                </div>
              )}

              {isExpanded && (!book.editions?.length) && (
                <p style={{ ...styles.hint, padding: '10px 16px' }}>
                  No physical copies registered.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {modal && (
        <BorrowerModal
          physicalBookId={modal.physicalBookId}
          barcode={modal.barcode}
          onClose={() => setModal(null)}
          onReturned={loadBooks}
        />
      )}
    </div>
  );
}

const styles = {
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.25rem',
    gap: 12,
  },
  pageTitle: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: 20,
    fontWeight: 500,
    color: '#1a1917',
    margin: 0,
  },
  search: {
    height: 34,
    padding: '0 10px',
    fontSize: 13,
    color: '#1a1917',
    background: '#fff',
    border: '1px solid #e4e2db',
    borderRadius: 6,
    outline: 'none',
    fontFamily: 'inherit',
    width: 220,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    background: '#e4e2db',
    border: '1px solid #e4e2db',
    borderRadius: 10,
    overflow: 'hidden',
  },
  bookCard: {
    background: '#fff',
  },
  bookRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '14px 16px',
    cursor: 'pointer',
    gap: 12,
  },
  bookInfo: { flex: 1 },
  bookTitle: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: 14,
    fontWeight: 500,
    color: '#1a1917',
    margin: 0,
    marginBottom: 3,
  },
  bookAuthors: {
    fontSize: 13,
    color: '#6b6860',
    margin: 0,
    marginBottom: 6,
  },
  tags: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  tag: {
    fontSize: 11,
    fontWeight: 500,
    color: '#2a3f2b',
    background: '#eef3ee',
    border: '1px solid #c8d9c9',
    borderRadius: 4,
    padding: '2px 7px',
  },
  editionTags: { display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 },
  editionTag: {
    fontSize: 11,
    fontWeight: 500,
    color: '#4a5568',
    background: '#f0f4f8',
    border: '1px solid #d8dee9',
    borderRadius: 4,
    padding: '2px 7px',
  },
  copyStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  badge: {
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 20,
    padding: '3px 10px',
    whiteSpace: 'nowrap',
  },
  badgeAvailable: {
    background: '#eef3ee',
    color: '#2a3f2b',
    border: '1px solid #c8d9c9',
  },
  badgeOut: {
    background: '#fdf2f1',
    color: '#c0392b',
    border: '1px solid #f5c6c3',
  },
  chevron: { fontSize: 10, color: '#a09d97' },
  copiesList: {
    borderTop: '1px solid #f0ede8',
    padding: '8px 0',
  },
  editionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    background: '#f7f6f2',
    borderTop: '1px solid #f0ede8',
    borderBottom: '1px solid #f0ede8',
  },
  editionLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#4a5568',
    fontFamily: "'Lora', Georgia, serif",
  },
  editionCount: {
    fontSize: 11,
    color: '#a09d97',
  },
  copyTableHead: {
    display: 'grid',
    gridTemplateColumns: '1fr 80px 120px',
    alignItems: 'center',
    padding: '6px 16px',
    gap: 12,
    fontSize: 11,
    fontWeight: 500,
    color: '#a09d97',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  copyRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 80px 120px',
    alignItems: 'center',
    padding: '7px 16px',
    gap: 12,
    cursor: 'default',
  },
  barcode: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6b6860',
  },
  condition: {
    fontSize: 12,
    color: '#a09d97',
  },
  copyBadge: {
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 4,
    padding: '2px 8px',
    textAlign: 'center',
  },
  copyIn: {
    background: '#eef3ee',
    color: '#2a3f2b',
  },
  copyOut: {
    background: '#fdf2f1',
    color: '#c0392b',
    cursor: 'pointer',
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
};