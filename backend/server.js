import express from 'express';
import bookRoutes from './routes/bookRoutes.js';
import migrate from './database/schema.js';

migrate();

const app = express();
app.use(express.json());
app.use('/books', bookRoutes);

app.listen(3000, () => console.log('Server running on port 3000'));