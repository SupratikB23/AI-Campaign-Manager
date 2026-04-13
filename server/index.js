import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import brandsRouter from './routes/brands.js';
import campaignsRouter from './routes/campaigns.js';
import generationsRouter from './routes/generations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Serve generated images
app.use('/static/generated', express.static(path.join(__dirname, '..', 'generated')));

// API routes
app.use('/api/brands', brandsRouter);
app.use('/api', campaignsRouter);
app.use('/api', generationsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
