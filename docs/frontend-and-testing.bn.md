Bookkeeper-এর নতুন screen-specific নির্দেশনা: [Bookkeeper integration guide](bookkeeper-integration.bn.md)। Shareable Swagger file: [OpenAPI JSON](openapi.json)।

# Frontend API ও backend testing guide

Base URL: `http://localhost:3000/api/v1` (PORT বদলালে URL বদলাবেন)। Swagger: `http://localhost:3000/api/docs`। সম্পূর্ণ method/path/access/body DTO: [API reference](api-reference.md)। Postman-এ `/api/docs-json` URL import করলে request schema পাবেন; [collection](backend.postman_collection.json) সব route-এর inventory, automatic test runner নয়।

## আগে local test করুন

এই পরিবর্তনের পরে build এবং মোট ৫০টি automated test পাস করেছে: ৩১টি unit/regression, ৮টি mocked HTTP এবং ১১টি temporary MongoDB integration test।

1. `npm ci` চালান।
2. `.env.example` দেখে local `.env` সেট করুন। বিদ্যমান `.env` overwrite করবেন না। MongoDB-এর জন্য আলাদা local database ব্যবহার করুন।
3. Docker Desktop চালু করে `docker compose -f docker-compose.local.yml up -d` দিন, অথবা নিজের local MongoDB চালান।
4. `npm run check` — build, unit regression এবং mocked HTTP tests।
5. `npm run test:integration` — আলাদা temporary MongoDB-তে full AppModule ও real persistence tests। প্রথমবার MongoDB binary download হবে; internet ও disk space লাগবে। এই suite নিজের database চালায়, configured database ব্যবহার করে না, Stripe/email বন্ধ রাখে।
6. `npm run start:dev` দিয়ে Swagger খুলুন। প্রতিটি role দিয়ে আলাদা login করে token `Authorize`-এ দিন।

Admin registration public নয়। প্রথম admin তৈরির জন্য shell-এ `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD` (১২+ অক্ষর) এবং সঠিক `MONGO_URI` set করে `npm run admin:create` চালান। এটি database-এ নতুন admin লিখবে; existing email পরিবর্তন করবে না। password shell থেকে সরিয়ে ফেলুন। Client বা source code-এ admin credential রাখবেন না।

## Frontend screen → API

সব path-এর আগে `/api/v1` বসবে। `id` কখন User ID, কখন profile ID—নিচের নির্দেশ মানুন।

