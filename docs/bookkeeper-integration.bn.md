# Bookkeeper frontend handoff — Figma অনুযায়ী

Frontend developer প্রথমে এই guide এবং [OpenAPI JSON](openapi.json) নেবেন। Running backend-এ **`/api/docs`**-এ Swagger Try it out; **`/api/docs-json`**-এ importable OpenAPI। Postman-এ JSON file বা URL import করুন। Route inventory [এখানে](api-reference.md)। এই guide bookkeeper screen-এর field mapping দেয়; পুরনো generic README-এর বদলে current Swagger contract ব্যবহার করুন।

## Authentication ও ID

Base: `http://localhost:3000/api/v1` অথবা deployed backend-এর `/api/v1`। Bookkeeper register করে login করুন; `data.accessToken` দিয়ে `Authorization: Bearer <token>` দিন। Swagger Authorize-এ শুধু token দিন।

`GET /user/profile`-এর `_id` account/User ID। `POST /bookkeeper`-এর `_id` bookkeeper profile ID। Profile, request এবং certificate-এর bookkeeperId profile ID; engagement participant/review-এর ID User ID।

## Screen অনুযায়ী endpoint

| Figma screen | API / data |
|---|---|
| Dashboard (`1:18580`) | `GET /dashboard/me`: profile, marketplaceStatus, profileCompletion.percentage/items, assessmentScore, assessments, learning, unreadMessages, recentMessages, contracts, activeEngagements |
| Profile & Skills (`1:20510`) | `GET /bookkeeper/profile/me`, `PATCH /bookkeeper/profile/me`; JSON অথবা multipart গ্রহণ করে, files থাকলে multipart |
| Application (`1:22070`) | একই profile PATCH-এ application details/documents save; তারপর `POST /bookkeeper/profile/me/application/submit` |
| Assessment cards (`1:18901`) | `GET /applications/forms/published`: title, durationMinutes, locked, assessmentStatus, submissionId, score |
| Assessment form (`1:19831`) | `GET /applications/form/:formId`; response-এর sections/questions/options/subQuestions/table rows অনুসারে form render |
| Assessment draft / submit | `POST /applications/save`, `GET /applications/my/:formId`, `PATCH /applications/:submissionId/submit` |
| Courses (`1:18950`) | `GET /course/my/overview`: completedCourses, remainingLessons, currentCourse, courses; `GET /course/my/all`-এ course content + progress |
| Modules & Lessons (`1:20839`) | `GET /course/:courseId`, `GET /course/:courseId/progress`; response nextLessonId/currentModule/remainingMinutes দিয়ে resume button |
| Quiz | lesson.quizzes থেকে question/options render; `POST /course/:courseId/lesson/:lessonId/quiz/submit`; `GET /course/:courseId/quiz-attempts/me` |
| Lesson complete | quiz থাকলে pass-এর পরে `POST /course/:courseId/lesson/:lessonId/complete`; পূর্বের lesson শেষ করা আবশ্যক |
| Assignments (`1:21112`) | course lesson-এর assignmentTitle/Instructions/DueDate; `POST /course/:courseId/lesson/:lessonId/assignment` multipart `file`; `GET /course/:courseId/submissions/me` |
| Resources (`1:21234`) | enrolled course detail-এর প্রতিটি lesson.resource; video=lesson.video, thumbnail=lesson.thumbnail |
| Certificates (`1:19123`, `1:20421`) | `GET /certificate`, `GET /certificate/:id`; response certificateUrl দিয়ে PDF preview/download। Pending হলে certificateUrl থাকবে না |
| Engagement / signing (`1:19258`, `1:20977`) | `GET /engagement`, `GET /engagement/:id`, `POST /engagement/:id/sign` body `{ "signature":"Sarah Chen", "accepted":true }` |
| Interview (`1:19431`, `1:20790`) | `GET /meeting-schedule/my-schedules`; date, time, meetingLink, meetingNote, status |
| Requests | `GET /request/my-requests`, `PATCH /request/accept/:requestId`, `PATCH /request/reject/:requestId` |
| Messages (`1:19512`) | `GET /engagement/inbox/me`; `GET/POST /engagement/:id/messages`; `PATCH /engagement/:id/messages/read` |
| Platform support | `GET/POST /support/me`; `GET /support/me/unread`; `PATCH /support/me/read` |
| Reviews (`1:19655`) | `GET /reviews/me`: data=received reviews, meta=averageRating/totalReviews; `POST /reviews` completed engagement-এর পরে |
| Settings (`1:19588`, `1:20442`) | account `GET /user/profile`, safe fields `PUT /user/profile`; bookkeeper-specific personal/email changes `PATCH /bookkeeper/profile/me`; `POST /auth/change-password` |

