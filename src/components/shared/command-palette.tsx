"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { FileText, Inbox, KeyRound, Moon, PlusCircle, Send, Sun } from "lucide-react";
import { useApp } from "@/context/app-context";
import { NAV_ITEMS } from "@/lib/theme";
import {
  CommandDialog,
  CommandEmpty,
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
    onOpenChange(false);
    fn();
  }

  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Ketik perintah, menu, atau cari nomor/perihal surat..." />
      <CommandList>
        <CommandEmpty>Tidak ditemukan hasil yang cocok.</CommandEmpty>

        <CommandGroup heading="Aksi Cepat">
          <CommandItem
            value="buat surat keluar baru tambah"
            onSelect={() => runCommand(() => router.push("/surat-keluar?new=1"))}
          >
            <PlusCircle className="size-4 text-blue-600 dark:text-blue-400" />
            <span>Buat Surat Keluar Baru</span>
            <CommandShortcut>Baru</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="catat surat masuk baru disposisi"
            onSelect={() => runCommand(() => router.push("/surat-masuk?new=1"))}
          >
            <Inbox className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Catat Surat Masuk &amp; Disposisi</span>
            <CommandShortcut>Baru</CommandShortcut>
          </CommandItem>
          {onOpenChangePin && (
            <CommandItem
              value="ubah ganti pin keamanan password saya"
              onSelect={() => runCommand(onOpenChangePin)}
            >
              <KeyRound className="size-4 text-violet-600 dark:text-violet-400" />
              <span>Ubah PIN Keamanan Saya</span>
            </CommandItem>
          )}
          <CommandItem
            value="ganti tema mode gelap terang dark light"
            onSelect={() =>
              runCommand(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))
            }
          >
            {resolvedTheme === "dark" ? (
              <Sun className="size-4 text-amber-400" />
            ) : (
              <Moon className="size-4 text-indigo-600" />
            )}
            <span>
              Beralih ke Mode {resolvedTheme === "dark" ? "Terang" : "Gelap"}
            </span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigasi Halaman">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.href}
                value={`menu ${item.label} ${item.description}`}
                onSelect={() => runCommand(() => router.push(item.href))}
              >
                <Icon className="text-muted-foreground size-4" />
                <span>{item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Pencarian Cepat Arsip Terbaru">
          {suratList.slice(0, 6).map((s) => (
            <CommandItem
              key={s.id}
              value={`surat ${s.nomor} ${s.perihal} ${s.pihak}`}
              onSelect={() =>
                runCommand(() =>
                  router.push(
                    s.arah === "keluar"
                      ? `/surat-keluar?q=${encodeURIComponent(s.nomor || s.perihal)}`
                      : `/surat-masuk?q=${encodeURIComponent(s.nomor || s.perihal)}`
                  )
                )
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
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
