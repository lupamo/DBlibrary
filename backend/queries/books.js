import db from '../database/db.js';

const getAllBooks = () => {
	return db.prepare(
		`
		SELECT 
			b.id,
			b.title,
			GROUP_CONCAT(DISTINCT a.name) as authors,
			GROUP_CONCAT(DISTINCT g.name) as genres,
			COUNT(DISTINCT pb.id) as total_copies,
			COUNT(DISTINCT CASE WHEN c.returned_at is NULL AND c.id is NOT NULL THEN pb.id END) as checked_out_copies
		FROM books b
		LEFT JOIN author_book ab ON b.id = ab.book_id
		LEFT JOIN authors a on ab.author_id = a.id
		LEFT JOIN book_genre bg ON b.id = bg.book_id
		LEFT JOIN genres g ON bg.genre_id = g.id
		LEFT JOIN book_editions be ON b.id = be.book_id
		LEFT JOIN physical_books pb ON be.id = pb.book_edition_id
		LEFT JOIN checkout_entries ce ON pb.id = ce.physical_book_id
		LEFT JOIN checkouts c ON ce.checkout_id = c.id
		GROUP BY b.id
		`
	).all()
}

const addCompleteBook = db.transaction((bookData) => {
	const { title, authors, genres, editions } = bookData;

	const getAuthor = db.prepare(`SELECT id FROM authors WHERE name = ?`);
	const addAuthor = db.prepare(`INSERT INTO authors (name) VALUES (?) RETURNING id`);

	const authorIds = [];
	for (const name of authors) {
		const existing = getAuthor.get(name);
		if (existing) {
			authorIds.push(existing.id);
		} else {
			const newlyCreated = addAuthor.get(name);
			authorIds.push(newlyCreated.id);
		}
	}

	const getGenre = db.prepare(`SELECT id FROM genres WHERE name = ?`);
	const addGenre = db.prepare(`INSERT INTO genres (name) VALUES (?) RETURNING id`);

	const genreIds = [];
	for (const name of genres) {
		const existing = getGenre.get(name);
		if (existing) {
			genreIds.push(existing.id);
		} else {
			const newlyCreated = addGenre.get(name);
			genreIds.push(newlyCreated.id);
		}
	}

	const bookResult = db.prepare(
		`INSERT INTO books (title) values (?) RETURNING id`
	).get(title)
	const bookId = bookResult.id;

	const linkAuthor = db.prepare(`INSERT INTO author_book (author_id, book_id) VALUES (?, ?)`);
	for (const authorId of authorIds) {
		linkAuthor.run(authorId, bookId);
	}

	const linkGenre = db.prepare(
		`INSERT INTO book_genre (book_id, genre_id) VALUES (?, ?)`
	);
	for (const genreId of genreIds) {
		linkGenre.run(bookId, genreId);
	}

	const insertEdition = db.prepare(
		`INSERT INTO book_editions (book_id, published_year) VALUES (?, ?) RETURNING id`
	);
	const insertPhysicalBook = db.prepare(
		`INSERT INTO physical_books (book_edition_id, condition, barcode) VALUES (?, ?, ?)`
	);
	
	let totalCopiesAdded = 0;

	for (const edition of editions) {
		const editionResult = insertEdition.get(bookId, edition.published_year);
		const editionId = editionResult.id;

		for (const { barcode, condition} of edition.copies){
			insertPhysicalBook.run(editionId, condition, barcode);
			totalCopiesAdded++;
		}
	}
	return {
		success: true,
		bookId,
		authorsLinked: authorIds.length,
		genresLinked: genreIds.length,
		copiesAdded: totalCopiesAdded
	};

})


const getBookById = (id) => {
	return db.prepare(`
        SELECT
            b.id,
            b.title,
            GROUP_CONCAT(DISTINCT a.name) as authors,
            GROUP_CONCAT(DISTINCT g.name) as genres
        FROM books b
        LEFT JOIN author_book ab ON b.id = ab.book_id
        LEFT JOIN authors a ON ab.author_id = a.id
        LEFT JOIN book_genre bg ON b.id = bg.book_id
        LEFT JOIN genres g ON bg.genre_id = g.id
        WHERE b.id = ?
        GROUP BY b.id
    `).get(id)
}

const getBookByTitle = (title) => {
	return db.prepare('SELECT * FROM books where title =?').get(title);
}
const updateBook = (id, title) => {
	return db.prepare(
		`UPDATE books SET title = ? WHERE id = ? RETURNING *`
	).get(title, id)
}
const getBookEditions = (bookId) => {
	return db.prepare(`
			SELECT id, published_year
			FROM book_editions
			WHERE book_id = ?
		`).all(bookId)
}

export {
	addCompleteBook,
	getAllBooks,
	getBookById,
	getBookByTitle,
	updateBook,
	getBookEditions
}