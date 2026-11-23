"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  FileSpreadsheet,
  FileUp,
  Loader2,
  PenLine,
  UploadCloud,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { THEMES } from "@/lib/theme";
import type { Arah } from "@/lib/types";
import { downloadCsv, sleep } from "@/lib/utils";
import { KlasifikasiCombobox } from "@/components/shared/klasifikasi-combobox";
import { PageHeader } from "@/components/shared/page-header";
import { TablePageSkeleton } from "@/components/shared/page-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const CSV_HEADERS = ["arah", "nomor", "urut", "jenis", "tanggal", "pihak", "perihal", "catatan"];
const SAMPLE_ROWS = [
  [
    "keluar",
    "34.114/001/SK/SMKNST/I/2025",
    "1",
    "SK",
    "2025-01-06",
    "Seluruh Dewan Guru",
    "SK Pembagian Tugas Semester Genap 2025",
    "Arsip map 2025",
  ],
  [
    "masuk",
    "421.5/088/DISDIK/2025",
    "",
    "",
    "2025-02-12",
    "Cabang Dinas Pendidikan",
    "Undangan Rapat Koordinasi Kepala SMK",
    "[Disposisi: Kepala TU] Dihadiri Kepala Sekolah",
  ],
];

export default function ImporPage() {
  const theme = THEMES.amber;
  const { klasifikasiList, saveSurat, importCsvSurat } = useApp();

  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);

  // State form manual arsip lama
  const [arah, setArah] = useState<Arah>("keluar");
  const [nomor, setNomor] = useState("");
  const [urut, setUrut] = useState("1");
  const [jenis, setJenis] = useState(klasifikasiList[0]?.kode ?? "SK");
  const [tanggal, setTanggal] = useState("2025-12-15");
  const [pihak, setPihak] = useState("");
  const [perihal, setPerihal] = useState("");
  const [catatan, setCatatan] = useState("");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 220);
    return () => clearTimeout(timer);
  }, []);

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pihak.trim() || !perihal.trim() || isSaving) return;
    setIsSaving(true);
    await sleep(280);
    const created = saveSurat({
      arah,
      nomorManual: nomor.trim(),
      urutManual: arah === "keluar" ? Number(urut) || 1 : undefined,
      jenis: arah === "keluar" ? jenis : "",
      tanggal,
      pihak: pihak.trim(),
      perihal: perihal.trim(),
      catatan: catatan.trim(),
      fileName: fileName || undefined,
    });
    setIsSaving(false);
    setPihak("");
    setPerihal("");
    setCatatan("");
    setNomor("");
    setFileName("");
    toast.success("Arsip lama berhasil disimpan", {
      description: created.nomor || created.perihal,
    });
  }

  async function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || isImportingCsv) return;
    setIsImportingCsv(true);
    await sleep(320);

    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      setIsImportingCsv(false);
      toast.error("File CSV kosong atau belum memiliki baris data.");
      return;
    }

    const parsed = lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
      const rowArah: Arah = cols[0]?.toLowerCase() === "masuk" ? "masuk" : "keluar";
      const rowTanggal = cols[4] || "2026-01-01";
      return {
        arah: rowArah,
        nomor: cols[1] || "",
        urut: rowArah === "keluar" ? Number(cols[2]) || 1 : ("" as const),
        tahun: Number(rowTanggal.slice(0, 4)) || 2026,
        jenis: rowArah === "keluar" ? cols[3] || "B" : "",
        tanggal: rowTanggal,
        pihak: cols[5] || "-",
        perihal: cols[6] || "-",
        catatan: cols[7] || "",
      };
    });

    const count = importCsvSurat(parsed);
    setIsImportingCsv(false);
    toast.success(`Berhasil mengimpor ${count} baris surat`, {
      description: `Sumber berkas: ${file.name}`,
    });
    e.target.value = "";
  }

  if (initialLoading) {
    return <TablePageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Impor Arsip Lama"
        description="Masukkan arsip surat terdahulu secara satuan (beserta scan) atau sekaligus lewat CSV."
        icon={FileUp}
        theme="amber"
      />

      <Tabs defaultValue="csv">
        <TabsList>
          <TabsTrigger value="csv">
            <FileSpreadsheet className="size-4" />
            Impor Massal CSV
          </TabsTrigger>
          <TabsTrigger value="manual">
            <PenLine className="size-4" />
            Input Arsip Lama + Scan
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Impor CSV */}
        <TabsContent value="csv">
          <Card>
            <CardHeader className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="text-base">Unggah File CSV Arsip</CardTitle>
                <CardDescription>
                  Kode klasifikasi tersedia:{" "}
                  {klasifikasiList.map((k) => k.kode).join(", ")}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    downloadCsv("template-kosong-surat.csv", CSV_HEADERS, []);
                    toast.info("Template CSV kosong diunduh");
                  }}
                >
                  <Download className="size-3.5" />
                  Template Kosong
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    downloadCsv("contoh-impor-surat.csv", CSV_HEADERS, SAMPLE_ROWS);
                    toast.info("Contoh CSV terisi diunduh");
                  }}
                >
                  <Download className="size-3.5" />
                  Contoh Terisi
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {CSV_HEADERS.map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE_ROWS.map((row, idx) => (
                      <TableRow key={idx}>
                        {row.map((val, j) => (
                          <TableCell key={j} className="text-xs text-slate-600">
                            {val || <span className="text-slate-300">—</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-8 text-center transition-colors hover:bg-amber-50/80">
                <div className="flex size-11 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  {isImportingCsv ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <UploadCloud className="size-5" />
                  )}
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {isImportingCsv
                    ? "Memproses baris CSV..."
                    : "Klik untuk memilih file CSV dari komputer"}
                </div>
                <p className="text-xs text-slate-500">
                  Format .csv UTF-8 · Langsung terimpor ke tabel Surat Keluar & Masuk (mode demo)
                </p>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  disabled={isImportingCsv}
                  onChange={handleCsvFile}
                  className="hidden"
                />
              </label>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Input Manual Arsip Lama */}
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Input Satuan Arsip Lama</CardTitle>
                  <CardDescription>
                    Cocok untuk menyalin buku agenda lama satu per satu lengkap dengan scan PDF.
                  </CardDescription>
                </div>
                <Badge variant="amber">Nomor Bebas</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Arah Surat</Label>
                    <Select value={arah} onValueChange={(v) => setArah(v as Arah)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="keluar">Surat Keluar</SelectItem>
                        <SelectItem value="masuk">Surat Masuk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="imp-tanggal">Tanggal Surat</Label>
                    <Input
                      id="imp-tanggal"
                      type="date"
                      required
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                    />
                  </div>

                  {arah === "keluar" && (
                    <div className="space-y-1.5">
                      <Label>Jenis Klasifikasi (Searchable)</Label>
                      <KlasifikasiCombobox
                        items={klasifikasiList}
                        value={jenis}
                        onValueChange={setJenis}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="imp-nomor">Nomor Surat Tercatat</Label>
                    <Input
                      id="imp-nomor"
                      required={arah === "keluar"}
                      placeholder="Contoh: 34.114/089/SK/SMKNST/XII/2025"
                      value={nomor}
                      onChange={(e) => setNomor(e.target.value)}
                    />
                  </div>
                  {arah === "keluar" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="imp-urut">Nomor Urut Agenda</Label>
                      <Input
                        id="imp-urut"
                        type="number"
                        min={1}
                        value={urut}
                        onChange={(e) => setUrut(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="imp-pihak">
                      {arah === "keluar" ? "Tujuan Surat" : "Pengirim Surat"}
                    </Label>
                    <Input
                      id="imp-pihak"
                      required
                      value={pihak}
                      onChange={(e) => setPihak(e.target.value)}
                      placeholder="Nama instansi / penerima"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="imp-perihal">Perihal</Label>
                    <Input
                      id="imp-perihal"
                      required
                      value={perihal}
                      onChange={(e) => setPerihal(e.target.value)}
                      placeholder="Pokok surat"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="imp-catatan">Catatan Arsip</Label>
                  <Textarea
                    id="imp-catatan"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Lokasi map fisik / keterangan tambahan..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="imp-file">File Scan PDF / Gambar (Opsional)</Label>
                  <Input
                    id="imp-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving} className={theme.buttonPrimary}>
                    {isSaving && <Loader2 className="size-4 animate-spin" />}
                    {isSaving ? "Menyimpan..." : "Simpan ke Arsip"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
