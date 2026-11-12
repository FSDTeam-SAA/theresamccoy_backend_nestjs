# API route reference

Generated with `npm run docs:api`. Base path: `/api/v1`. Request examples, validation and multipart file names are in Swagger at `/api/docs`; import `/api/docs-json` directly into Postman.

For `Public` routes no login is required. Other rows list allowed account roles. IDs in URLs are MongoDB IDs. Existing `businesswoner` spelling is preserved for frontend compatibility.

| Method | Path | Access | Body DTO |
|---|---|---|---|
| POST | `/api/v1/admin/application-forms` | admin | CreateApplicationFormDto |
| GET | `/api/v1/admin/application-forms` | admin | — |
| GET | `/api/v1/admin/application-forms/:id` | admin | — |
| PATCH | `/api/v1/admin/application-forms/:id` | admin | UpdateApplicationFormDto |
| PATCH | `/api/v1/admin/application-forms/:id/publish` | admin | — |
| DELETE | `/api/v1/admin/application-forms/:id` | admin | — |
| GET | `/api/v1/admin/application-submissions` | admin | — |
| GET | `/api/v1/admin/application-submissions/:id` | admin | — |
| PATCH | `/api/v1/admin/application-submissions/:id/review` | admin | ReviewApplicationDto |
| GET | `/api/v1/applications/forms/published` | bookkeeper | — |
| GET | `/api/v1/applications/form/:formId` | bookkeeper | — |
| POST | `/api/v1/applications/save` | bookkeeper | CreateSubmissionDto |
| GET | `/api/v1/applications/my/:formId` | bookkeeper | — |
| PATCH | `/api/v1/applications/:submissionId/submit` | bookkeeper | — |
| POST | `/api/v1/auth/register` | Public | CreateAuthDto |
| POST | `/api/v1/auth/login` | Public | LoginAuthDto |
| POST | `/api/v1/auth/refresh` | Public | — |
| POST | `/api/v1/auth/logout` | Public | — |
| POST | `/api/v1/auth/forgot-password` | Public | ForgotPasswordDto |
| POST | `/api/v1/auth/verify` | Public | VerifyEmailDto |
| POST | `/api/v1/auth/reset-password` | Public | ResetPasswordDto |
| POST | `/api/v1/auth/change-password` | bookkeeper, business, admin | ChangePasswordDto |
| POST | `/api/v1/bookkeeper` | bookkeeper | CreateBookkeeperDto |
| POST | `/api/v1/bookkeeper/:id/experience` | bookkeeper, admin | CreateExperienceDto |
| POST | `/api/v1/bookkeeper/:id/skills` | bookkeeper, admin | CreateBookkeeperSkillsDto |
| POST | `/api/v1/bookkeeper/:id/assessment` | bookkeeper, admin | CreateBookkeeperAssessmentDto |
| POST | `/api/v1/bookkeeper/:id/availability` | bookkeeper, admin | CreateBookkeeperAvailabilityDto |
| GET | `/api/v1/bookkeeper` | Public | — |
| GET | `/api/v1/bookkeeper/admin/all` | admin | — |
| GET | `/api/v1/bookkeeper/profile/me` | bookkeeper | — |
| PATCH | `/api/v1/bookkeeper/:id/review` | admin | ReviewBookkeeperDto |
| PATCH | `/api/v1/bookkeeper/profile/me` | bookkeeper | UpdateMyBookkeeperProfileDto |
| POST | `/api/v1/bookkeeper/profile/me/application/submit` | bookkeeper | — |
| GET | `/api/v1/bookkeeper/:id` | Public | — |
| PATCH | `/api/v1/bookkeeper/:id` | bookkeeper, admin | UpdateBookkeeperDto |
| DELETE | `/api/v1/bookkeeper/:id` | bookkeeper, admin | — |
| POST | `/api/v1/businesswoner` | business | CreateBusinesswonerDto |
| GET | `/api/v1/businesswoner` | admin | — |
| GET | `/api/v1/businesswoner/profile/me` | business | — |
| PATCH | `/api/v1/businesswoner/profile/me` | business | UpdateBusinesswonerDto |
| GET | `/api/v1/businesswoner/:id` | admin | — |
| PATCH | `/api/v1/businesswoner/:id/approve` | admin | — |
| PATCH | `/api/v1/businesswoner/:id/reject` | admin | — |
| PUT | `/api/v1/businesswoner/:id` | admin | UpdateBusinesswonerDto |
| DELETE | `/api/v1/businesswoner/:id` | admin | — |
| POST | `/api/v1/certificate` | admin | CreateCertificateDto |
| GET | `/api/v1/certificate` | admin, bookkeeper | — |
| GET | `/api/v1/certificate/:id` | admin, bookkeeper | — |
| PUT | `/api/v1/certificate/:id` | admin | UpdateCertificateDto |
| DELETE | `/api/v1/certificate/:id` | admin | — |
| POST | `/api/v1/contact` | Public | CreateContactDto |
| GET | `/api/v1/contact` | admin | — |
| GET | `/api/v1/contact/:id` | admin | — |
| PUT | `/api/v1/contact/:id` | admin | UpdateContactDto |
| DELETE | `/api/v1/contact/:id` | admin | — |
| GET | `/api/v1/content/:slug` | Public | — |
| GET | `/api/v1/content/admin/:slug` | admin | — |
| PUT | `/api/v1/content/admin/:slug` | admin | UpdatePageContentDto |
| POST | `/api/v1/course` | admin | CreateCourseDto |
| GET | `/api/v1/course` | admin, business, bookkeeper | — |
| GET | `/api/v1/course/catalog/public` | Public | — |
| GET | `/api/v1/course/my/overview` | bookkeeper | — |
| GET | `/api/v1/course/my/all` | bookkeeper | — |
| GET | `/api/v1/course/enrollments/me` | bookkeeper | — |
| GET | `/api/v1/course/enrollments/all` | admin | — |
| GET | `/api/v1/course/admin/assignments` | admin | — |
| PATCH | `/api/v1/course/admin/assignments/:id/review` | admin | ReviewAssignmentDto |
| GET | `/api/v1/course/:courseId` | admin, business, bookkeeper | — |
| PATCH | `/api/v1/course/:courseId` | admin | UpdateCourseDto |
| DELETE | `/api/v1/course/:courseId` | admin | — |
| POST | `/api/v1/course/:courseId/module` | admin | AddModuleDto |
| POST | `/api/v1/course/:courseId/enroll` | bookkeeper | — |
| PATCH | `/api/v1/course/:courseId/module/:moduleId` | admin | UpdateModuleDto |
| DELETE | `/api/v1/course/:courseId/module/:moduleId` | admin | — |
| POST | `/api/v1/course/:courseId/module/:moduleId/lesson` | admin | AddLessonDto |
| PATCH | `/api/v1/course/:courseId/lesson/:lessonId` | admin | UpdateLessonDto |
| DELETE | `/api/v1/course/:courseId/module/:moduleId/lesson/:lessonId` | admin | — |
| POST | `/api/v1/course/:courseId/lesson/:lessonId/quiz` | admin | AddQuizDto |
| POST | `/api/v1/course/:courseId/quiz/:quizId/option` | admin | AddQuizOptionDto |
| POST | `/api/v1/course/:courseId/lesson/:lessonId/quiz/submit` | bookkeeper | SubmitQuizDto |
| GET | `/api/v1/course/:courseId/quiz-attempts/me` | bookkeeper | — |
| POST | `/api/v1/course/:courseId/lesson/:lessonId/complete` | bookkeeper | — |
| GET | `/api/v1/course/:courseId/progress` | bookkeeper | — |
| POST | `/api/v1/course/:courseId/lesson/:lessonId/assignment` | bookkeeper | — |
| GET | `/api/v1/course/:courseId/submissions/me` | bookkeeper | — |
| GET | `/api/v1/dashboard/me` | business, bookkeeper | — |
| GET | `/api/v1/dashboard/overview` | admin | — |
| GET | `/api/v1/dashboard/chart` | admin | — |
| POST | `/api/v1/engagement` | admin | CreateEngagementDto |
| GET | `/api/v1/engagement` | admin, business, bookkeeper | — |
| GET | `/api/v1/engagement/inbox/me` | business, bookkeeper | — |
| PATCH | `/api/v1/engagement/:id/messages/read` | business, bookkeeper | ReadMessagesDto |
| GET | `/api/v1/engagement/:id` | admin, business, bookkeeper | — |
| POST | `/api/v1/engagement/:id/sign` | bookkeeper, business | SignEngagementDto |
| POST | `/api/v1/engagement/:id/payment` | business | — |
| GET | `/api/v1/engagement/:id/contacts` | bookkeeper, business | — |
| POST | `/api/v1/engagement/:id/messages` | bookkeeper, business | SendMessageDto |
| GET | `/api/v1/engagement/:id/messages` | bookkeeper, business | — |
| PATCH | `/api/v1/engagement/:id/complete` | business, admin | — |
| GET | `/api/v1/match-bookkeepers` | business | — |
| POST | `/api/v1/meeting-schedule/:requestId` | admin | CreateMeetingScheduleDto |
| GET | `/api/v1/meeting-schedule/my-schedules` | business, bookkeeper | — |
| GET | `/api/v1/meeting-schedule` | admin | — |
| GET | `/api/v1/meeting-schedule/:id` | admin | — |
| PATCH | `/api/v1/meeting-schedule/:id` | admin | CreateMeetingScheduleDto |
| DELETE | `/api/v1/meeting-schedule/:id` | admin | — |
| PATCH | `/api/v1/meeting-schedule/:id/status` | admin, business, bookkeeper | ChangeMeetingStatusDto |
| POST | `/api/v1/payment/:subscribeId` | business, bookkeeper | — |
| GET | `/api/v1/payment` | admin | — |
| GET | `/api/v1/payment/me/history` | business, bookkeeper | — |
| GET | `/api/v1/payment/:id` | admin | — |
| GET | `/api/v1/request` | admin, admin | — |
| POST | `/api/v1/request/:bookkeeperId` | business | — |
| GET | `/api/v1/request/my-requests` | bookkeeper, business | — |
| PATCH | `/api/v1/request/accept/:requestId` | bookkeeper | — |
| PATCH | `/api/v1/request/reject/:requestId` | bookkeeper | — |
| GET | `/api/v1/request/:id` | admin | — |
| POST | `/api/v1/reviews` | business, bookkeeper | CreateReviewDto |
| GET | `/api/v1/reviews/me` | bookkeeper, business | — |
| GET | `/api/v1/reviews/user/:userId` | Public | — |
| POST | `/api/v1/subscribe` | admin | CreateSubscribeDto |
| GET | `/api/v1/subscribe` | Public | — |
| GET | `/api/v1/subscribe/:id` | Public | — |
| PATCH | `/api/v1/subscribe/:id` | admin | UpdateSubscribeDto |
| DELETE | `/api/v1/subscribe/:id` | admin | — |
| GET | `/api/v1/support/me` | business, bookkeeper | — |
| GET | `/api/v1/support/me/unread` | business, bookkeeper | — |
| POST | `/api/v1/support/me` | business, bookkeeper | SendMessageDto |
| PATCH | `/api/v1/support/me/read` | business, bookkeeper | ReadMessagesDto |
| GET | `/api/v1/support/admin/inbox` | admin | — |
| GET | `/api/v1/support/admin/:userId` | admin | — |
| POST | `/api/v1/support/admin/:userId` | admin | SendMessageDto |
| PATCH | `/api/v1/support/admin/:userId/read` | admin | ReadMessagesDto |
| POST | `/api/v1/user` | admin | CreateUserDto |
| GET | `/api/v1/user` | admin | — |
| GET | `/api/v1/user/profile` | admin, business, bookkeeper | — |
| PUT | `/api/v1/user/profile` | admin, business, bookkeeper | UpdateMyUserProfileDto |
| GET | `/api/v1/user/:id` | admin | — |
| PUT | `/api/v1/user/:id` | admin | UpdateUserDto |
| DELETE | `/api/v1/user/:id` | admin | — |
| POST | `/api/v1/webhook` | Public | — |
| GET | `/` | Public | — |
