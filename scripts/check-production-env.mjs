import { hasPostgresEnv, maskDatabaseUrl, resolveDatabaseEnv } from './database-env.mjs';

const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) process.exit(0);

resolveDatabaseEnv();

const errors = [];
const warnings = [];

if (!process.env.APP_KEYS?.trim()) {
  errors.push('APP_KEYS не задан (4 ключа через запятую)');
}

const requestedClient = (process.env.DATABASE_CLIENT ?? '').trim().toLowerCase();
const postgresReady = hasPostgresEnv();

if (requestedClient === 'postgres' && !postgresReady) {
  warnings.push(
    'DATABASE_CLIENT=postgres, но нет DATABASE_URL/PGHOST. ' +
      'Strapi запустится на SQLite. Добавьте в Railway → Strapi → Variables: ' +
      'DATABASE_URL = ${{ИмяСервисаPostgres.DATABASE_PRIVATE_URL}}',
  );
  delete process.env.DATABASE_CLIENT;
}

for (const key of ['DATABASE_URL', 'DATABASE_PRIVATE_URL', 'PGHOST']) {
  const value = process.env[key];
  if (value && isUnresolvedRailwayRef(value)) {
    errors.push(
      `${key} содержит необработанную ссылку "${value}". ` +
        'В Railway выберите значение через "Add Reference", не копируйте ${{...}} вручную.',
    );
  }
}

if (postgresReady && process.env.DATABASE_URL) {
  console.info(`[strapi] PostgreSQL: ${maskDatabaseUrl(process.env.DATABASE_URL)}`);
}

for (const message of warnings) {
  console.warn(`[strapi] ${message}`);
}

if (errors.length) {
  console.error('\n[strapi] Неверная конфигурация окружения:\n');
  for (const message of errors) {
    console.error(`  - ${message}`);
  }
  process.exit(1);
}

function isUnresolvedRailwayRef(value) {
  return /\$\{\{/.test(value);
}
