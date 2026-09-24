---
name: fpc-public-ui-quality-gate
description: Verify FunPay Cloud landing, blog, auth, legal, referral, marketing, and system pages before release or review.
---

# Public UI Quality Gate

Run the repository gate, typecheck, production build and relevant Playwright coverage. A public UI change is incomplete while any of these fail.

Inspect at `1440x1000`, `1024x768`, and `390x844`:

- no page-level horizontal overflow or incoherent overlap;
- readable hierarchy and stable fixed-format controls;
- keyboard focus and labels on all interactions;
- no light/dark hydration flash;
- loading, empty, error and 404 states use canonical components;
- development section variants preserve identical content and behavior;
- `/platform/*` has no visual or behavioral regression.

Record failures with route, viewport and screenshot. Fix the underlying component or token rather than adding page-specific hardcoded values.