| Figma screen | Frontend API flow |
|---|---|
| Login / Signup | `POST /auth/register` (`bookkeeper` অথবা `business`), `POST /auth/login`, `GET /user/profile` |
| Forgot password / OTP | `POST /auth/forgot-password` → `POST /auth/verify` → response-এর `resetToken` দিয়ে `POST /auth/reset-password` |
| Home / About / Training / Apply / Contact | `GET /content/{home,about,training,apply,contact}`; training cards `GET /course/catalog/public`; contact form `POST /contact` |
| Marketplace / public profile | `GET /bookkeeper`, `GET /bookkeeper/:profileId`; শুধু approved profile দেখাবে |
| Bookkeeper onboarding | `POST /bookkeeper`; ফেরত পাওয়া profile `_id` দিয়ে `/experience`, `/skills`, `/assessment`, `/availability` POST |
| Profile & Skills | `GET /bookkeeper/profile/me`, `PATCH /bookkeeper/profile/me` (multipart; `profilePicture`, `portfolioFiles`; array JSON string) |
| Bookkeeper application | `GET /applications/forms/published`, `GET /applications/form/:formId`, `POST /applications/save`, `GET /applications/my/:formId`, `PATCH /applications/:submissionId/submit` |
| Business intake | `POST /businesswoner`, `GET/PATCH /businesswoner/profile/me` |
| Dashboard | business/bookkeeper: `GET /dashboard/me`; admin: `/dashboard/overview`, `/dashboard/chart?year=2026` |
| Matched bookkeepers | approved business: `GET /match-bookkeepers`; deterministic rule score, generative AI নয় |
| Requests | business: `POST /request/:bookkeeperProfileId`; both roles: `GET /request/my-requests`; bookkeeper: `PATCH /request/accept/:requestId` বা `/reject/:requestId` |
| Meeting / interview | admin: `POST /meeting-schedule/:requestId`; both participants: `GET /meeting-schedule/my-schedules`; status: `PATCH /meeting-schedule/:id/status` |
| Contracts / signing | `GET /engagement`, `GET /engagement/:id`, `POST /engagement/:id/sign`; bookkeeper আগে sign করবে, business পরে |
| Placement payment | business: `POST /engagement/:id/payment`; frontend Stripe.js দিয়ে clientSecret confirm করবে; signed Stripe webhook সফল হলে access খুলবে |
| Client messages | `GET /engagement/inbox/me`; `GET/POST /engagement/:id/messages`; `PATCH /engagement/:id/messages/read` |
| Platform support messages | `GET/POST /support/me`; `GET /support/me/unread`; `PATCH /support/me/read`; admin `/support/admin/inbox`, `/support/admin/:userId` |
| Courses / lessons / resources | `GET /course/my/all`, `POST /course/:courseId/enroll`, `GET /course/:courseId`, `GET /course/:courseId/progress` |
| Quiz | `POST /course/:courseId/lesson/:lessonId/quiz/submit`; `GET /course/:courseId/quiz-attempts/me`; pass হলে `/lesson/:lessonId/complete` POST |
| Admin assignment review | `GET /course/admin/assignments?courseId=...`, `PATCH /course/admin/assignments/:id/review` body `{ "score": 90, "feedback": "Reviewed" }` |
| Assignments | `POST /course/:courseId/lesson/:lessonId/assignment` multipart `file`; `GET /course/:courseId/submissions/me` |
| Certificates | `GET /certificate`; admin create করে; bookkeeper শুধুমাত্র নিজের certificate দেখতে পারে |
| Reviews | completed engagement-এর participant: `POST /reviews`; public `GET /reviews/user/:userId` |
| Payment history | subscription: `GET /payment/me/history`; placement fee/status: `GET /engagement` |
| Account settings | `PUT /user/profile`, `POST /auth/change-password`; role/status/password recovery fields profile-এ পাঠাবেন না |
| Admin profile approval | `GET /bookkeeper/admin/all`, `PATCH /bookkeeper/:id/review`; business `GET /businesswoner`, `PATCH /businesswoner/:id/approve` বা `/reject` |
| Admin CMS | `GET/PUT /content/admin/:slug`; সম্পূর্ণ sections array পাঠাবে; published=false হলে public API 404 |
| Admin LMS / forms / users | সম্পূর্ণ CRUD ও required DTO [API reference](api-reference.md)-এ |

## Request examples

Registration:

```json
{"firstName":"Sarah","lastName":"Chen","email":"sarah@example.com","password":"ChooseAStrongPassword123!","role":"bookkeeper"}
```

Login result-এর `data.accessToken`-কে `Authorization: Bearer <token>` header-এ পাঠাবেন। `data.user._id` User ID; `POST /bookkeeper` response-এর `_id` profile ID। Request bookkeeper profile ID নেয়; engagement/review-এর participant ID User ID। এই ID-গুলো পরস্পর বদলাবেন না।

OTP verify-এর পরে password reset:

```json
{"email":"sarah@example.com","newPassword":"AnotherStrongPassword123!","resetToken":"value-returned-by-verify"}
```

Reset token ১০ মিনিট বৈধ এবং একবার ব্যবহারযোগ্য। নতুন OTP পাঠালে আগের proof বাতিল। resend-এর মাঝে ৬০ সেকেন্ড; ৫টি ভুল OTP-এর পরে নতুন OTP লাগবে। Password change/reset আগের access এবং refresh token বাতিল করে; আবার login করাবেন।

Quiz submission (প্রতিটি question একবার; score client থেকে নেবে না):

```json
{"answers":[{"quizId":"actual-question-object-id","answer":"Assets = Liabilities + Equity"}]}
```

Pass threshold বর্তমানে ৮০% implementation default। Lesson order মানতে হবে। `POST /.../complete` করতে quiz থাকলে pass লাগবে।

Message send: `{"text":"Can we review the accounts?"}`। History newest-first, ৫০টি; পুরনো পেজের জন্য `?before=<oldestDisplayedMessageId>`। UI-তে chronological দেখাতে reverse করুন। Read request: `{"through":"newestDisplayedMessageId"}`; পরে আসা message unread থাকবে। REST polling আছে; WebSocket নেই।

CMS save example:

```json
{"published":true,"sections":[{"key":"hero","title":"The bookkeeper your business needs","description":"Connect with vetted professionals","items":[]},{"key":"faq","title":"Questions","items":[{"title":"How do I apply?","description":"Create your account and complete your application."}]}]}
```

সমর্থিত field: section `key/title/description/imageUrl/items`; item `title/description/imageUrl/linkUrl`। Image/link URL HTTPS হতে হবে। Public page তৈরি হওয়ার আগে 404 স্বাভাবিক। Content plain text হিসেবে render করবেন।

