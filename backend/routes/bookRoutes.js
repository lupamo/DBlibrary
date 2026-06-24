import express from 'express';
import { getAllBooksWithCopies, getBookById, addCompleteBook, searchBook, getBookEditions, addEdition, updateCompleteBook, deleteBook } from '../queries/books.js';

const router = express.Router();

router.get('/', (req, res) => {
	const books = getAllBooksWithCopies()
	res.json(books);
})

router.get('/search', (req, res) => {
	const { title } = req.query;
	if (!title) {
		return(res.status(400).json({ error: 'title query is required' }))
	}
	const books = searchBook(title);
	res.json(books);
})

router.get('/:id/editions', (req, res) => {
	const id = parseInt(req.params.id);
	if (isNaN(id)) {
		return res.status(400).json({ error: 'Invalid book ID' });
	}
	const editions = getBookEditions(id);
	res.json(editions);
})

router.post('/:id/editions', (req, res) => {
	const id = parseInt(req.params.id);
	if (isNaN(id)) {
		return res.status(400).json({ error: 'Invalid book ID' });
	}
	const { published_year } = req.body;
	try {
		const edition = addEdition(id, published_year);
		res.status(201).json(edition);
	} catch (error) {
		if (error.message === 'Book not found') {
			return res.status(404).json({ error: error.message });
		}
		res.status(400).json({ error: error.message });
	}
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

router.put('/:id', (req, res) => {
	try {
		const book = updateCompleteBook(Number(req.params.id), req.body);
		res.json(book);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

router.delete('/:id', (req, res) => {
	try {
		const result = deleteBook(Number(req.params.id));
		res.json(result);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

router.post('/', (req, res) => {
	try {
		const result = addCompleteBook(req.body);
		res.status(201).json(result);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
})

export default router;

