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

const getPhysicalCopiesByBook = () => {
	return db.prepare(`
		SELECT
			pb.id,
			pb.barcode,
			pb.condition,
			be.id AS edition_id,
			be.published_year,
			be.book_id,
			EXISTS (
				SELECT 1
				FROM checkout_entries ce
				JOIN checkouts c ON ce.checkout_id = c.id
				WHERE ce.physical_book_id = pb.id
				AND c.returned_at IS NULL
			) AS is_checked_out
		FROM physical_books pb
		JOIN book_editions be ON pb.book_edition_id = be.id
		ORDER BY be.published_year IS NULL, be.published_year, pb.id
	`).all()
}

const getEditionsByBook = () => {
	return db.prepare(`
		SELECT
			be.id,
			be.book_id,
			be.published_year,
			COUNT(pb.id) AS copy_count
		FROM book_editions be
		LEFT JOIN physical_books pb ON be.id = pb.book_edition_id
		GROUP BY be.id
		ORDER BY be.published_year IS NULL, be.published_year
	`).all()
}

const getAllBooksWithCopies = () => {
	const books = getAllBooks();
	const copiesByBook = {};
	const editionsByBook = {};

	for (const edition of getEditionsByBook()) {
		if (!editionsByBook[edition.book_id]) {
			editionsByBook[edition.book_id] = [];
		}
		editionsByBook[edition.book_id].push({
			id: edition.id,
			published_year: edition.published_year,
			copy_count: edition.copy_count,
		});
	}

	for (const copy of getPhysicalCopiesByBook()) {
		if (!copiesByBook[copy.book_id]) {
			copiesByBook[copy.book_id] = [];
		}
		copiesByBook[copy.book_id].push({
			id: copy.id,
			barcode: copy.barcode,
			condition: copy.condition,
			edition_id: copy.edition_id,
			published_year: copy.published_year,
			is_checked_out: !!copy.is_checked_out,
		});
	}

	return books.map((book) => ({
		...book,
		editions: editionsByBook[book.id] || [],
		copies: copiesByBook[book.id] || [],
	}));
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

const updateCompleteBook = db.transaction((id, { title, authors, genres}) => {
	const book = getBookById(id);
	if (!book) {
		throw new Error('Book not found');
	}
	db.prepare(`UPDATE books SET title = ? WHERE id = ?`).run(title, id);

	//resync authors
	db.prepare(`DELETE FROM author_book WHERE book_id = ?`).run(id);
	const getAuthor = db.prepare(`SELECT id FROM authors WHERE name = ?`);
	const addAuthor = db.prepare(`INSERT INTO authors (name) VALUES (?) RETURNING id`);
	const linkAuthor = db.prepare(`INSERT INTO author_book (author_id, book_id) VALUES (?, ?)`);
	for (const name of authors) {
		const existing = getAuthor.get(name);
		const authorId = existing ? existing.id : addAuthor.get(name).id;
		linkAuthor.run(authorId, id);
	}

	//resync genres
	db.prepare(`DELETE FROM book_genre WHERE book_id = ?`).run(id);
	const getGenre = db.prepare(`SELECT id FROM genres WHERE name = ?`);
	const addGenre = db.prepare(`INSERT INTO genres (name) VALUES (?) RETURNING id`);
	const linkGenre = db.prepare(`INSERT INTO book_genre (book_id, genre_id) VALUES (?, ?)`);
	for (const name of genres) {
		const existing = getGenre.get(name);
		const genreId = existing ? existing.id : addGenre.get(name).id;
		linkGenre.run(id, genreId);
	}
	return getBookById(id);
})

const deleteBook = db.transaction((id) => {
	const book = getBookById(id);

	if (!book) {
		throw new Error('Book not found');
	}

	const activeCheckout = db.prepare(`
		SELECT 1
		FROM physical_books pb
		JOIN book_editions be ON pb.book_edition_id = be.id
		JOIN checkout_entries ce ON ce.physical_book_id = pb.id
		JOIN checkouts c ON ce.checkout_id = c.id
		WHERE be.book_id = ? AND c.returned_at IS NULL
		LIMIT 1
	`).get(id);
	
	if (activeCheckout) {
		throw new Error('Cannot delete book with active checkouts');
	}
	//cascade delete:
	db.prepare(`
		DELETE FROM checkout_entries
		WHERE physical_book_id IN (
			SELECT pb.id FROM physical_books pb
			JOIN book_editions be ON pb.book_edition_id = be.id
			WHERE be.book_id = ?
		)
	`).run(id);

	db.prepare(`
		DELETE FROM physical_books
		WHERE book_edition_id IN (
			SELECT id FROM book_editions WHERE book_id = ?
		)
	`).run(id);
	db.prepare(`DELETE FROM book_editions WHERE book_id = ?`).run(id);
	db.prepare(`DELETE FROM author_book WHERE book_id = ?`).run(id);
	db.prepare(`DELETE FROM book_genre WHERE book_id = ?`).run(id);
	db.prepare(`DELETE FROM books WHERE id = ?`).run(id);
	return { success: true, message: 'Book deleted successfully' };
})

const getBookEditions = (bookId) => {
	return db.prepare(`
			SELECT
				be.id,
				be.published_year,
				COUNT(pb.id) AS copy_count
			FROM book_editions be
			LEFT JOIN physical_books pb ON be.id = pb.book_edition_id
			WHERE be.book_id = ?
			GROUP BY be.id
			ORDER BY be.published_year IS NULL, be.published_year
		`).all(bookId)
}

const addEdition = (bookId, publishedYear) => {
	const book = getBookById(bookId);
	if (!book) {
		throw new Error('Book not found');
	}
	return db.prepare(
		`INSERT INTO book_editions (book_id, published_year) VALUES (?, ?) RETURNING id, published_year`
	).get(bookId, publishedYear ?? null);
}

const searchBook = (title) => {
	return db.prepare(
		`
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
		WHERE b.title LIKE ?
		GROUP BY b.id
		`
	).all(`%${title}%`)
}

const addPhysicalCopies = (editionId, copies) => {
    const insert = db.prepare(`
        INSERT INTO physical_books (book_edition_id, barcode, condition)
        VALUES (?, ?, ?)
        RETURNING id, barcode, condition
    `);
    return copies.map(({ barcode, condition }) =>
        insert.get(editionId, barcode, condition ?? 'Good')
    );
};

export {
	addCompleteBook,
	getAllBooks,
	getAllBooksWithCopies,
	getBookById,
	getBookByTitle,
	updateCompleteBook,
	deleteBook,
	getBookEditions,
	addEdition,
	searchBook,
	addPhysicalCopies
}

