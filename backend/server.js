import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bookRoutes from './routes/bookRoutes.js';
import migrate from './database/schema.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import physicalBookRoute from './routes/physicalBookRoute.js';
import bookEditionRoute from './routes/bookEditionRoute.js';
import checkoutRoutes from './routes/checkoutRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

migrate();

const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/book-editions', bookEditionRoute);
app.use('/api/users', userRoutes);
app.use('/api/physical-books', physicalBookRoute);
app.use('/api/checkouts', checkoutRoutes);

app.listen(3000, () => console.log('Server running on port 3000'));
