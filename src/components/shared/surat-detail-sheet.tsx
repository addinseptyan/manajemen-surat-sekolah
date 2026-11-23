"use client";

import { toast } from "sonner";
import {
  Ban,
  Calendar,
  Copy,
  ExternalLink,
  FileCheck2,
  Pencil,
  Send,
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
  onCancel: (surat: Surat) => void;
}

export function SuratDetailSheet({
  surat,
  open,
  onOpenChange,
  canManage,
  onEdit,
  onCancel,
}: SuratDetailSheetProps) {
  if (!surat) return null;

  const isKeluar = surat.arah === "keluar";
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
            <Badge variant={surat.status === "Batal" ? "destructive" : "outline"}>
              {surat.status}
            </Badge>
            {surat.jenis && (
              <Badge variant="violet" className="font-mono">
                {surat.jenis}
              </Badge>
            )}
          </div>
          <SheetTitle className="mt-1 leading-snug">{surat.perihal}</SheetTitle>
          <SheetDescription>
            Detail lengkap arsip surat & riwayat pencatatan Tata Usaha.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5 text-sm">
          {/* Blok Nomor Surat */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
            <div className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              Nomor Resmi Surat
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-bold text-slate-900 break-all">
                {surat.nomor || "Belum bernomor"}
              </span>
              {surat.nomor && (
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

          {/* Disposisi (khusus Surat Masuk atau jika ada tag) */}
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
              Berkas Digital (Google Drive)
            </div>
            {surat.fileName ? (
              <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileCheck2 className="size-5 shrink-0 text-indigo-600" />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-slate-900">
                      {surat.fileName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Tersimpan di folder arsip Drive (simulasi demo)
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast.info("Simulasi Pratinjau Drive", {
                      description: `Pada mode produksi, tombol ini membuka berkas "${surat.fileName}" langsung dari Google Drive sekolah.`,
                    })
                  }
                >
                  <ExternalLink className="size-3.5" />
                  Buka
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                Belum ada scan PDF/gambar yang dilampirkan.
              </div>
            )}
          </div>

          {/* Riwayat Pembatalan bila Batal */}
          {surat.status === "Batal" && (
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-3.5 text-xs text-red-800">
              <div className="font-semibold">Nomor Dibatalkan & Dikunci</div>
              <p className="mt-1">Alasan: {surat.alasanBatal || "-"}</p>
              <p className="mt-0.5 text-red-600/80">
                Oleh {surat.batalOleh || "-"} pada {surat.batalWaktu || "-"}
              </p>
            </div>
          )}

          <Separator />

          {/* Tombol Aksi Cepat */}
          {canManage && surat.status === "Aktif" && (
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(surat);
                }}
              >
                <Pencil className="size-4" />
                Ubah Data
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  onOpenChange(false);
                  onCancel(surat);
                }}
              >
                <Ban className="size-4" />
                Batalkan Nomor
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
