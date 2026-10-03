import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 5,
});

pool.on('error', (error) => {
  console.error('Erro inesperado na conexão com o banco:', error);
});
