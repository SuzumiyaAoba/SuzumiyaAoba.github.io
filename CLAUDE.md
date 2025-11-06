# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js-based blog site with static site generation (SSG), featuring MDX content, Pagefind search, and UnoCSS for styling. The site is designed for GitHub Pages deployment.

## Development Commands

### Dev Server
```bash
npm run dev
```
This command:
1. Cleans the `.next` and `out` directories
2. Creates Pagefind stub files for development (see `scripts/pagefind-dev.js`)
3. Starts the Next.js dev server and SCSS type generation in parallel

### Build
```bash
npm run build
```
This runs a sequential build process:
1. Cleans output directories
2. Copies assets (images and CSS) from `src/contents/blog` and `src/contents/notes` to `public/assets`
3. Builds Next.js with static export
4. Generates Pagefind search index from the built site
5. Fixes Pagefind path references for static hosting

### Testing
```bash
npm test           # Run tests once
npm run test:watch # Run tests in watch mode
```
Tests use Vitest with jsdom environment. Setup file: `src/__tests__/setup.ts`

### Linting & Formatting
```bash
npm run lint        # Check code with Biome
npm run lint:fix    # Auto-fix issues with Biome
```
Uses Biome for linting and formatting (see `biome.json`). Configured for:
- 2-space indentation
- Double quotes
- Semicolons required

### Storybook
```bash
npm run storybook        # Dev server on port 6006
npm run build-storybook  # Build static Storybook
```

## Architecture

### Internationalization (i18n)

The site uses **i18next** for UI internationalization, providing a complete multi-language experience:

**i18n Setup** (`src/libs/i18n/`):
- `settings.ts` - Core configuration (supported languages: `ja`, `en`)
- `index.ts` - Server-side translation utilities for Server Components
- `client.ts` - Client-side translation hook for Client Components
- `locales/{lang}/common.json` - Translation files for each language

**Usage**:

*In Server Components:*
```typescript
import { useTranslation } from "@/libs/i18n";

async function MyComponent() {
  const { t } = await useTranslation("ja", "common");
  return <div>{t("nav.blog")}</div>;
}
```

*In Client Components:*
```typescript
"use client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/libs/i18n/client";

function MyComponent() {
  const { language } = useLanguage();
  const { t } = useTranslation(language, "common");
  return <div>{t("nav.blog")}</div>;
}
```

**Language Management**:
- `LanguageContext` (`src/contexts/LanguageContext.tsx`) - Provides global language state
- `LanguageSwitcher` component - Toggle between languages (shown in Header)
- Language preference saved to localStorage
- Auto-detects browser language on first visit

**Multi-Language Content vs UI**:
- **Content** (MDX files): Multi-language via `index.{lang}.mdx` files - handled by content system
- **UI** (components): Multi-language via i18next translation files

### Content System

Content is stored in `src/contents/` with MDX files organized by type:
- `blog/` - Blog posts with frontmatter (see `blogFrontmatterSchema` in `src/libs/contents/schema.ts`)
- `keywords/` - Keyword definitions
- `books/` - Book-related content

Each content item is a directory containing:
- `index.mdx` or `index.md` - The default content file (Japanese)
- `index.{lang}.mdx` or `index.{lang}.md` - Language-specific content (e.g., `index.en.mdx` for English)
- Images (`.png`, `.jpg`, `.jpeg`, `.svg`) - Auto-copied to `public/assets` during build
- CSS files - Auto-copied to `public/assets` during build

**Multi-Language Support**:
- Content can have multiple language versions by creating `index.{lang}.{md,mdx}` files
- Default file (`index.md` or `index.mdx`) is treated as Japanese (`ja`)
- Supported language codes: `ja` (Japanese), `en` (English)
- Language switching is handled client-side via `LanguageToggle` component
- All language versions are generated at build time (SSG compatible)

**Content Processing Pipeline** (`src/libs/contents/markdown.ts`):
1. `getRawContent()` - Loads MD/MDX file from filesystem
   - Supports optional `lang` parameter for language-specific files
   - Falls back to default file if language version doesn't exist
2. `parseRawContent()` - Parses frontmatter with Zod schema validation
3. `getContent()` - Full processing:
   - Supports optional `lang` parameter
   - Extracts TOC using unified/remark/rehype pipeline
   - Retrieves Git history (creation date, last modified)
   - Processes MDX with remark/rehype plugins
   - Returns Component, frontmatter, content, and metadata
4. `getAvailableLanguages()` - Returns array of available language codes for content
5. `hasEnglishVersion()` - Checks if English version exists (convenience function)
6. `getPaths()` - Automatically excludes language-specific files from path generation

**Frontmatter Schemas** (`src/libs/contents/schema.ts`):
- `blogFrontmatterSchema` - Required: title, date, category, tags. Optional: description, author, ogImage, amazonAssociate, myLinkBoxIds
- `keywordFrontmatterSchema` - Adds parent and draft fields
- `bookFrontmatterSchema` - Minimal schema for book content

### Series Management

Blog posts can be organized into series using JSON definition files in `src/contents/series/`.

