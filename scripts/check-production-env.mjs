const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) process.exit(0);

const client = (process.env.DATABASE_CLIENT ?? '').trim();
const usesPostgres =
  client === 'postgres' ||
  Boolean(
    process.env.DATABASE_URL?.trim() ||
      process.env.DATABASE_PRIVATE_URL?.trim() ||
      process.env.DATABASE_HOST?.trim() ||
      process.env.PGHOST?.trim(),
  );

const errors = [];

if (!process.env.APP_KEYS?.trim()) {
  errors.push('APP_KEYS не задан (нужно 4 ключа через запятую)');
}

if (usesPostgres) {
  const hasUrl =
    process.env.DATABASE_URL?.trim() || process.env.DATABASE_PRIVATE_URL?.trim();
  const hasHost =
    process.env.DATABASE_HOST?.trim() ||
    process.env.PGHOST?.trim() ||
    process.env.PGHOST_PRIVATE?.trim();

  if (!hasUrl && !hasHost) {
    errors.push(
      'PostgreSQL: задайте DATABASE_URL=${{Postgres.DATABASE_PRIVATE_URL}} ' +
        'или PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE из сервиса Postgres',
    );
  }

  const url = (process.env.DATABASE_URL ?? process.env.DATABASE_PRIVATE_URL ?? '').trim();
  if (url.includes('proxy.rlwy.net') && process.env.DATABASE_SSL !== 'true') {
    console.warn(
      '[strapi] Предупреждение: публичный Postgres URL. Для Strapi на Railway лучше ' +
        'DATABASE_URL=${{Postgres.DATABASE_PRIVATE_URL}}',
    );
  }
}

if (errors.length) {
  console.error('\n[strapi] Неверная конфигурация окружения:\n');
  for (const message of errors) {
    console.error(`  - ${message}`);
  }
  console.error(
    '\nПодсказка: Postgres и Strapi должны быть в одном Railway-проекте.\n',
  );
  process.exit(1);
}
