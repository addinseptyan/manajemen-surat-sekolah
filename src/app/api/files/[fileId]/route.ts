import { NextResponse } from "next/server";
import { fetchDriveFileStream } from "@/lib/drive-storage";
import { isDemoMode } from "@/lib/google";
import { getDemoUploadedFile } from "@/lib/repository";
import { requireUserSession } from "@/lib/session-guard";

export async function GET(
  request: Request,
  context: { params: Promise<{ fileId: string }> }
) {
  // Wajib login agar folder Google Drive sekolah tetap 100% privat dari publik internet
  const guard = await requireUserSession();
  if ("error" in guard) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status }
    );
  }

  const { fileId } = await context.params;
  const { searchParams } = new URL(request.url);
  const isDownload = searchParams.get("download") === "1";

  try {
    // 1. Jika Mode Demo & file baru diunggah di sesi memori demo
    if (isDemoMode() || fileId.startsWith("demo-")) {
      const demoFile = getDemoUploadedFile(fileId);
      if (!demoFile) {
        return NextResponse.json(
          { ok: false, error: "Berkas contoh tidak ditemukan." },
          { status: 404 }
        );
      }

      const safeHeaderName = demoFile.fileName.replace(/["\r\n]/g, "_");
      return new Response(new Uint8Array(demoFile.buffer), {
        status: 200,
        headers: {
          "Content-Type": demoFile.mimeType,
          "Content-Disposition": `${
            isDownload ? "attachment" : "inline"
          }; filename="${safeHeaderName}"`,
          "Cache-Control": "private, max-age=300",
        },
      });
    }

    // 2. Mode Produksi: Proxy langsung dari Google Drive API v3 (bebas "Request Access"!)
    const driveFile = await fetchDriveFileStream(fileId);
    const safeHeaderName = driveFile.fileName.replace(/["\r\n]/g, "_");

    const headers: Record<string, string> = {
      "Content-Type": driveFile.mimeType,
      "Content-Disposition": `${
        isDownload ? "attachment" : "inline"
      }; filename="${safeHeaderName}"`,
      "Cache-Control": "private, max-age=300",
    };
    if (driveFile.size) {
      headers["Content-Length"] = driveFile.size;
    }

    return new Response(driveFile.stream, {
      status: 200,
      headers,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Gagal mengambil berkas dari Google Drive.",
      },
      { status: 500 }
    );
  }
}
