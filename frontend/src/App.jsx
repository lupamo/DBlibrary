import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import BookList from './components/BookList';
import CreateUserForm from './components/CreateUserForm';
import AddBookForm from './components/AddBookForm';
import CheckoutsPage from './pages/CheckoutsPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('books');

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <Layout
      user={user}
      activePage={page}
      onNavigate={setPage}
      onLogout={() => setUser(null)}
    >
      {page === 'books' && <BookList librarian={user} />}
      {page === 'checkouts' && <CheckoutsPage librarian={user} />}
      {page === 'borrowers' && <CreateUserForm />}
      {page === 'add-book' && <AddBookForm />}
    </Layout>
  );
}