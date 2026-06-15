function read(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim() && !isUnresolvedRailwayRef(value)) {
      return value.trim();
    }
  }
  return undefined;
}

function isUnresolvedRailwayRef(value) {
  return /\$\{\{/.test(value);
}

function buildPostgresUrl({ host, port, user, password, database }) {
  const safeUser = encodeURIComponent(user);
  const safePassword = encodeURIComponent(password);
  return `postgresql://${safeUser}:${safePassword}@${host}:${port}/${database}`;
}

export function resolveDatabaseEnv() {
  const privateUrl = read('DATABASE_PRIVATE_URL', 'POSTGRES_PRIVATE_URL');
  if (!read('DATABASE_URL', 'POSTGRES_URL') && privateUrl) {
    process.env.DATABASE_URL = privateUrl;
  }

  if (read('DATABASE_URL', 'POSTGRES_URL')) return;

  const host = read('PGHOST', 'PGHOST_PRIVATE', 'DATABASE_HOST', 'POSTGRES_HOST');
  if (!host) return;

  const port = read('PGPORT', 'DATABASE_PORT', 'POSTGRES_PORT') ?? '5432';
  const user = read('PGUSER', 'DATABASE_USERNAME', 'POSTGRES_USER') ?? 'postgres';
  const password = read('PGPASSWORD', 'DATABASE_PASSWORD', 'POSTGRES_PASSWORD') ?? '';
  const database = read('PGDATABASE', 'DATABASE_NAME', 'POSTGRES_DB', 'POSTGRES_DATABASE') ?? 'railway';

  process.env.DATABASE_URL = buildPostgresUrl({ host, port, user, password, database });
}

export function hasPostgresEnv() {
  resolveDatabaseEnv();
  return Boolean(
    read('DATABASE_URL', 'POSTGRES_URL') ||
      read('PGHOST', 'PGHOST_PRIVATE', 'DATABASE_HOST', 'POSTGRES_HOST'),
  );
}

export function maskDatabaseUrl(url) {
  return url.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
}