**Series Definition** (`src/contents/series/{slug}.json`):
```json
{
  "name": "Series Display Name",
  "slug": "series-url-slug",
  "description": "Optional series description",
  "posts": [
    "2024-01-01-first-post",
    "2024-01-02-second-post"
  ]
}
```

**How it works**:
1. Create a JSON file in `src/contents/series/` (e.g., `my-series.json`)
2. Define series metadata and list of post slugs in order
3. Series information is automatically loaded and available at `/series/{slug}/`
4. Articles automatically show series navigation if they're included in a series

**Key Functions** (`src/libs/contents/series.ts`):
- `getAllSeries()` - Returns all series definitions with their posts
- `getSeriesBySlug(slug)` - Get series information by slug
- `findSeriesByPostSlug(postSlug)` - Find which series a post belongs to
- `getSeriesNavigation(postSlug)` - Get previous/next navigation for a post

**Important**: Blog posts do NOT need series-related fields in their frontmatter. Series membership is determined solely by the JSON definition files.

### MDX Processing

**Remark Plugins** (`src/libs/markdown/mdxOptions.ts`):
- `remark-gfm` - GitHub Flavored Markdown
- `remark-emoji` - Emoji support
- `remark-join-cjk-lines` - CJK text line joining
- `remark-math` - Math notation
- `remark-mermaid` - Mermaid diagrams

**Rehype Plugins**:
- `rehype-resolve-image-urls` - Resolves relative image paths
- `rehype-twitter-urls` - Handles Twitter embeds
- `rehype-youtube-urls` - Handles YouTube embeds
- `rehype-slug` - Adds IDs to headings
- `rehype-autolink-headings` - Wraps headings in links
- `rehype-external-links` - Adds target="_blank" to external links
- `rehype-katex` - Renders math with KaTeX

**Custom Components** (`defaultComponents`):
Components available in MDX: `SsgImage`, `Img`, `GitHubCodeLink`, `Message`, `Mermaid`, `DependencyInjectionPrinciplesPracticesAndPatterns`, `table` (TableWrapper), `VisDotGraph`, `TweetCard`, `YouTubeEmbed`

### Routing Structure

Next.js App Router with static export:
- `/` - Home page
- `/blog/` - Blog listing with pagination (10 posts per page)
- `/blog/post/[slug]/` - Individual blog posts
- `/search/` - Pagefind-powered search
- `/series/` - Content series
- `/tags/` - Tag pages
- `/keywords/` - Keyword definitions
- `/books/` - Books content
- `/about/`, `/contact/`, `/privacy-policy/`, `/tools/` - Static pages

**Redirect**: `/blog/:slug/` → `/blog/post/:slug/` (301 permanent)

### Styling

**UnoCSS Configuration** (`uno.config.ts`):
- Presets: Wind (Tailwind-compatible), Attributify, Icons, Typography, Animations, Shadcn
- Dark mode: Class-based with `[data-theme="dark"]` selector
- Custom theme colors via CSS variables: `--color-primary`, `--color-background`, `--color-text`
- Shortcuts: `btn`, `btn-primary`, `card`

### Search (Pagefind)

**Development**:
- Stub files created by `scripts/pagefind-dev.js` in `public/pagefind/`
- Provides sample data for testing without full indexing

**Production**:
- Real index generated from `out/` directory after build
- Script `scripts/fix-pagefind-path.js` adjusts paths for static hosting

### Build Configuration

**Next.js** (`next.config.mjs`):
- Output: `export` (static export for production)
- Trailing slash: enabled
- Image optimization: disabled in production (static export requirement)
- TypeScript: build errors NOT ignored
- ESLint: ignored during builds (Storybook-specific rules cause failures)

**TypeScript** (`tsconfig.json`):
- Path aliases: `@/*` → `src/*`, `@/fonts` → `src/styles/fonts`
- Pagefind types: `/pagefind/pagefind.js` → `src/types/pagefind.d.ts`

## Important Implementation Notes

### Working with Content

When adding or modifying content:
1. MDX files must be in directories with `index.mdx` or `index.md`
2. For multi-language content, add `index.{lang}.mdx` or `index.{lang}.md` files
   - Example: `index.en.mdx` for English version
   - Language files share the same directory and assets
3. Validate frontmatter against appropriate Zod schema
4. Images and CSS are auto-copied during build - reference them relative to the MDX file
5. Use Git history features - `getFileCreationDate()` and `getFileLastModified()` in `src/libs/git-history.ts`

**Adding Multi-Language Content**:
1. Create base content: `src/contents/blog/my-post/index.mdx`
2. Add translation: `src/contents/blog/my-post/index.en.mdx`
3. Language toggle button appears automatically when multiple languages exist
4. Assets (images, CSS) are shared across all language versions

### Styling Patterns

- Use UnoCSS utilities with dark mode support via `[data-theme="dark"]`
- SCSS modules: Auto-generated types with `npm run tsm`
- Theme colors: Use CSS variables for light/dark mode compatibility

### Static Export Constraints

- No runtime server features (API routes, middleware, etc.)
- Image optimization disabled in production builds
- All pages must be statically generated at build time
- Pagefind index must be generated post-build from `out/` directory

### Testing Components

- Storybook stories co-located with components
- Test files in `src/__tests__/`
- Vitest configured with jsdom for React component testing
