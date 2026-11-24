import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import {
  deleteUserByAdmin,
  findActiveUserById,
  listAllUsersForAdmin,
  upsertUserByAdmin,
} from "@/lib/server-users";
import type { Role } from "@/lib/types";

async function requireAdminSession() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(
    cookieStore.get(SESSION_COOKIE_NAME)?.value
  );
  if (!session) return { error: "SESI_HABIS", status: 401 as const };

  const active = await findActiveUserById(session.sub);
  if (!active) return { error: "SESI_HABIS", status: 401 as const };
  if (active.role !== "admin") return { error: "Hanya Admin yang diizinkan.", status: 403 as const };

  return { admin: active };
}

export async function GET() {
  const guard = await requireAdminSession();
  if ("error" in guard) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }
  const users = await listAllUsersForAdmin();
  return NextResponse.json({ ok: true, users });
}

export async function POST(request: Request) {
  const guard = await requireAdminSession();
  if ("error" in guard) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      nama?: string;
      role?: Role;
      pin?: string;
      aktif?: boolean;
    };
    const res = await upsertUserByAdmin(guard.admin.id, {
      id: body.id,
      nama: String(body.nama || ""),
      role: body.role === "admin" ? "admin" : "pegawai",
      pin: body.pin,
      aktif: body.aktif !== false,
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }
    const users = await listAllUsersForAdmin();
    return NextResponse.json({ ok: true, user: res.user, users });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Data pegawai tidak valid." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const guard = await requireAdminSession();
  if ("error" in guard) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || "";
  const res = await deleteUserByAdmin(guard.admin.id, id);
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
  }
  const users = await listAllUsersForAdmin();
  return NextResponse.json({ ok: true, users });
}
