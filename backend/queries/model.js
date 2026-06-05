import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const database = new DatabaseSync(`${__dirname}/database/library.db`);

const initDatabase = `
CREATE TABLE IF NOT EXISTS books (
	book_id INTEGER PRIMARY KEY AUTOINCREMENT,
	title TEXT NOT NULL,
	author TEXT NOT NULL,
	published_year INTEGER
);`;

database.exec(initDatabase);

export default database;