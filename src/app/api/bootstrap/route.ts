import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/google";
import { getBootstrapData } from "@/lib/repository";
import { requireUserSession } from "@/lib/session-guard";

export async function GET() {
  const guard = await requireUserSession();
  if ("error" in guard) {
    return NextResponse.json(
      { ok: false, error: guard.error },
      { status: guard.status }
    );
  }

  try {
    const data = await getBootstrapData();
    return NextResponse.json({
      ok: true,
      demoMode: isDemoMode(),
      user: guard.user,
      ...data,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Gagal memuat data dari Google Spreadsheet.",
      },
      { status: 500 }
    );
  }
}
