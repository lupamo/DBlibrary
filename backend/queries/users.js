import db from '../database/db.js';

const getUserById = (id) => {
	return db.prepare(
		`SELECT * FROM users WHERE id = ?`
	)
}

const getLibrarianById = (id) => {
	return db.prepare(
		`SELECT * FROM users WHERE id = ? AND role = 'librarian'`
	)
}

const getUserByUsername = (username) => {
	return db.prepare(
		`SELECT * FROM users WHERE username = ?`
	).get(username)
}

const addUser = (userData) => {
	const { name, phone, username, password, role } = userData;
	return db.prepare(
		`INSERT INTO users (name, phone, username, password, role) VALUES (?, ?, ?, ?, ?) RETURNING *`
	).get(name, phone, username, password, role)
}

export {
	getUserById,
	getLibrarianById,
	getUserByUsername,
	addUser
}