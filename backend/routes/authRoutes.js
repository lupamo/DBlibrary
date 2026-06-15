import express from 'express';
import { loginUser } from '../queries/users.js';

const router = express.Router();

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    const user = loginUser(username, password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.role !== 'librarian') {
        return res.status(403).json({ error: 'Access restricted to librarians' });
    }
    res.json({ user });
});

export default router;