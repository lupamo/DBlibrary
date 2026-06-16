const BASE = 'http://localhost:3000/api';

async function request(path, options = {}) {
	const res = await fetch(`${BASE}${path}`, {
		headers: { 'Content-Type': 'application/json' },
		...options,
	})
	const data = await res.json();

	if (!res.ok) {
		throw new Error(data.error|| 'request failed');
	}
	return data;
}

export const api = {
	login: (username, password) => request('/auth/login', {
		method: 'POST',
		body: JSON.stringify({ username, password }),
	}),

	getBooks: () => request('/books'),

	searchBorrowers: (q) => request(`/users/borrowers${q ? `?q=${encodeURIComponent(q)}` : ''}`),

	getActiveCheckouts: () => request('/checkouts/active'),

	checkoutBooks: (data) => request('/checkouts', {
		method: 'POST',
		body: JSON.stringify(data),
	}),

	lookupBarcode: (barcode) => request(`/physical-books/by-barcode/${encodeURIComponent(barcode)}`),

	getBorrower: (physicalBookId) => request(`/physical-books/${physicalBookId}/borrower`),

	returnBook: (physicalBookId) => request(`/physical-books/return/${physicalBookId}`, {method: 'PATCH'}),

	createBorrower: (data) => request('/users/borrowers', {
		method: 'POST',
		body: JSON.stringify(data),
	}),

	createLibrarian:(data) => request('/users/librarians', {
		method: 'POST',
		body: JSON.stringify(data),
	}),

	addCompleteBook:(data) => request('/books', {
		method: 'POST',
		body: JSON.stringify(data),
	}),
	addEdition:(bookId, data) => request(`/books/${bookId}/editions`, {
		method: 'POST',
		body: JSON.stringify(data),
	}),

	searchBooks: (title) => request(`/books/search?title=${encodeURIComponent(title)}`),
	getBookEditions: (bookId) => request(`/books/${bookId}/editions`),
	addCopies: (editionId, copies) =>
		request(`/book-editions/${editionId}/copies`, {
			method: 'POST',
			body: JSON.stringify({ copies }),
		}),

}

