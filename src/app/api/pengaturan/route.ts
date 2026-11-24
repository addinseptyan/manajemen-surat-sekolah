import { NextResponse } from "next/server";
import { savePengaturanRecord } from "@/lib/repository";
import { requireAdminUser } from "@/lib/session-guard";
import type { Pengaturan } from "@/lib/types";

export async function PUT(request: Request) {
  const guard = await requireAdminUser();
  if ("error" in guard) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status }
    );
  }

  try {
    const body = (await request.json()) as Pengaturan;
    const res = await savePengaturanRecord(guard.user, body);
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, pengaturan: res.pengaturan });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Gagal menyimpan pengaturan.",
      },
      { status: 500 }
    );
  }
}
