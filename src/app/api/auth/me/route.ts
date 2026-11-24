import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  buildSessionCookieOptions,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth";
import { findActiveUserById, isDemoMode } from "@/lib/server-users";

export async function GET() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(rawToken);

  if (!session) {
    return NextResponse.json(
      { ok: false, error: "SESI_HABIS" },
      { status: 401 }
    );
  }

  const activeUser = await findActiveUserById(session.sub);
  if (!activeUser) {
    const res = NextResponse.json(
      { ok: false, error: "SESI_HABIS" },
      { status: 401 }
    );
    res.cookies.set(SESSION_COOKIE_NAME, "", buildSessionCookieOptions(0));
    return res;
  }

  return NextResponse.json({
    ok: true,
    demoMode: isDemoMode(),
    user: activeUser,
    remember: session.remember,
    expiresAt: session.exp,
  });
}
