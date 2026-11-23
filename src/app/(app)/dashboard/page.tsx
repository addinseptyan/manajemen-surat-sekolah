"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Copy,
  FileCheck2,
  Hash,
  Inbox,
  LayoutDashboard,
  Send,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatNomorSurat, formatTanggalIndo } from "@/lib/utils";
import { KlasifikasiCombobox } from "@/components/shared/klasifikasi-combobox";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardSkeleton } from "@/components/shared/page-skeletons";
import { StatCard } from "@/components/shared/stat-card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const BULAN_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export default function DashboardPage() {
  const { suratList, klasifikasiList, pengaturan, getNextUrut } = useApp();
  const [initialLoading, setInitialLoading] = useState(true);
  const [tahun, setTahun] = useState("2026");
  const [jenisPreview, setJenisPreview] = useState(klasifikasiList[0]?.kode ?? "B");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 240);
    return () => clearTimeout(timer);
  }, []);

  const tahunNum = Number(tahun);
  const suratTahun = useMemo(
    () => suratList.filter((s) => s.tahun === tahunNum),
    [suratList, tahunNum]
  );

  const totalKeluarTerisi = suratTahun.filter(
    (s) => s.arah === "keluar" && s.status === "Lengkap"
  ).length;
  const totalMasuk = suratTahun.filter((s) => s.arah === "masuk").length;

  const suratLengkapData = suratTahun.filter((s) => s.status === "Lengkap");
  const sudahScanCount = suratLengkapData.filter((s) => Boolean(s.fileName)).length;
  const belumScanCount = suratLengkapData.length - sudahScanCount;
  const slotKosongList = suratTahun.filter((s) => s.status === "Belum Lengkap");

  const nextUrut = getNextUrut(tahunNum);
  const nextNomor = useMemo(() => {
    const sampleDate = tahunNum >= 2027 ? `${tahun}-01-02` : `${tahun}-11-23`;
    return formatNomorSurat(
      pengaturan.format,
      pengaturan.pad,
      nextUrut,
      jenisPreview,
      sampleDate
    );
  }, [tahun, tahunNum, pengaturan, nextUrut, jenisPreview]);

  const monthlyData = useMemo(() => {
    const base = Array.from({ length: 12 }, () => ({ keluar: 0, masuk: 0 }));
    suratTahun
      .filter((s) => s.status === "Lengkap")
      .forEach((s) => {
        const m = Number(s.tanggal.slice(5, 7)) - 1;
        if (base[m]) base[m][s.arah]++;
      });
    return base;
  }, [suratTahun]);

  const maxBar = Math.max(1, ...monthlyData.map((d) => d.keluar + d.masuk));

  const perJenis = useMemo(() => {
    const counts: Record<string, number> = {};
    suratTahun
      .filter((s) => s.arah === "keluar" && s.status === "Lengkap")
      .forEach((s) => {
        counts[s.jenis || "Lainnya"] = (counts[s.jenis || "Lainnya"] || 0) + 1;
      });
    return counts;
  }, [suratTahun]);

  const recentSurat = useMemo(() => {
    return [...suratTahun]
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
      .slice(0, 4);
  }, [suratTahun]);

  function handleCopyNomor() {
    navigator.clipboard.writeText(nextNomor);
    setCopied(true);
    toast.success("Nomor simulasi disalin", { description: nextNomor });
    setTimeout(() => setCopied(false), 1800);
  }

  if (initialLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Dashboard Arsip ${tahun}`}
        description={`${pengaturan.namaSekolah} · Pantau penomoran, kelengkapan scan, dan kesiapan tahun baru.`}
        icon={LayoutDashboard}
        theme="indigo"
        actions={
          <Select value={tahun} onValueChange={setTahun}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2027">Tahun 2027 (Baru)</SelectItem>
              <SelectItem value="2026">Tahun 2026</SelectItem>
              <SelectItem value="2025">Tahun 2025</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Banner Peringatan Penertiban Administrasi */}
      {(slotKosongList.length > 0 || belumScanCount > 0) && (
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50 via-orange-50/70 to-white p-4 sm:flex-row sm:items-center dark:border-amber-800/60 dark:from-amber-950/50 dark:via-amber-950/25 dark:to-card">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
              <AlertTriangle className="size-5" />
            </div>
            <div className="text-xs leading-relaxed text-amber-950 dark:text-amber-200">
              <div className="text-sm font-semibold">Perhatian Penertiban Arsip {tahun}</div>
              <p className="mt-0.5">
                {slotKosongList.length > 0 && (
                  <>
                    Terdapat{" "}
                    <b>
                      {slotKosongList.length} nomor urut kosong (
                      {slotKosongList
                        .map((s) => String(s.urut).padStart(pengaturan.pad, "0"))
                        .join(", ")}
                      )
                    </b>{" "}
                    yang perlu dicari berkas fisiknya
                    {belumScanCount > 0 ? ", serta " : ". "}
                  </>
                )}
                {belumScanCount > 0 && (
                  <>
                    <b>{belumScanCount} surat</b> belum diunggah scan PDF-nya.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {slotKosongList.length > 0 && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/surat-keluar?filter=slot">Lengkapi Nomor Kosong</Link>
              </Button>
            )}
            {belumScanCount > 0 && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/surat-keluar?filter=scan">Cek Belum Scan</Link>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Surat Keluar Terisi"
          value={totalKeluarTerisi}
          hint={
            slotKosongList.length > 0
              ? `+ ${slotKosongList.length} slot kosong sedang dicari`
              : "Semua nomor berurutan rapi"
          }
          icon={Send}
          theme="blue"
        />
        <StatCard
          label="Surat Masuk"
          value={totalMasuk}
          hint="Tercatat dari instansi luar"
          icon={Inbox}
          theme="emerald"
        />
        <StatCard
          label="Kelengkapan Scan PDF"
          value={`${sudahScanCount}/${suratLengkapData.length}`}
          hint={
            belumScanCount > 0
              ? `${belumScanCount} surat belum ada file scan`
              : "Seluruh arsip sudah di-scan"
          }
          icon={FileCheck2}
          theme="amber"
        />
      </div>

      {/* Nomor Surat Berikutnya */}
      <Card className="border-indigo-200/70 bg-gradient-to-r from-indigo-50/80 via-violet-50/50 to-white dark:border-indigo-900/60 dark:from-indigo-950/45 dark:via-violet-950/25 dark:to-card">
        <CardContent className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide text-indigo-600 uppercase dark:text-indigo-400">
              <Hash className="size-3.5" />
              Nomor Surat Keluar Berikutnya ({tahun})
              {nextUrut === 1 && (
                <Badge variant="emerald" className="normal-case">
                  Otomatis Reset Mulai 001
                </Badge>
              )}
            </div>
            <div className="text-foreground font-mono text-base font-bold tracking-tight break-all sm:text-xl">
              {nextNomor}
            </div>
            <p className="text-muted-foreground text-xs">
              Urutan ke-<b>{String(nextUrut).padStart(pengaturan.pad, "0")}</b> di tahun {tahun}.
              Pilih tahun <b>2027</b> di kanan atas untuk melihat simulasi reset tahun baru.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <KlasifikasiCombobox
              items={klasifikasiList}
              value={jenisPreview}
              onValueChange={setJenisPreview}
              className="w-full sm:w-52"
            />

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button variant="outline" onClick={handleCopyNomor} className="w-full sm:w-auto">
                {copied ? (
                  <>
                    <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                    Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    Salin
                  </>
                )}
              </Button>

              <Button
                asChild
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700 sm:w-auto"
              >
                <Link href="/surat-keluar?new=1">
                  Buat Surat
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grafik Bulanan & Klasifikasi (Urut Abjad A-Z) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Distribusi Surat per Bulan</CardTitle>
              <CardDescription>
                Perbandingan surat keluar &amp; masuk sepanjang {tahun}
              </CardDescription>
            </div>
            <div className="text-muted-foreground flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-blue-500" /> Keluar
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-emerald-500" /> Masuk
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-44 items-end gap-1.5 pt-4 sm:gap-2">
              {monthlyData.map((d, idx) => {
                const total = d.keluar + d.masuk;
                const keluarH = Math.round((d.keluar / maxBar) * 110);
                const masukH = Math.round((d.masuk / maxBar) * 110);
                return (
                  <Tooltip key={BULAN_LABELS[idx]}>
                    <TooltipTrigger asChild>
                      <div className="group flex flex-1 cursor-pointer flex-col items-center justify-end gap-1">
                        <span className="text-muted-foreground text-[10px] font-semibold">
                          {total > 0 ? total : ""}
                        </span>
                        <div className="bg-muted flex w-full max-w-8 flex-col justify-end overflow-hidden rounded-t-md transition-opacity group-hover:opacity-85">
                          {d.keluar > 0 && (
                            <div
                              className="w-full bg-blue-500 transition-all"
                              style={{ height: `${Math.max(6, keluarH)}px` }}
                            />
                          )}
                          {d.masuk > 0 && (
                            <div
                              className="w-full bg-emerald-500 transition-all"
                              style={{ height: `${Math.max(6, masukH)}px` }}
                            />
                          )}
                          {total === 0 && <div className="bg-border h-1.5 w-full" />}
                        </div>
                        <span className="text-muted-foreground text-[10px] font-medium sm:text-[11px]">
                          {BULAN_LABELS[idx]}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {BULAN_LABELS[idx]} {tahun}: {d.keluar} keluar · {d.masuk} masuk
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rekap Klasifikasi (A–Z)</CardTitle>
            <CardDescription>Terurut otomatis sesuai abjad kode</CardDescription>
          </CardHeader>
          <CardContent className="max-h-60 space-y-2 overflow-y-auto">
            {klasifikasiList.map((k) => {
              const count = perJenis[k.kode] ?? 0;
              return (
                <div
                  key={k.kode}
                  className="bg-muted/50 flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {k.kode}
                    </span>
                    <p className="text-muted-foreground truncate text-xs">{k.nama}</p>
                  </div>
                  <Badge variant={count > 0 ? "blue" : "secondary"}>{count} surat</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Aktivitas Arsip Terbaru */}
      {recentSurat.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Aktivitas Surat Terbaru ({tahun})</CardTitle>
              <CardDescription>Ringkasan cepat pencatatan terakhir</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/surat-keluar">
                Lihat Semua
                <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {recentSurat.map((s) => (
              <Link
                key={s.id}
                href={s.arah === "keluar" ? "/surat-keluar" : "/surat-masuk"}
                className="hover:bg-muted/60 flex items-start justify-between gap-3 rounded-xl border border-border p-3 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={s.arah === "keluar" ? "blue" : "emerald"}
                      className="px-1.5 py-0 text-[10px]"
                    >
                      {s.arah === "keluar" ? "Keluar" : "Masuk"}
                    </Badge>
                    <span className="text-muted-foreground text-[11px]">
                      {formatTanggalIndo(s.tanggal)}
                    </span>
                  </div>
                  <p className="text-foreground mt-1 truncate text-xs font-semibold">
                    {s.perihal}
                  </p>
                  <p className="text-muted-foreground truncate font-mono text-[11px]">
                    {s.nomor || s.pihak}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
