import { Pool } from 'pg';

export const pool = new Pool({
  user: 'school_user',         // your PostgreSQL username
  host: 'localhost',           // or your DB host
  database: 'smartTeach',      // your database name (case-sensitive!)
  password: '123',             // your PostgreSQL password
  port: 5432,                  // default PostgreSQL port
});