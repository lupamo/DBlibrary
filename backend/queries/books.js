import db from '../database/db.js';

const getAllBooks = () => {
	return db.prepare(
		`
		SELECT 
			b.id,
			b.title,
			GROUP_CONCAT(DISTINCT a.name) as authors,
			GROUP_CONCAT(DISTINCT g.name) as genres
		FROM books b
		LEFT JOIN author_book ab ON b.id = ab.book_id
		LEFT JOIN authors a on ab.author_id = a.id
		LEFT JOIN book_genre bg ON b.id = bg.book_id
		LEFT JOIN genres g ON bg.genres_id = g.id
		GROUP BY b.id
		`
	).all()
}

const addBook = (title) => {
	return db.prepare(
		`INSERT INTO books (title) VALUES (?) RETURNING *`
	).get(title)
}

const getBookById = (id) => {
	return db.prepare('SELECT * FROM books where id = ?').get(id);
}

const getBookByTitle = (title) => {
	return db.prepare('SELECT * FROM books where title =?').get(title);
}
const updateBook = (id, title) => {
	return db.prepare(
		`UPDATE books SET title = ? WHERE id = ? RETURNING *`
	).get(title, id)
}
const getBookEditions = (bookId) => {
	return db.prepare(`
			SELECT id, published_year
			FROM book_editions
			WHERE book_id = ?
		`).all(bookId)
}


export {
	addBook,
	getAllBooks,
	getBookById,
	getBookByTitle,
	updateBook,
	getBookEditions
}