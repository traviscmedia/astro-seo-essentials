# Astro SEO Essentials 🚀

A ready-made SEO setup for [Astro](https://astro.build) sites. Run one command, fill in a few blanks, and every page on your site gets correct title tags, descriptions, social sharing cards, a sitemap, a robots.txt, and structured data. The same way, every time.

It works two ways:

- **As a script** you run yourself (no AI needed).
- **As a skill** for AI coding agents (Claude Code, Codex, Hermes), so you can type `/astro-seo-essentials` and let the agent do the setup.

---

## Who this is for

- You're building sites with Astro and don't want to research SEO tags every time.
- You've built one site with good SEO and want to repeat that setup on the next one without copy-pasting.
- You use an AI coding agent and want it to do SEO **your** way, not whatever it invents.

You don't need to know anything about SEO to use this. You do need a working Astro project and Node.js installed.

---

## What you get

After setup, every page of your site will have:

| What | Why it matters |
| --- | --- |
| `<title>` and meta description | What Google shows in search results |
| Canonical URL | Tells Google which URL is the "real" one, avoids duplicate-content problems |
| Open Graph tags | The preview card when someone shares your link on Facebook, LinkedIn, Slack, iMessage, Discord |
| Twitter/X card tag | Same thing for X |
| Robots directives | Tells search engines to index the page and show large image previews |
| Favicon and theme colour | Browser tab icon, mobile browser bar colour |
| Structured data (JSON-LD) | Lets Google understand "this is an article by this author, published on this date", enables rich results |
| `sitemap-index.xml` | A list of all your pages for search engines |
| `robots.txt` | Points search engines to the sitemap |

All of it is driven by **one config file** (`src/config/site.ts`) and your site's URL in `astro.config.mjs`. Change a value once, it updates everywhere.

---

## What's in this repo

```
astro-seo-essentials/
├── SKILL.md                    ← instructions for AI agents
├── assets/                     ← the files that get copied into your project
│   ├── site.ts                 ← your site's name, description, default image, etc.
│   ├── seo.ts                  ← small helper functions
│   ├── SEO.astro               ← the component that writes all the <head> tags
│   ├── StructuredData.astro    ← JSON-LD for your homepage and product pages
│   └── robots.txt.ts           ← generates robots.txt with the correct sitemap link
├── scripts/
│   ├── setup.mjs               ← the installer
│   ├── doctor.mjs              ← checks your source files before you build
│   └── check-seo.mjs           ← checks your built site after you build
└── references/
    ├── checklist.md            ← things to review by hand before launch
    └── source-project-notes.md ← design decisions and where ideas came from
```

---

## Setup (do it yourself)

### 1. Get the files

Clone this repo somewhere outside your Astro project:

```bash
git clone https://github.com/traviscmedia/astro-seo-essentials.git
```

### 2. Run the installer from your Astro project

Open a terminal **inside your Astro project folder** (the one with `astro.config.mjs`) and run:

```bash
node ../astro-seo-essentials/scripts/setup.mjs --site https://your-domain.com --name "Your Site Name" --description "One sentence about your site." --author "Your Name"
```

Adjust `../astro-seo-essentials` to wherever you cloned the repo.

The installer will:

- copy five files into `src/`
- add your site URL and the sitemap integration to `astro.config.mjs`
- install `@astrojs/sitemap` using whichever package manager your project uses
- warn you if it finds an old `public/robots.txt` or a custom sitemap file that would conflict

It never touches your layout or pages. Run it with `--dry-run` first if you want to see what it would do without changing anything.

### 3. Fill in the blanks

Open `src/config/site.ts`. Every value that still says `EDIT` needs a real value. The comments explain each one. The important ones:

- `homeTitle`: the browser tab title of your homepage. `{year}` becomes the current year automatically.
- `ogImage`: the image shown when your site is shared. Put a **1200 × 630** image at `public/og-default.jpg`, or change this path.
- `ogImageAlt`: a one-line description of that image.

### 4. Add the SEO component to your layout

Open your base layout, usually `src/layouts/Layout.astro`. Delete any `<title>` or `<meta name="description">` tags it already has, and add the `<SEO>` component inside `<head>`.

A minimal layout looks like this:

```astro
---
import SEO from '../components/SEO.astro'
import type { Props as SEOProps } from '../components/SEO.astro'
type Props = SEOProps
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <SEO {...Astro.props} />
    <slot name="head" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

Keep your own `charset` and `viewport` lines, the SEO component deliberately doesn't write those.

**If a page already has its own `<html>` and `<head>`** (Typically the starter template's `index.astro` does), delete all of that and wrap the page in `<Layout>` instead. A page that keeps its own `<html>` never touches the SEO component, and you end up with two `<title>` tags.

### 5. Give each page a title

In any page that uses the layout:

```astro
---
import Layout from '../layouts/Layout.astro'
---
<Layout title="About us" description="Who we are and what we do.">
  <h1>About us</h1>
</Layout>
```

Leave `title` off on the homepage and it uses `homeTitle` from your config.

### 6. Check your source before building

```bash
node ../astro-seo-essentials/scripts/doctor.mjs
```

This reads your `src/` and `public/` folders and names the exact file and line for anything you missed: an `EDIT` placeholder still in `site.ts`, a social image that doesn't exist, a page that skipped the layout, a layout with a leftover `<title>`. Fix what it lists, run it again until it says `Pre-build check passed.`

### 7. Build and check the output

```bash
npm run build
node ../astro-seo-essentials/scripts/check-seo.mjs dist
```

This reads every built page in `dist/` and confirms the tags actually made it into the HTML; title, description, canonical, Open Graph, structured data, and that `robots.txt` and the sitemap exist and point at each other. Fix anything it reports and re-run until it says `SEO check passed.`

That's it. Deploy.

> **Paths with spaces** if the folder path has a space anywhere in it (`C:\Users\Your Name\...`), every command that includes the path must have it in quotes, or the shell splits it into pieces and reports "file not found":
>
> ```
> node "C:\Users\Your Name\astro-seo-essentials\scripts\doctor.mjs"
> node "..\astro-seo-essentials\scripts\check-seo.mjs" dist
> ```
>
> The same applies to the symlink target in the AI-agent section below. Quoting always works; moving the folder to a path with no spaces is simpler.

### Common mistakes

These are the things people actually get wrong, in order of how often:

| Symptom | Cause | Fix |
| --- | --- | --- |
| Two `<title>` tags on the homepage | `index.astro` still has its own `<html>`/`<head>` from the starter template | Delete that block, wrap the page in `<Layout>` |
| Title says `Site Name` or a tag says `EDIT …` | A placeholder in `src/config/site.ts` wasn't replaced | `doctor.mjs` gives you the line number |
| Social card shows no image | `public/og-default.jpg` doesn't exist | Add a 1200×630 JPG there, or change `ogImage` |
| `robots.txt` shows the old contents | A `public/robots.txt` is shadowing the new endpoint | Delete `public/robots.txt` |
| Canonical URL says `example.com` | `site` in `astro.config.mjs` is still the placeholder | Set your real domain |

---

## Setup (with an AI agent)

If you use Claude Code, Codex, or Hermes, you can have the agent do all of the above.

### 1. Install the skill

Copy or symlink this repo's folder into your agent's skills directory:

| Agent | Global (all projects) | Per project | Type to run it |
| --- | --- | --- | --- |
| Claude Code | `~/.claude/skills/astro-seo-essentials/` | `.claude/skills/astro-seo-essentials/` | `/astro-seo-essentials` |
| Codex CLI | `~/.codex/skills/astro-seo-essentials/` | `.agents/skills/astro-seo-essentials/` | `$astro-seo-essentials` (or `/skills` to pick from a list) |
| Hermes | `~/.hermes/skills/astro-seo-essentials/` | `.agents/skills/astro-seo-essentials/` | `/astro-seo-essentials` |

Codex and Hermes share the `.agents/skills/` convention, so one project-level folder serves both.

#### Copy or symlink?

A **symlink** is a shortcut the operating system treats as if it were the real folder. The agent opens `~/.claude/skills/astro-seo-essentials`, sees `SKILL.md`, and works. But there's only one real copy of the repo, wherever you keep it. Edit the repo and every agent sees the change immediately. **Copying** works too; you just have to re-copy after every update.

**Windows**: PowerShell run as administrator (Windows restricts symlink creation). Quote the paths if they contain spaces:

```
New-Item -ItemType Directory -Force "$HOME\.claude\skills"
New-Item -ItemType SymbolicLink -Path "$HOME\.claude\skills\astro-seo-essentials" -Target "C:\path\to\astro-seo-essentials"
```

**macOS / Linux:**

```
mkdir -p ~/.claude/skills
ln -s /path/to/astro-seo-essentials ~/.claude/skills/astro-seo-essentials
```

For Codex or Hermes, swap `.claude` for `.codex` or `.hermes`.

**Confirm it worked**: list the link; you should see `SKILL.md`, `assets`, `scripts`, `references`:

```
dir "$HOME\.claude\skills\astro-seo-essentials"      # Windows
ls ~/.claude/skills/astro-seo-essentials               # macOS / Linux
```

Then open the agent, type `/`, and check the skill appears.

**Remove or move it**: deleting the link doesn't touch the repo. If you move the repo, delete the link and recreate it pointing at the new location:

```
Remove-Item "$HOME\.claude\skills\astro-seo-essentials"   # Windows
rm ~/.claude/skills/astro-seo-essentials                  # macOS / Linux
```

If you delete or move the repo folder without updating the link, the agent will stop listing the skill until you fix it.

Codex picks up new skills automatically (restart it if one doesn't appear). Hermes loads skills at the start of a session, so start a new chat or run `/reset` after installing.

### 2. Run it

Open your Astro project in the agent and type the command from the table above. Tell it your site's URL and name if it asks. It runs the installer, edits your layout for you, builds the site, runs the checker, and reports back.

The skill has a strict-scope rule: the agent installs exactly what's in this repo and nothing more. If it thinks something is missing, it's told to tell you instead of adding it.

### Optional: tell every project to use this skill

Newer versions of `npm create astro` add two identical files to every project, `AGENTS.md` and `CLAUDE.md`. They tell an agent how to start the dev server and which Astro docs to read. They're generic, nothing about your project, nothing about SEO, so they won't conflict with this skill, but they also won't point the agent at it.

If you want a project to always use this setup, add one line to `AGENTS.md`:

```
For SEO setup, use the astro-seo-essentials skill and nothing else.
```

Codex and Hermes read `AGENTS.md`. Claude Code reads `CLAUDE.md`, so either add the same line there or replace `CLAUDE.md` with a single line that says `See AGENTS.md.`

Older Astro projects won't have either file. That's fine, this skill doesn't depend on them.

### Optional: Astro Docs MCP

Adding the [Astro Docs MCP server](https://docs.astro.build/en/guides/build-with-ai/) to your agent lets it check current Astro APIs instead of relying on memory. The skill uses it if it's there.

---

## Everyday use

### Blog posts and articles

Pass `article` details and turn on `articleJsonLd`. Everything else like the `og:type`, the dates, the Article structured data is derived automatically:

```astro
<Layout
  title={post.data.title}
  description={post.data.description}
  image={post.data.ogImage}
  article={{ publishedTime: post.data.pubDate, authors: ['Your Name'], tags: post.data.tags }}
  articleJsonLd
>
```

Do this once in your `[slug].astro` route and every post gets its own complete SEO with no further work.

### Product pages

```astro
<Layout title="Widget Pro" description="...">
  <StructuredData slot="head" type="product" product={{ name: 'Widget Pro', description: '...', image: '/widget.jpg', price: '49.99' }} />
  ...
</Layout>
```

Don't pass `rating` unless the score comes from real third-party reviews. Google penalises sites that emit ratings for their own content.

### Pages you don't want indexed

```astro
<Layout title="Thank you" noindex>
```

### Overriding the X card

X uses your Open Graph tags by default. If you want a different title or image just for X:

```astro
<Layout title="..." twitter={{ title: 'Different title for X', image: '/x-card.jpg' }}>
```

### All the options

Open `assets/SEO.astro`, the `Props` interface at the top lists every prop with a comment. Open `assets/site.ts` for every site-wide setting.

---

## Design decisions

A few things are deliberately **not** included. `references/source-project-notes.md` explains each one, but the short version:

- `twitter:title`, `twitter:description`, `twitter:image` are not emitted by default. X falls back to the Open Graph tags, so they're duplicate weight. Set `twitterMirrorOg: true` in `site.ts` if an SEO audit tool nags you.
- No `meta keywords` by default. Google has ignored it since 2009.
- No `preload` of the social image. It's not shown on the page, so preloading it wastes bandwidth.
- JSON-LD is escaped so that a `</script>` inside a product description can't break your page. Don't replace this with a plain `JSON.stringify`.

---

## Before you launch

Read `references/checklist.md`. It's the short list of things a script can't check: does the description read well, does the social card look right in a preview tool, is the sitemap submitted to Search Console.

---

## License

MIT
