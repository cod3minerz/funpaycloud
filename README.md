# Analyze file and execute

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Reliability tests (Chats)

Run production build check:

- `npm run build`

Run e2e reliability scenarios for chats:

- `npm run test:e2e -- chat-reliability.spec.ts`

## Frontend Design System

- Main guide: `docs/FRONTEND_DESIGN_SYSTEM.md`

## Platform v2 feature flag

For staged `/platform` migration, the v2 route group is available at `/platform-v2/*`.

Enable automatic routing to v2 with one env flag:

- `PLATFORM_V2_ENABLED=true`
- or `NEXT_PUBLIC_PLATFORM_V2_ENABLED=true`

When enabled, `/platform/*` requests are redirected to `/platform-v2/*` in middleware/proxy.
