import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./auth";
import { findActiveUserById } from "./server-users";
import type { User } from "./types";

export async function requireUserSession(): Promise<
  { user: User } | { error: string; status: 401 | 403 }
> {
  const cookieStore = await cookies();
  const session = await verifySessionToken(
    cookieStore.get(SESSION_COOKIE_NAME)?.value
  );
  if (!session) {
    return { error: "SESI_HABIS", status: 401 };
  }

  const activeUser = await findActiveUserById(session.sub);
  if (!activeUser) {
    return { error: "SESI_HABIS", status: 401 };
  }

  return { user: activeUser };
}

export async function requireAdminUser(): Promise<
  { user: User } | { error: string; status: 401 | 403 }
> {
  const res = await requireUserSession();
  if ("error" in res) return res;
  if (res.user.role !== "admin") {
    return { error: "Hanya Admin yang diizinkan.", status: 403 };
  }
  return res;
}
