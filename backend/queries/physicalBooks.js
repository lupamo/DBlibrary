import db from '../database/db.js'

const borrowedBook = (physicalBookId) => {
	return db.prepare(`
		SELECT
			u.name as borrower_name,
			u.phone as borrower_phone,
			c.checked_out_at,
			c.id as checkout_id
		FROM physical_books pb
		JOIN checkout_entries ce ON pb.id = ce.physical_book_id
		JOIN checkouts c ON ce.checkout_id = c.id
		JOIN users u ON c.borrower_id = u.id
		WHERE pb.id = ?
		AND c.returned_at IS NULL
	`).get(physicalBookId)
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
	checkedIn
}
