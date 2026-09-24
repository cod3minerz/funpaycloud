# Public UI redesign audit

## Baseline

- Public UI previously mixed platform2, landing-specific, blog-specific and auth-specific component systems.
- `app/globals.css` had roughly 4,445 lines and 286 color literals.
- The former design-system check omitted most public routes and could pass while landing or legal pages used hardcoded UI.
- Landing, blog and auth duplicated controls and theme behavior.
- Public 404, route error, global error and loading templates were missing.
- Public visual regression coverage was absent.

Baseline screenshots were captured locally before migration. Final regression is maintained by `tests/public-pages.spec.ts` at desktop, tablet and mobile widths.

## Canonical boundaries

- Components and theme: `src/design-system`.
- Public shells and variants: `src/public`.
- Primitive and semantic values: `src/design-system/tokens.css`.
- Icons: `@/shared/streamline/icons`.
- Public pages may use semantic HTML for article content, but interactive controls come from `@/design-system`.

## Knowledge graph

- Frontend graph: `funpaycloud-frontend`.
- Backend graph: `funpaycloud-backend`.
- Both were indexed in full mode. The previous derived graph name is not the canonical project for discovery.
- Graph artifacts stay local and `.codebase-memory/graph.db.zst` is not tracked.

## Security note

An untracked local `CLAUDE.md` contains a production database connection string. It is intentionally outside this change. The credential must be rotated and moved to secret storage before that file can ever be tracked.
