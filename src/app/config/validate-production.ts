/** Fail before opening a database connection if production credentials are unsafe. */
export function validateProductionEnvironment(env: NodeJS.ProcessEnv) {
  if (env.NODE_ENV !== 'production') return;
  for (const key of ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET']) {
    const value = env[key];
    if (!value || value.length < 32 || /change-me|replace-with/i.test(value)) {
      throw new Error(
        `${key} must be a unique random secret of at least 32 characters`,
      );
    }
  }
  if (env.ACCESS_TOKEN_SECRET === env.REFRESH_TOKEN_SECRET) {
    throw new Error('Access and refresh token secrets must differ');
  }
  if (!env.MONGO_URI) throw new Error('MONGO_URI is required in production');
  if (!env.CORS_ORIGIN || env.CORS_ORIGIN === '*') {
    throw new Error('Set explicit CORS_ORIGIN values in production');
  }
}
