import database from './models/model.js';

const addBook = database.prepare(`
	INSERT INTO books (title, author, published_year)
	VALUES (?, ?, ?)
	RETURNING book_id, title, author, published_year`
)

const getAllBooks= database.prepare(`
	SELECT * FROM books`
)
const getBookById = database.prepare(`
	SELECT * FROM books
	WHERE book_id = ?`
)

const updateBook =  database.prepare(`
	UPDATE books SET title = ?, author = ?, published_year = ? WHERE book_id = ?`
)

export {
	addBook,
	getAllBooks,
	getBookById,
	updateBook
}