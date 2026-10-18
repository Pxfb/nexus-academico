import 'dotenv/config';

import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { pool } from '../db.js';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const sqlDirectory = resolve(currentDirectory, '../../sql');

// Número arbitrário, igual para todos, usado como trava no banco.
const MIGRATION_LOCK_ID = 727274;

async function migrate() {
  const files = (await readdir(sqlDirectory))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    for (const file of files) {
      await client.query('BEGIN');

      // Evita que duas pessoas apliquem a mesma migration ao mesmo tempo.
      // A trava é liberada automaticamente no COMMIT/ROLLBACK.
      await client.query('SELECT pg_advisory_xact_lock($1)', [
        MIGRATION_LOCK_ID,
      ]);

      const existing = await client.query(
        'SELECT 1 FROM schema_migrations WHERE name = $1',
        [file],
      );

      if (existing.rowCount && existing.rowCount > 0) {
        await client.query('ROLLBACK');
        console.log(`Migração já aplicada: ${file}`);
        continue;
      }

      const sql = await readFile(resolve(sqlDirectory, file), 'utf8');

      await client.query(sql);

      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [
        file,
      ]);

      await client.query('COMMIT');

      console.log(`Migração aplicada: ${file}`);
    }
  } catch (error) {
    await client.query('ROLLBACK');

    console.error('Erro ao executar migrations:', error);

    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