সাধারণ response:

```json
{"statusCode":200,"success":true,"message":"...","meta":{"page":1,"limit":10,"total":1},"data":[]}
```

`GET /course` course summaries দেয়; lesson content পেতে আগে enroll করে `GET /course/:courseId` ব্যবহার করুন। Dashboard training-এ answer key পাঠানো হয় না।

List-এর সর্বোচ্চ limit ১০০। error-এর HTTP status ও `errorSources` দেখুন। 401 → login/refresh; 403 → role/ownership/payment gate; 409 → duplicate বা invalid workflow state। Secret/recovery fields response থেকে সরানো হয়। Contact details public profile থেকে লুকানো থাকে; payment-complete engagement-এর `/contacts` দিয়ে নেবেন।

## Complete engagement manual test

1. Business ও bookkeeper account/profile তৈরি এবং admin approval দিন।
2. Business bookkeeper profile ID দিয়ে request করে; bookkeeper accept করে।
3. Admin meeting schedule করে; meeting completion record করুন।
4. Admin `POST /engagement`: meetingId, projectTitle, projectDetails, contractText, projectValue (USD), businessAgreed=true, bookkeeperAgreed=true। Existing policy: ১০% platform fee backend হিসাব করে।
5. Payment-এর আগে contacts/messages → 403 নিশ্চিত করুন।
6. Bookkeeper sign → business sign। উল্টো order বা পুনরায় sign reject হবে।
7. Stripe test keys ব্যবহার করে payment শুরু ও Stripe.js confirmation দিন। Local webhook forwarding: `stripe listen --forward-to localhost:3000/api/v1/webhook`। CLI-এর signing secret `.env`-এ বসান।
8. Valid success webhook-এর পরে status=active, paymentStatus=paid, contacts/messages খোলে। অন্য user-এর access এখনও 403 হওয়া চাই।
9. Business/admin complete করে; তারপর participant review দেয়।

## Production verification এখনও যা দরকার

এগুলো পাস না হওয়া পর্যন্ত client-কে পুরো production acceptance completed বলবেন না:

- Stripe test-mode বাস্তব confirmation, invalid signature, retry/out-of-order webhook; তারপর live configuration। এই কাজের automated suite টাকা নেয় না।
- SMTP OTP delivery এবং S3 upload/access policy, file limits, PDF/certificate download বাস্তবে যাচাই।
- Figma-র assessed tiers ও adaptive assessment policy, pass threshold/retake policy নিশ্চিত করা। এখানে LMS quiz ৮০% default; tiers/mentorship-এর পূর্ণ workflow নেই।
- Paid course checkout এখনও নেই; price>0 course-এর free enroll বন্ধ করে 409 দেওয়া হয়। Subscription ও placement payment আলাদা existing flows।
- Assignment upload এবং admin score/feedback review আছে; certificate-এর জন্য assignment pass বাধ্যতামূলক করার business policy আলাদাভাবে নির্ধারণ করতে হবে।
- CMS ordered sections সমর্থন করে; full revision/publish staging, dedicated video/metric/testimonial field models নেই।
- Dashboard বাস্তব data দেয়; সব decorative card/percentage বা Figma-র demo number হুবহু বানানো হয় না। Inbox/contract/recent lists bounded; বড় dataset-এ paging/aggregation উন্নয়ন দরকার।
- Session version password change/reset-এ invalidate হয়; logout cookie সরায়, independent stolen refresh-token session revocation এখনো নেই। Distributed login rate limiting, monitoring, backup/restore, load testing এবং deployment review দরকার।
- নতুন unique index বসানোর আগে existing Businesswoner ও CourseEnrollment duplicate data audit করুন; production data এই কাজের সময় migrate/delete করা হয়নি।

## Code সহজে বাড়ানোর নিয়ম

`dto` = frontend কী পাঠাতে পারবে ও validation/Swagger; `controller` = URL/role/HTTP; `service` = business rules/query; `entity` = MongoDB shape/index; `module` = dependency registration। নতুন screen এলে প্রথমে DTO, তারপর service, controller, module যোগ করুন। Public DTO-তে role/status/OTP/private payment state দেবেন না।

নতুন route যোগ হলে `npm run docs:api` চালিয়ে inventory update করুন। নতুন business rule-এর regression test দিন; `npm run check` এবং `npm run test:integration` চালান। Figma token source/env/docs-এ রাখা হয়নি।
