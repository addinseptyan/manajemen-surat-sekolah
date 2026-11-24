import { NextResponse } from "next/server";
import { getPengaturanData } from "@/lib/repository";
import {
  DEMO_ADMIN_PIN,
  DEMO_PEGAWAI_PIN,
  isDemoMode,
  listPublicActiveUsers,
} from "@/lib/server-users";

export async function GET() {
  try {
    const [users, pengaturan] = await Promise.all([
      listPublicActiveUsers(),
      getPengaturanData(),
    ]);
    const demo = isDemoMode();
    return NextResponse.json({
      ok: true,
      demoMode: demo,
      demoHints: demo
        ? { adminPin: DEMO_ADMIN_PIN, pegawaiPin: DEMO_PEGAWAI_PIN }
        : undefined,
      users,
      brand: {
        namaAplikasi: pengaturan.namaAplikasi,
        namaSekolah: pengaturan.namaSekolah,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Gagal memuat daftar pengguna dari database.",
      },
      { status: 500 }
    );
  }
}
