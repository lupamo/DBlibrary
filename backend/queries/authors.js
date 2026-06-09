import db from '../database/db.js'

const getAllAuthors = () => {
	return db.prepare(
		`
		SELECT
			authors.id,
			authors.name,
			GROUP_CONCAT(books.title) as books
		FROM authors
		LEFT JOIN author_book ON authors.id = author_book.author_id
		LEFT JOIN books on author_book.book_id = books.id
		GROUP BY authors.id
		`
	).all()
}

const addAuthor = (name) => {
	return db.prepare(
		`INSERT INTO authors (name) VALUES (?) RETURNING *`
	).get(name)
}

const getAuthorById = (id) => {
	return db.prepare(
		`SELECT * FROM authors WHERE id = ?`
	).get(id)
}

const getAuthorByName = (name) => {
	return db.prepare(
		`SELECT * FROM authors WHERE name LIKE ?`
	).all(`%${name}%`)
}

const updateAuthor = (id, name) => {
	return db.prepare(
		`UPDATE authors SET name = ? WHERE id = ? RETURNING *`
	).get(name, id)
}

const getAuthorWithBooks = (authorId) => {
	return db.prepare(`
		SELECT 
			authors.id,
			authors.name,
			GROUP_CONCAT(books.title) as books
		FROM authors
		LEFT JOIN author_book ON authors.id = author_book.author_id
		LEFT JOIN books on author_book.book_id = books.id
		WHERE authors.id = ?
		GROUP BY authors.id
	`).get(authorId);
}

export {
	getAllAuthors, 
	addAuthor, 
	getAuthorById, 
	getAuthorByName, 
	updateAuthor, 
	getAuthorWithBooks
}