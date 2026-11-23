"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Inbox, PlusCircle, Send } from "lucide-react";
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
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { suratList } = useApp();

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
            <PlusCircle className="size-4 text-blue-600" />
            <span>Buat Surat Keluar Baru</span>
            <CommandShortcut>Baru</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="catat surat masuk baru disposisi"
            onSelect={() => runCommand(() => router.push("/surat-masuk?new=1"))}
          >
            <Inbox className="size-4 text-emerald-600" />
            <span>Catat Surat Masuk & Disposisi</span>
            <CommandShortcut>Baru</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigasi Halaman">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.href}
                value={`menu ${item.label} ${item.description}`}
                onSelect={() => runCommand(() => router.push(item.href))}
              >
                <Icon className="size-4 text-slate-500" />
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
                <div className="truncate font-mono text-[11px] text-slate-400">
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
