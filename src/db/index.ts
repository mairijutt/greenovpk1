import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: pg.Pool | undefined;
}

export const createPool = (): pg.Pool => {
  if (!global._postgresPool) {
    const rawUrl = process.env.DATABASE_URL;
    let config: pg.PoolConfig;

    if (rawUrl) {
      try {
        const u = new URL(rawUrl);
        config = {
          host: u.hostname,
          port: u.port ? parseInt(u.port, 10) : 5432,
          database: u.pathname ? u.pathname.slice(1) : 'postgres',
          user: decodeURIComponent(u.username),
          password: decodeURIComponent(u.password),
          ssl: { rejectUnauthorized: false },
          max: 10,
          connectionTimeoutMillis: 15000,
        };
      } catch {
        config = {
          connectionString: rawUrl,
          ssl: { rejectUnauthorized: false },
          max: 10,
          connectionTimeoutMillis: 15000,
        };
      }
    } else {
      config = {
        host: 'db.tchlzcytxtmycxdmbgug.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'Chaudhary@182!@',
        ssl: { rejectUnauthorized: false },
        max: 10,
        connectionTimeoutMillis: 15000,
      };
    }

    global._postgresPool = new pg.Pool(config);

    global._postgresPool.on('error', (err: any) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

export const pool = createPool();
export const db = drizzle(pool, { schema });
