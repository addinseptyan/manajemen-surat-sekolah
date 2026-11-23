"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Inbox,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { THEMES } from "@/lib/theme";
import type { Arah, Surat } from "@/lib/types";
import { cn, downloadCsv, formatNomorSurat } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
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
    saveSurat,
    cancelSurat,
    deleteSurat,
  } = useApp();

  // Filter & Pagination state
  const [query, setQuery] = useState("");
  const [filterJenis, setFilterJenis] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterTahun, setFilterTahun] = useState("2026");
  const [page, setPage] = useState(1);

  // Dialog Tambah/Ubah state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSurat, setEditingSurat] = useState<Surat | null>(null);
  const [formTanggal, setFormTanggal] = useState("2026-11-23");
  const [formJenis, setFormJenis] = useState(klasifikasiList[0]?.kode ?? "B");
  const [formNomorMasuk, setFormNomorMasuk] = useState("");
  const [formPihak, setFormPihak] = useState("");
  const [formPerihal, setFormPerihal] = useState("");
  const [formCatatan, setFormCatatan] = useState("");
  const [formFileName, setFormFileName] = useState("");

  // AlertDialog Pembatalan state
  const [cancelingSurat, setCancelingSurat] = useState<Surat | null>(null);
  const [alasanBatal, setAlasanBatal] = useState("");

  const filtered = useMemo(() => {
    return suratList
      .filter((s) => s.arah === arah)
      .filter((s) => (filterTahun === "ALL" ? true : String(s.tahun) === filterTahun))
      .filter((s) => (isKeluar && filterJenis !== "ALL" ? s.jenis === filterJenis : true))
      .filter((s) => (filterStatus === "ALL" ? true : s.status === filterStatus))
      .filter((s) => {
        if (!query.trim()) return true;
        const haystack = `${s.nomor} ${s.pihak} ${s.perihal} ${s.pembuat}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [suratList, arah, filterTahun, isKeluar, filterJenis, filterStatus, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const previewNomorKeluar = useMemo(() => {
    if (!isKeluar) return "";
    const tahun = Number(formTanggal.slice(0, 4)) || 2026;
    const urut =
      editingSurat && typeof editingSurat.urut === "number"
        ? editingSurat.urut
        : getNextUrut(tahun);
    return formatNomorSurat(pengaturan.format, pengaturan.pad, urut, formJenis, formTanggal);
  }, [isKeluar, formTanggal, editingSurat, getNextUrut, pengaturan, formJenis]);

  function openCreateDialog() {
    setEditingSurat(null);
    setFormTanggal(new Date().toISOString().slice(0, 10));
    setFormJenis(klasifikasiList[0]?.kode ?? "B");
    setFormNomorMasuk("");
    setFormPihak("");
    setFormPerihal("");
    setFormCatatan("");
    setFormFileName("");
    setDialogOpen(true);
  }

  function openEditDialog(item: Surat) {
    setEditingSurat(item);
    setFormTanggal(item.tanggal);
    setFormJenis(item.jenis || klasifikasiList[0]?.kode || "B");
    setFormNomorMasuk(item.nomor);
    setFormPihak(item.pihak);
    setFormPerihal(item.perihal);
    setFormCatatan(item.catatan);
    setFormFileName(item.fileName ?? "");
    setDialogOpen(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formPihak.trim() || !formPerihal.trim()) return;
    saveSurat({
      id: editingSurat?.id,
      arah,
      jenis: isKeluar ? formJenis : "",
      nomorManual: isKeluar ? undefined : formNomorMasuk,
      tanggal: formTanggal,
      pihak: formPihak.trim(),
      perihal: formPerihal.trim(),
      catatan: formCatatan.trim(),
      fileName: formFileName.trim() || undefined,
    });
    setDialogOpen(false);
  }

  function handleConfirmCancel() {
    if (!cancelingSurat) return;
    cancelSurat(cancelingSurat.id, alasanBatal.trim() || "Dibatalkan oleh pengguna");
    setCancelingSurat(null);
    setAlasanBatal("");
  }

  function handleExportCsv() {
    downloadCsv(
      `arsip-surat-${arah}-${filterTahun}.csv`,
      ["Tanggal", "Nomor", isKeluar ? "Jenis" : "Asal", "Pihak", "Perihal", "Status", "Pembuat"],
      filtered.map((s) => [
        s.tanggal,
        s.nomor,
        isKeluar ? s.jenis : "Masuk",
        s.pihak,
        s.perihal,
        s.status,
        s.pembuat,
      ])
    );
  }

  return (
    <div>
      <PageHeader
        title={isKeluar ? "Surat Keluar" : "Surat Masuk"}
        description={
          isKeluar
            ? "Penomoran otomatis berurutan sesuai klasifikasi & arsip surat keluar sekolah."
            : "Pencatatan surat masuk dari instansi luar beserta catatan disposisi."
        }
        icon={isKeluar ? Send : Inbox}
        theme={themeKey}
        actions={
          <>
            <Button variant="outline" onClick={handleExportCsv}>
              <Download className="size-4" />
              Unduh CSV
            </Button>
            <Button className={theme.buttonPrimary} onClick={openCreateDialog}>
              <Plus className="size-4" />
              {isKeluar ? "Buat Surat Keluar" : "Catat Surat Masuk"}
            </Button>
          </>
        }
      />

      {/* Filter Bar */}
      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={
                isKeluar
                  ? "Cari nomor surat, tujuan, perihal, atau pembuat..."
                  : "Cari nomor surat asal, pengirim, atau perihal..."
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
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isKeluar && (
              <Select
                value={filterJenis}
                onValueChange={(v) => {
                  setFilterJenis(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Semua jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Jenis</SelectItem>
                  {klasifikasiList.map((k) => (
                    <SelectItem key={k.kode} value={k.kode}>
                      {k.kode} — {k.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select
              value={filterStatus}
              onValueChange={(v) => {
                setFilterStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="Aktif">Aktif</SelectItem>
                <SelectItem value="Batal">Dibatalkan</SelectItem>
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
              <TableHead>Perihal & Catatan</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-14 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((row) => {
              const canManage =
                currentUser.role === "admin" || row.pembuat === currentUser.nama;
              return (
                <TableRow
                  key={row.id}
                  className={cn(row.status === "Batal" && "bg-red-50/30 opacity-75")}
                >
                  <TableCell className="text-xs font-medium text-slate-600 whitespace-nowrap">
                    {row.tanggal}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "font-mono text-xs font-semibold",
                          row.status === "Batal"
                            ? "text-slate-400 line-through"
                            : "text-slate-900"
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
                      Oleh {row.pembuat}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-48 font-medium text-slate-800">
                    <div className="truncate" title={row.pihak}>
                      {row.pihak}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="font-medium text-slate-800">{row.perihal}</div>
                    {row.catatan && (
                      <div className="mt-0.5 text-xs text-slate-500">{row.catatan}</div>
                    )}
                    {row.fileName && (
                      <div className="mt-1 inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        <Paperclip className="size-3" />
                        {row.fileName}
                      </div>
                    )}
                    {row.status === "Batal" && row.alasanBatal && (
                      <div className="mt-1 text-xs font-medium text-red-600">
                        Alasan batal: {row.alasanBatal}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.status === "Batal" ? "destructive" : "emerald"}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Menu baris">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          disabled={row.status === "Batal" || !canManage}
                          onClick={() => openEditDialog(row)}
                        >
                          <Pencil className="size-4" />
                          Ubah Data
                        </DropdownMenuItem>
                        {row.status === "Aktif" && canManage && (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              setCancelingSurat(row);
                              setAlasanBatal("");
                            }}
                          >
                            <Ban className="size-4" />
                            Batalkan Nomor
                          </DropdownMenuItem>
                        )}
                        {pengaturan.trial && currentUser.role === "admin" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => deleteSurat(row.id)}
                            >
                              <Trash2 className="size-4" />
                              Hapus (Mode Percobaan)
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
                      Belum ada surat yang cocok
                    </p>
                    <p className="text-xs">
                      Ubah kata kunci pencarian atau tambahkan data surat baru.
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
            Menampilkan <b>{paginated.length}</b> dari <b>{filtered.length}</b> surat
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

      {/* Dialog Tambah / Ubah Surat */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSurat
                ? `Ubah ${isKeluar ? "Surat Keluar" : "Surat Masuk"}`
                : isKeluar
                  ? "Buat Surat Keluar Baru"
                  : "Catat Surat Masuk Baru"}
            </DialogTitle>
            <DialogDescription>
              {isKeluar
                ? "Nomor surat dibuat otomatis mengikuti urutan tertinggi tahun berjalan."
                : "Masukkan detail surat yang diterima dari instansi luar."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            {isKeluar && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3">
                <div className="text-[11px] font-medium tracking-wide text-blue-700 uppercase">
                  Pratinjau Nomor Otomatis
                </div>
                <div className="mt-1 font-mono text-sm font-bold text-blue-950">
                  {previewNomorKeluar}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tanggal">Tanggal Surat</Label>
                <Input
                  id="tanggal"
                  type="date"
                  required
                  value={formTanggal}
                  onChange={(e) => setFormTanggal(e.target.value)}
                />
              </div>

              {isKeluar ? (
                <div className="space-y-1.5">
                  <Label>Jenis / Klasifikasi</Label>
                  <Select value={formJenis} onValueChange={setFormJenis}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {klasifikasiList.map((k) => (
                        <SelectItem key={k.kode} value={k.kode}>
                          {k.kode} — {k.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
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

            <div className="space-y-1.5">
              <Label htmlFor="catatan">Catatan / Disposisi (Opsional)</Label>
              <Textarea
                id="catatan"
                placeholder="Catatan tambahan atau instruksi disposisi..."
                value={formCatatan}
                onChange={(e) => setFormCatatan(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lampiran">Lampiran Scan PDF/Gambar (Simulasi Demo)</Label>
              <Input
                id="lampiran"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setFormFileName(file.name);
                }}
              />
              {formFileName && (
                <p className="text-xs text-slate-500">File terpilih: {formFileName}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className={theme.buttonPrimary}>
                {editingSurat ? "Simpan Perubahan" : "Simpan Surat"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Konfirmasi Batalkan Nomor */}
      <AlertDialog
        open={Boolean(cancelingSurat)}
        onOpenChange={(open) => !open && setCancelingSurat(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Nomor Surat Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Nomor <b className="font-mono text-slate-800">{cancelingSurat?.nomor || "surat ini"}</b>{" "}
              akan dikunci dengan status <b>Batal</b> agar urutan penomoran arsip tetap rapi dan tidak loncat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 py-1">
            <Label htmlFor="alasan-batal">Alasan Pembatalan</Label>
            <Input
              id="alasan-batal"
              placeholder="Contoh: Salah tujuan / kegiatan ditunda"
              value={alasanBatal}
              onChange={(e) => setAlasanBatal(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Kembali</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Ya, Batalkan Surat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
