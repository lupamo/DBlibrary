const BASE = 'https://localhost:3000/api';

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

}

