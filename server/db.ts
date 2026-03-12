/**
 * @fileoverview PostgreSQL database connection and Drizzle ORM initialization.
 *
 * Creates a connection pool using the DATABASE_URL environment variable
 * and exports the configured Drizzle database instance with schema.
 */

import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

import * as schema from '~/shared/schema'

const { Pool } = pg

// Load .env.local or .env when running locally.
// In Replit and CI the environment is already populated (via Secrets /
// workflow env vars), so process.loadEnvFile() is a no-op in those
// environments. Locally, it lets developers keep DATABASE_URL and
// SESSION_SECRET in .env.local without setting them system-wide.
// Both calls are wrapped in try/catch because the function throws if the
// file doesn't exist, not just if parsing fails.
try {
  process.loadEnvFile('.env.local')
} catch {
  try {
    process.loadEnvFile()
  } catch {}
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must be set. Did you forget to provision a database?',
  )
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema })
