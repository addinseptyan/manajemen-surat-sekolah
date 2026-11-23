"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { useApp } from "@/context/app-context";
import type { Arah } from "@/lib/types";
import { downloadCsv, sleep } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CSV_HEADERS = ["nomor", "urut", "jenis", "tanggal", "pihak", "perihal", "catatan"];

interface CsvImportDialogProps {
  arah: Arah;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CsvImportDialog({ arah, open, onOpenChange }: CsvImportDialogProps) {
  const isKeluar = arah === "keluar";
  const { klasifikasiList, importCsvSurat } = useApp();
  const [isImporting, setIsImporting] = useState(false);

  const sampleRows = isKeluar
    ? [
        [
          "001/34.114/SK/SMKNST/I/2025",
          "1",
          "SK",
          "2025-01-06",
          "Seluruh Dewan Guru",
          "SK Pembagian Tugas Semester Genap 2025",
          "Arsip map 2025",
        ],
      ]
    : [
        [
          "421.5/088/DISDIK/2025",
          "",
          "",
          "2025-02-12",
          "Cabang Dinas Pendidikan",
          "Undangan Rapat Koordinasi Kepala SMK",
          "[Disposisi: Kepala TU] Dihadiri Kepala Sekolah",
        ],
      ];

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || isImporting) return;
    setIsImporting(true);
    await sleep(300);

    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      setIsImporting(false);
      toast.error("File CSV kosong atau belum memiliki baris data.");
      return;
    }

    const parsed = lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
      // Mendukung CSV 7 kolom (tanpa kolom arah) maupun 8 kolom lama (dengan kolom arah di depan)
      const hasArahCol =
        cols[0]?.toLowerCase() === "keluar" || cols[0]?.toLowerCase() === "masuk";
      const offset = hasArahCol ? 1 : 0;
      const rowTanggal = cols[offset + 3] || "2026-01-01";
      return {
        arah,
        nomor: cols[offset] || "",
        urut: isKeluar ? Number(cols[offset + 1]) || 1 : ("" as const),
        tahun: Number(rowTanggal.slice(0, 4)) || 2026,
        jenis: isKeluar ? cols[offset + 2] || "B" : "",
        tanggal: rowTanggal,
        pihak: cols[offset + 4] || "-",
        perihal: cols[offset + 5] || "-",
        catatan: cols[offset + 6] || "",
      };
    });

    const count = importCsvSurat(parsed);
    setIsImporting(false);
    onOpenChange(false);
    toast.success(`Berhasil mengimpor ${count} baris ${isKeluar ? "Surat Keluar" : "Surat Masuk"}`, {
      description: `Sumber: ${file.name}`,
    });
    e.target.value = "";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-amber-600" />
            Impor CSV {isKeluar ? "Surat Keluar" : "Surat Masuk"}
          </DialogTitle>
          <DialogDescription>
            Unggah banyak data arsip lama sekaligus.{" "}
            {isKeluar && `Kode jenis tersedia: ${klasifikasiList.map((k) => k.kode).join(", ")}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs">
            <span className="font-medium text-slate-600">Unduh format kolom CSV:</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadCsv(`template-${arah}.csv`, CSV_HEADERS, [])
                }
              >
                <Download className="size-3.5" />
                Template Kosong
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadCsv(`contoh-${arah}.csv`, CSV_HEADERS, sampleRows)
                }
              >
                <Download className="size-3.5" />
                Contoh Terisi
              </Button>
            </div>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-7 text-center transition-colors hover:bg-amber-50/80">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              {isImporting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <UploadCloud className="size-5" />
              )}
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {isImporting ? "Memproses CSV..." : "Pilih file CSV dari komputer"}
            </div>
            <p className="text-xs text-slate-500">
              Kolom: {CSV_HEADERS.join(", ")}
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={isImporting}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </DialogContent>
    </Dialog>
  );
}
