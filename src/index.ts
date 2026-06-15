import fs from 'fs';
import path from 'path';

import type { Core } from '@strapi/strapi';

type SportTypeSeed = {
  name: string;
  slug: string;
  isTeamSport: boolean;
  isActive: boolean;
};

type ArticleSeed = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  readTime: string;
  authorName: string;
  imageUrl?: string;
  isFeatured: boolean;
};

type SiteSettingsSeed = {
  siteName: string;
  siteTagline: string;
  logoAbbreviation: string;
  aboutText: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  schedule: string;
  partnerEmail: string;
  partnerHint: string;
  responseTime: string;
  copyrightText: string;
  footerNote: string;
  tickerItems: Array<{ text: string }>;
  footerBadges: Array<{ text: string }>;
  socials: Array<{ label: string; href: string; iconUrl?: string }>;
};

function readJsonFile<T>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function demoDataDir() {
  const candidates = [
    process.env.DEMO_DATA_DIR,
    '/demo-data',
    path.resolve(process.cwd(), '../demo-data'),
    path.resolve(process.cwd(), '../../demo-data'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

async function enablePublicPermissions(strapi: Core.Strapi) {
  const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });
  if (!publicRole) return;

  const actions = [
    'api::sport-type.sport-type.find',
    'api::sport-type.sport-type.findOne',
    'api::article.article.find',
    'api::article.article.findOne',
    'api::site-setting.site-setting.find',
  ];

  for (const action of actions) {
    const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
      where: { role: publicRole.id, action },
    });
    if (existing) {
      if (!existing.enabled) {
        await strapi.db.query('plugin::users-permissions.permission').update({
          where: { id: existing.id },
          data: { enabled: true },
        });
      }
      continue;
    }
    await strapi.db.query('plugin::users-permissions.permission').create({
      data: { action, role: publicRole.id, enabled: true },
    });
  }
}

async function ensureDevApiToken(strapi: Core.Strapi) {
  const tokenName = 'sport-server-dev';
  const existing = await strapi.db.query('admin::api-token').findOne({
    where: { name: tokenName },
  });
  if (existing) {
    strapi.log.info(`[seed] API token "${tokenName}" already exists — use it in sport-server STRAPI_API_TOKEN`);
    return;
  }

  const apiTokenService = strapi.admin?.services?.['api-token-content-api'];
  if (!apiTokenService?.create) {
    strapi.log.warn('[seed] api-token-content-api service unavailable — skip dev token creation');
    return;
  }

  const created = await apiTokenService.create({
    name: tokenName,
    description: 'Local dev token for sport-server',
    type: 'full-access',
    lifespan: null,
  });

  strapi.log.info('================================================================');
  strapi.log.info('[seed] Created sport-server API token — copy to apps/sport-server/.env:');
  strapi.log.info(`STRAPI_API_TOKEN=${created.accessKey}`);
  strapi.log.info('================================================================');
}

async function seedSportTypes(strapi: Core.Strapi, items: SportTypeSeed[]) {
  for (const item of items) {
    const existing = await strapi.documents('api::sport-type.sport-type').findFirst({
      filters: { slug: item.slug },
    });
    if (existing) continue;
    await strapi.documents('api::sport-type.sport-type').create({ data: item });
    strapi.log.info(`[seed] sport-type: ${item.slug}`);
  }
}

async function seedArticles(strapi: Core.Strapi, items: ArticleSeed[]) {
  for (const item of items) {
    const existing = await strapi.documents('api::article.article').findFirst({
      filters: { slug: item.slug },
    });
    if (existing) continue;
    await strapi.documents('api::article.article').create({
      data: item,
      status: 'published',
    });
    strapi.log.info(`[seed] article: ${item.slug}`);
  }
}

async function seedSiteSettings(strapi: Core.Strapi, settings: SiteSettingsSeed) {
  const existing = await strapi.documents('api::site-setting.site-setting').findFirst({});
  if (existing) {
    const attrs = (existing as { siteName?: string }).siteName;
    if (!attrs) {
      await strapi.documents('api::site-setting.site-setting').update({
        documentId: existing.documentId,
        data: settings,
      });
      strapi.log.info('[seed] site-setting migrated to extended schema');
    }
    return;
  }
  await strapi.documents('api::site-setting.site-setting').create({ data: settings });
  strapi.log.info('[seed] site-setting created');
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    if (process.env.SEED_DEMO === 'false') return;

    await enablePublicPermissions(strapi);

    const dir = demoDataDir();
    if (!dir) {
      strapi.log.warn('[seed] demo-data directory not found — skipping CMS seed');
      await ensureDevApiToken(strapi);
      return;
    }

    const sportTypes = readJsonFile<SportTypeSeed[]>(path.join(dir, 'sport-types.json')) ?? [];
    const articles = readJsonFile<ArticleSeed[]>(path.join(dir, 'articles.json')) ?? [];
    const siteSettings = readJsonFile<SiteSettingsSeed>(path.join(dir, 'site-settings.json'));

    await seedSportTypes(strapi, sportTypes);
    await seedArticles(strapi, articles);
    if (siteSettings) await seedSiteSettings(strapi, siteSettings);
    await ensureDevApiToken(strapi);

    strapi.log.info('[seed] Strapi demo data bootstrap complete');
  },
};
