import { HttpError } from './http';
import type { EnvChecked } from './env';

export interface JWTPayload {
  tenant_id: string;
  user_id?: string;
  exp: number;
  iat: number;
}

/**
 * Verify and decode JWT token
 * Uses Web Crypto API for HMAC-SHA256 verification
 */
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new HttpError(401, 'Invalid token format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Verify signature
  const encoder = new TextEncoder();
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const keyData = encoder.encode(secret);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signature = base64UrlDecode(signatureB64);
  const valid = await crypto.subtle.verify('HMAC', key, signature, data);

  if (!valid) {
    throw new HttpError(401, 'Invalid token signature');
  }

  // Decode payload
  const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
  const payload = JSON.parse(payloadJson) as JWTPayload;

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new HttpError(401, 'Token expired');
  }

  // Validate required claims
  if (!payload.tenant_id) {
    throw new HttpError(401, 'Missing tenant_id in token');
  }

  return payload;
}

/**
 * Create JWT token (for testing/dev purposes)
 */
export async function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string, expiresInSeconds = 3600): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(fullPayload)));

  const encoder = new TextEncoder();
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const keyData = encoder.encode(secret);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, data);
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

/**
 * Extract and verify JWT from request
 */
export async function requireAuth(request: Request, env: EnvChecked): Promise<JWTPayload> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    throw new HttpError(401, 'Missing authorization header');
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new HttpError(401, 'Invalid authorization header format');
  }

  const token = match[1];
  return verifyJWT(token, env.JWT_SECRET);
}

/**
 * Optional auth - returns payload if token present, undefined otherwise
 */
export async function optionalAuth(request: Request, env: EnvChecked): Promise<JWTPayload | undefined> {
  try {
    return await requireAuth(request, env);
  } catch (error) {
    return undefined;
  }
}

// Base64 URL encoding/decoding helpers
function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
