# Platform v2 Parity Matrix

This checklist tracks functional parity between `/platform/*` and `/platform-v2/*`.

## P0

| Route | Data load | Filters | Main actions | Empty/Error states | Mobile | Done |
|---|---|---|---|---|---|---|
| `/platform-v2/dashboard` | ☐ | n/a | ☐ | ☐ | ☐ | ☐ |
| `/platform-v2/accounts` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/platform-v2/ai-assistant` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/platform-v2/subscription` | ☐ | n/a | ☐ | ☐ | ☐ | ☐ |
| `/platform-v2/finances` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

## P1

| Route | Data load | Filters | Main actions | Empty/Error states | Mobile | Done |
|---|---|---|---|---|---|---|
| `/platform-v2/orders` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/platform-v2/lots` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/platform-v2/warehouse` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/platform-v2/analytics` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/platform-v2/referrals` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

## P2

| Route | Data load | Filters | Main actions | Empty/Error states | Mobile | Done |
|---|---|---|---|---|---|---|
| `/platform-v2/plugins` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/platform-v2/constructor` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/platform-v2/test-chat` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/platform-v2/settings` | ☐ | n/a | ☐ | ☐ | ☐ | ☐ |

## Critical flow acceptance (go-live gate)

- [ ] auth/session guard parity for `/platform-v2/*`
- [ ] subscription lock parity and recovery after renewal
- [ ] proxy connect modal flow works
- [ ] AI mode switch + save works
- [ ] finance export CSV works
- [ ] rollback via `PLATFORM_V2_ENABLED=false` works without deploy changes
