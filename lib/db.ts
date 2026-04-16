import { Pool, type PoolConfig } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured');
}

const parsedUrl = new URL(databaseUrl);
const sslMode = parsedUrl.searchParams.get('sslmode');

// Preserve current pg SSL behavior across upcoming pg/libpq compatibility changes.
if (sslMode === 'require' && !parsedUrl.searchParams.has('uselibpqcompat')) {
  parsedUrl.searchParams.set('uselibpqcompat', 'true');
}

const isProduction = process.env.NODE_ENV === 'production';
const strictSsl = process.env.PG_STRICT_SSL !== 'false';

const poolConfig: PoolConfig = {
  connectionString: parsedUrl.toString(),
  ssl: isProduction && strictSsl ? { rejectUnauthorized: true } : { rejectUnauthorized: false }
};

const pool = new Pool(poolConfig);

export default pool;