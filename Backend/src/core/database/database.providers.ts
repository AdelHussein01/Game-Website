import { Pool } from 'pg';
import { PG_POOL } from './database.constants';

export const databaseProviders = [
  {
    provide: PG_POOL,
    useFactory: async () => {
      const pool = new Pool({
        host: process.env.DATABASE_HOST,
        port: Number(process.env.DATABASE_PORT) || 5432,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
      });

      await pool.query('SELECT 1');

      return pool;
    },
  },
];