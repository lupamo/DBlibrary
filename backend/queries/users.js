import db from '../database/db.js';
import bcrypt from 'bcryptjs';

const loginUser = (username, password) => {
	const user = db.prepare(
		`
		SELECT id, name, username, role, phone, password
		FROM users WHERE username =?
		`
	).get(username);

	if (!user) {
		return null;
	}
	const valid = bcrypt.compareSync(password, user.password);

	if(!valid){
		return null;
	}
	const { password: _, ...safeUser} = user;
	
	return safeUser;
}

const createLibrarian = (name, phone, username, password) => {
    const hashed = bcrypt.hashSync(password, 10);
    return db.prepare(`
        INSERT INTO users (name, phone, username, password, role)
        VALUES (?, ?, ?, ?, 'librarian')
        RETURNING id, name, username, role
    `).get(name, phone, username, hashed);
}

const createUser = (name, phone, username, password) => {
	const  hashed = bcrypt.hashSync(password, 10);

	return db.prepare(
		`
		INSERT INTO users (name, phone, username, password, role)
		VALUES (?, ?, ?, ?, 'user')
		RETURNING id, name, username, role
		`
	).get(name, phone, username, hashed);
}

const getUserById = (id) => {
	return db.prepare(
		`SELECT * FROM users WHERE id = ?`
	).get(id)
}

const getLibrarianById = (id) => {
	return db.prepare(
		`SELECT * FROM users WHERE id = ? AND role = 'librarian'`
	).get(id)
}

const getUserByUsername = (username) => {
	return db.prepare(
		`SELECT * FROM users WHERE username = ?`
	).get(username)
}

export {
	loginUser,
	createUser,
	createLibrarian,
	getUserById,
	getLibrarianById,
	getUserByUsername
}