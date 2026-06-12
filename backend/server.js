import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bookRoutes from './routes/bookRoutes.js';
import migrate from './database/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

migrate();

const app = express();
app.use(express.json());
app.use(cors());


app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/api/books', bookRoutes);

app.listen(3000, () => console.log('Server running on port 3000'));