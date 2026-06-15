import { spawnSync } from 'node:child_process';

import { resolveDatabaseEnv } from './database-env.mjs';

resolveDatabaseEnv();

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  const check = spawnSync(process.execPath, ['scripts/check-production-env.mjs'], {
    stdio: 'inherit',
    env: process.env,
  });
  if (check.status !== 0) process.exit(check.status ?? 1);
}

const start = spawnSync('npx', ['strapi', 'start'], {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

process.exit(start.status ?? 1);
