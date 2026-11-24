import type { Role } from "./types";

export const SESSION_COOKIE_NAME = "surat_session";
export const TTL_DEFAULT_SECONDS = 12 * 60 * 60; // 12 jam (aman untuk PC bersama ruang TU)
export const TTL_REMEMBER_SECONDS = 7 * 24 * 60 * 60; // 7 hari (opsional perangkat pribadi)

export interface SessionPayload {
  sub: string;
  nama: string;
  role: Role;
  remember: boolean;
  iat: number;
  exp: number;
}

const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(b64url: string): Uint8Array | null {
  try {
    const padded = b64url
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(b64url.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

/** Perbandingan waktu-konstan agar tahan timing attack. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Sesuai Users.gs: PIN wajib terdiri dari 4 hingga 8 digit angka. */
export function isValidPinFormat(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}

export function getPinSalt(): string {
  return process.env.SALT ?? "demo-portfolio-salt";
}

function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.SALT ||
    "demo-portfolio-session-secret-key"
  );
}

/**
 * 100% kompatibel dengan fungsi hash_(pin) di Auth.gs Apps Script lama:
 *   'h' + SHA256_HEX(salt + String(pin))
 * Awalan huruf 'h' mencegah Google Sheets salah membaca nilai hex sebagai angka/rumus.
 */
export async function hashPin(pin: string, customSalt?: string): Promise<string> {
  const salt = customSalt ?? getPinSalt();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(`${salt}${String(pin)}`)
  );
  return `h${bytesToHex(new Uint8Array(digest))}`;
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return bytesToBase64Url(new Uint8Array(sig));
}

export async function signSessionToken(
  user: { id: string; nama: string; role: Role },
  remember = false
): Promise<{ token: string; maxAge: number; exp: number }> {
  const now = Math.floor(Date.now() / 1000);
  const maxAge = remember ? TTL_REMEMBER_SECONDS : TTL_DEFAULT_SECONDS;
  const payload: SessionPayload = {
    sub: user.id,
    nama: user.nama,
    role: user.role,
    remember,
    iat: now,
    exp: now + maxAge,
  };
  const payloadB64 = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const sigB64 = await hmacSign(payloadB64, getSessionSecret());
  return {
    token: `${payloadB64}.${sigB64}`,
    maxAge,
    exp: payload.exp,
  };
}

export async function verifySessionToken(
  token?: string | null
): Promise<SessionPayload | null> {
  if (!token || !token.includes(".")) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, sigB64] = parts;
  const expectedSig = await hmacSign(payloadB64, getSessionSecret());
  if (!safeEqual(sigB64, expectedSig)) return null;

  const decodedBytes = base64UrlToBytes(payloadB64);
  if (!decodedBytes) return null;

  try {
    const parsed = JSON.parse(new TextDecoder().decode(decodedBytes)) as SessionPayload;
    if (!parsed?.sub || !parsed?.role || typeof parsed.exp !== "number") {
      return null;
    }
    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp <= now) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildSessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
