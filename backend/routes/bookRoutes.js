import express from 'express';
import { getAllBooks, getBookById, getBookByTitle, addCompleteBook } from '../queries/books.js';

const router = express.Router();

router.get('/search', (req, res) => {
	const title = req.query.title;
	if (!title) {
		return res.status(400).json({ error: 'Title query parameter is required' });
	}
	const book = getBookByTitle(title);
	if (book) {
		res.json(book);
	} else {
		res.status(404).json({ error: 'Book not found' });
	}
})
router.get('/', (req, res) => {
	const books = getAllBooks()
	res.json(books);
})

router.get('/:id', (req, res) => {
	const bookId = req.params.id;
	const book = getBookById(bookId);
	if (book) {
		res.json(book);
	} else {
		res.status(404).json({ error: 'Book not found' });
	}
})

router.post('/', (req, res) => {
	try {
		const result = addCompleteBook(req.body);
		res.status(201).json(result);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
})

export default router;