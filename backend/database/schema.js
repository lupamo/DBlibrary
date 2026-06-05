import db from './db';
const migrate =() => {
	db.exec(`
		PRAGMA foreign_keys = ON;

		CREATE TABLE IF NOT EXISTS authors (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL
		);
		
		CREATE TABLE IF NOT EXISTS genres (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS books (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			genre_id INTEGER REFERENCES genres(id) NOT NULL
		);

		CREATE TABLE IF NOT EXISTS book_edition (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			book_id INTEGER REFERENCES books(id) NOT NULL,
			published_year INTEGER
		);
		
		CREATE TABLE IF NOT EXISTS physical_book (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			book_edition_id INTEGER NOT NULL REFERENCES book_edition(id),
			condition TEXT,
			barcode TEXT UNIQUE NOT NULL
		);

		CREATE TABLE IF NOT EXISTS user (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'librarian')),
			name TEXT NOT NULL,
			phone TEXT NOT NULL,
			username TEXT NOT NULL UNIQUE,
			password TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS author_book (
		author_id INTEGER NOT NULL REFERENCES authors(id),
		book_id INTEGER NOT NULL REFERENCES books(id),
		PRIMARY KEY (author_id, book_id)
		);

		CREATE TABLE IF NOT EXISTS checkout_entries (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		borrower_id INTEGER NOT NULL REFERENCES user(id),
		librarian_id INTEGER NOT NULL REFERENCES user(id)
		checked_out_at TEXT NOT NULL DEFAULT (datetime('now')),
		returned_at TEXT
		);

		CREATE TABLE IF NOT EXISTS checkout (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		checkout_id INTEGER NOT NULL REFERENCES checkout_entries(id),
		physical_book_id INTEGER NOT NULL REFERENCES physical_book(id)
		);
	`);
}

export default migrate;