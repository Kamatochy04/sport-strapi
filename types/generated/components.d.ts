import type { Schema, Struct } from '@strapi/strapi';

export interface SiteFooterBadge extends Struct.ComponentSchema {
  collectionName: 'components_site_footer_badges';
  info: {
    description: '\u041A\u043E\u0440\u043E\u0442\u043A\u0430\u044F \u043C\u0435\u0442\u043A\u0430 \u043F\u043E\u0434 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435\u043C \u0441\u0430\u0439\u0442\u0430 \u0432 \u0444\u0443\u0442\u0435\u0440\u0435';
    displayName: '\u0411\u0435\u0439\u0434\u0436 \u0444\u0443\u0442\u0435\u0440\u0430';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SiteSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_site_social_links';
  info: {
    description: '\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0441\u043E\u0446\u0441\u0435\u0442\u044C \u0441 \u0437\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043C\u043E\u0439 \u0438\u043A\u043E\u043D\u043A\u043E\u0439';
    displayName: '\u0421\u043E\u0446\u0441\u0435\u0442\u044C';
  };
  attributes: {
    href: Schema.Attribute.String & Schema.Attribute.Required;
    icon: Schema.Attribute.Media<'images'>;
    iconUrl: Schema.Attribute.String;
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SiteTickerItem extends Struct.ComponentSchema {
  collectionName: 'components_site_ticker_items';
  info: {
    description: '\u0422\u0435\u043A\u0441\u0442 \u0432 \u0432\u0435\u0440\u0445\u043D\u0435\u0439 \u0431\u0435\u0433\u0443\u0449\u0435\u0439 \u0441\u0442\u0440\u043E\u043A\u0435 \u0441\u0430\u0439\u0442\u0430';
    displayName: '\u0421\u0442\u0440\u043E\u043A\u0430 \u0431\u0435\u0433\u0443\u0449\u0435\u0439 \u043B\u0435\u043D\u0442\u044B';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'site.footer-badge': SiteFooterBadge;
      'site.social-link': SiteSocialLink;
      'site.ticker-item': SiteTickerItem;
    }
  }
}
