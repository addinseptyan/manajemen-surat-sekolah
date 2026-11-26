"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { FileText, Inbox, KeyRound, Moon, PlusCircle, Send, Sun } from "lucide-react";
import { useApp } from "@/context/app-context";
import { NAV_ITEMS } from "@/lib/theme";
import { Badge } from "@/components/ui/badge";
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChangePin?: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  onOpenChangePin,
}: CommandPaletteProps) {
  const router = useRouter();
  const { suratList, currentUser } = useApp();
  const { resolvedTheme, setTheme } = useTheme();
  const isAdmin = currentUser.role === "admin";
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  function runCommand(fn: () => void) {
    setSearch("");
    onOpenChange(false);
    fn();
  }

  const q = search.trim().toLowerCase();

  const quickActions = useMemo(() => {
    const items = [
      {
        id: "act-surat-keluar",
        keywords: "buat surat keluar baru tambah nomor",
        label: "Buat Surat Keluar Baru",
        shortcut: "Baru",
        icon: <PlusCircle className="size-4 text-blue-600 dark:text-blue-400" />,
        action: () => router.push("/surat-keluar?new=1"),
      },
      {
        id: "act-surat-masuk",
        keywords: "catat surat masuk baru disposisi",
        label: "Catat Surat Masuk & Disposisi",
        shortcut: "Baru",
        icon: <Inbox className="size-4 text-emerald-600 dark:text-emerald-400" />,
        action: () => router.push("/surat-masuk?new=1"),
      },
      ...(onOpenChangePin
        ? [
            {
              id: "act-change-pin",
              keywords: "ubah ganti pin keamanan password saya",
              label: "Ubah PIN Keamanan Saya",
              shortcut: undefined,
              icon: <KeyRound className="size-4 text-violet-600 dark:text-violet-400" />,
              action: onOpenChangePin,
            },
          ]
        : []),
      {
        id: "act-toggle-theme",
        keywords: "ganti tema mode gelap terang dark light",
        label: `Beralih ke Mode ${resolvedTheme === "dark" ? "Terang" : "Gelap"}`,
        shortcut: undefined,
        icon:
          resolvedTheme === "dark" ? (
            <Sun className="size-4 text-amber-400" />
          ) : (
            <Moon className="size-4 text-indigo-600" />
          ),
        action: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      },
    ];

    if (!q) return items;
    return items.filter((item) =>
      `${item.label} ${item.keywords}`.toLowerCase().includes(q)
    );
  }, [q, onOpenChangePin, resolvedTheme, router, setTheme]);

  const filteredNavItems = useMemo(() => {
    const allowed = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
    if (!q) return allowed;
    return allowed.filter((item) =>
      `${item.label} ${item.description}`.toLowerCase().includes(q)
    );
  }, [isAdmin, q]);

  // Pencarian arsip identik dengan kolom pencarian di Surat Keluar & Surat Masuk (seluruh data, bukan 6 teratas)
  const matchedSurat = useMemo(() => {
    const sorted = [...suratList].sort((a, b) =>
      b.tanggal.localeCompare(a.tanggal)
    );
    if (!q) return sorted.slice(0, 6);

    return sorted
      .filter((s) => {
        const haystack =
          `${s.nomor} ${s.pihak} ${s.perihal} ${s.catatan} ${s.pembuat} ${s.jenis} ${s.fileName ?? ""} ${s.tanggal}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 30);
  }, [suratList, q]);

  const hasAnyResult =
    quickActions.length > 0 ||
    filteredNavItems.length > 0 ||
    matchedSurat.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder="Cari nomor, perihal, tujuan/pengirim, atau aksi cepat..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {!hasAnyResult && (
          <div className="text-muted-foreground py-6 text-center text-xs">
            Tidak ditemukan surat atau perintah untuk &ldquo;{search}&rdquo;.
          </div>
        )}

        {/* Saat mengetik kata kunci, tampilkan hasil pencarian surat paling atas agar langsung terlihat di HP */}
        {q && matchedSurat.length > 0 && (
          <CommandGroup heading={`Hasil Pencarian Surat (${matchedSurat.length})`}>
            {matchedSurat.map((s) => {
              const targetFilterText = s.nomor || s.perihal;
              const targetPath =
                s.arah === "keluar" ? "/surat-keluar" : "/surat-masuk";
              const targetHref = `${targetPath}?q=${encodeURIComponent(
                targetFilterText
              )}&tahun=${encodeURIComponent(String(s.tahun))}`;

              return (
                <CommandItem
                  key={`q-${s.id}`}
                  value={`q-${s.id}`}
                  onSelect={() =>
                    runCommand(() => {
                      window.dispatchEvent(
                        new CustomEvent("app:apply-quick-search", {
                          detail: {
                            href: targetPath,
                            q: targetFilterText,
                            tahun: String(s.tahun),
                          },
                        })
                      );
                      router.push(targetHref);
                    })
                  }
                >
                  {s.arah === "keluar" ? (
                    <Send className="size-4 text-blue-500" />
                  ) : (
                    <FileText className="size-4 text-emerald-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={s.arah === "keluar" ? "blue" : "emerald"}
                        className="px-1.5 py-0 text-[10px]"
                      >
                        {s.arah === "keluar" ? "Keluar" : "Masuk"}
                      </Badge>
                      <span className="truncate text-xs font-semibold">
                        {s.perihal}
                      </span>
                    </div>
                    <div className="text-muted-foreground mt-0.5 truncate font-mono text-[11px]">
                      {s.nomor ? `${s.nomor} · ${s.pihak}` : s.pihak}
                    </div>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {q && matchedSurat.length > 0 && (quickActions.length > 0 || filteredNavItems.length > 0) && (
          <CommandSeparator />
        )}

        {quickActions.length > 0 && (
          <CommandGroup heading="Aksi Cepat">
            {quickActions.map((act) => (
              <CommandItem
                key={act.id}
                value={act.id}
                onSelect={() => runCommand(act.action)}
              >
                {act.icon}
                <span>{act.label}</span>
                {act.shortcut && <CommandShortcut>{act.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {quickActions.length > 0 && filteredNavItems.length > 0 && (
          <CommandSeparator />
        )}

        {filteredNavItems.length > 0 && (
          <CommandGroup heading="Navigasi Halaman">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  value={`nav-${item.href}`}
                  onSelect={() =>
                    runCommand(() => {
                      window.dispatchEvent(
                        new CustomEvent("app:reset-route-filter", {
                          detail: { href: item.href },
                        })
                      );
                      router.push(item.href);
                    })
                  }
                >
                  <Icon className="text-muted-foreground size-4" />
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {!q && matchedSurat.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Arsip Terbaru">
              {matchedSurat.map((s) => {
                const targetFilterText = s.nomor || s.perihal;
                const targetPath =
                  s.arah === "keluar" ? "/surat-keluar" : "/surat-masuk";
                const targetHref = `${targetPath}?q=${encodeURIComponent(
                  targetFilterText
                )}&tahun=${encodeURIComponent(String(s.tahun))}`;

                return (
                  <CommandItem
                    key={`recent-${s.id}`}
                    value={`recent-${s.id}`}
                    onSelect={() =>
                      runCommand(() => {
                        window.dispatchEvent(
                          new CustomEvent("app:apply-quick-search", {
                            detail: {
                              href: targetPath,
                              q: targetFilterText,
                              tahun: String(s.tahun),
                            },
                          })
                        );
                        router.push(targetHref);
                      })
                    }
                  >
                    {s.arah === "keluar" ? (
                      <Send className="size-4 text-blue-500" />
                    ) : (
                      <FileText className="size-4 text-emerald-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">{s.perihal}</div>
                      <div className="text-muted-foreground truncate font-mono text-[11px]">
                        {s.nomor || s.pihak}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
