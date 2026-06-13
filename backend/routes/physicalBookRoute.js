import express from 'express';
import { borrowedBook, checkedIn } from '../queries/physicalBooks.js';

const router = express.Router();

router.get('/:id/borrower', (req, res) => {
	const id = parseInt(req.params.id)
	if (isNaN(id)) {
		return res.status(400).json({ error: 'Invalid ID' })
	}
	const borrower = borrowedBook(id)
	if (!borrower) {
		return res.status(404).json({ error: 'Physical book not currently borrowed' })
	}
	return res.json(borrower)
})

router.patch('/return/:id', (req, res) => {
	const id = parseInt(req.params.id)
	if (isNaN(id)) {
		return res.status(400).json({ error: 'Invalid ID' })
	}
	const result = checkedIn(id)
	if (result.changes === 0) {
		return res.status(404).json({ error: 'Physical book not currently borrowed' })
	}
	return res.json({ message: 'Book returned successfully' })
})

export default router;