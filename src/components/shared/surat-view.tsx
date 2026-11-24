"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  FastForward,
  Inbox,
  Loader2,
  Lock,
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
  downloadCsv,
  formatNomorSurat,
  formatTanggalIndo,
  parseDisposisi,
} from "@/lib/utils";
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
import { Switch } from "@/components/ui/switch";
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
    isDataLoading,
    suratList,
    klasifikasiList,
    disposisiList,
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
  const [lompatUrutEnabled, setLompatUrutEnabled] = useState(false);
  const [formJenis, setFormJenis] = useState(klasifikasiList[0]?.kode ?? "B");
  const [formNomorMasuk, setFormNomorMasuk] = useState("");
  const [formPihak, setFormPihak] = useState("");
  const [formPerihal, setFormPerihal] = useState("");
  const [formDisposisi, setFormDisposisi] = useState<string[]>([]);
  const [formCatatan, setFormCatatan] = useState("");
  const [formFileName, setFormFileName] = useState("");
  const [formFileObj, setFormFileObj] = useState<File | undefined>(undefined);

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

  // Daftar jabatan disposisi aktif (ditambah tag lama bila sedang mengedit surat lama)
  const availableDisposisiNames = useMemo(() => {
    const activeNames = disposisiList.filter((d) => d.aktif).map((d) => d.nama);
    const merged = [...activeNames];
    for (const tag of formDisposisi) {
      if (!merged.includes(tag)) merged.push(tag);
    }
    return merged;
  }, [disposisiList, formDisposisi]);

  // Hitung tunggakan pada tahun yang sedang dipilih untuk banner pengingat penertiban
  const arahTahunList = useMemo(
    () =>
      suratList.filter(
        (s) =>
          s.arah === arah &&
          (filterTahun === "ALL" ? true : String(s.tahun) === filterTahun)
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
        if (
          isKeluar &&
          a.tahun === b.tahun &&
          typeof a.urut === "number" &&
          typeof b.urut === "number"
        ) {
          return b.urut - a.urut;
        }
        return b.tanggal.localeCompare(a.tanggal);
      });
  }, [arahTahunList, isKeluar, filterJenis, filterKelengkapan, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const formTahun = Number(formTanggal.slice(0, 4)) || 2026;
  const normalNextUrut = useMemo(() => getNextUrut(formTahun), [getNextUrut, formTahun]);
  const targetUrutNum = Math.max(1, Number(formUrut) || 1);

  const pendingGapList = useMemo(() => {
    if (!isKeluar || editingSurat || !lompatUrutEnabled) return [];
    return getMissingUrutBefore(formTahun, targetUrutNum);
  }, [isKeluar, editingSurat, lompatUrutEnabled, getMissingUrutBefore, formTahun, targetUrutNum]);

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
    setLompatUrutEnabled(false);
    setFormJenis(klasifikasiList[0]?.kode ?? "B");
    setFormNomorMasuk("");
    setFormPihak("");
    setFormPerihal("");
    setFormDisposisi([]);
    setFormCatatan("");
    setFormFileName("");
    setFormFileObj(undefined);
    setDialogOpen(true);
  }

  function openEditDialog(item: Surat) {
    const isSlot = item.status === "Belum Lengkap";
    const parsed = parseDisposisi(item.catatan);
    setEditingSurat(item);
    setFormTanggal(item.tanggal);
    setFormUrut(String(typeof item.urut === "number" ? item.urut : 1));
    setLompatUrutEnabled(false);
    setFormJenis(item.jenis || klasifikasiList[0]?.kode || "B");
    setFormNomorMasuk(item.nomor);
    setFormPihak(isSlot ? "" : item.pihak);
    setFormPerihal(isSlot ? "" : item.perihal);
    setFormDisposisi(parsed.tags);
    setFormCatatan(isSlot ? "" : parsed.cleanNote);
    setFormFileName(item.fileName ?? "");
    setFormFileObj(undefined);
    setDialogOpen(true);
  }

  function handleTanggalChange(nextDate: string) {
    setFormTanggal(nextDate);
    if (!editingSurat && !lompatUrutEnabled) {
      const nextYr = Number(nextDate.slice(0, 4));
      if (nextYr >= 2000) {
        setFormUrut(String(getNextUrut(nextYr)));
      }
    }
  }

  function handleToggleLompatUrut(checked: boolean) {
    setLompatUrutEnabled(checked);
    if (checked) {
      toast.warning("Mode Lompat Nomor Urut Diaktifkan", {
        description:
          "Nomor yang dilewati akan otomatis dicatat sebagai slot 'Belum Lengkap' agar arsip fisiknya ditertibkan.",
      });
    } else {
      setFormUrut(String(normalNextUrut));
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

    const finalCatatan = isKeluar
      ? formCatatan.trim()
      : composeDisposisi(formDisposisi, formCatatan);

    const effectiveUrut =
      isKeluar && !editingSurat
        ? lompatUrutEnabled
          ? targetUrutNum
          : normalNextUrut
        : isKeluar
          ? targetUrutNum
          : undefined;

    const res = await saveSurat({
      id: editingSurat?.id,
      arah,
      urutManual: effectiveUrut,
      jenis: isKeluar ? formJenis : "",
      nomorManual: isKeluar ? undefined : formNomorMasuk,
      tanggal: formTanggal,
      pihak: formPihak.trim(),
      perihal: formPerihal.trim(),
      catatan: finalCatatan,
      file: formFileObj,
    });

    setIsSaving(false);

    if (!res.ok || !res.saved) {
      toast.error("Gagal menyimpan surat", {
        description: res.error ?? "Terjadi kesalahan saat menyimpan.",
      });
      return;
    }

    setDialogOpen(false);
    const { saved, generatedGaps } = res;

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

  async function handleConfirmDelete() {
    if (!deletingSurat) return;
    const target = deletingSurat;
    setDeletingSurat(null);
    const res = await deleteSurat(target.id);
    if (!res.ok) {
      toast.error("Gagal menghapus surat", { description: res.error });
      return;
    }
    toast.success("Baris arsip surat telah dihapus", {
      description: target.nomor || target.perihal,
    });
  }

  function handleExportCsv() {
    downloadCsv(
      `arsip-surat-${arah}-${filterTahun}.csv`,
      [
        "Tanggal",
        "Tanggal Indo",
        "Nomor",
        "Urut",
        isKeluar ? "Jenis" : "Asal",
        "Pihak",
        "Perihal",
        "Catatan",
        "Berkas",
        "Status",
      ],
      filtered.map((s) => [
        s.tanggal,
        formatTanggalIndo(s.tanggal),
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

  if (initialLoading || isDataLoading) {
    return <TablePageSkeleton />;
  }

  const activeDetailCanManage = Boolean(
    detailSurat &&
      (currentUser.role === "admin" ||
        detailSurat.pembuat === currentUser.nama ||
        detailSurat.status === "Belum Lengkap")
  );

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div>
      {/* Area Interaktif Layar */}
      <div className="print:hidden">
        {/* Header Seimbang: Hanya CTA Utama di Kanan Atas */}
        <PageHeader
          title={isKeluar ? "Surat Keluar" : "Surat Masuk"}
          description={
            isKeluar
              ? "Penomoran otomatis per tahun (reset 001 tiap tahun baru) & penertiban nomor lompat."
              : "Pencatatan surat masuk dari instansi luar, disposisi cepat, dan pratinjau berkas scan."
          }
          icon={isKeluar ? Send : Inbox}
          theme={themeKey}
          actions={
            <Button
              className={cn("w-full sm:w-auto", theme.buttonPrimary)}
              onClick={openCreateDialog}
            >
              <Plus className="size-4" />
              {isKeluar ? "Buat Surat Keluar" : "Catat Surat Masuk"}
            </Button>
          }
        />

        {/* Banner Peringatan Penertiban Administrasi */}
        {(slotKosongCount > 0 || tanpaScanCount > 0) && (
          <div className="mb-4 flex flex-col justify-between gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50/60 to-white p-3.5 sm:flex-row sm:items-center dark:border-amber-800/60 dark:from-amber-950/50 dark:via-amber-950/25 dark:to-card">
            <div className="flex items-start gap-2.5 text-xs text-amber-950 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
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

        {/* Toolbar Pencarian, Filter & Aksi Ekspor Seimbang */}
        <Card className="mb-4 p-3.5 sm:p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
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
                  className="pr-8 pl-9"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                {isKeluar && (
                  <div className="col-span-2 sm:w-48">
                    <KlasifikasiCombobox
                      items={klasifikasiList}
                      value={filterJenis}
                      onValueChange={(v) => {
                        setFilterJenis(v);
                        setPage(1);
                      }}
                      includeAllOption
                      allLabel="Semua Jenis (A–Z)"
                    />
                  </div>
                )}

                <Select
                  value={filterKelengkapan}
                  onValueChange={(v) => {
                    setFilterKelengkapan(v as FilterKelengkapan);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-44">
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
                  <SelectTrigger className="w-full sm:w-28">
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

            {/* Baris Bawah Toolbar: Ringkasan Hasil di Kiri + Tombol Sekunder Seimbang di Kanan */}
            <div className="flex flex-col gap-2 border-t border-border/70 pt-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-muted-foreground text-xs">
                Ditemukan <b className="text-foreground">{filtered.length}</b> arsip{" "}
                {isKeluar ? "surat keluar" : "surat masuk"}{" "}
                {filterTahun !== "ALL" ? `tahun ${filterTahun}` : ""}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCsv}
                  className="w-full sm:w-auto"
                >
                  <Download className="size-3.5" />
                  Unduh CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto"
                >
                  <Printer className="size-3.5" />
                  Cetak Agenda
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Kontainer Data: Desktop Table (md+) & Mobile Card View (<md) */}
        <Card className="overflow-hidden py-0">
          {/* TAMPILAN DESKTOP: Tabel Lengkap */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">Tanggal</TableHead>
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
                        isSlot &&
                          "bg-amber-50/60 hover:bg-amber-50 dark:bg-amber-950/25 dark:hover:bg-amber-950/40"
                      )}
                    >
                      <TableCell className="text-muted-foreground text-xs font-medium whitespace-nowrap">
                        {formatTanggalIndo(row.tanggal)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-mono text-xs font-semibold",
                              isSlot
                                ? "text-amber-800 dark:text-amber-300"
                                : "text-foreground"
                            )}
                          >
                            {row.nomor || "—"}
                          </span>
                          {row.jenis && (
                            <Badge
                              variant={isKeluar ? "blue" : "emerald"}
                              className="text-[10px]"
                            >
                              {row.jenis}
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground mt-0.5 text-[11px]">
                          {isSlot ? "Perlu dilengkapi TU" : `Oleh ${row.pembuat}`}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground/90 max-w-48 font-medium">
                        <div
                          className={cn(
                            "truncate",
                            isSlot && "text-amber-800 italic dark:text-amber-300"
                          )}
                          title={row.pihak}
                        >
                          {row.pihak}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div
                          className={cn(
                            "font-medium",
                            isSlot
                              ? "text-amber-900 dark:text-amber-200"
                              : "text-foreground"
                          )}
                        >
                          {row.perihal}
                        </div>
                        {dispTags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {dispTags.map((t) => (
                              <Badge
                                key={t}
                                variant="emerald"
                                className="px-2 py-0 text-[10px]"
                              >
                                {t}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {cleanNote && (
                          <div className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
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
                            className="mt-1 inline-flex cursor-pointer items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-950"
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
                          <Badge
                            variant="outline"
                            className="border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300"
                          >
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
                      <div className="text-muted-foreground mx-auto flex max-w-xs flex-col items-center gap-2">
                        <FileText className="size-8 stroke-1" />
                        <p className="text-foreground text-sm font-medium">
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
          </div>

          {/* TAMPILAN MOBILE (<md): Mobile Card View Tanpa Geser Horizontal */}
          <div className="divide-y divide-border md:hidden">
            {paginated.map((row) => {
              const isSlot = row.status === "Belum Lengkap";
              const canManage =
                currentUser.role === "admin" ||
                row.pembuat === currentUser.nama ||
                isSlot;
              const { tags: dispTags, cleanNote } = parseDisposisi(row.catatan);

              return (
                <div
                  key={row.id}
                  onClick={() => setDetailSurat(row)}
                  className={cn(
                    "hover:bg-muted/50 active:bg-muted/70 cursor-pointer space-y-2.5 p-3.5 transition-colors",
                    isSlot && "bg-amber-50/50 dark:bg-amber-950/25"
                  )}
                >
                  {/* Baris Atas Kartu: Nomor Surat + Status & Menu */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "font-mono text-xs font-bold break-all",
                            isSlot
                              ? "text-amber-800 dark:text-amber-300"
                              : "text-foreground"
                          )}
                        >
                          {row.nomor || "Tanpa Nomor"}
                        </span>
                        {row.jenis && (
                          <Badge
                            variant={isKeluar ? "blue" : "emerald"}
                            className="px-1.5 py-0 text-[10px]"
                          >
                            {row.jenis}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex shrink-0 items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isSlot ? (
                        <Badge variant="amber" className="text-[10px]">
                          Nomor Kosong
                        </Badge>
                      ) : row.fileName ? (
                        <Badge variant="emerald" className="text-[10px]">
                          + Scan
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-300 text-[10px] text-amber-700 dark:border-amber-800 dark:text-amber-300"
                        >
                          Belum Scan
                        </Badge>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label="Menu surat"
                          >
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
                    </div>
                  </div>

                  {/* Isi Utama Kartu: Perihal & Pihak */}
                  <div className="space-y-1">
                    <div
                      className={cn(
                        "text-sm leading-snug font-semibold",
                        isSlot
                          ? "text-amber-900 dark:text-amber-200"
                          : "text-foreground"
                      )}
                    >
                      {row.perihal}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      <span className="font-medium">
                        {isKeluar ? "Tujuan:" : "Pengirim:"}
                      </span>{" "}
                      <span className="text-foreground/90">{row.pihak}</span>
                    </div>
                  </div>

                  {/* Disposisi / Catatan / Lampiran */}
                  {(dispTags.length > 0 || cleanNote || row.fileName) && (
                    <div className="space-y-1.5">
                      {dispTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {dispTags.map((t) => (
                            <Badge
                              key={t}
                              variant="emerald"
                              className="px-2 py-0 text-[10px]"
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {cleanNote && (
                        <p className="text-muted-foreground line-clamp-2 text-xs">
                          {cleanNote}
                        </p>
                      )}
                      {row.fileName && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setPreviewDocSurat(row)}
                            className="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                          >
                            <Paperclip className="size-3 shrink-0" />
                            <span className="truncate">{row.fileName}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer Meta Kartu: Tanggal Indonesia & Pencatat */}
                  <div className="text-muted-foreground flex items-center justify-between pt-0.5 text-[11px]">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatTanggalIndo(row.tanggal)}
                    </span>
                    <span>{isSlot ? "Perlu dilengkapi TU" : `Oleh ${row.pembuat}`}</span>
                  </div>
                </div>
              );
            })}

            {paginated.length === 0 && (
              <div className="p-8 text-center">
                <div className="text-muted-foreground mx-auto flex max-w-xs flex-col items-center gap-2">
                  <FileText className="size-8 stroke-1" />
                  <p className="text-foreground text-sm font-medium">
                    Belum ada surat pada filter ini
                  </p>
                  <p className="text-xs">
                    Coba ganti tahun/filter atau ketuk tombol buat surat baru di atas.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Pagination Responsif */}
          <div className="bg-muted/40 text-muted-foreground flex flex-col gap-2.5 border-t border-border px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <span className="text-center sm:text-left">
              Menampilkan <b className="text-foreground">{paginated.length}</b> dari{" "}
              <b className="text-foreground">{filtered.length}</b> baris
            </span>
            <div className="flex items-center justify-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-3.5" />
                Sebelumnya
              </Button>
              <span className="text-foreground px-2 font-medium">
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

      {/* Area Cetak Resmi Buku Agenda (Selalu Hitam-Putih & Tanggal Bahasa Indonesia) */}
      <div className="hidden text-black print:block">
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
              <th className="border border-black px-2 py-1.5 text-left">Tanggal Surat</th>
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
                <td className="border border-black px-2 py-1 whitespace-nowrap">
                  {formatTanggalIndo(s.tanggal)}
                </td>
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
              {pengaturan.kotaSurat}, {formatTanggalIndo(todayIso)}
            </div>
            <div className="font-semibold">Kepala {pengaturan.namaSekolah}</div>
            <div className="h-16" />
            <div className="font-bold underline">{pengaturan.namaKepsek}</div>
            <div>NIP. {pengaturan.nipKepsek}</div>
          </div>
        </div>
      </div>

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
                ? "Nomor urut terkunci otomatis sesuai urutan berikutnya agar tertib. Aktifkan sakelar lompat nomor hanya bila ada arsip fisik sebelumnya yang terselip."
                : "Masukkan detail surat masuk beserta tujuan disposisi dan berkas scan."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            {isKeluar && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 dark:border-blue-800/70 dark:bg-blue-950/40">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium tracking-wide text-blue-700 uppercase dark:text-blue-300">
                    Pratinjau Nomor Surat ({formTahun})
                  </span>
                  {formTahun >= 2027 && targetUrutNum === 1 && (
                    <Badge variant="emerald" className="text-[10px]">
                      Reset Tahun Baru 001
                    </Badge>
                  )}
                </div>
                <div className="mt-1 font-mono text-sm font-bold break-all text-blue-950 dark:text-blue-100">
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
                    <Label htmlFor="urut-surat" className="flex items-center gap-1">
                      Nomor Urut
                      {!editingSurat && !lompatUrutEnabled && (
                        <Lock className="text-muted-foreground size-3" />
                      )}
                    </Label>
                    <Input
                      id="urut-surat"
                      type="number"
                      min={1}
                      required
                      disabled={Boolean(editingSurat) || !lompatUrutEnabled}
                      value={formUrut}
                      onChange={(e) => setFormUrut(e.target.value)}
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

            {/* Kontrol Switch Lompati Nomor Urut (Khusus Tambah Surat Keluar Baru) */}
            {isKeluar && !editingSurat && (
              <div className="space-y-2.5">
                <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5">
                  <div className="min-w-0">
                    <Label
                      htmlFor="switch-lompat-urut"
                      className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold"
                    >
                      <FastForward className="size-3.5 text-amber-600 dark:text-amber-400" />
                      Lompati Nomor Urut
                    </Label>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">
                      Urutan normal berikutnya:{" "}
                      <b className="text-foreground font-mono">
                        {String(normalNextUrut).padStart(pengaturan.pad, "0")}
                      </b>
                    </p>
                  </div>
                  <Switch
                    id="switch-lompat-urut"
                    checked={lompatUrutEnabled}
                    onCheckedChange={handleToggleLompatUrut}
                  />
                </div>

                {/* Peringatan Eksplisit Saat Switch Lompat Nomor Diaktifkan */}
                {lompatUrutEnabled && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-800/80 dark:bg-amber-950/50 dark:text-amber-200">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <div className="space-y-1 leading-relaxed">
                      <div className="font-semibold">
                        Perhatian: Mode Lompat Nomor Urut Aktif!
                      </div>
                      <p>
                        Gunakan fitur ini hanya jika nomor urut sebelumnya sudah terpakai tetapi
                        berkas fisiknya terselip (misal surat terakhir nomor{" "}
                        <code className="font-mono font-bold">10</code>, nomor{" "}
                        <code className="font-mono font-bold">11–15</code> belum ketemu, lalu Anda
                        mengetik <code className="font-mono font-bold">16</code>).
                      </p>
                      {pendingGapList.length > 0 && (
                        <p className="rounded-lg bg-amber-100/80 px-2.5 py-1.5 font-medium text-amber-950 dark:bg-amber-900/50 dark:text-amber-100">
                          Sistem akan otomatis membuat{" "}
                          <b>{pendingGapList.length} slot pengingat &ldquo;Belum Lengkap&rdquo;</b>{" "}
                          untuk nomor:{" "}
                          <code className="font-mono font-bold">
                            {pendingGapList
                              .slice(0, 6)
                              .map((n) => String(n).padStart(pengaturan.pad, "0"))
                              .join(", ")}
                            {pendingGapList.length > 6 ? "..." : ""}
                          </code>
                          .
                        </p>
                      )}
                    </div>
                  </div>
                )}
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
                  isKeluar
                    ? "Contoh: Orang Tua Siswa Kelas XII"
                    : "Contoh: Dinas Pendidikan Provinsi"
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
                <div className="flex items-center justify-between">
                  <Label>Tujuan Disposisi Cepat</Label>
                  <span className="text-muted-foreground text-[11px]">
                    Dikelola Admin di Pengaturan
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableDisposisiNames.map((opt) => {
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
                            : "bg-muted/60 text-foreground/80 hover:bg-muted border-border"
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
              <Label htmlFor="lampiran">
                Unggah Scan PDF / Gambar (Maks. 4 MB · Langsung Pratinjau)
              </Label>
              <Input
                id="lampiran"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 4.2 * 1024 * 1024) {
                      toast.error("Ukuran file terlalu besar", {
                        description: "Maksimal ukuran scan PDF/gambar adalah 4 MB.",
                      });
                      e.target.value = "";
                      return;
                    }
                    setFormFileName(file.name);
                    setFormFileObj(file);
                  }
                }}
              />
              {formFileName && (
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Berkas dipilih: {formFileName}
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
              <b className="text-foreground font-mono">
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
