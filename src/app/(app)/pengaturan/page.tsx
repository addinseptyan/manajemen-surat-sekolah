"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
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
  const [isSavingFormat, setIsSavingFormat] = useState(false);
  const [isSavingKlas, setIsSavingKlas] = useState(false);

  const [format, setFormat] = useState(pengaturan.format);
  const [pad, setPad] = useState(String(pengaturan.pad));
  const [trial, setTrial] = useState(pengaturan.trial);

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

  const samplePreview = useMemo(
    () => formatNomorSurat(format, Number(pad) || 3, 1, "SK", "2026-01-05"),
    [format, pad]
  );

  const usageMap = useMemo(() => {
    const m: Record<string, number> = {};
    suratList.forEach((s) => {
      if (s.jenis) m[s.jenis] = (m[s.jenis] || 0) + 1;
    });
    return m;
  }, [suratList]);

  async function handleSaveFormat(e: React.FormEvent) {
    e.preventDefault();
    if (isSavingFormat) return;
    setIsSavingFormat(true);
    await sleep(260);
    savePengaturan({
      format: format.trim() || "34.114/{urut}/{jenis}/SMKNST/{bulan}/{tahun}",
      pad: Math.max(1, Math.min(6, Number(pad) || 3)),
      trial,
    });
    setIsSavingFormat(false);
    toast.success("Pengaturan format nomor diperbarui", {
      description: `Contoh: ${samplePreview}`,
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
      editingKode ? "Klasifikasi surat diperbarui" : "Klasifikasi baru ditambahkan",
      { description: `${kodeInput.trim()} — ${namaInput.trim()}` }
    );
  }

  if (initialLoading) {
    return <TablePageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Sistem"
        description="Atur pola penomoran surat keluar otomatis serta daftar kode klasifikasi resmi."
        icon={Settings}
        theme="violet"
      />

      <Tabs defaultValue="format">
        <TabsList>
          <TabsTrigger value="format">
            <Hash className="size-4" />
            Format Nomor Surat
          </TabsTrigger>
          <TabsTrigger value="klasifikasi">
            <Tags className="size-4" />
            Jenis / Klasifikasi ({klasifikasiList.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Format Nomor */}
        <TabsContent value="format">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pola Penomoran Surat Keluar</CardTitle>
              <CardDescription>
                Gunakan token <code className="font-mono">{"{urut}"}</code>,{" "}
                <code className="font-mono">{"{jenis}"}</code>,{" "}
                <code className="font-mono">{"{bulan}"}</code> (Romawi), dan{" "}
                <code className="font-mono">{"{tahun}"}</code>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveFormat} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div className="space-y-1.5 sm:col-span-3">
                    <Label htmlFor="pola">Template Format</Label>
                    <Input
                      id="pola"
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pad">Digit Urut (Padding)</Label>
                    <Input
                      id="pad"
                      type="number"
                      min={1}
                      max={6}
                      value={pad}
                      onChange={(e) => setPad(e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-4">
                  <div className="text-[11px] font-semibold tracking-wide text-violet-700 uppercase">
                    Hasil Pratinjau Langsung
                  </div>
                  <div className="mt-1 font-mono text-base font-bold text-violet-950">
                    {samplePreview}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-sm font-semibold text-slate-900">
                      Mode Percobaan (Trial)
                    </div>
                    <p className="text-xs text-slate-500">
                      Jika aktif, Admin diizinkan menghapus baris surat secara permanen. Matikan
                      saat sudah dipakai resmi agar surat hanya bisa dibatalkan, bukan dihapus.
                    </p>
                  </div>
                  <Switch checked={trial} onCheckedChange={setTrial} />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSavingFormat}
                    className={theme.buttonPrimary}
                  >
                    {isSavingFormat && <Loader2 className="size-4 animate-spin" />}
                    {isSavingFormat ? "Menyimpan..." : "Simpan Pengaturan"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Klasifikasi */}
        <TabsContent value="klasifikasi">
          <Card className="overflow-hidden py-0">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Daftar Kode Klasifikasi Surat
                </h2>
                <p className="text-xs text-slate-500">
                  Kode yang sudah dipakai pada surat keluar terkunci agar riwayat nomor konsisten.
                </p>
              </div>
              <Button className={theme.buttonPrimary} size="sm" onClick={openNewKlasifikasi}>
                <Plus className="size-4" />
                Tambah Jenis
              </Button>
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
                {klasifikasiList.map((k) => {
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
              surat keluar.
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
