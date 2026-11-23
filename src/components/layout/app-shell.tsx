"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, MailCheck, Menu, Search, Sparkles } from "lucide-react";
import { NAV_ITEMS, THEMES, type NavItem } from "@/lib/theme";
import { cn, getInitials } from "@/lib/utils";
import { useApp } from "@/context/app-context";
import { CommandPalette } from "@/components/shared/command-palette";
import { ThemeToggle } from "@/components/shared/theme-toggle";
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
      <div className="text-muted-foreground px-2.5 pb-1 text-[11px] font-semibold tracking-wider uppercase">
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
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
              <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
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
  showDesktopThemeToggle = false,
}: {
  onNavigate?: () => void;
  onOpenCommand: () => void;
  showDesktopThemeToggle?: boolean;
}) {
  const pathname = usePathname();
  const { currentUser, pengaturan } = useApp();

  const operasionalItems = NAV_ITEMS.filter((i) => i.group === "operasional");
  const adminItems = NAV_ITEMS.filter((i) => i.group === "administrasi");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-1 py-1">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/25">
            <MailCheck className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="text-foreground truncate text-sm font-bold tracking-tight">
              {pengaturan.namaAplikasi}
            </div>
            <div className="text-muted-foreground truncate text-xs">
              {pengaturan.namaSekolah}
            </div>
          </div>
        </div>
        {showDesktopThemeToggle && <ThemeToggle className="size-8 shrink-0" />}
      </div>

      {/* Tombol Pintasan Command Palette */}
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          onOpenCommand();
        }}
        className="bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground mt-4 flex w-full cursor-pointer items-center justify-between rounded-xl border border-border px-3 py-2 text-xs transition-colors"
      >
        <span className="flex items-center gap-2">
          <Search className="size-3.5 opacity-70" />
          Cari / Aksi cepat...
        </span>
        <kbd className="bg-card text-muted-foreground rounded border border-border px-1.5 py-0.5 font-mono text-[10px] font-semibold">
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
        <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/50 p-3 dark:border-amber-800/50 dark:from-amber-950/40 dark:to-orange-950/20">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <Sparkles className="size-3.5 text-amber-600 dark:text-amber-400" />
            Mode Demo Interaktif
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-700/90 dark:text-amber-300/80">
            Ketuk surat untuk detail &amp; pratinjau berkas langsung di dalam aplikasi.
          </p>
        </div>

        <div className="bg-muted/50 flex items-center justify-between gap-2 rounded-xl border border-border p-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar className="size-8">
              <AvatarFallback>{getInitials(currentUser.nama)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-foreground truncate text-xs font-semibold">
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
              <LogOut className="text-muted-foreground size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pengaturan } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <div className="bg-background flex min-h-screen print:bg-white">
      {/* Sidebar Desktop */}
      <aside className="bg-card sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border p-4 lg:block print:hidden">
        <NavMenuContent
          onOpenCommand={() => setCommandOpen(true)}
          showDesktopThemeToggle
        />
      </aside>

      {/* Konten Utama */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar Mobile */}
        <header className="bg-card/90 sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border px-3.5 backdrop-blur lg:hidden print:hidden">
          <div className="flex min-w-0 items-center gap-2.5">
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
            <span className="text-foreground truncate text-sm font-bold">
              {pengaturan.namaAplikasi}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCommandOpen(true)}
              aria-label="Cari cepat"
            >
              <Search className="size-4" />
            </Button>
            <ThemeToggle />
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
