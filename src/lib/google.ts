import crypto from "node:crypto";

interface CachedToken {
  accessToken: string;
  expiresAtMs: number;
}

const globalForGoogle = globalThis as unknown as {
  __googleAccessTokenCache?: CachedToken;
};

export function isDemoMode(): boolean {
  return process.env.USE_MOCK !== "false";
}

export function getSpreadsheetId(): string {
  const id = (process.env.GOOGLE_SPREADSHEET_ID || "").trim();
  if (!id) {
    throw new Error(
      "GOOGLE_SPREADSHEET_ID belum diisi di Environment Variables."
    );
  }
  return id;
}

export function getDriveFolderId(): string {
  const id = (process.env.GOOGLE_DRIVE_FOLDER_ID || "").trim();
  if (!id) {
    throw new Error(
      "GOOGLE_DRIVE_FOLDER_ID belum diisi di Environment Variables."
    );
  }
  return id;
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function fetchTokenViaRefreshToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<CachedToken> {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Gagal memperbarui token OAuth Google (${res.status}): ${errText}`
    );
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  return {
    accessToken: data.access_token,
    expiresAtMs: Date.now() + Math.max(60, (data.expires_in || 3600) - 60) * 1000,
  };
}

async function fetchTokenViaServiceAccount(
  clientEmail: string,
  rawPrivateKey: string
): Promise<CachedToken> {
  const privateKey = rawPrivateKey.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);

  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claimSet = base64UrlEncode(
    JSON.stringify({
      iss: clientEmail,
      scope:
        "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );

  const unsignedJwt = `${header}.${claimSet}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedJwt);
  signer.end();
  const signature = base64UrlEncode(signer.sign(privateKey));
  const assertion = `${unsignedJwt}.${signature}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Gagal autentikasi Service Account Google (${res.status}): ${errText}`
    );
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  return {
    accessToken: data.access_token,
    expiresAtMs: Date.now() + Math.max(60, (data.expires_in || 3600) - 60) * 1000,
  };
}

/**
 * Menghasilkan Access Token Google API dengan prioritas:
 * 1. OAuth2 Refresh Token (Rekomendasi utama untuk akun @gmail.com gratis 15 GB: Sheets + Drive Upload)
 * 2. Service Account JWT (Opsional untuk Google Workspace @sch.id Shared Drive)
 */
export async function getGoogleAccessToken(): Promise<string> {
  const cached = globalForGoogle.__googleAccessTokenCache;
  if (cached && cached.expiresAtMs > Date.now()) {
    return cached.accessToken;
  }

  const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
  const refreshToken = (process.env.GOOGLE_REFRESH_TOKEN || "").trim();

  if (clientId && clientSecret && refreshToken) {
    const fresh = await fetchTokenViaRefreshToken(
      clientId,
      clientSecret,
      refreshToken
    );
    globalForGoogle.__googleAccessTokenCache = fresh;
    return fresh.accessToken;
  }

  const saEmail = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "").trim();
  const saKey = (process.env.GOOGLE_PRIVATE_KEY || "").trim();

  if (saEmail && saKey) {
    const fresh = await fetchTokenViaServiceAccount(saEmail, saKey);
    globalForGoogle.__googleAccessTokenCache = fresh;
    return fresh.accessToken;
  }

  throw new Error(
    "Kredensial Google belum lengkap. Isi GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN (untuk Gmail biasa) atau GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY."
  );
}

/** Ekstrak Google Drive File ID dari URL lama Apps Script maupun URL proxy internal. */
export function extractDriveFileId(urlOrId?: string | null): string {
  const raw = String(urlOrId || "").trim();
  if (!raw || raw.startsWith("#") || raw.startsWith("blob:")) return "";

  const proxyMatch = raw.match(/\/api\/files\/([-\w]{15,})/);
  if (proxyMatch) return proxyMatch[1];

  const driveMatch = raw.match(/[-\w]{25,}/);
  return driveMatch ? driveMatch[0] : "";
}
