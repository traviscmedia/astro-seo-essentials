# Manual SEO review checklist

Run after `check-seo.mjs` passes. These need judgement, not a script.

## Content
- Every page has a unique title and description; homepage title is not just the site name.
- Descriptions read like a sentence a person would click on, not a keyword list.
- One `<h1>` per page and it matches the page's intent.
- Images have meaningful `alt` text.

## URLs
- `site` in `astro.config.mjs` is the real production domain, `https`, no trailing slash.
- Canonical URLs match how pages are actually served (trailing slash or not). Check `trailingSlash` in config and the host's redirect behaviour.
- No `noindex` on pages that should rank. Staging deploys should set `noindex` site-wide.

## Social
- Default OG image exists in `/public`, is 1200×630, under ~1 MB.
- Paste a page URL into a social card debugger (LinkedIn Post Inspector, X card validator, opengraph.xyz) after deploy.

## Structured data
- Only `product` type on real product pages.
- No `aggregateRating` unless it comes from multiple genuine third-party reviews.
- Validate a deployed page with Google's Rich Results Test.

## Crawling
- `/robots.txt` and `/sitemap-index.xml` load on the deployed site.
- Submit the sitemap in Google Search Console.
- Sitemap does not include pages marked `noindex` (use the integration's `filter` option if needed).

## Performance-adjacent (affects ranking)
- Run Lighthouse on the homepage; fix anything red in Performance and SEO.
- Fonts and hero images are not blocking render.
