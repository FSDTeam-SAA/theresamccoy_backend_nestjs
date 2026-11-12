# Backend audit and delivery notes

Reviewed against [the supplied Figma file](https://www.figma.com/design/hJociBJ8aK3qtwRkkKjB2G/Untitled?node-id=0-1). Date: 2026-11-12. This is a backend implementation and API audit, not a pixel comparison or a claim that every prototype interaction is complete.

## Design evidence

Read the full page hierarchy: Authentication, Public website flow, Business Owner Dashboard, Admin Dashboard, and individual bookkeeper screens. Retrieved detailed design context for Bookkeeper Dashboard Overview (`1:18580`), editable Profile & Skills (`1:20510`), business Messages (`1:6424`), admin Quiz Management (`1:11473`) and Home Settings (`1:16757`). The initial page-level context request required selecting a specific frame; subsequent frame reads succeeded through the connected Figma account. The supplied personal token was not copied into source, documentation or environment files.

| Design area | Existing implementation | Changes / practical limit |
|---|---|---|
| Authentication | Register/login, OTP reset, refresh cookie | Public admin registration blocked, safe profile DTO, atomic expiring OTP/reset proof, hashed OTP, password-change token invalidation, suspended/deleted account checks |
| Public marketplace | Bookkeeper search/details | Only approved profiles public; admin has a separate pending/rejected list; ownership on every legacy profile mutation |
| Business onboarding | Business application and approval | Private admin list/details, self-update path retained, unique profile index, rejection audit fields persisted |
| Application / assessments | Versioned forms, drafts, submissions and admin reviews | Published form discovery; draft forms cannot receive new candidate saves |
| Dashboard | Admin aggregate overview | Member overview, training metadata, actual unread messages, placement fee revenue included in admin totals/chart |
| Training | Course/module/lesson/quiz authoring, enrollment, assignment uploads | Public catalog, server quiz scoring/attempts, passing quiz gates completion, admin assignment review with scores/feedback, answer key removed from student responses; paid course checkout remains a separate missing feature |
| Engagement | Accepted request → completed meeting → two signatures → Stripe fee | Missing completion guard fixed; ObjectId schema types corrected; participant queries now actually match stored references |
| Messaging | Engagement-scoped send/history | Bounded inbox previews, unread counters, read-through cursor, separate private platform support inbox and admin replies; REST polling only |
| Certificates / reviews | Course completion checks and participant reviews | Corrected review ObjectId storage/query schema; retained existing certificate workflow |
| Website settings | No page content module | Typed content sections/items for five page slugs, admin save/preview/publish, public published reads |
| Subscription billing | Payment intents and signed webhook | Valid account roles can initiate; private payment history/details; amount/owner validation, idempotent plan membership, delayed failure cannot downgrade completed payment |

## Important fixes

- Profile updates previously accepted role/password/recovery state. Personal DTOs now exclude these fields. Password updates use authentication services and hashing, never generic query updates.
- A reset previously depended on email plus a persisted boolean after OTP verification. Reset now needs an expiring secret proof, consumed in the same atomic write that changes the password.
- Authorization now loads the current account for each protected request, so suspension/deletion/role changes take effect without waiting for JWT expiry.
- Contact/payment/user private detail routes now require administrator authorization. Paid engagement contacts remain available only to the parties under the existing payment gate.
- Bare `Types.ObjectId` in Nest schema decorators produced Mixed paths, causing string query IDs to miss stored ObjectId references. Engagement, review, quiz attempt and support reference fields use `Schema.Types.ObjectId`.
- Course query parameters were applied as Mongo document filters, making `?page=1&limit=10` incorrectly return no courses. Pagination and filters are now separated.
- Query pagination is bounded; regex search terms are escaped; shared filters ignore Mongo operator objects. Public subscription responses no longer populate subscriber accounts.
- Production startup rejects missing/default/shared JWT secrets, missing Mongo URI and wildcard CORS origins. Comma-separated frontend origins are supported. SMTP port 465 uses TLS.

## Verification

Final run: build passed; 26 unit/regression tests, 8 mocked HTTP tests and 7 disposable-MongoDB integration tests passed (41 total). Targeted ESLint and `git diff --check` passed. Tests were run on Windows with Node 26.7.0 and MongoDB 8.2.6. Mongoose emits deprecation warnings for the existing `new: true` query option; these did not fail tests.

- `npm run check`: build, unit/regression suites and mocked HTTP suites.
- `npm run test:integration`: complete AppModule starts against a disposable local MongoDB, creates indexes, uses real password hashing, and exercises persistence plus HTTP authorization. No configured client database is used. SMTP and Stripe are disabled in this suite.
- Integration scenarios: CMS private draft/public publish; public profile approval and cross-owner rejection; course query/pagination/enrollment/hidden answer keys; quiz score/progress; admin assignment review; dashboard training privacy; support replies/read state; contract signature ordering; payment-gated messaging; duplicate simulated payment confirmation; one-use OTP/reset proof; invalidation of old JWTs.
- Payment activation in integration tests uses a deliberately simulated already-verified PaymentIntent. It does not validate real Stripe delivery, take money or replace Stripe test-mode acceptance.
- New content/support/config/quiz DTO code was checked with ESLint. This is not a repository-wide lint certification; the pre-existing codebase contains broad `any` patterns.

## Deployment and migration notes

Read [the Bengali frontend/test guide](frontend-and-testing.bn.md) before client handoff. It includes concrete API mapping, request examples, role/ID conventions, local setup, admin bootstrap, manual Stripe testing and remaining acceptance work.

Existing data is untouched. Before applying new unique indexes, audit duplicate business profiles and course enrollments. Inspect legacy Mixed reference fields in engagement/review collections: historical string values may need conversion to ObjectId in a reviewed migration. OTPs issued before this update must be reissued. Existing JWTs without tokenVersion remain version zero until a password change/reset invalidates them.

The following are not certified complete: adaptive/tier/mentoring policy, paid course checkout, distributed rate limits, current-session refresh revocation, real S3/SMTP/Stripe acceptance, production data migration, backup/restore and load tests. Quiz pass threshold is currently 80%, preserving a simple explicit server rule; confirm the client's final scoring policy before launch. No deployment or production data changes were made.
