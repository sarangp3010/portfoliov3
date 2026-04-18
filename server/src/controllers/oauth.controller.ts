/**
 * oauth.controller.ts
 *
 * Manual OAuth 2.0 implementation for Google and GitHub.
 * No Passport.js — uses native fetch for token exchange.
 *
 * Flow:
 *   1. GET /api/customer/auth/google          → redirect to Google consent page
 *   2. GET /api/customer/auth/google/callback → exchange code, get profile, create session
 *   3. Redirect browser to customer portal with JWT in URL fragment/query
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { oauthLogin } from '../services/customer.service.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function redirectError(res: Response, message: string) {
  const url = new URL(config.oauth.errorRedirect);
  url.searchParams.set('error', message);
  return res.redirect(url.toString());
}

function redirectSuccess(res: Response, token: string, sessionToken: string) {
  const url = new URL(config.oauth.successRedirect);
  url.searchParams.set('token', token);
  url.searchParams.set('session', sessionToken);
  return res.redirect(url.toString());
}

// In-memory CSRF state store (sufficient for stateless deployments — expires after 10 min)
const stateStore = new Map<string, number>();

function generateState(): string {
  const state = crypto.randomBytes(24).toString('hex');
  stateStore.set(state, Date.now() + 10 * 60 * 1000);
  return state;
}

function validateState(state: string): boolean {
  const exp = stateStore.get(state);
  if (!exp || Date.now() > exp) return false;
  stateStore.delete(state);
  return true;
}

// Prune expired states periodically
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of stateStore.entries()) {
    if (now > v) stateStore.delete(k);
  }
}, 5 * 60 * 1000);

// ─── Google ───────────────────────────────────────────────────────────────────

export const googleAuth = (req: Request, res: Response): void => {
  const { clientId, callbackUrl } = config.oauth.google;

  if (!clientId) {
    res.status(503).json({
      success: false,
      error: 'Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.',
    });
    return;
  }

  const state = generateState();
  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  callbackUrl,
    response_type: 'code',
    scope:         'openid email profile',
    access_type:   'online',
    prompt:        'select_account',
    state,
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};

export const googleCallback = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) return void redirectError(res, 'Google sign-in was cancelled or denied.');
  if (!code || !state || !validateState(state)) return void redirectError(res, 'Invalid OAuth state. Please try again.');

  const { clientId, clientSecret, callbackUrl } = config.oauth.google;

  try {
    // 1. Exchange authorization code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  callbackUrl,
        grant_type:    'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenRes.ok || !tokenData.access_token) {
      logger.error('[oauth/google] Token exchange failed:', tokenData.error);
      return void redirectError(res, 'Failed to authenticate with Google. Please try again.');
    }

    // 2. Fetch user profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileRes.json() as {
      id?: string; email?: string; name?: string; picture?: string; verified_email?: boolean;
    };

    if (!profile.id || !profile.email) {
      return void redirectError(res, 'Could not retrieve your Google profile. Please try again.');
    }

    // 3. Create or link account
    const ip = req.ip || undefined;
    const ua = req.headers['user-agent'] || undefined;

    const result = await oauthLogin({
      provider:   'google',
      providerId: profile.id,
      email:      profile.email,
      name:       profile.name || profile.email.split('@')[0],
      avatarUrl:  profile.picture || undefined,
    }, ip, ua);

    return void redirectSuccess(res, result.token, result.sessionToken);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[oauth/google] Error:', msg);
    return void redirectError(res, msg.includes('deactivated') ? msg : 'Google authentication failed. Please try again.');
  }
};

// ─── GitHub ───────────────────────────────────────────────────────────────────

export const githubAuth = (req: Request, res: Response): void => {
  const { clientId, callbackUrl } = config.oauth.github;

  if (!clientId) {
    res.status(503).json({
      success: false,
      error: 'GitHub OAuth is not configured. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to your .env file.',
    });
    return;
  }

  const state = generateState();
  const params = new URLSearchParams({
    client_id:    clientId,
    redirect_uri: callbackUrl,
    scope:        'read:user user:email',
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
};

export const githubCallback = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) return void redirectError(res, 'GitHub sign-in was cancelled or denied.');
  if (!code || !state || !validateState(state)) return void redirectError(res, 'Invalid OAuth state. Please try again.');

  const { clientId, clientSecret, callbackUrl } = config.oauth.github;

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id:     clientId,
        client_secret: clientSecret,
        code,
        redirect_uri:  callbackUrl,
      }),
    });

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenRes.ok || !tokenData.access_token) {
      logger.error('[oauth/github] Token exchange failed:', tokenData.error);
      return void redirectError(res, 'Failed to authenticate with GitHub. Please try again.');
    }

    // 2. Fetch user profile
    const [profileRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'portfolio-app' },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'portfolio-app' },
      }),
    ]);

    const profile = await profileRes.json() as {
      id?: number; login?: string; name?: string; email?: string | null; avatar_url?: string;
    };

    // GitHub may not expose email in profile — fetch from emails endpoint
    let email = profile.email;
    if (!email && emailsRes.ok) {
      const emails = await emailsRes.json() as { email: string; primary: boolean; verified: boolean }[];
      const primary = emails.find(e => e.primary && e.verified) ?? emails.find(e => e.verified);
      email = primary?.email ?? null;
    }

    if (!profile.id || !email) {
      return void redirectError(res, 'Could not retrieve your GitHub email. Make sure your GitHub email is public or verified.');
    }

    const ip = req.ip || undefined;
    const ua = req.headers['user-agent'] || undefined;

    const result = await oauthLogin({
      provider:   'github',
      providerId: String(profile.id),
      email,
      name:       profile.name || profile.login || email.split('@')[0],
      avatarUrl:  profile.avatar_url || undefined,
    }, ip, ua);

    return void redirectSuccess(res, result.token, result.sessionToken);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('[oauth/github] Error:', msg);
    return void redirectError(res, msg.includes('deactivated') ? msg : 'GitHub authentication failed. Please try again.');
  }
};
