import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { changeOwnPin } from "@/lib/server-users";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = await verifySessionToken(
    cookieStore.get(SESSION_COOKIE_NAME)?.value
  );

  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Sesi login telah berakhir. Silakan login kembali." },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as {
      pinLama?: string;
      pinBaru?: string;
    };
    const res = await changeOwnPin(
      session.sub,
      String(body.pinLama || ""),
      String(body.pinBaru || "")
    );

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Permintaan ubah PIN tidak valid." },
      { status: 400 }
    );
  }
}
