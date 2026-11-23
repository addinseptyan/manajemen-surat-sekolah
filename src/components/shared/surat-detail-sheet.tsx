"use client";

import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  Copy,
  Eye,
  FileCheck2,
  Pencil,
  Send,
  Trash2,
  Upload,
  UserCheck,
} from "lucide-react";
import type { Surat } from "@/lib/types";
import { parseDisposisi } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface SuratDetailSheetProps {
  surat: Surat | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  onEdit: (surat: Surat) => void;
  onDelete: (surat: Surat) => void;
  onPreviewDoc: (surat: Surat) => void;
}

export function SuratDetailSheet({
  surat,
  open,
  onOpenChange,
  canManage,
  onEdit,
  onDelete,
  onPreviewDoc,
}: SuratDetailSheetProps) {
  if (!surat) return null;

  const isKeluar = surat.arah === "keluar";
  const isSlotKosong = surat.status === "Belum Lengkap";
  const { tags: disposisiTags, cleanNote } = parseDisposisi(surat.catatan);

  function copyNomor() {
    if (!surat?.nomor) return;
    navigator.clipboard.writeText(surat.nomor);
    toast.success("Nomor surat disalin ke clipboard", {
      description: surat.nomor,
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isKeluar ? "blue" : "emerald"}>
              {isKeluar ? "Surat Keluar" : "Surat Masuk"}
            </Badge>
            <Badge variant={isSlotKosong ? "amber" : surat.fileName ? "emerald" : "outline"}>
              {isSlotKosong
                ? "Slot Kosong (Belum Lengkap)"
                : surat.fileName
                  ? "Lengkap + Scan"
                  : "Belum Ada Scan"}
            </Badge>
            {surat.jenis && (
              <Badge variant="violet" className="font-mono">
                {surat.jenis}
              </Badge>
            )}
          </div>
          <SheetTitle className="mt-1 leading-snug">{surat.perihal}</SheetTitle>
          <SheetDescription>
            Detail lengkap arsip surat & kelengkapan berkas digital Tata Usaha.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5 text-sm">
          {isSlotKosong && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="size-4 text-amber-600" />
                Nomor Urut Belum Dilengkapi
              </div>
              <p className="mt-1 leading-relaxed">
                Slot ini dibuat otomatis saat melompati nomor urut. Segera cari arsip fisiknya,
                lengkapi data surat, dan unggah hasil scan PDF.
              </p>
            </div>
          )}

          {/* Blok Nomor Surat */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
            <div className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              Nomor Resmi Surat
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-bold text-slate-900 break-all">
                {surat.nomor || "Belum bernomor"}
              </span>
              {surat.nomor && !isSlotKosong && (
                <Button variant="outline" size="sm" onClick={copyNomor}>
                  <Copy className="size-3.5" />
                  Salin
                </Button>
              )}
            </div>
          </div>

          {/* Metadata Utama */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 p-3.5">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="size-3.5" />
                Tanggal Surat
              </div>
              <div className="mt-1 font-medium text-slate-800">{surat.tanggal}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <UserCheck className="size-3.5" />
                Dicatat Oleh
              </div>
              <div className="mt-1 font-medium text-slate-800">{surat.pembuat}</div>
            </div>
            <div className="col-span-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Send className="size-3.5" />
                {isKeluar ? "Tujuan Penerima" : "Instansi Pengirim"}
              </div>
              <div className="mt-1 font-medium text-slate-900">{surat.pihak}</div>
            </div>
          </div>

          {/* Disposisi */}
          {disposisiTags.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Tujuan Disposisi
              </div>
              <div className="flex flex-wrap gap-1.5">
                {disposisiTags.map((tag) => (
                  <Badge key={tag} variant="emerald">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Catatan */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Catatan / Instruksi
            </div>
            <p className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-slate-700">
              {cleanNote || "Tidak ada catatan tambahan."}
            </p>
          </div>

          {/* Pratinjau File Lampiran */}
          <div className="space-y-2">
            <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Berkas Scan Digital
            </div>
            {surat.fileName ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileCheck2 className="size-5 shrink-0 text-indigo-600" />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-slate-900">
                      {surat.fileName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Klik Pratinjau untuk baca &amp; unduh langsung di aplikasi
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={() => onPreviewDoc(surat)}
                >
                  <Eye className="size-3.5" />
                  Pratinjau
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/40 p-4 text-center">
                <p className="text-xs font-medium text-amber-800">
                  Belum ada berkas scan PDF/gambar yang diunggah.
                </p>
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onEdit(surat);
                    }}
                  >
                    <Upload className="size-3.5" />
                    Unggah Scan Sekarang
                  </Button>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Tombol Aksi Cepat */}
          {canManage && (
            <div className="flex items-center gap-2 pt-1">
              <Button
                className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(surat);
                }}
              >
                <Pencil className="size-4" />
                {isSlotKosong ? "Lengkapi Nomor Ini" : "Ubah / Upload Scan"}
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => {
                  onOpenChange(false);
                  onDelete(surat);
                }}
              >
                <Trash2 className="size-4" />
                Hapus
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
