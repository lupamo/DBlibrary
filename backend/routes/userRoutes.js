import express from 'express';
import { createUser, createLibrarian, searchBorrowers, getBorrowers } from '../queries/users.js';

const router = express.Router();

router.get('/borrowers', (req, res) => {
	const { q } = req.query;
	const borrowers = q?.trim() ? searchBorrowers(q.trim()) : getBorrowers();
	res.json(borrowers);
});

router.post('/borrowers', (req, res) => {
    const { name, phone, username, password } = req.body;
    if (!name || !phone || !username || !password) {
        return res.status(400).json({ error: 'All fields required' });
    }
    try {
        const user = createUser(name, phone, username, password);
        res.status(201).json(user);
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Username already taken' });
        }
        res.status(500).json({ error: err.message });
    }
});

router.post('/librarians', (req, res) => {
    const { name, phone, username, password } = req.body;
    if (!name || !phone || !username || !password) {
        return res.status(400).json({ error: 'All fields required' });
    }
    try {
        const librarian = createLibrarian(name, phone, username, password);
        res.status(201).json(librarian);
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Username already taken' });
        }
        res.status(500).json({ error: err.message });
    }
});

export default router;