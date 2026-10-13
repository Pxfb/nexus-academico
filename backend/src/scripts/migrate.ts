import 'dotenv/config';

import { readFile } from 'node:fs/promises';

import { dirname, resolve } from 'node:path';

import { fileURLToPath } from 'node:url';

import { pool } from '../db.js';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const migrationFile = resolve(
  currentDirectory,
  '../../sql/001_create_users.sql',
);

const migrationName = '001_create_users.sql';

async function migrate() {
  const sql = await readFile(migrationFile, 'utf8');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const existingMigration = await client.query(
      `
          SELECT id
          FROM schema_migrations
          WHERE name = $1
        `,
      [migrationName],
    );

    if (existingMigration.rowCount && existingMigration.rowCount > 0) {
      console.log(`Migração ${migrationName} já foi executada.`);

      await client.query('ROLLBACK');

      return;
    }

    await client.query(sql);

    await client.query(
      `
        INSERT INTO schema_migrations (name)
        VALUES ($1)
      `,
      [migrationName],
    );

    await client.query('COMMIT');

    console.log(`Migração ${migrationName} executada com sucesso.`);
  } catch (error) {
    await client.query('ROLLBACK');

    console.error('Erro ao executar migração:', error);

    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
