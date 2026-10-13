import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

import { pool } from './db.js';

const PgStore = connectPgSimple(session);

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error('SESSION_SECRET não foi configurado.');
}

const isProduction = process.env.NODE_ENV === 'production';

export const sessionMiddleware = session({
  store: new PgStore({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
  }),

  secret: sessionSecret,

  name: 'nexus.sid',

  resave: false,

  saveUninitialized: false,

  cookie: {
    httpOnly: true,

    sameSite: 'lax',

    secure: isProduction,

    maxAge: 8 * 60 * 60 * 1000,
  },
});
