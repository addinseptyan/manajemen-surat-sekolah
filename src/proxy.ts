import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

const ADMIN_ONLY_PREFIXES = ["/pegawai", "/pengaturan"];

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const rawToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(rawToken);

  if (pathname === "/") {
    const dest = session ? "/dashboard" : "/login";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (pathname === "/login") {
    if (session && !searchParams.has("force")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Semua halaman operasional & administrasi wajib login
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Proteksi ketat halaman Admin (/pegawai & /pengaturan)
  const isAdminRoute = ADMIN_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (isAdminRoute && session.role !== "admin") {
    const deniedUrl = new URL("/dashboard", request.url);
    deniedUrl.searchParams.set("denied", "admin");
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|icon\\.svg|favicon\\.ico).*)"],
};
