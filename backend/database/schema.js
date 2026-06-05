import db from './db';

const migrate =() => {
	db.exec(`
		CREATE TABLE IF NOT EXISTS authors (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS books (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS genres (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			FOREIGN KEY (id) REFERENCES books(id)
		);

		CREATE TABLE IF NOT EXISTS bookEdition (
			id integer,
			book_edition_id integer PRIMARY KEY AUTOINCREMENT,
			FOREIGN KEY (id) REFERENCES books(id)
		);
		
		CREATE TABLE IF NOT EXISTS physicalBook (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			book_id INTEGER NOT NULL,
			condition TEXT,
			barcode TEXT UNIQUE NOT NULL,
			FOREIGN KEY (book_id) REFERENCES books(id)
		);
		CREATE TABLE IF NOT EXISTS user (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			role TEXT NOT NULL,
			name TEXT NOT NULL,
			address TEXT NOT NULL,
			phone TEXT NOT NULL,
			username TEXT NOT NULL UNIQUE,
			password TEXT NOT NULL
		);
		
	`)
}

export default migrate;