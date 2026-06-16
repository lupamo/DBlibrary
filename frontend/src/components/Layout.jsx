export default function Layout({ user, activePage, onNavigate, onLogout, children }) {
  const navItems = [
    { id: 'books', label: 'Books' },
    { id: 'borrowers', label: 'Borrowers' },
  ];

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div>
          <h1 style={styles.wordmark}>DBlibrary</h1>
          <p style={styles.sideSubtitle}>Catalogue management</p>
        </div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <button
              key={item.id}
              style={{
                ...styles.navBtn,
                ...(activePage === item.id ? styles.navBtnActive : {}),
              }}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div style={styles.userBox}>
          <p style={styles.userName}>{user.name}</p>
          <p style={styles.userRole}>{user.role}</p>
          <button style={styles.logoutBtn} onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles = {
  shell: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Inter', system-ui, sans-serif",
    background: '#f7f6f2',
  },
  sidebar: {
    width: 220,
    background: '#fff',
    borderRight: '1px solid #e4e2db',
    padding: '1.5rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    flexShrink: 0,
  },
  wordmark: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: 18,
    fontWeight: 500,
    color: '#3d5a3e',
    margin: 0,
  },
  sideSubtitle: {
    fontSize: 12,
    color: '#a09d97',
    marginTop: 3,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1,
  },
  navBtn: {
    background: 'none',
    border: 'none',
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: 13,
    color: '#6b6860',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'background 0.1s',
  },
  navBtnActive: {
    background: '#eef3ee',
    color: '#2a3f2b',
    fontWeight: 500,
  },
  userBox: {
    borderTop: '1px solid #e4e2db',
    paddingTop: '1rem',
  },
  userName: {
    fontSize: 13,
    fontWeight: 500,
    color: '#1a1917',
    margin: 0,
  },
  userRole: {
    fontSize: 11,
    color: '#a09d97',
    marginTop: 2,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  logoutBtn: {
    background: 'none',
    border: '1px solid #e4e2db',
    borderRadius: 5,
    padding: '5px 10px',
    fontSize: 12,
    color: '#6b6860',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};