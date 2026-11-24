import { NextResponse } from "next/server";
import {
  DEMO_ADMIN_PIN,
  DEMO_PEGAWAI_PIN,
  isDemoMode,
  listPublicActiveUsers,
} from "@/lib/server-users";

export async function GET() {
  const users = await listPublicActiveUsers();
  const demo = isDemoMode();
  return NextResponse.json({
    ok: true,
    demoMode: demo,
    demoHints: demo
      ? { adminPin: DEMO_ADMIN_PIN, pegawaiPin: DEMO_PEGAWAI_PIN }
      : undefined,
    users,
  });
}
