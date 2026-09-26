# Backend Gaps (updated after Phase 0–4 implementation + FE wire)

## Done on BE (new)

| Domain | Endpoints |
|---|---|
| Roles | `User.role` enum + seed users (incl. moderator `7777009`) |
| Membership | `CompanyMember` + `/companies/me/members*` |
| Favorites | `/favorites`, `/favorites/toggle`, `/favorites/check` |
| Invites | `/opportunities/{id}/invites`, `/invites/mine` |
| Services | `/companies/me/services*`, public list |
| Cases | `/companies/me/cases*`, public list |
| Documents | `/companies/me/documents*` |
| Settings | `/companies/me/settings` |
| Verification | `/companies/me/verification` |
| Activity | `/companies/me/activity` |
| Moderation | `/moderation/*`, `/reports*`, `/escalations*` |
| Platform admin | `/admin/users*`, `/admin/companies*`, `/admin/dictionaries*`, `/admin/analytics/overview`, `/admin/audit`, `/admin/feature-flags*`, `/admin/settings` |

## FE wiring status (`VITE_USE_MOCK_API=false`)

| Domain | Capability | Wired |
|---|---|---|
| auth/companies/opportunities/proposals/matching/deals/notifications/shortlist | real | yes |
| favorites / team / services / settings / verification | real | yes |
| invites | via opportunities real | yes |
| cases / documents / activity | real | yes (`casesApi`/`documentsApi`/`activityApi`) |
| moderation / reports / escalations | real | yes (`moderationApi`/`reportsApi`/`escalationsApi` → `/moderation/*`) |
| admin users/companies / dictionaries / analytics / audit / settings / flags | real | yes (`/admin/*` via `shared/api/real/moderationAdmin.ts`) |

Mocks stay when `VITE_USE_MOCK_API=true` (proxy switches per domain).

## Remaining

1. Live smoke with Docker + seed (`7777001` admin, `7777009` moderator).
2. Caddyfile: add proxies for `/favorites*`, `/admin*`, `/moderation*`, `/reports*`, `/escalations*`, `/invites*` if using Caddy HTTPS entry.
3. Analytics FE maps BE overview counts → richer `AnalyticsOverview` shape (deltas/funnel filled with zeros / flat metrics).
4. Admin company detail nested lists (employees/cases/docs) empty from BE list DTO until dedicated endpoints exist.
