import db from '../database/db.js';

const isCopyAvailable = (physicalBookId) => {
	const row = db.prepare(`
		SELECT NOT EXISTS (
			SELECT 1
			FROM checkout_entries ce
			JOIN checkouts c ON ce.checkout_id = c.id
			WHERE ce.physical_book_id = ?
			AND c.returned_at IS NULL
		) AS available
	`).get(physicalBookId);
	return !!row?.available;
};

const createCheckout = db.transaction((librarianId, borrowerId, physicalBookIds) => {
	const borrower = db.prepare(
		`SELECT id FROM users WHERE id = ? AND role = 'user'`
	).get(borrowerId);
	if (!borrower) {
		throw new Error('Borrower not found');
	}

	const librarian = db.prepare(
		`SELECT id FROM users WHERE id = ? AND role = 'librarian'`
	).get(librarianId);
	if (!librarian) {
		throw new Error('Librarian not found');
	}

	if (!physicalBookIds?.length) {
		throw new Error('At least one physical book is required');
	}

	const uniqueIds = [...new Set(physicalBookIds)];
	for (const id of uniqueIds) {
		const copy = db.prepare(`SELECT id FROM physical_books WHERE id = ?`).get(id);
		if (!copy) {
			throw new Error(`Physical book ${id} not found`);
		}
		if (!isCopyAvailable(id)) {
			throw new Error(`Copy ${id} is not available`);
		}
	}

	const checkout = db.prepare(`
		INSERT INTO checkouts (borrower_id, librarian_id)
		VALUES (?, ?)
		RETURNING id, borrower_id, librarian_id, checked_out_at
	`).get(borrowerId, librarianId);

	const insertEntry = db.prepare(`
		INSERT INTO checkout_entries (checkout_id, physical_book_id)
		VALUES (?, ?)
	`);

	for (const physicalBookId of uniqueIds) {
		insertEntry.run(checkout.id, physicalBookId);
	}

	return {
		...checkout,
		physical_book_ids: uniqueIds,
	};
});

const getActiveCheckouts = () => {
	return db.prepare(`
		SELECT
			ce.physical_book_id,
			pb.barcode,
			pb.condition,
			b.id AS book_id,
			b.title AS book_title,
			be.published_year,
			u.id AS borrower_id,
			u.name AS borrower_name,
			u.phone AS borrower_phone,
			c.checked_out_at,
			c.id AS checkout_id
		FROM checkouts c
		JOIN checkout_entries ce ON c.id = ce.checkout_id
		JOIN physical_books pb ON ce.physical_book_id = pb.id
		JOIN book_editions be ON pb.book_edition_id = be.id
		JOIN books b ON be.book_id = b.id
		JOIN users u ON c.borrower_id = u.id
		WHERE c.returned_at IS NULL
		ORDER BY c.checked_out_at DESC, b.title
	`).all();
};

export {
	createCheckout,
	getActiveCheckouts,
	isCopyAvailable,
};
