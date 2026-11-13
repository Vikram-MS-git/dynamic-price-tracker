import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import pool from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const ADVISORY_LOCK_KEY = 727274; // arbitrary constant: stops two migrate runs racing

/**
 * Applies each migration once, in order, inside its own transaction, and records it in
 * `schema_migrations`. Safe to run repeatedly. Migrations only ADD to the schema; existing
 * rows are preserved. `.sql` files are run as-is; `.js` files export `up(client)`.
 */
export async function runMigrations(db = pool, log = console.log) {
  const client = await db.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [ADVISORY_LOCK_KEY]);
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    const done = new Set((await client.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name));

    const files = [{ name: '000_base_schema.sql', file: path.join(__dirname, 'schema.sql') }];
    if (fs.existsSync(MIGRATIONS_DIR)) {
      fs.readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql') || f.endsWith('.js'))
        .sort()
        .forEach((f) => files.push({ name: f, file: path.join(MIGRATIONS_DIR, f) }));
    }

    const applied = [];
    for (const { name, file } of files) {
      if (done.has(name)) continue;
      try {
        await client.query('BEGIN');
        if (name.endsWith('.js')) {
          const mod = await import(pathToFileURL(file).href);
          await mod.up(client);
        } else {
          await client.query(fs.readFileSync(file, 'utf8'));
        }
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
        await client.query('COMMIT');
        applied.push(name);
        log(`Applied migration: ${name}`);
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw new Error(`Migration ${name} failed: ${err.message}`);
      }
    }
    if (!applied.length) log('Database is already up to date.');
    return applied;
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY]).catch(() => {});
    client.release();
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  runMigrations()
    .then(async () => {
      console.log('Migration completed successfully.');
      await pool.end();
    })
    .catch(async (err) => {
      console.error(err.message);
      await pool.end().catch(() => {});
      process.exit(1);
    });
}
