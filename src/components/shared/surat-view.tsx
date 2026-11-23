"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Inbox,
  Loader2,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Printer,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { THEMES } from "@/lib/theme";
import type { Arah, Surat } from "@/lib/types";
import {
  cn,
  composeDisposisi,
  DISPOSISI_OPTIONS,
  downloadCsv,
  formatNomorSurat,
  parseDisposisi,
  sleep,
} from "@/lib/utils";
import { CsvImportDialog } from "@/components/shared/csv-import-dialog";
import { DocumentPreviewDialog } from "@/components/shared/document-preview-dialog";
import { KlasifikasiCombobox } from "@/components/shared/klasifikasi-combobox";
import { PageHeader } from "@/components/shared/page-header";
import { TablePageSkeleton } from "@/components/shared/page-skeletons";
import { SuratDetailSheet } from "@/components/shared/surat-detail-sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";

const PAGE_SIZE = 8;

type FilterKelengkapan = "ALL" | "SLOT_KOSONG" | "TANPA_SCAN" | "LENGKAP_SCAN";

interface SuratViewProps {
  arah: Arah;
}

export function SuratView({ arah }: SuratViewProps) {
  const isKeluar = arah === "keluar";
  const themeKey = isKeluar ? "blue" : "emerald";
  const theme = THEMES[themeKey];

  const {
    suratList,
    klasifikasiList,
    pengaturan,
    currentUser,
    getNextUrut,
    getMissingUrutBefore,
    saveSurat,
    deleteSurat,
  } = useApp();

  // Loading & modal states
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);

  // Filter & Pagination state
  const [query, setQuery] = useState("");
  const [filterJenis, setFilterJenis] = useState("ALL");
  const [filterKelengkapan, setFilterKelengkapan] = useState<FilterKelengkapan>("ALL");
  const [filterTahun, setFilterTahun] = useState("2026");
  const [page, setPage] = useState(1);

  // Detail Sheet & Document Preview state
  const [detailSurat, setDetailSurat] = useState<Surat | null>(null);
  const [previewDocSurat, setPreviewDocSurat] = useState<Surat | null>(null);

  // Dialog Tambah/Ubah state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSurat, setEditingSurat] = useState<Surat | null>(null);
  const [formTanggal, setFormTanggal] = useState("2026-11-23");
  const [formUrut, setFormUrut] = useState("8");
  const [urutTouched, setUrutTouched] = useState(false);
  const [formJenis, setFormJenis] = useState(klasifikasiList[0]?.kode ?? "B");
  const [formNomorMasuk, setFormNomorMasuk] = useState("");
  const [formPihak, setFormPihak] = useState("");
  const [formPerihal, setFormPerihal] = useState("");
  const [formDisposisi, setFormDisposisi] = useState<string[]>([]);
  const [formCatatan, setFormCatatan] = useState("");
  const [formFileName, setFormFileName] = useState("");
  const [formFileBlobUrl, setFormFileBlobUrl] = useState<string | undefined>(undefined);
  const [formFileMime, setFormFileMime] = useState<string | undefined>(undefined);

  // AlertDialog Hapus state
  const [deletingSurat, setDeletingSurat] = useState<Surat | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 240);
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get("q");
    if (qParam) setQuery(qParam);
    const fParam = params.get("filter");
    if (fParam === "slot") setFilterKelengkapan("SLOT_KOSONG");
    if (fParam === "scan") setFilterKelengkapan("TANPA_SCAN");
    if (params.get("new") === "1") {
      openCreateDialog();
      window.history.replaceState({}, "", window.location.pathname);
    }
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hitung tunggakan pada tahun yang sedang dipilih untuk banner pengingat penertiban
  const arahTahunList = useMemo(
    () =>
      suratList.filter(
        (s) => s.arah === arah && (filterTahun === "ALL" ? true : String(s.tahun) === filterTahun)
      ),
    [suratList, arah, filterTahun]
  );

  const slotKosongCount = arahTahunList.filter((s) => s.status === "Belum Lengkap").length;
  const tanpaScanCount = arahTahunList.filter(
    (s) => s.status === "Lengkap" && !s.fileName
  ).length;

  const filtered = useMemo(() => {
    return arahTahunList
      .filter((s) => (isKeluar && filterJenis !== "ALL" ? s.jenis === filterJenis : true))
      .filter((s) => {
        if (filterKelengkapan === "SLOT_KOSONG") return s.status === "Belum Lengkap";
        if (filterKelengkapan === "TANPA_SCAN")
          return s.status === "Lengkap" && !s.fileName;
        if (filterKelengkapan === "LENGKAP_SCAN")
          return s.status === "Lengkap" && Boolean(s.fileName);
        return true;
      })
      .filter((s) => {
        if (!query.trim()) return true;
        const haystack =
          `${s.nomor} ${s.pihak} ${s.perihal} ${s.catatan} ${s.pembuat}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
      .sort((a, b) => {
        if (isKeluar && a.tahun === b.tahun && typeof a.urut === "number" && typeof b.urut === "number") {
          return b.urut - a.urut;
        }
        return b.tanggal.localeCompare(a.tanggal);
      });
  }, [arahTahunList, isKeluar, filterJenis, filterKelengkapan, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const formTahun = Number(formTanggal.slice(0, 4)) || 2026;
  const targetUrutNum = Math.max(1, Number(formUrut) || 1);

  const pendingGapList = useMemo(() => {
    if (!isKeluar || editingSurat) return [];
    return getMissingUrutBefore(formTahun, targetUrutNum);
  }, [isKeluar, editingSurat, getMissingUrutBefore, formTahun, targetUrutNum]);

  const previewNomorKeluar = useMemo(() => {
    if (!isKeluar) return "";
    return formatNomorSurat(
      pengaturan.format,
      pengaturan.pad,
      targetUrutNum,
      formJenis,
      formTanggal
    );
  }, [isKeluar, pengaturan, targetUrutNum, formJenis, formTanggal]);

  function openCreateDialog() {
    const today = new Date().toISOString().slice(0, 10);
    const yr = Number(today.slice(0, 4)) || 2026;
    setEditingSurat(null);
    setFormTanggal(today);
    setFormUrut(String(getNextUrut(yr)));
    setUrutTouched(false);
    setFormJenis(klasifikasiList[0]?.kode ?? "B");
    setFormNomorMasuk("");
    setFormPihak("");
    setFormPerihal("");
    setFormDisposisi([]);
    setFormCatatan("");
    setFormFileName("");
    setFormFileBlobUrl(undefined);
    setFormFileMime(undefined);
    setDialogOpen(true);
  }

  function openEditDialog(item: Surat) {
    const isSlot = item.status === "Belum Lengkap";
    const parsed = parseDisposisi(item.catatan);
    setEditingSurat(item);
    setFormTanggal(item.tanggal);
    setFormUrut(String(typeof item.urut === "number" ? item.urut : 1));
    setUrutTouched(true);
    setFormJenis(item.jenis || klasifikasiList[0]?.kode || "B");
    setFormNomorMasuk(item.nomor);
    setFormPihak(isSlot ? "" : item.pihak);
    setFormPerihal(isSlot ? "" : item.perihal);
    setFormDisposisi(parsed.tags);
    setFormCatatan(isSlot ? "" : parsed.cleanNote);
    setFormFileName(item.fileName ?? "");
    setFormFileBlobUrl(item.fileUrl?.startsWith("blob:") ? item.fileUrl : undefined);
    setFormFileMime(item.fileMime);
    setDialogOpen(true);
  }

  function handleTanggalChange(nextDate: string) {
    setFormTanggal(nextDate);
    // Jika tambah baru & user belum mengunci nomor urut manual, otomatis sesuaikan per tahun (mis. pilih 2027 -> reset 001!)
    if (!editingSurat && !urutTouched) {
      const nextYr = Number(nextDate.slice(0, 4));
      if (nextYr >= 2000) {
        setFormUrut(String(getNextUrut(nextYr)));
      }
    }
  }

  function toggleDisposisiTag(tag: string) {
    setFormDisposisi((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formPihak.trim() || !formPerihal.trim() || isSaving) return;
    setIsSaving(true);
    await sleep(280);

    const finalCatatan = isKeluar
      ? formCatatan.trim()
      : composeDisposisi(formDisposisi, formCatatan);

    const { saved, generatedGaps } = saveSurat({
      id: editingSurat?.id,
      arah,
      urutManual: isKeluar ? targetUrutNum : undefined,
      jenis: isKeluar ? formJenis : "",
      nomorManual: isKeluar ? undefined : formNomorMasuk,
      tanggal: formTanggal,
      pihak: formPihak.trim(),
      perihal: formPerihal.trim(),
      catatan: finalCatatan,
      fileName: formFileName.trim() || undefined,
      fileUrl: formFileBlobUrl,
      fileMime: formFileMime,
    });

    setIsSaving(false);
    setDialogOpen(false);

    const gapNote =
      generatedGaps.length > 0
        ? ` · ${generatedGaps.length} slot kosong otomatis ditandai Belum Lengkap`
        : "";

    toast.success(
      editingSurat ? "Data surat berhasil diperbarui" : "Surat berhasil diterbitkan",
      {
        description: `${saved.nomor || saved.perihal}${gapNote}`,
        action: saved.nomor
          ? {
              label: "Salin Nomor",
              onClick: () => navigator.clipboard.writeText(saved.nomor),
            }
          : undefined,
      }
    );
  }

  function handleConfirmDelete() {
    if (!deletingSurat) return;
    deleteSurat(deletingSurat.id);
    toast.success("Baris arsip surat telah dihapus", {
      description: deletingSurat.nomor || deletingSurat.perihal,
    });
    setDeletingSurat(null);
  }

  function handleExportCsv() {
    downloadCsv(
      `arsip-surat-${arah}-${filterTahun}.csv`,
      ["Tanggal", "Nomor", "Urut", isKeluar ? "Jenis" : "Asal", "Pihak", "Perihal", "Catatan", "Berkas", "Status"],
      filtered.map((s) => [
        s.tanggal,
        s.nomor,
        String(s.urut),
        isKeluar ? s.jenis : "Masuk",
        s.pihak,
        s.perihal,
        s.catatan,
        s.fileName ?? "",
        s.status,
      ])
    );
    toast.success("Berkas CSV berhasil diunduh", {
      description: `${filtered.length} baris surat diekspor.`,
    });
  }

  if (initialLoading) {
    return <TablePageSkeleton />;
  }

  const activeDetailCanManage = Boolean(
    detailSurat &&
      (currentUser.role === "admin" ||
        detailSurat.pembuat === currentUser.nama ||
        detailSurat.status === "Belum Lengkap")
  );

  return (
    <div>
      {/* Area Interaktif Layar */}
      <div className="print:hidden">
        <PageHeader
          title={isKeluar ? "Surat Keluar" : "Surat Masuk"}
          description={
            isKeluar
              ? "Penomoran otomatis per tahun (reset 001 tiap tahun baru) & penertiban nomor lompat."
              : "Pencatatan surat masuk dari instansi luar, disposisi, dan pratinjau berkas scan."
          }
          icon={isKeluar ? Send : Inbox}
          theme={themeKey}
          actions={
            <>
              <Button variant="outline" onClick={() => setCsvOpen(true)}>
                <FileSpreadsheet className="size-4 text-amber-600" />
                Impor CSV
              </Button>
              <Button variant="outline" onClick={handleExportCsv}>
                <Download className="size-4" />
                Unduh CSV
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="size-4" />
                Cetak Agenda
              </Button>
              <Button className={theme.buttonPrimary} onClick={openCreateDialog}>
                <Plus className="size-4" />
                {isKeluar ? "Buat Surat Keluar" : "Catat Surat Masuk"}
              </Button>
            </>
          }
        />

        {/* Banner Peringatan Penertiban Administrasi */}
        {(slotKosongCount > 0 || tanpaScanCount > 0) && (
          <div className="mb-4 flex flex-col justify-between gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50/60 to-white p-3.5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-2.5 text-xs text-amber-950">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <div>
                <span className="font-semibold">Pengingat Penertiban Arsip: </span>
                {slotKosongCount > 0 && (
                  <span>
                    <b>{slotKosongCount} nomor urut kosong</b> belum ditemukan berkasnya
                    {tanpaScanCount > 0 ? " dan " : ". "}
                  </span>
                )}
                {tanpaScanCount > 0 && (
                  <span>
                    <b>{tanpaScanCount} surat</b> belum diunggah scan PDF/gambarnya.
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              {slotKosongCount > 0 && (
                <Button
                  size="sm"
                  variant={filterKelengkapan === "SLOT_KOSONG" ? "default" : "outline"}
                  onClick={() => {
                    setFilterKelengkapan(
                      filterKelengkapan === "SLOT_KOSONG" ? "ALL" : "SLOT_KOSONG"
                    );
                    setPage(1);
                  }}
                  className="h-7 text-xs"
                >
                  Cek Nomor Kosong ({slotKosongCount})
                </Button>
              )}
              {tanpaScanCount > 0 && (
                <Button
                  size="sm"
                  variant={filterKelengkapan === "TANPA_SCAN" ? "default" : "outline"}
                  onClick={() => {
                    setFilterKelengkapan(
                      filterKelengkapan === "TANPA_SCAN" ? "ALL" : "TANPA_SCAN"
                    );
                    setPage(1);
                  }}
                  className="h-7 text-xs"
                >
                  Belum Scan ({tanpaScanCount})
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <Card className="mb-4 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder={
                  isKeluar
                    ? "Cari nomor surat, tujuan, perihal, atau pembuat..."
                    : "Cari nomor asal, pengirim, perihal, atau disposisi..."
                }
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-8"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isKeluar && (
                <KlasifikasiCombobox
                  items={klasifikasiList}
                  value={filterJenis}
                  onValueChange={(v) => {
                    setFilterJenis(v);
                    setPage(1);
                  }}
                  includeAllOption
                  allLabel="Semua Jenis (A–Z)"
                  className="w-48"
                />
              )}

              <Select
                value={filterKelengkapan}
                onValueChange={(v) => {
                  setFilterKelengkapan(v as FilterKelengkapan);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Kelengkapan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Kelengkapan</SelectItem>
                  <SelectItem value="LENGKAP_SCAN">Lengkap + Scan</SelectItem>
                  <SelectItem value="TANPA_SCAN">Belum Ada Scan</SelectItem>
                  {isKeluar && (
                    <SelectItem value="SLOT_KOSONG">Nomor Kosong (Dicari)</SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Select
                value={filterTahun}
                onValueChange={(v) => {
                  setFilterTahun(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua</SelectItem>
                  <SelectItem value="2027">2027</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Tabel Data */}
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Tanggal</TableHead>
                <TableHead>Nomor Surat</TableHead>
                <TableHead>{isKeluar ? "Tujuan" : "Instansi Pengirim"}</TableHead>
                <TableHead>Perihal &amp; {isKeluar ? "Catatan" : "Disposisi"}</TableHead>
                <TableHead className="w-36">Kelengkapan</TableHead>
                <TableHead className="w-14 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((row) => {
                const isSlot = row.status === "Belum Lengkap";
                const canManage =
                  currentUser.role === "admin" ||
                  row.pembuat === currentUser.nama ||
                  isSlot;
                const { tags: dispTags, cleanNote } = parseDisposisi(row.catatan);

                return (
                  <TableRow
                    key={row.id}
                    onClick={() => setDetailSurat(row)}
                    className={cn(
                      "cursor-pointer",
                      isSlot && "bg-amber-50/50 hover:bg-amber-50/90"
                    )}
                  >
                    <TableCell className="text-xs font-medium text-slate-600 whitespace-nowrap">
                      {row.tanggal}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-mono text-xs font-semibold",
                            isSlot ? "text-amber-800" : "text-slate-900"
                          )}
                        >
                          {row.nomor || "—"}
                        </span>
                        {row.jenis && (
                          <Badge variant={isKeluar ? "blue" : "emerald"} className="text-[10px]">
                            {row.jenis}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        {isSlot ? "Perlu dilengkapi TU" : `Oleh ${row.pembuat}`}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-48 font-medium text-slate-800">
                      <div
                        className={cn("truncate", isSlot && "italic text-amber-800")}
                        title={row.pihak}
                      >
                        {row.pihak}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div
                        className={cn(
                          "font-medium",
                          isSlot ? "text-amber-900" : "text-slate-800"
                        )}
                      >
                        {row.perihal}
                      </div>
                      {dispTags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {dispTags.map((t) => (
                            <Badge key={t} variant="emerald" className="px-2 py-0 text-[10px]">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {cleanNote && (
                        <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                          {cleanNote}
                        </div>
                      )}
                      {row.fileName && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDocSurat(row);
                          }}
                          className="mt-1 inline-flex cursor-pointer items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                          <Paperclip className="size-3" />
                          {row.fileName}
                        </button>
                      )}
                    </TableCell>
                    <TableCell>
                      {isSlot ? (
                        <Badge variant="amber">
                          <AlertTriangle className="size-3" />
                          Nomor Kosong
                        </Badge>
                      ) : row.fileName ? (
                        <Badge variant="emerald">Lengkap + Scan</Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-200 text-amber-700">
                          Belum Scan
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Menu baris">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailSurat(row)}>
                            <Eye className="size-4" />
                            Lihat Detail
                          </DropdownMenuItem>
                          {row.fileName && (
                            <DropdownMenuItem onClick={() => setPreviewDocSurat(row)}>
                              <FileText className="size-4" />
                              Pratinjau &amp; Unduh Scan
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            disabled={!canManage}
                            onClick={() => openEditDialog(row)}
                          >
                            <Pencil className="size-4" />
                            {isSlot ? "Lengkapi Nomor Ini" : "Ubah / Upload Scan"}
                          </DropdownMenuItem>
                          {canManage && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeletingSurat(row)}
                              >
                                <Trash2 className="size-4" />
                                Hapus Baris
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}

              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-slate-400">
                      <FileText className="size-8 stroke-1" />
                      <p className="text-sm font-medium text-slate-600">
                        Belum ada surat pada filter ini
                      </p>
                      <p className="text-xs">
                        Coba ganti tahun/filter atau klik tombol buat surat baru di kanan atas.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Footer Pagination */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
            <span>
              Menampilkan <b>{paginated.length}</b> dari <b>{filtered.length}</b> baris
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-3.5" />
                Sebelumnya
              </Button>
              <span className="px-2 font-medium text-slate-700">
                {safePage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Berikutnya
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Area Cetak Resmi Buku Agenda (Dinamis dari Pengaturan Sekolah) */}
      <div className="hidden print:block">
        <div className="border-b-2 border-black pb-3 text-center">
          <div className="text-sm font-semibold uppercase">{pengaturan.instansiInduk}</div>
          <div className="text-lg font-bold uppercase">{pengaturan.namaSekolah}</div>
          <div className="text-xs">{pengaturan.alamatSekolah}</div>
          <div className="mt-1 text-xs font-semibold">
            BUKU AGENDA RESMI {isKeluar ? "SURAT KELUAR" : "SURAT MASUK"} · TAHUN{" "}
            {filterTahun === "ALL" ? "SEMUA TAHUN" : filterTahun}
          </div>
        </div>

        <table className="mt-4 w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-black px-2 py-1.5 text-left">No</th>
              <th className="border border-black px-2 py-1.5 text-left">Tanggal</th>
              <th className="border border-black px-2 py-1.5 text-left">Nomor Surat</th>
              <th className="border border-black px-2 py-1.5 text-left">
                {isKeluar ? "Tujuan" : "Pengirim"}
              </th>
              <th className="border border-black px-2 py-1.5 text-left">Perihal</th>
              <th className="border border-black px-2 py-1.5 text-left">
                {isKeluar ? "Kelengkapan" : "Disposisi / Catatan"}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, idx) => (
              <tr key={s.id}>
                <td className="border border-black px-2 py-1">{idx + 1}</td>
                <td className="border border-black px-2 py-1 whitespace-nowrap">{s.tanggal}</td>
                <td className="border border-black px-2 py-1 font-mono">{s.nomor || "-"}</td>
                <td className="border border-black px-2 py-1">{s.pihak}</td>
                <td className="border border-black px-2 py-1">{s.perihal}</td>
                <td className="border border-black px-2 py-1">
                  {isKeluar
                    ? s.status === "Belum Lengkap"
                      ? "Nomor Kosong"
                      : s.fileName
                        ? "Lengkap + Scan"
                        : "Belum Scan"
                    : s.catatan || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 flex justify-end text-xs">
          <div className="w-64 text-center">
            <div>
              {pengaturan.kotaSurat}, {new Date().toISOString().slice(0, 10)}
            </div>
            <div className="font-semibold">Kepala {pengaturan.namaSekolah}</div>
            <div className="h-16" />
            <div className="font-bold underline">{pengaturan.namaKepsek}</div>
            <div>NIP. {pengaturan.nipKepsek}</div>
          </div>
        </div>
      </div>

      {/* Modal Impor CSV Terpadu */}
      <CsvImportDialog arah={arah} open={csvOpen} onOpenChange={setCsvOpen} />

      {/* Modal In-App Document Preview + Download */}
      <DocumentPreviewDialog
        surat={previewDocSurat}
        open={Boolean(previewDocSurat)}
        onOpenChange={(open) => !open && setPreviewDocSurat(null)}
      />

      {/* Panel Slide-Over Detail Kanan */}
      <SuratDetailSheet
        surat={detailSurat}
        open={Boolean(detailSurat)}
        onOpenChange={(open) => !open && setDetailSurat(null)}
        canManage={activeDetailCanManage}
        onEdit={openEditDialog}
        onDelete={(s) => setDeletingSurat(s)}
        onPreviewDoc={(s) => setPreviewDocSurat(s)}
      />

      {/* Dialog Tambah / Ubah / Lengkapi Surat */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSurat
                ? editingSurat.status === "Belum Lengkap"
                  ? `Lengkapi Slot Nomor Urut ${String(editingSurat.urut).padStart(pengaturan.pad, "0")}`
                  : `Ubah ${isKeluar ? "Surat Keluar" : "Surat Masuk"}`
                : isKeluar
                  ? "Buat Surat Keluar Baru"
                  : "Catat Surat Masuk Baru"}
            </DialogTitle>
            <DialogDescription>
              {isKeluar
                ? "Nomor urut otomatis melanjutkan urutan tahun berjalan (reset ke 001 saat berganti tahun), atau dapat dilompati bila arsip sebelumnya belum ketemu."
                : "Masukkan detail surat yang diterima beserta tujuan disposisi dan berkas scan."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            {isKeluar && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium tracking-wide text-blue-700 uppercase">
                    Pratinjau Nomor Surat ({formTahun})
                  </span>
                  {formTahun >= 2027 && targetUrutNum === 1 && (
                    <Badge variant="emerald" className="text-[10px]">
                      Reset Tahun Baru 001
                    </Badge>
                  )}
                </div>
                <div className="mt-1 font-mono text-sm font-bold text-blue-950">
                  {previewNomorKeluar}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="tanggal">Tanggal Surat</Label>
                <Input
                  id="tanggal"
                  type="date"
                  required
                  value={formTanggal}
                  onChange={(e) => handleTanggalChange(e.target.value)}
                />
              </div>

              {isKeluar ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="urut-surat">Nomor Urut</Label>
                    <Input
                      id="urut-surat"
                      type="number"
                      min={1}
                      required
                      disabled={Boolean(editingSurat)}
                      value={formUrut}
                      onChange={(e) => {
                        setFormUrut(e.target.value);
                        setUrutTouched(true);
                      }}
                      className="font-mono font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Kode Jenis (A–Z)</Label>
                    <KlasifikasiCombobox
                      items={klasifikasiList}
                      value={formJenis}
                      onValueChange={setFormJenis}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="nomor-masuk">Nomor Surat Pengirim</Label>
                  <Input
                    id="nomor-masuk"
                    placeholder="Contoh: 421.5/112/DISDIK/2026"
                    value={formNomorMasuk}
                    onChange={(e) => setFormNomorMasuk(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Peringatan Otomatis jika Melompati Nomor Urut */}
            {pendingGapList.length > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <div>
                  <b>Lompat Nomor Terdeteksi:</b> Nomor urut{" "}
                  <code className="font-mono font-bold">
                    {pendingGapList
                      .slice(0, 6)
                      .map((n) => String(n).padStart(pengaturan.pad, "0"))
                      .join(", ")}
                    {pendingGapList.length > 6 ? "..." : ""}
                  </code>{" "}
                  belum ada di tahun {formTahun}. Sistem akan otomatis membuat{" "}
                  <b>{pendingGapList.length} slot pengingat &ldquo;Belum Lengkap&rdquo;</b> agar
                  berkasnya dicari &amp; di-scan nanti.
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="pihak">
                {isKeluar ? "Tujuan Surat" : "Instansi / Pihak Pengirim"}
              </Label>
              <Input
                id="pihak"
                required
                placeholder={
                  isKeluar ? "Contoh: Orang Tua Siswa Kelas XII" : "Contoh: Dinas Pendidikan Provinsi"
                }
                value={formPihak}
                onChange={(e) => setFormPihak(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="perihal">Perihal Surat</Label>
              <Input
                id="perihal"
                required
                placeholder="Ringkasan isi atau pokok surat"
                value={formPerihal}
                onChange={(e) => setFormPerihal(e.target.value)}
              />
            </div>

            {!isKeluar && (
              <div className="space-y-2">
                <Label>Tujuan Disposisi Cepat</Label>
                <div className="flex flex-wrap gap-1.5">
                  {DISPOSISI_OPTIONS.map((opt) => {
                    const selected = formDisposisi.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleDisposisiTag(opt)}
                        className={cn(
                          "cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                          selected
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="catatan">
                {isKeluar ? "Catatan Arsip (Opsional)" : "Instruksi Disposisi / Catatan"}
              </Label>
              <Textarea
                id="catatan"
                placeholder={
                  isKeluar
                    ? "Lokasi map fisik / keterangan tambahan..."
                    : "Contoh: Mohon ditindaklanjuti sebelum Jumat..."
                }
                value={formCatatan}
                onChange={(e) => setFormCatatan(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lampiran">Unggah Scan PDF / Gambar (Langsung Bisa Pratinjau)</Label>
              <Input
                id="lampiran"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormFileName(file.name);
                    setFormFileBlobUrl(URL.createObjectURL(file));
                    setFormFileMime(file.type);
                  }
                }}
              />
              {formFileName && (
                <p className="text-xs font-medium text-emerald-700">
                  Berkas terlampir: {formFileName}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSaving} className={theme.buttonPrimary}>
                {isSaving && <Loader2 className="size-4 animate-spin" />}
                {isSaving
                  ? "Menyimpan..."
                  : editingSurat
                    ? "Simpan & Lengkapi"
                    : "Simpan Surat"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Konfirmasi Hapus */}
      <AlertDialog
        open={Boolean(deletingSurat)}
        onOpenChange={(open) => !open && setDeletingSurat(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Baris Surat Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Data surat{" "}
              <b className="font-mono text-slate-800">
                {deletingSurat?.nomor || deletingSurat?.perihal}
              </b>{" "}
              akan dihapus dari daftar arsip. Jika ini adalah nomor urut paling akhir, nomor
              tersebut otomatis dapat dipakai kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
