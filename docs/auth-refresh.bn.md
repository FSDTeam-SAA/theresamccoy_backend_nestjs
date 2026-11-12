# Login, refresh ও Swagger ব্যবহার

Swagger `/api/docs`-এ login **Execute** করলে response-এর `data.accessToken` স্বয়ংক্রিয়ভাবে Authorize হয়। Protected request-এর access token expired হলে Swagger আগে `/api/v1/auth/refresh` call করে, নতুন access token দিয়ে request পাঠায়। Cookie valid থাকলে আবার login লাগবে না। Refresh cookie expired/invalid হলে login লাগবে। Logout করলে Swagger authorization এবং refresh cookie clear হয়।

Refresh token login-এর JSON body-তে দেওয়া হয় না। Server `Set-Cookie` header দিয়ে `HttpOnly` `refreshToken` cookie দেয়; browser/Postman cookie jar সেটি রাখে। Browser JavaScript এটি পড়তে পারে না, কিন্তু request-এ পাঠাতে পারে। Cookie lifetime signed refresh JWT-এর expiration অনুযায়ী।

Frontend-এর API client-এ **login এবং refresh দুটোতেই** credentials পাঠাতে হবে:

```js
const loginResponse = await fetch(`${apiBase}/auth/login`, {
  method: 'POST', credentials: 'include',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email, password})
});
const login = await loginResponse.json();
let accessToken = login.data.accessToken;

// Access token expired হলে, অথবা protected endpoint থেকে 401 পেলে:
const refreshResponse = await fetch(`${apiBase}/auth/refresh`, {
  method: 'POST', credentials: 'include'
});
if (!refreshResponse.ok) {
  // 401 হলে session expired: login screen দেখান। Network error হলে retry UI দিন।
} else {
  accessToken = (await refreshResponse.json()).data.accessToken;
  // Original request একবার retry করুন নতুন Authorization header দিয়ে।
}
```

Axios হলে client-এ `withCredentials: true` দিন। Refresh call-এ access token বা JSON refreshToken field লাগবে না। Frontend-এ central interceptor দিয়ে refresh + original request retry একবার করুন; একাধিক concurrent 401 হলে একই pending refresh promise reuse করুন। Swagger-এর interceptor শুধু Swagger UI-এর জন্য; frontend app-এর API client-এ একই আচরণ বসাতে হবে।

Default cookie SameSite=Lax, Path=/; production-এ Secure। Frontend/backend যদি আলাদা site-এ থাকে, production HTTPS-এ `REFRESH_COOKIE_SAME_SITE=none`, নির্দিষ্ট `CORS_ORIGIN`, এবং credentials:true ব্যবহার করুন। Browser-এর third-party-cookie policy এখনও প্রযোজ্য; একই site বা frontend proxy ব্যবহার করা সবচেয়ে নির্ভরযোগ্য। HTTP development-এর জন্য `NODE_ENV=development` ও SameSite=Lax রাখুন। `.env.example`-এ setting দেওয়া আছে; existing `.env` স্বয়ংক্রিয়ভাবে বদলানো হয়নি।

Swagger-এর generic 200/400/401/403/404/409 examples সরানো হয়েছে। এটি documentation UI-এর পরিবর্তন; আসল JSON response বা error behavior বদলায়নি। Request DTO এবং multipart fields আগের মতো আছে।
