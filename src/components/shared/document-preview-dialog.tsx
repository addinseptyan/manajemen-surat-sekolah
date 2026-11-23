"use client";

import { toast } from "sonner";
import { Download, FileCheck2, ShieldCheck } from "lucide-react";
import { useApp } from "@/context/app-context";
import type { Surat } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DocumentPreviewDialogProps {
  surat: Surat | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentPreviewDialog({
  surat,
  open,
  onOpenChange,
}: DocumentPreviewDialogProps) {
  const { pengaturan } = useApp();

  if (!surat) return null;

  const isRealBlob = surat.fileUrl?.startsWith("blob:");
  const isImage =
    surat.fileMime?.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif)$/i.test(surat.fileName ?? "");

  function handleDownload() {
    if (!surat) return;

    if (isRealBlob && surat.fileUrl) {
      const a = document.createElement("a");
      a.href = surat.fileUrl;
      a.download = surat.fileName || `dokumen-${surat.id}`;
      a.click();
      toast.success("Mengunduh berkas asli", { description: surat.fileName });
      return;
    }

    // Untuk berkas contoh mode demo, buat dokumen pratinjau HTML rapi yang langsung bisa dibuka/dicetak
    const htmlDoc = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>${surat.fileName || surat.nomor}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 720px; margin: 40px auto; padding: 24px; color: #111; line-height: 1.6; }
  .kop { text-align: center; border-bottom: 3px double #111; padding-bottom: 12px; margin-bottom: 24px; }
  .meta { margin-bottom: 20px; font-size: 14px; }
  .ttd { margin-top: 56px; float: right; width: 260px; text-align: center; }
</style>
</head>
<body>
  <div class="kop">
    <div style="font-size:13px;font-weight:bold;text-transform:uppercase">${pengaturan.instansiInduk}</div>
    <div style="font-size:20px;font-weight:bold;text-transform:uppercase">${pengaturan.namaSekolah}</div>
    <div style="font-size:12px">${pengaturan.alamatSekolah}</div>
  </div>
  <div class="meta">
    <div><b>Nomor:</b> ${surat.nomor || "-"}</div>
    <div><b>Tanggal:</b> ${surat.tanggal}</div>
    <div><b>${surat.arah === "keluar" ? "Kepada Yth" : "Pengirim"}:</b> ${surat.pihak}</div>
    <div><b>Perihal:</b> ${surat.perihal}</div>
  </div>
  <p>Dokumen ini adalah berkas contoh mode demo untuk arsip <b>${surat.fileName || "Surat"}</b>.</p>
  <p>${surat.catatan || ""}</p>
  <div class="ttd">
    <div>${pengaturan.kotaSurat}, ${surat.tanggal}</div>
    <div>Kepala ${pengaturan.namaSekolah}</div>
    <br/><br/><br/>
    <div><b><u>${pengaturan.namaKepsek}</u></b></div>
    <div>NIP. ${pengaturan.nipKepsek}</div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = (surat.fileName || "arsip-surat").replace(/\.[^.]+$/, "");
    a.download = `${baseName}-demo.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Berkas contoh berhasil diunduh", {
      description: "Pada mode produksi, tombol ini mengunduh PDF/JPG asli dari Google Drive.",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-3 sm:max-w-3xl">
        <DialogHeader className="pr-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileCheck2 className="size-5 text-indigo-600" />
              <DialogTitle className="text-base">
                {surat.fileName || "Pratinjau Dokumen Surat"}
              </DialogTitle>
              <Badge variant="blue" className="font-mono text-[11px]">
                {surat.nomor || "Tanpa Nomor"}
              </Badge>
            </div>

            <Button size="sm" onClick={handleDownload} className="bg-indigo-600 text-white hover:bg-indigo-700">
              <Download className="size-4" />
              Unduh Dokumen
            </Button>
          </div>
          <DialogDescription className="flex items-center gap-1.5 text-xs">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            Pratinjau langsung di dalam aplikasi — bebas masalah &ldquo;Request Access&rdquo; Google Drive.
          </DialogDescription>
        </DialogHeader>

        {/* Area Viewer Dokumen */}
        <div className="min-h-[420px] flex-1 overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-4">
          {isRealBlob && surat.fileUrl ? (
            isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={surat.fileUrl}
                alt={surat.fileName || "Lampiran surat"}
                className="mx-auto max-h-[65vh] rounded-lg bg-white object-contain shadow"
              />
            ) : (
              <iframe
                src={surat.fileUrl}
                title={surat.fileName || "PDF Preview"}
                className="h-[65vh] w-full rounded-lg bg-white shadow"
              />
            )
          ) : (
            /* Lembar Pratinjau Dokumen Contoh (Demo) */
            <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-slate-900 shadow-md">
              <div className="border-b-2 border-slate-900 pb-3 text-center">
                <div className="text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                  {pengaturan.instansiInduk}
                </div>
                <div className="text-base font-bold uppercase">{pengaturan.namaSekolah}</div>
                <div className="text-[11px] text-slate-500">{pengaturan.alamatSekolah}</div>
              </div>

              <div className="mt-5 grid grid-cols-[90px_1fr] gap-y-1.5 text-xs">
                <span className="text-slate-500">Nomor</span>
                <span className="font-mono font-semibold">: {surat.nomor || "-"}</span>
                <span className="text-slate-500">Tanggal</span>
                <span>: {surat.tanggal}</span>
                <span className="text-slate-500">
                  {surat.arah === "keluar" ? "Kepada Yth." : "Dari"}
                </span>
                <span className="font-medium">: {surat.pihak}</span>
                <span className="text-slate-500">Perihal</span>
                <span className="font-semibold">: {surat.perihal}</span>
              </div>

              <div className="mt-5 space-y-2.5 text-xs leading-relaxed text-slate-700">
                <p>Dengan hormat,</p>
                <p>
                   Ini adalah tampilan simulasi berkas scan <b>{surat.fileName}</b> di dalam
                  aplikasi. Jika Anda memilih file PDF/gambar asli dari komputer saat menambah atau
                  mengubah surat, file asli tersebut akan langsung tampil utuh di jendela ini.
                </p>
                {surat.catatan && (
                  <p className="rounded-md bg-slate-50 p-2.5 text-[11px] text-slate-600">
                    <b>Catatan Arsip:</b> {surat.catatan}
                  </p>
                )}
              </div>

              <div className="mt-10 flex justify-end text-xs">
                <div className="w-52 text-center">
                  <div>
                    {pengaturan.kotaSurat}, {surat.tanggal}
                  </div>
                  <div className="font-medium">Kepala {pengaturan.namaSekolah}</div>
                  <div className="h-12" />
                  <div className="font-bold underline">{pengaturan.namaKepsek}</div>
                  <div className="text-[11px] text-slate-500">NIP. {pengaturan.nipKepsek}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
