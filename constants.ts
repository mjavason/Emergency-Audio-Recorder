import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: './.env',
});

export const PORT = process.env.PORT || 5000;
export const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
export const STREAM_DIR = path.join(__dirname, 'streams');
