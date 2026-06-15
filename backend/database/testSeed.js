// backend/database/testSeed.js
import db from './db.js';

// 1. Create a librarian
db.prepare(`
    INSERT OR IGNORE INTO users (name, phone, username, password, role)
    VALUES ('John', '070122000', 'admin', 'password123', 'user')
`).run();

console.log('Test data insered');