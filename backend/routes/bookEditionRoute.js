import express from 'express';
import { addPhysicalCopies } from '../queries/books.js';

const router = express.Router();

router.post('/:id/copies', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const { copies } = req.body;
    if (!copies?.length) return res.status(400).json({ error: 'copies array required' });
    try {
        const result = addPhysicalCopies(id, copies);
        res.status(201).json(result);
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Barcode already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

export default router;