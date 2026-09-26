# Backend Gaps (updated — Wave A)

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
| Report create | `POST /reports` (any auth user) |
| Resubmit | `POST /moderation/items/{id}/resubmit` |
| Enqueue | `publish_request` → `ModerationItem` |
| Platform admin | `/admin/users*`, `/admin/companies*`, `/admin/dictionaries*`, `/admin/analytics/overview`, `/admin/audit`, `/admin/feature-flags*`, `/admin/settings` |

## Wave A seed extras (`seed_extras.py`)

After core seed: dictionaries, DigitalLab workspace (services/cases/docs/members/activity),
proposals+deals+favorites+invites+notifications, moderation queue/reports/escalations/audit.

## FE wiring status (`VITE_USE_MOCK_API=false` — **default**)

| Domain | Capability | Wired |
|---|---|---|
| auth/companies/opportunities/proposals/matching/deals/notifications/shortlist | real | yes |
| favorites / team / services / settings / verification | real | yes |
| invites | via opportunities real | yes |
| cases / documents / activity | real | yes |
| moderation / reports / escalations / history | real | yes |
| moderator/admin notifications | real via `/notifications` | yes |
| admin users/companies / dictionaries / analytics / audit / settings / flags | real | yes |

Mocks only if `VITE_USE_MOCK_API=true` (tests/legacy). Runtime no longer calls `hydrateMocks()`.

## Smoke

```bash
python backend_max/scripts/smoke_wave_a.py
# or BASE_URL=http://localhost:8000 ...
```

## Remaining (Wave B+)

1. Real MAX Bridge adapter (`initData` + `shareMaxContent`) — still `MockMaxBridgeAdapter`.
2. Delete `frontend/src/shared/mocks/*` entirely (branches remain behind flag for unit tests).
3. Member RBAC enforce (MANAGER/VIEWER).
4. Invite accept flows.
