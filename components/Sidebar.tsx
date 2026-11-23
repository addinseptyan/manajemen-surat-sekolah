"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { href: "/dashboard", label: "📊 Dashboard", color: "#6366f1" },
  { href: "/surat-keluar", label: "📤 Surat Keluar", color: "#2563eb" },
  { href: "/surat-masuk", label: "📥 Surat Masuk", color: "#059669" },
  { href: "/impor", label: "📦 Impor Data", color: "#d97706" },
  { href: "/pengaturan", label: "⚙️ Pengaturan", color: "#7c3aed" },
  { href: "/pegawai", label: "👥 Pegawai", color: "#db2777" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex min-h-screen w-56 flex-col gap-1 bg-gradient-to-b from-indigo-950 to-indigo-900 p-4 text-indigo-200">
      <div className="mb-3 text-base font-bold text-white">Manajemen Surat</div>
      {MENU.map((m) => (
        <Link
          key={m.href}
          href={m.href}
          className={`rounded-md px-3 py-2 text-sm hover:bg-white/10 hover:text-white ${pathname === m.href ? "bg-white/15 font-semibold text-white" : ""}`}
          style={pathname === m.href ? { background: m.color } : undefined}
        >
          {m.label}
        </Link>
      ))}
      <div className="mt-auto text-xs text-indigo-300">
        <div className="mb-2 rounded-md bg-amber-100 px-2 py-1 text-amber-800">⚠ Mode demo (data contoh)</div>
        Admin · admin
        <br />
        <Link href="/login" className="text-white underline">Keluar</Link>
      </div>
    </aside>
  );
}
