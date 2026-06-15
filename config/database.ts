import path from 'path';
import type { Core } from '@strapi/strapi';

type PgSslConfig = boolean | { rejectUnauthorized: boolean };
type StrapiEnv = Core.Config.Shared.ConfigParams['env'];

function readEnv(env: StrapiEnv, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = env(key);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function hasPostgresConfig(env: StrapiEnv): boolean {
  return Boolean(
    readEnv(
      env,
      'DATABASE_URL',
      'DATABASE_PRIVATE_URL',
      'DATABASE_HOST',
      'PGHOST',
      'PGHOST_PRIVATE',
    ),
  );
}

function resolvePostgresSsl(
  env: StrapiEnv,
  hints: { connectionString?: string; host?: string },
): PgSslConfig | undefined {
  if (env('DATABASE_SSL') === 'false') return false;
  if (env.bool('DATABASE_SSL', false)) {
    return {
      rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', false),
    };
  }

  const normalizedUrl = hints.connectionString?.toLowerCase() ?? '';
  const normalizedHost = hints.host?.toLowerCase() ?? '';

  if (normalizedUrl.includes('sslmode=disable')) return false;
  if (normalizedUrl.includes('railway.internal') || normalizedHost.includes('railway.internal')) {
    return false;
  }
  if (normalizedUrl.includes('sslmode=require') || normalizedUrl.includes('proxy.rlwy.net')) {
    return { rejectUnauthorized: false };
  }

  return undefined;
}

function postgresConnection(env: StrapiEnv) {
  const connectionString = readEnv(env, 'DATABASE_URL', 'DATABASE_PRIVATE_URL');
  if (connectionString) {
    const ssl = resolvePostgresSsl(env, { connectionString });
    return {
      connectionString,
      schema: env('DATABASE_SCHEMA', 'public'),
      ...(ssl !== undefined ? { ssl } : {}),
    };
  }

  const host = readEnv(env, 'DATABASE_HOST', 'PGHOST', 'PGHOST_PRIVATE') ?? 'localhost';
  const ssl = resolvePostgresSsl(env, { host });

  return {
    host,
    port: env.int('DATABASE_PORT', env.int('PGPORT', 5432)),
    database: readEnv(env, 'DATABASE_NAME', 'PGDATABASE') ?? 'strapi',
    user: readEnv(env, 'DATABASE_USERNAME', 'PGUSER') ?? 'strapi',
    password: readEnv(env, 'DATABASE_PASSWORD', 'PGPASSWORD') ?? 'strapi',
    schema: env('DATABASE_SCHEMA', 'public'),
    ...(ssl !== undefined ? { ssl } : {}),
  };
}

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Database => {
  const client = env('DATABASE_CLIENT', hasPostgresConfig(env) ? 'postgres' : 'sqlite');

  const connections = {
    mysql: {
      connection: {
        connectionString: env('DATABASE_URL'),
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 3306),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        ssl: env.bool('DATABASE_SSL', false) && {
          key: env('DATABASE_SSL_KEY', undefined),
          cert: env('DATABASE_SSL_CERT', undefined),
          ca: env('DATABASE_SSL_CA', undefined),
          capath: env('DATABASE_SSL_CAPATH', undefined),
          cipher: env('DATABASE_SSL_CIPHER', undefined),
          rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
        },
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },
    postgres: {
      connection: postgresConnection(env),
      pool: {
        min: env.int('DATABASE_POOL_MIN', 0),
        max: env.int('DATABASE_POOL_MAX', 5),
        acquireTimeoutMillis: env.int('DATABASE_POOL_ACQUIRE_TIMEOUT_MILLIS', 60000),
        createTimeoutMillis: env.int('DATABASE_POOL_CREATE_TIMEOUT_MILLIS', 30000),
        idleTimeoutMillis: env.int('DATABASE_POOL_IDLE_TIMEOUT_MILLIS', 30000),
        reapIntervalMillis: env.int('DATABASE_POOL_REAP_INTERVAL_MILLIS', 1000),
        createRetryIntervalMillis: env.int('DATABASE_POOL_CREATE_RETRY_INTERVAL_MILLIS', 200),
      },
    },
    sqlite: {
      connection: {
        filename: path.join(__dirname, '..', '..', env('DATABASE_FILENAME', '.tmp/data.db')),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 120000),
    },
  };
};

export default config;
