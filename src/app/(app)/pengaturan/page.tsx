"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDownAZ,
  Building2,
  Hash,
  Loader2,
  Lock,
  MailCheck,
  Pencil,
  Plus,
  Settings,
  ShieldAlert,
  Tags,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { THEMES } from "@/lib/theme";
import type { DisposisiJabatan, Klasifikasi } from "@/lib/types";
import {
  formatNomorSurat,
  formatTanggalIndo,
  getCurrentYearWib,
  getTodayIsoWib,
  parseDisposisi,
} from "@/lib/utils";
import { FormatNomorBuilder } from "@/components/shared/format-nomor-builder";
import { PageHeader } from "@/components/shared/page-header";
import { TablePageSkeleton } from "@/components/shared/page-skeletons";
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
import { Switch } from "@/components/ui/switch";
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
  const router = useRouter();
  const theme = THEMES.violet;
  const {
    currentUser,
    isAuthLoading,
    isDataLoading,
    pengaturan,
    klasifikasiList,
    disposisiList,
    suratList,
    savePengaturan,
    saveKlasifikasi,
    deleteKlasifikasi,
    saveDisposisi,
    deleteDisposisi,
  } = useApp();

  const isAdmin = currentUser.role === "admin";

  const [initialLoading, setInitialLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingKlas, setIsSavingKlas] = useState(false);
  const [isSavingDisp, setIsSavingDisp] = useState(false);

  // State Profil, Nama Aplikasi & Format
  const [namaAplikasi, setNamaAplikasi] = useState(pengaturan.namaAplikasi);
  const [instansiInduk, setInstansiInduk] = useState(pengaturan.instansiInduk);
  const [namaSekolah, setNamaSekolah] = useState(pengaturan.namaSekolah);
  const [alamatSekolah, setAlamatSekolah] = useState(pengaturan.alamatSekolah);
  const [kotaSurat, setKotaSurat] = useState(pengaturan.kotaSurat);
  const [namaKepsek, setNamaKepsek] = useState(pengaturan.namaKepsek);
  const [nipKepsek, setNipKepsek] = useState(pengaturan.nipKepsek);
  const [format, setFormat] = useState(pengaturan.format);
  const [pad, setPad] = useState(String(pengaturan.pad));

  // Urutan abjad klasifikasi
  const [sortBy, setSortBy] = useState<"kode" | "nama">("kode");

  // State Dialog Klasifikasi
  const [klasDialogOpen, setKlasDialogOpen] = useState(false);
  const [editingKode, setEditingKode] = useState<string | undefined>(undefined);
  const [kodeInput, setKodeInput] = useState("");
  const [namaInput, setNamaInput] = useState("");
  const [klasError, setKlasError] = useState("");

  // State Dialog Tujuan Disposisi (Admin CRUD)
  const [dispDialogOpen, setDispDialogOpen] = useState(false);
  const [editingDisp, setEditingDisp] = useState<DisposisiJabatan | null>(null);
  const [dispNama, setDispNama] = useState("");
  const [dispAktif, setDispAktif] = useState(true);
  const [dispError, setDispError] = useState("");
  const [deletingDisp, setDeletingDisp] = useState<DisposisiJabatan | null>(null);

  useEffect(() => {
    setNamaAplikasi(pengaturan.namaAplikasi);
    setInstansiInduk(pengaturan.instansiInduk);
    setNamaSekolah(pengaturan.namaSekolah);
    setAlamatSekolah(pengaturan.alamatSekolah);
    setKotaSurat(pengaturan.kotaSurat);
    setNamaKepsek(pengaturan.namaKepsek);
    setNipKepsek(pengaturan.nipKepsek);
    setFormat(pengaturan.format);
    setPad(String(pengaturan.pad));
  }, [pengaturan]);

  useEffect(() => {
    if (!isAuthLoading && currentUser.role !== "admin") {
      router.replace("/dashboard?denied=admin");
      return;
    }
    const timer = setTimeout(() => setInitialLoading(false), 200);
    return () => clearTimeout(timer);
  }, [isAuthLoading, currentUser.role, router]);

  const currentYear = getCurrentYearWib();
  const nextYear = currentYear + 1;

  const samplePreviewCurrentYear = useMemo(
    () => formatNomorSurat(format, Number(pad) || 3, 12, "SK", getTodayIsoWib()),
    [format, pad]
  );

  const samplePreviewNextYear = useMemo(
    () => formatNomorSurat(format, Number(pad) || 3, 1, "SK", `${nextYear}-01-02`),
    [format, pad, nextYear]
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

  const disposisiUsageMap = useMemo(() => {
    const m: Record<string, number> = {};
    suratList
      .filter((s) => s.arah === "masuk")
      .forEach((s) => {
        const { tags } = parseDisposisi(s.catatan);
        tags.forEach((t) => {
          m[t] = (m[t] || 0) + 1;
        });
      });
    return m;
  }, [suratList]);

  async function handleSaveAllSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin || isSavingSettings) return;
    setIsSavingSettings(true);
    const cleanNamaApp = namaAplikasi.trim() || "Manajemen Surat";
    const res = await savePengaturan({
      namaAplikasi: cleanNamaApp,
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
    if (!res.ok) {
      toast.error("Gagal menyimpan pengaturan", { description: res.error });
      return;
    }
    toast.success("Pengaturan aplikasi berhasil disimpan", {
      description: `${cleanNamaApp} · ${namaSekolah}`,
    });
  }

  function openNewKlasifikasi() {
    setEditingKode(undefined);
    setKodeInput("");
    setNamaInput("");
    setKlasError("");
    setKlasDialogOpen(true);
  }

  function openEditKlasifikasi(item: Klasifikasi) {
    setEditingKode(item.kode);
    setKodeInput(item.kode);
    setNamaInput(item.nama);
    setKlasError("");
    setKlasDialogOpen(true);
  }

  async function handleSaveKlasifikasi(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin || isSavingKlas) return;
    setIsSavingKlas(true);
    const res = await saveKlasifikasi({ kode: kodeInput, nama: namaInput }, editingKode);
    setIsSavingKlas(false);
    if (!res.ok) {
      setKlasError(res.error ?? "Gagal menyimpan klasifikasi.");
      return;
    }
    setKlasDialogOpen(false);
    toast.success(
      editingKode
        ? "Klasifikasi surat diperbarui"
        : "Klasifikasi baru ditambahkan & diurutkan A–Z",
      { description: `${kodeInput.trim()} — ${namaInput.trim()}` }
    );
  }

  // Handlers CRUD Tujuan Disposisi
  function openNewDisposisi() {
    setEditingDisp(null);
    setDispNama("");
    setDispAktif(true);
    setDispError("");
    setDispDialogOpen(true);
  }

  function openEditDisposisi(item: DisposisiJabatan) {
    setEditingDisp(item);
    setDispNama(item.nama);
    setDispAktif(item.aktif);
    setDispError("");
    setDispDialogOpen(true);
  }

  async function handleSaveDisposisi(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin || isSavingDisp) return;
    setIsSavingDisp(true);
    const res = await saveDisposisi({
      id: editingDisp?.id,
      nama: dispNama,
      aktif: dispAktif,
    });
    setIsSavingDisp(false);
    if (!res.ok) {
      setDispError(res.error ?? "Gagal menyimpan tujuan disposisi.");
      return;
    }
    setDispDialogOpen(false);
    toast.success(
      editingDisp ? "Tujuan disposisi diperbarui" : "Tujuan disposisi ditambahkan",
      { description: dispNama.trim() }
    );
  }

  async function handleConfirmDeleteDisposisi() {
    if (!deletingDisp) return;
    const target = deletingDisp;
    setDeletingDisp(null);
    const res = await deleteDisposisi(target.id);
    if (!res.ok) {
      toast.error("Gagal menghapus tujuan disposisi", { description: res.error });
      return;
    }
    toast.success("Tujuan disposisi dihapus", { description: target.nama });
  }

  if (initialLoading || isAuthLoading || isDataLoading || currentUser.role !== "admin") {
    return <TablePageSkeleton />;
  }

  const todayIndo = formatTanggalIndo(new Date().toISOString().slice(0, 10));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Aplikasi"
        description="Kelola nama aplikasi, profil sekolah, susunan format nomor surat, tujuan disposisi, serta klasifikasi A–Z."
        icon={Settings}
        theme="violet"
      />

      {!isAdmin && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-200">
          <ShieldAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            Anda masuk sebagai <b>Pegawai</b>. Pengaturan di bawah ditampilkan dalam mode baca —
            hanya akun <b>Admin</b> yang dapat menambah atau mengubah pengaturan.
          </span>
        </div>
      )}

      <Tabs defaultValue="profil">
        <TabsList className="h-auto w-full flex-wrap justify-start sm:w-auto">
          <TabsTrigger value="profil">
            <Building2 className="size-4" />
            Profil &amp; Aplikasi
          </TabsTrigger>
          <TabsTrigger value="format">
            <Hash className="size-4" />
            Format Nomor
          </TabsTrigger>
          <TabsTrigger value="disposisi">
            <UserCheck className="size-4" />
            Tujuan Disposisi ({disposisiList.length})
          </TabsTrigger>
          <TabsTrigger value="klasifikasi">
            <Tags className="size-4" />
            Klasifikasi A–Z ({klasifikasiList.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Nama Aplikasi, Profil Sekolah & Kepala Sekolah */}
        <TabsContent value="profil">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Nama Aplikasi, Identitas Sekolah &amp; Kepala Sekolah
              </CardTitle>
              <CardDescription>
                Perubahan nama aplikasi langsung diterapkan pada Sidebar, Topbar Mobile, halaman
                Login, dan judul tab browser.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveAllSettings} className="space-y-4">
                <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/50 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-center">
                    <div className="space-y-1.5">
                      <Label htmlFor="nama-aplikasi">Nama Aplikasi</Label>
                      <Input
                        id="nama-aplikasi"
                        required
                        disabled={!isAdmin}
                        value={namaAplikasi}
                        onChange={(e) => setNamaAplikasi(e.target.value)}
                        placeholder="Contoh: Manajemen Surat / E-Arsip TU"
                      />
                      <p className="text-muted-foreground text-[11px]">
                        Tampil di pojok kiri atas aplikasi, halaman Login, dan tab browser.
                      </p>
                    </div>

                    <div className="bg-card flex items-center gap-3 rounded-xl border border-border p-3 shadow-2xs">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
                        <MailCheck className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                          Pratinjau Brand Aplikasi
                        </div>
                        <div className="text-foreground truncate text-sm font-bold">
                          {namaAplikasi || "Manajemen Surat"}
                        </div>
                        <div className="text-muted-foreground truncate text-xs">
                          {namaSekolah || "SMK Nusantara Lab"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="instansi">Instansi Induk / Yayasan / Dinas</Label>
                    <Input
                      id="instansi"
                      disabled={!isAdmin}
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
                      disabled={!isAdmin}
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
                      disabled={!isAdmin}
                      value={alamatSekolah}
                      onChange={(e) => setAlamatSekolah(e.target.value)}
                      placeholder="Jalan, Kecamatan, Kabupaten/Kota"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="kota-surat">Kota Tanda Tangan</Label>
                    <Input
                      id="kota-surat"
                      disabled={!isAdmin}
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
                      disabled={!isAdmin}
                      value={namaKepsek}
                      onChange={(e) => setNamaKepsek(e.target.value)}
                      placeholder="Nama beserta gelar"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nip-kepsek">NIP / NIY Kepala Sekolah</Label>
                    <Input
                      id="nip-kepsek"
                      disabled={!isAdmin}
                      value={nipKepsek}
                      onChange={(e) => setNipKepsek(e.target.value)}
                      placeholder="Contoh: 19720815 199802 1 003 atau -"
                    />
                  </div>
                </div>

                {/* Pratinjau Kop & TTD */}
                <div className="bg-muted/50 text-foreground/90 rounded-xl border border-border p-4 text-xs">
                  <div className="border-b border-border pb-2 text-center">
                    <div className="text-muted-foreground text-[10px] font-semibold uppercase">
                      {instansiInduk}
                    </div>
                    <div className="text-foreground text-sm font-bold uppercase">
                      {namaSekolah}
                    </div>
                    <div className="text-muted-foreground text-[11px]">{alamatSekolah}</div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <div className="text-center">
                      <div>
                        {kotaSurat}, {todayIndo}
                      </div>
                      <div className="text-foreground font-semibold">
                        Kepala {namaSekolah} — {namaKepsek}
                      </div>
                      <div className="text-muted-foreground text-[11px]">NIP. {nipKepsek}</div>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSavingSettings}
                      className={theme.buttonPrimary}
                    >
                      {isSavingSettings && <Loader2 className="size-4 animate-spin" />}
                      {isSavingSettings ? "Menyimpan..." : "Simpan Profil & Aplikasi"}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Draggable & Editable Format Nomor */}
        <TabsContent value="format">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Penyusun Format Nomor Surat (Draggable &amp; Editable)
              </CardTitle>
              <CardDescription>
                Geser urutan blok variabel atau ketik langsung pada blok teks tetap. Nomor urut
                otomatis kembali ke <code className="font-mono">001</code> setiap pergantian tahun
                baru.
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
                      disabled={!isAdmin}
                      value={pad}
                      onChange={(e) => setPad(e.target.value)}
                    />
                    <p className="text-muted-foreground text-[11px]">
                      Nilai 3 menghasilkan format <code className="font-mono">001</code>,{" "}
                      <code className="font-mono">002</code>, dst.
                    </p>
                  </div>

                  <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3.5 sm:col-span-2 dark:border-violet-800/70 dark:bg-violet-950/35">
                    <div className="text-[11px] font-semibold tracking-wide text-violet-700 uppercase dark:text-violet-300">
                      Simulasi Hasil Format Nomor
                    </div>
                    <div className="mt-1.5 space-y-1 font-mono text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-muted-foreground font-sans text-xs">
                          Tahun berjalan ({currentYear}):
                        </span>
                        <b className="break-all text-violet-950 dark:text-violet-100">
                          {samplePreviewCurrentYear}
                        </b>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-sans text-xs text-emerald-700 dark:text-emerald-400">
                          Awal tahun baru ({nextYear}):
                        </span>
                        <b className="break-all text-emerald-800 dark:text-emerald-300">
                          {samplePreviewNextYear}
                        </b>
                      </div>
                    </div>
                  </div>
                </div>

                {isAdmin && (
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
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Admin CRUD Tujuan Disposisi Surat Masuk */}
        <TabsContent value="disposisi">
          <Card className="overflow-hidden py-0">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <h2 className="text-foreground text-base font-semibold">
                  Daftar Jabatan / Tujuan Disposisi Surat Masuk
                </h2>
                <p className="text-muted-foreground text-xs">
                  Jabatan yang berstatus aktif tampil sebagai tombol pilihan cepat saat mencatat
                  Surat Masuk.
                </p>
              </div>
              {isAdmin && (
                <Button
                  className={theme.buttonPrimary}
                  size="sm"
                  onClick={openNewDisposisi}
                >
                  <Plus className="size-4" />
                  Tambah Tujuan Disposisi
                </Button>
              )}
            </div>

            {/* Tabel Desktop Tujuan Disposisi */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">No</TableHead>
                    <TableHead>Jabatan / Unit Tujuan Disposisi</TableHead>
                    <TableHead className="w-36">Pemakaian</TableHead>
                    <TableHead className="w-36">Status Pilihan</TableHead>
                    <TableHead className="w-28 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disposisiList.map((d, idx) => {
                    const used = disposisiUsageMap[d.nama] ?? 0;
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="text-foreground font-medium">
                          {d.nama}
                        </TableCell>
                        <TableCell>
                          {used > 0 ? (
                            <Badge variant="emerald">{used} surat masuk</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Belum dipakai</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={d.aktif}
                              disabled={!isAdmin}
                              onCheckedChange={async (checked) => {
                                const res = await saveDisposisi({
                                  id: d.id,
                                  nama: d.nama,
                                  aktif: checked,
                                });
                                if (!res.ok) {
                                  toast.error(res.error ?? "Gagal mengubah status");
                                  return;
                                }
                                toast.info(
                                  checked
                                    ? `"${d.nama}" ditampilkan di pilihan disposisi`
                                    : `"${d.nama}" disembunyikan dari pilihan disposisi`
                                );
                              }}
                            />
                            <span className="text-muted-foreground text-xs font-medium">
                              {d.aktif ? "Aktif" : "Nonaktif"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={!isAdmin}
                              onClick={() => openEditDisposisi(d)}
                              title="Ubah jabatan"
                            >
                              <Pencil className="text-muted-foreground size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={!isAdmin}
                              onClick={() => setDeletingDisp(d)}
                              title="Hapus jabatan"
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
            </div>

            {/* Mobile Card View Tujuan Disposisi */}
            <div className="divide-y divide-border md:hidden">
              {disposisiList.map((d, idx) => {
                const used = disposisiUsageMap[d.nama] ?? 0;
                return (
                  <div key={d.id} className="space-y-2.5 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-muted-foreground font-mono text-[11px]">
                          #{idx + 1}
                        </span>
                        <div className="text-foreground text-sm font-semibold">{d.nama}</div>
                      </div>
                      {used > 0 && <Badge variant="emerald">{used} surat</Badge>}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={d.aktif}
                          disabled={!isAdmin}
                          onCheckedChange={async (checked) => {
                            await saveDisposisi({ id: d.id, nama: d.nama, aktif: checked });
                          }}
                        />
                        <span className="text-muted-foreground text-xs">
                          {d.aktif ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDisposisi(d)}
                          >
                            <Pencil className="size-3.5" />
                            Ubah
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingDisp(d)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 4: Klasifikasi Terurut Abjad */}
        <TabsContent value="klasifikasi">
          <Card className="overflow-hidden py-0">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <h2 className="text-foreground text-base font-semibold">
                  Daftar Kode &amp; Nama Klasifikasi Surat
                </h2>
                <p className="text-muted-foreground text-xs">
                  Diurutkan otomatis berdasarkan abjad untuk memudahkan pencarian.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as "kode" | "nama")}>
                  <SelectTrigger className="h-8 w-44 text-xs">
                    <ArrowDownAZ className="text-muted-foreground size-3.5" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kode">Urut Kode (A–Z)</SelectItem>
                    <SelectItem value="nama">Urut Nama Surat (A–Z)</SelectItem>
                  </SelectContent>
                </Select>
                {isAdmin && (
                  <Button className={theme.buttonPrimary} size="sm" onClick={openNewKlasifikasi}>
                    <Plus className="size-4" />
                    Tambah Jenis
                  </Button>
                )}
              </div>
            </div>

            {/* Tabel Desktop Klasifikasi */}
            <div className="hidden md:block">
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
                        <TableCell className="text-foreground font-medium">{k.nama}</TableCell>
                        <TableCell>
                          {used > 0 ? (
                            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs font-medium">
                              <Lock className="size-3 text-amber-600 dark:text-amber-400" />
                              {used} surat
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">Belum dipakai</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={!isAdmin}
                              onClick={() => openEditKlasifikasi(k)}
                              title="Ubah"
                            >
                              <Pencil className="text-muted-foreground size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={!isAdmin || used > 0}
                              onClick={async () => {
                                const res = await deleteKlasifikasi(k.kode);
                                if (res.ok) toast.success(`Kode ${k.kode} dihapus`);
                                else toast.error(res.error ?? "Gagal menghapus");
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
            </div>

            {/* Mobile Card View Klasifikasi */}
            <div className="divide-y divide-border md:hidden">
              {sortedKlasifikasi.map((k) => {
                const used = usageMap[k.kode] ?? 0;
                return (
                  <div key={k.kode} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="violet" className="font-mono">
                          {k.kode}
                        </Badge>
                        {used > 0 && (
                          <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
                            <Lock className="size-3 text-amber-600 dark:text-amber-400" />
                            {used} surat
                          </span>
                        )}
                      </div>
                      <div className="text-foreground mt-1 text-sm font-medium">{k.nama}</div>
                    </div>

                    {isAdmin && (
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8"
                          onClick={() => openEditKlasifikasi(k)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8 text-red-500"
                          disabled={used > 0}
                          onClick={async () => {
                            const res = await deleteKlasifikasi(k.kode);
                            if (res.ok) toast.success(`Kode ${k.kode} dihapus`);
                            else toast.error(res.error ?? "Gagal menghapus");
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Tambah/Ubah Tujuan Disposisi */}
      <Dialog open={dispDialogOpen} onOpenChange={setDispDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDisp ? "Ubah Tujuan Disposisi" : "Tambah Tujuan Disposisi Baru"}
            </DialogTitle>
            <DialogDescription>
              Masukkan nama jabatan atau unit kerja sekolah yang sering menerima disposisi surat
              masuk.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveDisposisi} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nama-disposisi">Nama Jabatan / Unit Kerja</Label>
              <Input
                id="nama-disposisi"
                required
                placeholder="Contoh: Koordinator BK / Kaprog TKJ"
                value={dispNama}
                onChange={(e) => {
                  setDispNama(e.target.value);
                  setDispError("");
                }}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <div className="text-foreground text-sm font-medium">Tampilkan di Form Surat</div>
                <p className="text-muted-foreground text-xs">
                  Muncul sebagai tombol disposisi cepat saat mencatat Surat Masuk.
                </p>
              </div>
              <Switch checked={dispAktif} onCheckedChange={setDispAktif} />
            </div>

            {dispError && <p className="text-xs font-medium text-red-500">{dispError}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSavingDisp}
                onClick={() => setDispDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSavingDisp} className={theme.buttonPrimary}>
                {isSavingDisp && <Loader2 className="size-4 animate-spin" />}
                {isSavingDisp ? "Menyimpan..." : "Simpan Disposisi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Hapus Tujuan Disposisi */}
      <AlertDialog
        open={Boolean(deletingDisp)}
        onOpenChange={(open) => !open && setDeletingDisp(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tujuan Disposisi Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Jabatan <b className="text-foreground">{deletingDisp?.nama}</b> akan dihapus dari
              pilihan cepat disposisi baru. Arsip surat masuk lama yang sudah memiliki catatan
              disposisi ini tetap aman dan tidak berubah.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteDisposisi}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Tambah/Ubah Klasifikasi */}
      <Dialog open={klasDialogOpen} onOpenChange={setKlasDialogOpen}>
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
                <p className="text-xs text-amber-700 dark:text-amber-300">
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
            {klasError && <p className="text-xs font-medium text-red-500">{klasError}</p>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSavingKlas}
                onClick={() => setKlasDialogOpen(false)}
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
