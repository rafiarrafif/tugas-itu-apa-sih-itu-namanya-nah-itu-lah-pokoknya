import 'dotenv/config';
import mssql from 'mssql';
import { drizzle } from 'drizzle-orm/node-mssql';
import * as schema from './schema.ts';

const config: mssql.config = {
  server: process.env.DB_SERVER ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 1433),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
};

let poolPromise: Promise<mssql.ConnectionPool> | null = null;
let dbPromise: ReturnType<typeof buildDb> | null = null;

async function buildDb() {
  poolPromise ??= mssql.connect(config);
  const pool = await poolPromise;
  return drizzle({ client: pool, schema });
}

// Satu instance Drizzle dipakai ulang untuk seluruh aplikasi.
export function getDb() {
  if (!dbPromise) {
    dbPromise = buildDb().catch((error) => {
      dbPromise = null;
      poolPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

