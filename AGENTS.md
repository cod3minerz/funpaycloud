# FunPay Cloud Frontend

## Discovery
- Use the Codebase Memory project `monorepo-cloud` first: `search_graph`, `trace_path`, then `get_code_snippet`.
- Use text search only for literals, CSS tokens, configuration, or when the graph is insufficient.
- Reindex the graph after structural changes before relying on it for final impact analysis.

## Public UI
- Public routes use components only from `@/design-system` and shells from `@/public`.
- Colors, spacing, radii, typography, shadows, borders and motion belong in `src/design-system/tokens.css`.
- Use semantic CSS classes backed by `--ds-*` tokens. Do not use inline styles or arbitrary color utilities.
- Use `@/shared/streamline/icons`; do not add Lucide imports or handwritten SVG controls.
- Native `button`, `input`, `select` and `textarea` elements are allowed only inside design-system primitives.
- `src/public/maintenance/maintenance.module.css` is the sole standalone exception: it uses the user-approved pure-black/white Liquid Glass treatment and is exempt only from raw-color token checks.
- Keep platform routes visually and behaviorally unchanged unless the task explicitly includes them.

## Verification
- Run `npm run lint:design-system`, `npm run typecheck`, `npm run build`, and relevant Playwright tests.
- Verify public UI at desktop, tablet, and mobile widths in both themes.
- Treat overflow, overlap, hydration flash, inaccessible focus states, and missing loading/error states as release blockers.
