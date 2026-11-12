import type { CookieOptions } from 'express';
import config from '../../config';

/** Shared attributes ensure login and logout refer to the same cookie. */
export function refreshCookieOptions(): CookieOptions {
  const sameSite = config.jwt.refreshCookieSameSite;
  if (sameSite === 'none' && config.env !== 'production') {
    throw new Error(
      'REFRESH_COOKIE_SAME_SITE=none requires production HTTPS cookies',
    );
  }
  return {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite,
    path: '/',
  };
}
