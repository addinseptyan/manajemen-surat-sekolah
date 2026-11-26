import { NextResponse } from "next/server";
import { deleteSuratRecord, saveSuratRecord } from "@/lib/repository";
import { requireUserSession } from "@/lib/session-guard";
import type { Arah } from "@/lib/types";

const MAX_UPLOAD_BYTES = 4.2 * 1024 * 1024; // Aman di bawah batas 4.5 MB Vercel Serverless

export async function POST(request: Request) {
  const guard = await requireUserSession();
  if ("error" in guard) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status }
    );
  }

  try {
    const formData = await request.formData();
    const id = String(formData.get("id") || "").trim() || undefined;
    const arahRaw = String(formData.get("arah") || "keluar");
    const arah: Arah = arahRaw === "masuk" ? "masuk" : "keluar";
    const urutRaw = String(formData.get("urutManual") || "").trim();
    const urutManual = urutRaw ? Number(urutRaw) : undefined;
    const nomorManual = String(formData.get("nomorManual") || "").trim() || undefined;
    const jenis = String(formData.get("jenis") || "").trim();
    const tanggal = String(formData.get("tanggal") || "").trim();
    const pihak = String(formData.get("pihak") || "").trim();
    const perihal = String(formData.get("perihal") || "").trim();
    const catatan = String(formData.get("catatan") || "");
    const fileEntry = formData.get("file");

    let uploadedFile:
      | { buffer: Buffer; mimeType: string; originalName: string }
      | undefined;

    if (fileEntry && fileEntry instanceof File && fileEntry.size > 0) {
      if (fileEntry.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Ukuran file maksimal 4 MB agar lancar diunggah melalui server cloud.",
          },
          { status: 400 }
        );
      }
      const arrBuf = await fileEntry.arrayBuffer();
      uploadedFile = {
        buffer: Buffer.from(arrBuf),
        mimeType: fileEntry.type || "application/pdf",
        originalName: fileEntry.name || "lampiran.pdf",
      };
    }

    const res = await saveSuratRecord(guard.user, {
      id,
      arah,
      urutManual,
      nomorManual,
      jenis,
      tanggal,
      pihak,
      perihal,
      catatan,
      uploadedFile,
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      saved: res.saved,
      suratList: res.suratList,
      generatedGaps: res.generatedGaps ?? [],
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Gagal menyimpan data surat.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const guard = await requireUserSession();
  if ("error" in guard) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";
    const res = await deleteSuratRecord(guard.user, id);
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      convertedToSlot: Boolean(res.convertedToSlot),
      suratList: res.suratList,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Gagal menghapus surat.",
      },
      { status: 500 }
    );
  }
}
