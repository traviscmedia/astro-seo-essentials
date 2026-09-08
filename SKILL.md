---
name: astro-seo-essentials
description: Set up baseline technical SEO on an Astro site the same way every time — a reusable SEO head component (title, description, canonical, robots, Open Graph, Twitter card, favicons, hreflang), JSON-LD structured data, @astrojs/sitemap, and a robots.txt endpoint, all driven by one site config. Use this whenever the user creates a new Astro project, asks to "add SEO", "set up meta tags", "add Open Graph / social sharing", "add a sitemap or robots.txt", "add structured data / JSON-LD", or audits an existing Astro site's head tags. Trigger even if they only mention one of those pieces, the point of the skill is doing the whole set consistently.
---

# Astro SEO Essentials

Install a fixed, known-good SEO layer into an Astro project using the installer in `scripts/setup.mjs` and the templates in `assets/`. The templates encode decisions the user already made; the job is to apply them faithfully, not to improve them.

## Scope: read this first

This skill is a preset, not a starting point for your own ideas. Stay inside it:

- Install the files by running `scripts/setup.mjs`. Do not recreate them from memory, paraphrase them, or "clean them up."
- Do not add tags, files, integrations, or config options that this skill does not list. That includes things you believe are best practice (e.g. extra meta tags, preload hints, analytics, a different sitemap setup). If you think something is missing, say so to the user and stop; do not add it.
- The one asset you may create is a placeholder social image at the path `SITE.ogImage` points to (1200×630) if the project has none, because the build check fails without it. Tell the user it is a placeholder. Do not create favicons, touch icons, or any other asset; if an icon the config references is missing, set that config value to `''` so the tag is omitted, and tell the user.
- Do not remove or rewrite anything in the templates to match the project's existing style. The only edits you make to template files are the `EDIT` placeholders in `site.ts`.
- The one place judgement is required is wiring `SEO.astro` into the project's existing layout (step 5). Change as little of the layout as possible: remove the old `<title>`/meta tags it duplicates, keep everything else.
- If the project already has an SEO setup, report what exists and ask before replacing anything.

## Files this skill installs

| Template (in `assets/`) | Destination                           | Purpose                                                          |
| ----------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| `site.ts`               | `src/config/site.ts`                  | Single source of truth for name, description, OG image, etc.     |
| `seo.ts`                | `src/lib/seo.ts`                      | Helpers: absolute URLs, safe JSON-LD serialisation, dev warnings |
| `SEO.astro`             | `src/components/SEO.astro`            | Everything in `<head>`, plus derived Article JSON-LD             |
| `StructuredData.astro`  | `src/components/StructuredData.astro` | JSON-LD for WebSite, Product, or any custom schema               |
| `robots.txt.ts`         | `src/pages/robots.txt.ts`             | robots.txt as an endpoint so the sitemap URL comes from `site`   |

Scripts (not copied; run from the skill folder): `setup.mjs` installs, `doctor.mjs` checks source before build, `check-seo.mjs` checks `dist/` after build.

The site URL is **not** in `site.ts`. It lives only in `astro.config.mjs` as `site`, and every component reads `Astro.site`. The reference project had the URL in four places with two different values; this design makes that impossible.

## Workflow

1. **Inspect the project first.** Run `node <skill-dir>/scripts/doctor.mjs` from the project root — on a fresh project it lists exactly what is missing, and on an existing one it surfaces conflicts. Then find the base layout (usually `src/layouts/Layout.astro` or `BaseLayout.astro`), check `astro.config.mjs` for `site` and existing integrations, and check for any existing `SEO`/`BaseHead` component, `robots.txt`, or `sitemap.xml.ts`. If any exist, tell the user what you found and ask whether to replace it before touching it. Existing `public/robots.txt` conflicts with the endpoint version — one has to go.

2. **Collect the values you actually need.** Ask the user for these if they are not obvious from the repo (README, package.json, existing pages). Do not invent them:
   - production URL (for `site`)
   - site name, one-line description, author/organisation name
   - homepage title (may include `{year}`)
   - a default OG image, 1200×630, in `public/` — if none exists, generate a plain placeholder at that path and say so (see Scope)
   - optional: X/Twitter handle, geo region, theme colour, keywords

