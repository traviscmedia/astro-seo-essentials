// src/config/site.ts
// Single source of truth for site-wide SEO values.
// The production URL is NOT here — set `site` in astro.config.mjs; components read Astro.site.
// Replace every value marked EDIT, then grep the repo for "EDIT" to confirm none remain.

export const SITE = {
  /** Short brand name. Used in titleTemplate, og:site_name and JSON-LD publisher. */
  name: 'EDIT Site Name',

  /** Default meta description (≈150 chars). Pages override via props. */
  description: 'EDIT One sentence describing what this site is for.',

  /** Applied to page titles. `%s` is the page title. '' disables the template. */
  titleTemplate: '%s | EDIT Site Name',

  /** Homepage <title> when no title prop is passed. Not templated. `{year}` is replaced at build time. */
  homeTitle: 'EDIT Best Widgets of {year} | Site Name',

  /** Author or organisation for meta author and JSON-LD. */
  author: 'EDIT Author or Org Name',
  /** Optional author/org URL for JSON-LD. '' to omit. */
  authorUrl: '',

  /** Default social image, 1200×630, in /public. Absolute URLs also work. */
  ogImage: '/og-default.jpg',
  ogImageAlt: 'EDIT What the default social image shows',
  ogImageWidth: 1200,
  ogImageHeight: 630,

  locale: 'en_US',

  /** '@handle' for twitter:site, or '' to omit. */
  twitterSite: '',
  /**
   * X falls back to og:* tags, so twitter:title/description/image are not emitted by default.
   * Set true if an audit tool nags you about it. Per-page overrides via the `twitter` prop always emit.
   */
  twitterMirrorOg: false,

  /** Default robots directives appended to index/follow. */
  robotsExtras: 'max-image-preview:large, max-snippet:-1, max-video-preview:-1',

  /** Comma-separated meta keywords, or '' to omit. Search engines ignore this tag. */
  keywords: '',

  /** Browser UI colour. '' to omit. */
  themeColor: '#ffffff',
  /** Icons, as paths in /public. Set either to '' to omit its <link> tag. Type is inferred from the extension. */
  favicon: '/favicon.svg',
  appleTouchIcon: '/apple-touch-icon.png',

  /** Optional geo targeting. null to omit. */
  geo: { region: 'US', placename: 'United States' } as { region: string; placename: string } | null,

  /** Emit hreflang en + x-default. Only useful if you plan to add languages. */
  hreflang: false,
}
