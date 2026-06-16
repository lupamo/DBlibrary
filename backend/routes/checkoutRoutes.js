import express from 'express';
import { createCheckout, getActiveCheckouts } from '../queries/checkouts.js';

const router = express.Router();

router.get('/active', (req, res) => {
	const checkouts = getActiveCheckouts();
	res.json(checkouts);
});

router.post('/', (req, res) => {
	const { librarian_id, borrower_id, physical_book_ids } = req.body;
	if (!librarian_id || !borrower_id) {
		return res.status(400).json({ error: 'librarian_id and borrower_id are required' });
	}
	try {
		const checkout = createCheckout(librarian_id, borrower_id, physical_book_ids);
		res.status(201).json(checkout);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});

export default router;
