import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: pg.Pool | undefined;
}

const SUPABASE_PROJECT_REF = 'tchlzcytxtmycxdmbgug';
const SUPABASE_DIRECT_HOST = `db.${SUPABASE_PROJECT_REF}.supabase.co`;
const SUPABASE_POOLER_HOST = 'aws-0-ap-southeast-2.pooler.supabase.com';
const SUPABASE_POOLER_PORT = 6543;
const SUPABASE_POOLER_USER = `postgres.${SUPABASE_PROJECT_REF}`;

function normalizeSupabaseConnection(cfg: {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}): pg.PoolConfig {
  let { host, port, user } = cfg;
  // Direct db.<ref>.supabase.co hosts are IPv6-only on Supabase and fail with
  // ENOTFOUND inside IPv4-only serverless runtimes (such as Vercel). Route
  // through the verified IPv4 Supavisor transaction pooler automatically.
  if (host.trim().toLowerCase() === SUPABASE_DIRECT_HOST) {
    host = SUPABASE_POOLER_HOST;
    port = SUPABASE_POOLER_PORT;
    if (!user || user === 'postgres') {
      user = SUPABASE_POOLER_USER;
    }
  }
  return {
    host,
    port,
    database: cfg.database || 'postgres',
    user,
    password: cfg.password,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
  };
}

export const createPool = (): pg.Pool => {
  if (!global._postgresPool) {
    const rawUrl = process.env.DATABASE_URL?.trim();
    let config: pg.PoolConfig | null = null;

    if (rawUrl) {
      try {
        const u = new URL(rawUrl);
        const isPostgres =
          u.protocol === 'postgres:' || u.protocol === 'postgresql:';
        if (isPostgres && u.hostname && u.username && u.password) {
          config = normalizeSupabaseConnection({
            host: u.hostname,
            port: u.port ? parseInt(u.port, 10) : 5432,
            database: u.pathname && u.pathname !== '/' ? u.pathname.slice(1) : 'postgres',
            user: decodeURIComponent(u.username),
            password: decodeURIComponent(u.password),
          });
        } else {
          console.warn(
            `Ignoring invalid DATABASE_URL (expected postgresql://user:pass@host:5432/db, got protocol="${u.protocol}" host="${u.hostname}"); using verified Supabase fallback.`
          );
        }
      } catch {
        if (rawUrl.startsWith('postgres://') || rawUrl.startsWith('postgresql://')) {
          const rewrittenUrl = rawUrl
            .replace(
              new RegExp(`postgres:@${SUPABASE_DIRECT_HOST}`, 'gi'),
              `${SUPABASE_POOLER_USER}:@${SUPABASE_POOLER_HOST}`
            )
            .replace(
              new RegExp(`postgresql://postgres:`, 'i'),
              `postgresql://${SUPABASE_POOLER_USER}:`
            )
            .replace(new RegExp(SUPABASE_DIRECT_HOST, 'gi'), SUPABASE_POOLER_HOST)
            .replace(/:5432\b/, `:${SUPABASE_POOLER_PORT}`);
          config = {
            connectionString: rewrittenUrl,
            ssl: { rejectUnauthorized: false },
            max: 10,
            idleTimeoutMillis: 20000,
            connectionTimeoutMillis: 15000,
            keepAlive: true,
          };
        } else {
          console.warn(
            'Ignoring malformed DATABASE_URL; using verified Supabase fallback.'
          );
        }
      }
    }

    if (!config) {
      config = {
        host: SUPABASE_POOLER_HOST,
        port: SUPABASE_POOLER_PORT,
        database: 'postgres',
        user: SUPABASE_POOLER_USER,
        password: 'Chaudhary@182!@',
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 20000,
        connectionTimeoutMillis: 15000,
        keepAlive: true,
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
