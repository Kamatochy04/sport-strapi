import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS', [
      'sport-strapi-app-key-1-change-me',
      'sport-strapi-app-key-2-change-me',
      'sport-strapi-app-key-3-change-me',
      'sport-strapi-app-key-4-change-me',
    ]),
  },
});

export default config;
