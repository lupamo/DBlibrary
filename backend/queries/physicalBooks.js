import db from '../database/db.js'

const borrowedBook = (physicalBookId) => {
	return db.prepare(`
		SELECT
			u.name as borrower_name,
			u.phone as borrower_phone,
			c.checked_out_at,
			c.id as checkout_id,
			pb.barcode,
			b.title as book_title,
			be.published_year
		FROM physical_books pb
		JOIN book_editions be ON pb.book_edition_id = be.id
		JOIN books b ON be.book_id = b.id
		JOIN checkout_entries ce ON pb.id = ce.physical_book_id
		JOIN checkouts c ON ce.checkout_id = c.id
		JOIN users u ON c.borrower_id = u.id
		WHERE pb.id = ?
		AND c.returned_at IS NULL
	`).get(physicalBookId)
}

const getPhysicalBookByBarcode = (barcode) => {
	return db.prepare(`
		SELECT
			pb.id,
			pb.barcode,
			pb.condition,
			be.published_year,
			b.id AS book_id,
			b.title AS book_title,
			NOT EXISTS (
				SELECT 1
				FROM checkout_entries ce
				JOIN checkouts c ON ce.checkout_id = c.id
				WHERE ce.physical_book_id = pb.id
				AND c.returned_at IS NULL
			) AS is_available
		FROM physical_books pb
		JOIN book_editions be ON pb.book_edition_id = be.id
		JOIN books b ON be.book_id = b.id
		WHERE pb.barcode = ?
	`).get(barcode)
}

const checkedIn = (physicalBookId) => {
	return db.prepare(
		`
		UPDATE checkouts 
		SET returned_at = datetime('now')
		WHERE id = (
			SELECT c.id 
			FROM checkout_entries ce
			JOIN checkouts c ON ce.checkout_id = c.id
			WHERE ce.physical_book_id = ?
			AND c.returned_at IS NULL
		)`
	).run(physicalBookId)
}

export {
	borrowedBook,
	checkedIn,
	getPhysicalBookByBarcode,
}
