---
name: fpc-design-system
description: Build or refactor FunPay Cloud public frontend UI using the canonical design system, themes, variants, and Streamline icon API.
---

# FunPay Cloud Design System

Use `@/design-system` for controls, layout primitives, typography, cards, states and theme controls. Use `@/public/PublicShell` for public navigation and footer.

- Put primitive and semantic tokens in `src/design-system/tokens.css`.
- Put page composition in semantic CSS classes using `--ds-*` tokens.
- Use `VariantBoundary` only for meaningful composition alternatives; variants share content, tokens and components.
- Use `@/shared/streamline/icons`. Do not import Lucide or draw interactive SVGs.
- Do not add native controls outside `src/design-system/components.tsx`.
- Keep platform2 behavior unchanged unless the request explicitly includes platform work.

Before finishing, run `npm run lint:design-system` and `npm run typecheck`, then inspect desktop, tablet and mobile states in both themes.
