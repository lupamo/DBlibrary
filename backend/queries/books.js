import db from '../database/db.js';
import database from './database/db.js';

const getAllBooks = () => {
	return db.prepare('SELECT * FROM books').all()
}

const addBook = (title, genres) => {
	return db.prepare(
		`INSERT INTO books (title, genres) VALUES (?, ?) RETURNING *`
	).get(title, genres)
}

const getBookById = (id) => {
	return db.prepare('SELECT * FROM books where id = ?').get(id);
}

const getBookByTitle = (title) => {
	return db.prepare('SELECT * FROM books where title =?').get(title);
}
export {
	addBook,
	getAllBooks,
	getBookById,
	updateBook
}