## প্রথম profile তৈরি

`POST /bookkeeper` JSON:

```json
{"firstName":"Sarah","lastName":"Chen","email":"sarah@example.com","city":"Sydney","state":"NSW"}
```

Duplicate profile create করলে 409। ফিরে পাওয়া profile ID ধরে legacy onboarding steps ব্যবহার করা যায়; নতুন Profile & Skills এবং Application screen-এর জন্য `/profile/me` path-ই সহজ।

## Profile & Application save (multipart)

`PATCH /bookkeeper/profile/me`:

| Field | কী পাঠাবেন |
|---|---|
| firstName / lastName | Full name split করে আলাদা field |
| email / phoneNumber | নিজের contact details |
| city / state | Location split করে field |
| professionalTitle / professionalBio | text |
| yearsOfExperience / hourlyRate / projectsCompleted | number; multipart-এ numeric text-ও চলে |
| availability | যেমন Full-time |
| educationalQualification | যেমন Bachelor of Business Administration |
| languages | JSON string: `["English","Mandarin"]` |
| skills | JSON string: `["Xero","Payroll"]` |
| specializations | JSON string: `["Retail","E-commerce"]` |
| certifications | JSON string: `[{"title":"Xero Advisor","year":2024}]` |
| portfolio | JSON string: `[{"title":"Shopify setup","description":"Reconciliation","department":"Retail"}]` |
| uploadResume | PDF file |
| coverLetter | optional PDF file |
| certificationFiles | PDF files, certifications array-এর একই index/order |
| portfolioFiles | PDF files, portfolio array-এর একই index/order |
| profilePicture | image file |

Swagger-এ arrays-এর জন্য JSON text input এবং files-এর জন্য Choose file দেওয়া আছে। মোট file count/size configured `AWS_MAX_FILES`/`AWS_MAX_FILE_SIZE_MB` সীমার মধ্যে রাখতে হবে। Certification/portfolio array replace হয়; আগের file রাখতে item-এর `fileUrl` পুনরায় পাঠাবেন। `[]` পাঠালে array খালি হবে।

Frontend example:

```js
const body = new FormData();
body.set('yearsOfExperience', '6');
body.set('educationalQualification', 'Bachelor of Business Administration');
body.set('skills', JSON.stringify(['Xero', 'Payroll']));
body.set('certifications', JSON.stringify([{title: 'Xero Advisor', year: 2024}]));
body.append('uploadResume', resumeFile);
body.append('certificationFiles', certificatePdf);
await fetch(`${apiBase}/bookkeeper/profile/me`, {
  method: 'PATCH', headers: {Authorization: `Bearer ${token}`}, body
});
// FormData-র Content-Type নিজে set করবেন না; browser boundary যোগ করবে।
```

এরপর body ছাড়া `POST /bookkeeper/profile/me/application/submit`। Required: resume, অন্তত একটি skill, yearsOfExperience (০ valid), educationalQualification। Missing fields → 400; duplicate pending submission → 409; সফল হলে `applicationStatus=submitted`, `status=pending`, timestamp দেওয়া হয়। Admin `/bookkeeper/:profileId/review` দিয়ে approve/reject করবে। Rejected application সংশোধন করে আবার submit করা যায়। Public marketplace-এ শুধু approved profile দেখা যায়।

