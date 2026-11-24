import { NextResponse } from "next/server";
import { deleteDisposisiRecord, saveDisposisiRecord } from "@/lib/repository";
import { requireAdminUser } from "@/lib/session-guard";

export async function POST(request: Request) {
  const guard = await requireAdminUser();
  if ("error" in guard) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status }
    );
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      nama?: string;
      aktif?: boolean;
    };
    const res = await saveDisposisiRecord(guard.user, {
      id: body.id,
      nama: String(body.nama || ""),
      aktif: body.aktif !== false,
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, disposisiList: res.disposisiList });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Gagal menyimpan tujuan disposisi.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const guard = await requireAdminUser();
  if ("error" in guard) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";
    const res = await deleteDisposisiRecord(guard.user, id);
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, disposisiList: res.disposisiList });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Gagal menghapus tujuan disposisi.",
      },
      { status: 500 }
    );
  }
}
