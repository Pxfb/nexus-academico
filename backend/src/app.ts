import 'dotenv/config';

import cors from 'cors';
import express, { type Express } from 'express';

import { pool } from './db.js';

const app: Express = express();

const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

app.use(
  cors({
    origin: frontendUrl,
  }),
);

app.use(express.json());

app.get('/api/health', async (_request, response) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');

    response.status(200).json({
      status: 'ok',
      api: 'ok',
      database: 'ok',
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    console.error('Erro ao verificar o banco de dados:', error);

    response.status(503).json({
      status: 'degraded',
      api: 'ok',
      database: 'error',
    });
  }
});

export { app };