## Assessment status ও locking

Admin form তৈরি করার সময় `durationMinutes` এবং optional `prerequisiteFormId` দিতে পারে। পূর্বের form-এর submission **approved** হলে পরের form unlock হয়। শুধু screen button disable করা নয়—locked form open, draft save এবং final submit-ও server আটকায়। Prerequisite cycle invalid। কোনো prerequisite না দিলে assessment available।

Assessment duration বর্তমানে estimate; enforced timer নয়। Form assessment scoring admin-reviewed; LMS lesson quiz স্বয়ংক্রিয় scoring। এগুলো আলাদা flow। Dashboard assessmentScore reviewed/approved/rejected submission-এর সর্বশেষ score; review না হলে null, demo score দেওয়া হয় না।

Draft save-এ `candidateName`, `date` (ISO), `positionName`, `time`, `formId`, `answers` পাঠাবেন। Question/subquestion/row ID actual form response থেকে নেবেন। Form বদলে version বাড়লে UI নতুন structure fetch করবে।

## Courses / progress

`GET /course` browsing summaries। Full lesson content-এর জন্য আগে free course-এ `POST /course/:courseId/enroll`; enrolled detail `GET /course/:courseId`। `nextLessonId=null` হলে সব lesson complete। `currentModule`-এ id/name/number; remainingMinutes থেকে frontend human-readable time দেখাবে। Completion সংখ্যা backend থেকে আসবে; Figma-র 72% বা demo dates hardcode করবেন না।

Quiz request:

```json
{"answers":[{"quizId":"actual-mongodb-id","answer":"the selected option text"}]}
```

সব question একবার করে পাঠাতে হবে। Backend correctAnswers, totalQuestions, score, passed দেয়; ৮০% pass। Assignment upload PDF ব্যবহার করুন; admin review-এর পরে submissions-এ status=reviewed, score, feedback পাওয়া যাবে।

## Messages / contracts / reviews

Contract bookkeeper আগে sign করে; business পরে। Payment webhook verified না হওয়া পর্যন্ত client contacts/messages locked (403)। Support thread payment ছাড়াই খোলে। Send: `{"text":"Hello"}`। History newest-first, ৫০টি; `?before=<oldestDisplayedId>` দিয়ে আগের page। Read: `{"through":"newestDisplayedMessageId"}`। REST polling, WebSocket নয়।

Reviews create: `{"engagementId":"actual-id","rating":5,"comment":"Great collaboration"}`। Only completed engagement-এর participants; দ্বিতীয় review 409। Received reviews `GET /reviews/me`; summary `meta`-তে।

শেষ verification: build, targeted ESLint এবং মোট ৫০টি test পাস (৩১ unit, ৮ HTTP, ১১ MongoDB integration)।

## Swagger / testing / handoff

- Swagger UI: `/api/docs`। OpenAPI URL: `/api/docs-json`। File: [openapi.json](openapi.json)।
- `npm run check`: build + unit + mocked HTTP tests।
- `npm run test:integration`: isolated MongoDB-তে real HTTP/persistence tests; configured database ব্যবহার করে না। S3 upload test-এ mocked; Stripe payment activation simulated।
- `npm run docs:openapi`: isolated app থেকে current Swagger JSON export এবং contract validation।
- `npm run docs:api`: route inventory/Postman route collection regenerate।

Swagger export-এ request fields, authentication, path IDs, standard success/error envelopes ও bookkeeper profile response schema আছে। Flexible form fields এবং অন্য module-এর কিছু response data generic: এই screen map ও actual response দেখে use করবেন; generated client সব field infer করবে ধরে নেবেন না।

**বাকি production acceptance:** বাস্তব SMTP/S3/Stripe test, paid-course checkout, adaptive tier/mentoring rules, distributed rate limiting/session management এবং load test। এই scope-এ bookkeeper screen-এর ওপরের flowগুলো implemented ও tested; সব external service production verified বলে দাবি করা হয়নি।
