import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrations = [
  {
    name: '001_create_users',
    file: '001_create_users.sql',
  },
  {
    name: '002_create_gamification',
    file: '002_create_gamification.sql',
  },
  {
    name: '003_gamification_history_and_security',
    file: '003_gamification_history_and_security.sql',
  },
  {
    name: '004_gamification_achievement_progress',
    file: '004_gamification_achievement_progress.sql',
  },
  {
    name: '005_create_meetings',
    file: '005_create_meetings.sql',
  },
];

const client = await pool.connect();

try {
  await client.query('BEGIN');

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  for (const migration of migrations) {
    const existing = await client.query(
      'SELECT 1 FROM schema_migrations WHERE name = $1',
      [migration.name],
    );

    if (existing.rowCount && existing.rowCount > 0) {
      console.log(`Migração já aplicada: ${migration.name}`);
      continue;
    }

    const migrationPath = resolve(__dirname, '../../sql', migration.file);

    const sql = await readFile(migrationPath, 'utf8');

    await client.query(sql);

    await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [
      migration.name,
    ]);

    console.log(`Migração aplicada: ${migration.name}`);
  }

  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');

  console.error('Erro ao executar migrations:', error);

  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
