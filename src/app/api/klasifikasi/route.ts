import { NextResponse } from "next/server";
import {
  deleteKlasifikasiRecord,
  saveKlasifikasiRecord,
} from "@/lib/repository";
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
      kode?: string;
      nama?: string;
      oldKode?: string;
    };
    const res = await saveKlasifikasiRecord(
      guard.user,
      { kode: String(body.kode || ""), nama: String(body.nama || "") },
      body.oldKode
    );
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, klasifikasiList: res.klasifikasiList });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Gagal menyimpan klasifikasi.",
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
    const kode = searchParams.get("kode") || "";
    const res = await deleteKlasifikasiRecord(guard.user, kode);
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, klasifikasiList: res.klasifikasiList });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "Gagal menghapus klasifikasi.",
      },
      { status: 500 }
    );
  }
}