3. **Run the installer** from the project root:

   ```
   node <skill-dir>/scripts/setup.mjs --site https://example.com --name "Site Name" --description "..." --author "..."
   ```

   It copies the five template files, adds `site` and the sitemap integration to `astro.config`, installs `@astrojs/sitemap` with the project's package manager, and prints warnings for conflicts (a `public/robots.txt`, a hand-rolled sitemap route). Use `--dry-run` first if the project already has SEO files. Do the copying by hand only if the script cannot run; if you do, copy byte-for-byte.

4. **Finish `site.ts`.** Replace every remaining `EDIT` marker; grep for `EDIT` afterwards and none should remain. Make sure the OG image the config points to exists in `public/` at 1200×630. If `trailingSlash` is set in the config, note it, canonical URLs must match the deployed form.

5. **Wire `SEO.astro` into the base layout.** Replace whatever ad-hoc `<title>`/meta tags the layout already has with `<SEO {...seo} />` inside `<head>`, and pass the layout's props through. Minimal shape:

   ```astro
   ---
   import SEO from '../components/SEO.astro'
   import type { Props as SEOProps } from '../components/SEO.astro'
   type Props = SEOProps
   const props = Astro.props
   ---
   <html lang="en">
     <head>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1" />
       <SEO {...props} />
       <slot name="head" />
     </head>
     <body><slot /></body>
   </html>
   ```

   Keep the layout's own `charset`/`viewport` — `SEO.astro` deliberately does not emit them so it composes with any layout.

6. **Add structured data where it earns its place.**
   - Homepage: `<StructuredData slot="head" type="website" />`.
   - Articles / blog posts: pass `article={{ publishedTime, authors, tags }}` and `articleJsonLd` to the layout. `SEO.astro` derives the Article node from the same props — never write it by hand or pass the title twice.
   - Product pages only: `<StructuredData slot="head" type="product" product={{...}} />`. Read the component's warning before passing `rating` — self-authored review ratings violate Google's guidelines and can get rich results suppressed.
   - Anything else (FAQ, Organization, BreadcrumbList): `schema={{...}}` on either component.
     All JSON-LD goes through `safeJsonLd()`, which escapes `<` and `>` as unicode escapes so a `</script>` in content cannot break out of the tag. Never emit JSON-LD with a bare `JSON.stringify`.

7. **Set per-page overrides** on at least the homepage and one inner page so the pattern is visible: `<Layout title="..." description="..." article={{...}} articleJsonLd>`. For content collections, pass frontmatter through in the dynamic route so publishing a post never touches code.

8. **Verify.** First run `node <skill-dir>/scripts/doctor.mjs` from the project root — it checks the source for leftover `EDIT` placeholders, a missing OG image, pages that bypass the layout, and a layout with its own `<title>`, and names the file and line. Fix everything it lists. Then run the build, then `node <skill-dir>/scripts/check-seo.mjs dist` (pass the project's build output directory). It checks every HTML page for title, description, canonical, OG and Twitter tags, checks that `robots.txt` and a sitemap exist and reference each other, and fails on leftover `EDIT` markers. Fix anything it reports and re-run until it passes. Report the result to the user.

9. **Check current Astro APIs.** If an Astro Docs MCP server is available (`search_astro_docs`), confirm the sitemap integration's output filename and the `Astro.site` / endpoint API for the installed Astro major version. Sitemap and endpoint behaviour have changed across versions; don't trust memory over the docs.

## Decisions baked into the templates

Explain these to the user if they ask why something is missing compared to their old setup:

- `og:title` is the raw page title; the `| Site Name` suffix is browser-tab chrome, not card content.
- `twitter:title/description/image` are not emitted by default — X falls back to `og:*`. Set `SITE.twitterMirrorOg = true` if an audit tool complains, or pass the `twitter` prop for a per-page override.
- No `<link rel="preload">` for the OG image — it preloads an image the page never renders.
- No `X-UA-Compatible`, no `apple-mobile-web-app-*` — dead or PWA-only.
- Empty image URLs are skipped rather than emitted as `content=""`.
- In `astro dev`, the component warns on missing description, missing image alt, and over-long descriptions. These are stripped from builds.
- `keywords` is supported but off by default; search engines ignore it.
- `hreflang` emits `en` + `x-default` only when `SITE.hreflang` is true; on a single-language site it adds nothing.
- The `{year}` in the homepage title is resolved at build time on static sites. It only updates on rebuild.
- OG image dimensions default to 1200×630 (the platform-recommended size), not the reference project's 1260×750.

See `references/checklist.md` for the manual review list and `references/source-project-notes.md` for how the reference project differed and why.
