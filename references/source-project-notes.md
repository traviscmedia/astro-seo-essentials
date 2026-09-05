# How this skill differs from the reference project

The templates were distilled from the user's "Astro Review Site" project (Astro 5, React, Tailwind 4). Kept the intent; changed the implementation where the original had defects.

## Kept as-is
- Title pattern: `{title} | {site name}`, year-stamped homepage title.
- Canonical defaulting to current URL, overridable.
- Robots meta with `max-image-preview:large, max-snippet:-1, max-video-preview:-1`; `noindex` toggle.
- Full Open Graph + Twitter `summary_large_image` blocks with image alt/width/height, site_name, locale.
- Favicon, apple-touch-icon, theme-color.
- geo.region / geo.placename (now optional).
- hreflang en + x-default scaffold (now opt-in).
- `@astrojs/sitemap` integration.
- JSON-LD Article and Product schemas.
- Per-page overrides via layout props.

## Changed and why
| Original | Now | Reason |
| --- | --- | --- |
| Site URL in `consts.ts`, `meta.json`, `robots.txt`, and hardcoded in `Layout.astro` (two different values) | Only `site` in `astro.config.mjs`; components use `Astro.site` | Impossible to drift |
| Both `@astrojs/sitemap` and a hand-rolled `src/pages/sitemap.xml.ts` listing only the homepage; robots pointed at the hand-rolled one | Integration only; robots points at `sitemap-index.xml` | The custom route was shadowing the real sitemap |
| Static `public/robots.txt` with a hardcoded URL | `src/pages/robots.txt.ts` endpoint | Derives sitemap URL from `site` |
| SEO tags inline in `Layout.astro` | Separate `SEO.astro` component | Drops into any layout; layout keeps its own body/scripts |
| `<link rel="preload" as="image">` on OG image | Removed | Preloads an image the page doesn't render; browser warns |
| `X-UA-Compatible`, `apple-mobile-web-app-*` | Removed | Obsolete / PWA-only |
| `meta keywords` always emitted | Opt-in | Ignored by search engines |
| `mask-icon` | Removed | Safari-pinned-tab only, deprecated in Safari 12+ |
| OG image 1260×750 | 1200×630 | Platform-recommended ratio |
| Product schema with `aggregateRating` from own single review | Rating is opt-in with a guideline warning | Self-serving reviews violate Google's review-snippet policy |
| `meta.json` + `consts.ts` split | `src/config/site.ts` | One typed config |

## Not carried over (out of scope for SEO)
- `MarketingTracking.astro` (GA / ad pixels / UTM rewriting)
- Theme generator scripts and API routes
- CSP header in `server.headers`

## Ideas borrowed from other Astro SEO packages

Reviewed `jonasmerlin/astro-seo` (the popular library) and `rodgtr1/astro-seo-kit` (newer, Astro 6/7). Neither is used as a dependency — the goal is a self-maintained preset — but these ideas were adopted:

| Idea | Source | Applied as |
| --- | --- | --- |
| JSON-LD `<script>` breakout via `</script>` in content | astro-seo-essentials-kit | `safeJsonLd()` escapes `<`, `>`, U+2028/9 as `\uXXXX` |
| Raw `og:title` without site suffix | both | `og:title` = title prop; `<title>` gets the template |
| `titleTemplate` with `%s` | both | `SITE.titleTemplate` |
| Don't mirror `twitter:*` — X falls back to `og:*` | astro-seo-essentials-kit | Off by default; `SITE.twitterMirrorOg` or `twitter` prop |
| Separate `noindex` / `nofollow`, extras string | both | Props + `SITE.robotsExtras` |
| Article OG: authors, section, tags, expiration | both | `article` prop |
| Derive Article JSON-LD from the props already passed | astro-seo-essentials-kit | `articleJsonLd` prop, overridable |
| Skip empty image URLs | astro-seo-essentials-kit | `absUrl()` returns undefined on blank |
| Infer `og:image:type` from extension | astro-seo-essentials-kit | `imageType()` |
| Dev-only warnings | astro-seo-essentials-kit | `devWarn()` behind `import.meta.env.DEV` |
| `canonical={false}` escape hatch | astro-seo-essentials-kit | Supported |
| Tests via Astro Container API + vitest | astro-seo-essentials-kit | Not yet — planned before public release |

Rejected: leaving `max-image-preview:large` off by default (right for a library, wrong for a preset for your own sites); a `keywords` prop as a first-class feature (ours is opt-in and off).
