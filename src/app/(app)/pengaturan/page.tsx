"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownAZ,
  Building2,
  Hash,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Settings,
  Tags,
  Trash2,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { THEMES } from "@/lib/theme";
import type { Klasifikasi } from "@/lib/types";
import { formatNomorSurat, sleep } from "@/lib/utils";
import { FormatNomorBuilder } from "@/components/shared/format-nomor-builder";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function PengaturanPage() {
  const theme = THEMES.violet;
  const {
    pengaturan,
    klasifikasiList,
    suratList,
    savePengaturan,
    saveKlasifikasi,
    deleteKlasifikasi,
  } = useApp();

  const [initialLoading, setInitialLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingKlas, setIsSavingKlas] = useState(false);

  // State Profil & Format
  const [instansiInduk, setInstansiInduk] = useState(pengaturan.instansiInduk);
  const [namaSekolah, setNamaSekolah] = useState(pengaturan.namaSekolah);
  const [alamatSekolah, setAlamatSekolah] = useState(pengaturan.alamatSekolah);
  const [kotaSurat, setKotaSurat] = useState(pengaturan.kotaSurat);
  const [namaKepsek, setNamaKepsek] = useState(pengaturan.namaKepsek);
  const [nipKepsek, setNipKepsek] = useState(pengaturan.nipKepsek);
  const [format, setFormat] = useState(pengaturan.format);
  const [pad, setPad] = useState(String(pengaturan.pad));

  // Urutan abjad klasifikasi (berdasarkan kode atau nama)
  const [sortBy, setSortBy] = useState<"kode" | "nama">("kode");

  // State Dialog Klasifikasi
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKode, setEditingKode] = useState<string | undefined>(undefined);
  const [kodeInput, setKodeInput] = useState("");
  const [namaInput, setNamaInput] = useState("");
  const [klasError, setKlasError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 220);
    return () => clearTimeout(timer);
  }, []);

  const samplePreview2026 = useMemo(
    () => formatNomorSurat(format, Number(pad) || 3, 12, "SK", "2026-11-23"),
    [format, pad]
  );

  const samplePreview2027 = useMemo(
    () => formatNomorSurat(format, Number(pad) || 3, 1, "SK", "2027-01-02"),
    [format, pad]
  );

  const sortedKlasifikasi = useMemo(() => {
    return [...klasifikasiList].sort((a, b) =>
      sortBy === "kode"
        ? a.kode.localeCompare(b.kode, "id", { sensitivity: "base" })
        : a.nama.localeCompare(b.nama, "id", { sensitivity: "base" })
    );
  }, [klasifikasiList, sortBy]);

  const usageMap = useMemo(() => {
    const m: Record<string, number> = {};
    suratList.forEach((s) => {
      if (s.jenis) m[s.jenis] = (m[s.jenis] || 0) + 1;
    });
    return m;
  }, [suratList]);

  async function handleSaveAllSettings(e: React.FormEvent) {
    e.preventDefault();
    if (isSavingSettings) return;
    setIsSavingSettings(true);
    await sleep(260);
    savePengaturan({
      instansiInduk: instansiInduk.trim(),
      namaSekolah: namaSekolah.trim() || "SMK Nusantara Lab",
      alamatSekolah: alamatSekolah.trim(),
      kotaSurat: kotaSurat.trim() || "Purwoharjo",
      namaKepsek: namaKepsek.trim(),
      nipKepsek: nipKepsek.trim(),
      format: format.trim() || "{urut}/34.114/{jenis}/SMKNST/{bulan}/{tahun}",
      pad: Math.max(1, Math.min(6, Number(pad) || 3)),
    });
    setIsSavingSettings(false);
    toast.success("Pengaturan aplikasi berhasil disimpan", {
      description: `${namaSekolah} · Format: ${samplePreview2027}`,
    });
  }

  function openNewKlasifikasi() {
    setEditingKode(undefined);
    setKodeInput("");
    setNamaInput("");
    setKlasError("");
    setDialogOpen(true);
  }

  function openEditKlasifikasi(item: Klasifikasi) {
    setEditingKode(item.kode);
    setKodeInput(item.kode);
    setNamaInput(item.nama);
    setKlasError("");
    setDialogOpen(true);
  }

  async function handleSaveKlasifikasi(e: React.FormEvent) {
    e.preventDefault();
    if (isSavingKlas) return;
    setIsSavingKlas(true);
    await sleep(240);
    const res = saveKlasifikasi({ kode: kodeInput, nama: namaInput }, editingKode);
    setIsSavingKlas(false);
    if (!res.ok) {
      setKlasError(res.error ?? "Gagal menyimpan klasifikasi.");
      return;
    }
    setDialogOpen(false);
    toast.success(
      editingKode ? "Klasifikasi surat diperbarui" : "Klasifikasi baru ditambahkan & diurutkan A–Z",
      { description: `${kodeInput.trim()} — ${namaInput.trim()}` }
    );
  }

  if (initialLoading) {
    return <TablePageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Aplikasi"
        description="Kelola identitas sekolah, pejabat penandatangan, susunan format nomor surat (drag & edit), serta klasifikasi A–Z."
        icon={Settings}
        theme="violet"
      />

      <Tabs defaultValue="format">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="format">
            <Hash className="size-4" />
            Format Nomor Surat
          </TabsTrigger>
          <TabsTrigger value="profil">
            <Building2 className="size-4" />
            Profil &amp; Kepala Sekolah
          </TabsTrigger>
          <TabsTrigger value="klasifikasi">
            <Tags className="size-4" />
            Klasifikasi A–Z ({klasifikasiList.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Draggable & Editable Format Nomor */}
        <TabsContent value="format">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Penyusun Format Nomor Surat (Draggable &amp; Editable)
              </CardTitle>
              <CardDescription>
                Geser urutan blok variabel atau klik teks kode sekolah untuk mengeditnya secara
                langsung. Nomor urut otomatis kembali ke <code className="font-mono">001</code> setiap
                pergantian tahun baru.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveAllSettings} className="space-y-5">
                <FormatNomorBuilder value={format} onChange={setFormat} />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pad">Jumlah Digit Nomor Urut</Label>
                    <Input
                      id="pad"
                      type="number"
                      min={1}
                      max={6}
                      value={pad}
                      onChange={(e) => setPad(e.target.value)}
                    />
                    <p className="text-[11px] text-slate-400">
                      Nilai 3 menghasilkan format <code className="font-mono">001</code>,{" "}
                      <code className="font-mono">002</code>, dst.
                    </p>
                  </div>

                  <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3.5 sm:col-span-2">
                    <div className="text-[11px] font-semibold tracking-wide text-violet-700 uppercase">
                      Simulasi Hasil Format Nomor
                    </div>
                    <div className="mt-1.5 space-y-1 font-mono text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-sans text-xs text-slate-500">Tahun berjalan (2026):</span>
                        <b className="text-violet-950">{samplePreview2026}</b>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-sans text-xs text-emerald-700">
                          Awal tahun baru (2027):
                        </span>
                        <b className="text-emerald-800">{samplePreview2027}</b>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSavingSettings}
                    className={theme.buttonPrimary}
                  >
                    {isSavingSettings && <Loader2 className="size-4 animate-spin" />}
                    {isSavingSettings ? "Menyimpan..." : "Simpan Format Nomor"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Profil Sekolah & Kepala Sekolah */}
        <TabsContent value="profil">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identitas Sekolah &amp; Pejabat Penandatangan</CardTitle>
              <CardDescription>
                Digunakan otomatis pada Sidebar, Kop Cetak Buku Agenda, serta lembar pratinjau
                dokumen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveAllSettings} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="instansi">Instansi Induk / Yayasan / Dinas</Label>
                    <Input
                      id="instansi"
                      value={instansiInduk}
                      onChange={(e) => setInstansiInduk(e.target.value)}
                      placeholder="Contoh: Pemerintah Provinsi Jawa Timur · Dinas Pendidikan"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nama-sekolah">Nama Sekolah</Label>
                    <Input
                      id="nama-sekolah"
                      required
                      value={namaSekolah}
                      onChange={(e) => setNamaSekolah(e.target.value)}
                      placeholder="Contoh: SMK Nusantara Lab"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="alamat-sekolah">Alamat Kop Surat</Label>
                    <Input
                      id="alamat-sekolah"
                      value={alamatSekolah}
                      onChange={(e) => setAlamatSekolah(e.target.value)}
                      placeholder="Jalan, Kecamatan, Kabupaten/Kota"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="kota-surat">Kota Tanda Tangan</Label>
                    <Input
                      id="kota-surat"
                      value={kotaSurat}
                      onChange={(e) => setKotaSurat(e.target.value)}
                      placeholder="Contoh: Purwoharjo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="nama-kepsek">Nama Lengkap Kepala Sekolah</Label>
                    <Input
                      id="nama-kepsek"
                      value={namaKepsek}
                      onChange={(e) => setNamaKepsek(e.target.value)}
                      placeholder="Nama beserta gelar"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nip-kepsek">NIP / NIY Kepala Sekolah</Label>
                    <Input
                      id="nip-kepsek"
                      value={nipKepsek}
                      onChange={(e) => setNipKepsek(e.target.value)}
                      placeholder="Contoh: 19720815 199802 1 003 atau -"
                    />
                  </div>
                </div>

                {/* Pratinjau Kop & TTD */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-700">
                  <div className="border-b border-slate-300 pb-2 text-center">
                    <div className="text-[10px] font-semibold uppercase text-slate-500">
                      {instansiInduk}
                    </div>
                    <div className="text-sm font-bold uppercase text-slate-900">{namaSekolah}</div>
                    <div className="text-[11px] text-slate-500">{alamatSekolah}</div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <div className="text-center">
                      <div>{kotaSurat}, 23 November 2026</div>
                      <div className="font-semibold text-slate-900">
                        Kepala {namaSekolah} — {namaKepsek}
                      </div>
                      <div className="text-[11px] text-slate-500">NIP. {nipKepsek}</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSavingSettings}
                    className={theme.buttonPrimary}
                  >
                    {isSavingSettings && <Loader2 className="size-4 animate-spin" />}
                    {isSavingSettings ? "Menyimpan..." : "Simpan Profil Sekolah"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Klasifikasi Terurut Abjad */}
        <TabsContent value="klasifikasi">
          <Card className="overflow-hidden py-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Daftar Kode &amp; Nama Klasifikasi Surat
                </h2>
                <p className="text-xs text-slate-500">
                  Diurutkan otomatis berdasarkan abjad untuk memudahkan pencarian.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as "kode" | "nama")}>
                  <SelectTrigger className="h-8 w-44 text-xs">
                    <ArrowDownAZ className="size-3.5 text-slate-500" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kode">Urut Kode (A–Z)</SelectItem>
                    <SelectItem value="nama">Urut Nama Surat (A–Z)</SelectItem>
                  </SelectContent>
                </Select>
                <Button className={theme.buttonPrimary} size="sm" onClick={openNewKlasifikasi}>
                  <Plus className="size-4" />
                  Tambah Jenis
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Kode</TableHead>
                  <TableHead>Nama Jenis Surat</TableHead>
                  <TableHead className="w-36">Pemakaian</TableHead>
                  <TableHead className="w-28 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedKlasifikasi.map((k) => {
                  const used = usageMap[k.kode] ?? 0;
                  return (
                    <TableRow key={k.kode}>
                      <TableCell>
                        <Badge variant="violet" className="font-mono">
                          {k.kode}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">{k.nama}</TableCell>
                      <TableCell>
                        {used > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                            <Lock className="size-3 text-amber-600" />
                            {used} surat
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Belum dipakai</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditKlasifikasi(k)}
                            title="Ubah"
                          >
                            <Pencil className="size-4 text-slate-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={used > 0}
                            onClick={() => {
                              const res = deleteKlasifikasi(k.kode);
                              if (res.ok) toast.success(`Kode ${k.kode} dihapus`);
                            }}
                            title={used > 0 ? "Sudah dipakai pada surat" : "Hapus jenis"}
                          >
                            <Trash2 className="size-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Tambah/Ubah Klasifikasi */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingKode ? "Ubah Klasifikasi Surat" : "Tambah Klasifikasi Baru"}
            </DialogTitle>
            <DialogDescription>
              Kode akan disisipkan pada token <code className="font-mono">{"{jenis}"}</code> nomor
              surat keluar dan otomatis terurut abjad.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveKlasifikasi} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="kode-klas">Kode Singkat</Label>
              <Input
                id="kode-klas"
                required
                disabled={Boolean(editingKode && (usageMap[editingKode] ?? 0) > 0)}
                placeholder="Contoh: SPer / 421.5"
                value={kodeInput}
                onChange={(e) => setKodeInput(e.target.value)}
                className="font-mono"
              />
              {editingKode && (usageMap[editingKode] ?? 0) > 0 && (
                <p className="text-xs text-amber-700">
                  Kode sudah dipakai pada arsip, hanya nama jenis yang dapat diubah.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nama-klas">Nama Jenis Surat</Label>
              <Input
                id="nama-klas"
                required
                placeholder="Contoh: Surat Perjanjian Kerja Sama"
                value={namaInput}
                onChange={(e) => setNamaInput(e.target.value)}
              />
            </div>
            {klasError && <p className="text-xs font-medium text-red-600">{klasError}</p>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSavingKlas}
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSavingKlas} className={theme.buttonPrimary}>
                {isSavingKlas && <Loader2 className="size-4 animate-spin" />}
                {isSavingKlas ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
