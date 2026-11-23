"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, MailCheck, Menu, Search, Sparkles } from "lucide-react";
import { NAV_ITEMS, THEMES, type NavItem } from "@/lib/theme";
import { cn, getInitials } from "@/lib/utils";
import { useApp } from "@/context/app-context";
import { CommandPalette } from "@/components/shared/command-palette";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

function NavGroupList({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1">
      <div className="px-2.5 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
        {title}
      </div>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const theme = THEMES[item.theme];
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-all",
              active
                ? theme.activeNav
                : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900"
            )}
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-lg transition-colors",
                active ? "bg-white/20 text-white" : cn(theme.iconBg, theme.iconText)
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="flex-1 truncate">{item.label}</span>
            {item.adminOnly && !active && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                Admin
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function NavMenuContent({
  onNavigate,
  onOpenCommand,
}: {
  onNavigate?: () => void;
  onOpenCommand: () => void;
}) {
  const pathname = usePathname();
  const { currentUser, pengaturan } = useApp();

  const operasionalItems = NAV_ITEMS.filter((i) => i.group === "operasional");
  const adminItems = NAV_ITEMS.filter((i) => i.group === "administrasi");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-2 py-1">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/25">
          <MailCheck className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold tracking-tight text-slate-900">
            Surat Sekolah
          </div>
          <div className="truncate text-xs text-slate-500">{pengaturan.namaSekolah}</div>
        </div>
      </div>

      {/* Tombol Pintasan Command Palette */}
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          onOpenCommand();
        }}
        className="mt-4 flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-2 text-xs text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100/70"
      >
        <span className="flex items-center gap-2">
          <Search className="size-3.5 text-slate-400" />
          Cari / Aksi cepat...
        </span>
        <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
          Ctrl K
        </kbd>
      </button>

      <nav className="mt-5 flex flex-1 flex-col gap-5 overflow-y-auto">
        <NavGroupList
          title="Operasional Harian"
          items={operasionalItems}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <NavGroupList
          title="Administrasi"
          items={adminItems}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </nav>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/50 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
            <Sparkles className="size-3.5 text-amber-600" />
            Mode Demo Interaktif
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-700/90">
            Klik baris tabel untuk detail &amp; pratinjau berkas di dalam aplikasi.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar className="size-8">
              <AvatarFallback>{getInitials(currentUser.nama)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-slate-900">
                {currentUser.nama}
              </div>
              <Badge
                variant={currentUser.role === "admin" ? "violet" : "blue"}
                className="mt-0.5 px-1.5 py-0 text-[10px]"
              >
                {currentUser.role}
              </Badge>
            </div>
          </div>

          <Button variant="ghost" size="icon" asChild title="Keluar ke halaman Login">
            <Link href="/login">
              <LogOut className="size-4 text-slate-500" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50/60 print:bg-white">
      {/* Sidebar Desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200/80 bg-white p-4 lg:block print:hidden">
        <NavMenuContent onOpenCommand={() => setCommandOpen(true)} />
      </aside>

      {/* Konten Utama */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar Mobile */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur lg:hidden print:hidden">
          <div className="flex items-center gap-2.5">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Buka navigasi">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-4">
                <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
                <NavMenuContent
                  onNavigate={() => setMobileOpen(false)}
                  onOpenCommand={() => setCommandOpen(true)}
                />
              </SheetContent>
            </Sheet>
            <span className="text-sm font-bold text-slate-900">Manajemen Surat</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCommandOpen(true)}
              aria-label="Cari cepat"
            >
              <Search className="size-4" />
            </Button>
            <Badge variant="amber">Demo</Badge>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8 print:max-w-none print:p-0">
          {children}
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
