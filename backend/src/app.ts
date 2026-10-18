import 'dotenv/config';

import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { pool } from './db.js';
import { sessionMiddleware } from './session.js';
import authRouter from './routes/auth.js';
import gamificationRouter from './routes/gamification.js';

const app: Express = express();

const frontendUrl = (
  process.env.FRONTEND_URL || 'http://localhost:5173'
).replace(/\/+$/, '');
const isProduction = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: isProduction,
  }),
);

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: '100kb',
  }),
);

app.use(sessionMiddleware);

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

app.use('/api/auth', authRouter);
app.use('/api/gamification', gamificationRouter);

export { app };
