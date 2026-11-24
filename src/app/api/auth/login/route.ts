import { NextResponse } from "next/server";
import {
  buildSessionCookieOptions,
  SESSION_COOKIE_NAME,
  signSessionToken,
} from "@/lib/auth";
import { verifyUserCredentials } from "@/lib/server-users";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      pin?: string;
      remember?: boolean;
    };

    const result = await verifyUserCredentials(
      String(body.id || ""),
      String(body.pin || "")
    );

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 401 });
    }

    const remember = Boolean(body.remember);
    const { token, maxAge, exp } = await signSessionToken(result.user, remember);

    const response = NextResponse.json({
      ok: true,
      user: result.user,
      remember,
      expiresAt: exp,
    });
    response.cookies.set(SESSION_COOKIE_NAME, token, buildSessionCookieOptions(maxAge));
    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Permintaan login tidak valid." },
      { status: 400 }
    );
  }
}
