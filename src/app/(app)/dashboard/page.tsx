"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Ban,
  Check,
  Copy,
  Hash,
  Inbox,
  LayoutDashboard,
  Send,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { formatNomorSurat } from "@/lib/utils";
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
  const [jenisPreview, setJenisPreview] = useState(klasifikasiList[0]?.kode ?? "SK");
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

  const totalKeluar = suratTahun.filter(
    (s) => s.arah === "keluar" && s.status === "Aktif"
  ).length;
  const totalMasuk = suratTahun.filter((s) => s.arah === "masuk").length;
  const totalBatal = suratTahun.filter((s) => s.status === "Batal").length;

  const nextNomor = useMemo(() => {
    const today = `${tahun}-11-23`;
    return formatNomorSurat(
      pengaturan.format,
      pengaturan.pad,
      getNextUrut(tahunNum),
      jenisPreview,
      today
    );
  }, [tahun, tahunNum, pengaturan, getNextUrut, jenisPreview]);

  const monthlyData = useMemo(() => {
    const base = Array.from({ length: 12 }, () => ({ keluar: 0, masuk: 0 }));
    suratTahun.forEach((s) => {
      const m = Number(s.tanggal.slice(5, 7)) - 1;
      if (base[m]) base[m][s.arah]++;
    });
    return base;
  }, [suratTahun]);

  const maxBar = Math.max(1, ...monthlyData.map((d) => d.keluar + d.masuk));

  const perJenis = useMemo(() => {
    const counts: Record<string, number> = {};
    suratTahun
      .filter((s) => s.arah === "keluar")
      .forEach((s) => {
        counts[s.jenis || "Lainnya"] = (counts[s.jenis || "Lainnya"] || 0) + 1;
      });
    return counts;
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
        description="Pantau volume surat masuk & keluar serta pratinjau nomor surat berikutnya."
        icon={LayoutDashboard}
        theme="indigo"
        actions={
          <Select value={tahun} onValueChange={setTahun}>
            <SelectTrigger className="w-32 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">Tahun 2026</SelectItem>
              <SelectItem value="2025">Tahun 2025</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Surat Keluar Aktif"
          value={totalKeluar}
          hint="Nomor resmi diterbitkan"
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
          label="Nomor Dibatalkan"
          value={totalBatal}
          hint="Dikunci agar urutan tetap utuh"
          icon={Ban}
          theme="rose"
        />
      </div>

      {/* Nomor Surat Berikutnya */}
      <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-violet-50/50 to-white">
        <CardContent className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-indigo-600 uppercase">
              <Hash className="size-3.5" />
              Nomor Surat Keluar Berikutnya
            </div>
            <div className="font-mono text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              {nextNomor}
            </div>
            <p className="text-xs text-slate-500">
              Urutan ke-<b>{getNextUrut(tahunNum)}</b> di tahun {tahun}. Cari jenis surat untuk
              simulasi kode.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <KlasifikasiCombobox
              items={klasifikasiList}
              value={jenisPreview}
              onValueChange={setJenisPreview}
              className="w-52"
            />

            <Button variant="outline" onClick={handleCopyNomor}>
              {copied ? (
                <>
                  <Check className="size-4 text-emerald-600" />
                  Tersalin
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Salin
                </>
              )}
            </Button>

            <Button asChild className="bg-indigo-600 text-white hover:bg-indigo-700">
              <Link href="/surat-keluar?new=1">
                Buat Surat
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grafik Bulanan & Klasifikasi */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Distribusi Surat per Bulan</CardTitle>
              <CardDescription>Perbandingan surat keluar & masuk sepanjang {tahun}</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-blue-500" /> Keluar
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-emerald-500" /> Masuk
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-44 items-end gap-2 pt-4">
              {monthlyData.map((d, idx) => {
                const total = d.keluar + d.masuk;
                const keluarH = Math.round((d.keluar / maxBar) * 110);
                const masukH = Math.round((d.masuk / maxBar) * 110);
                return (
                  <Tooltip key={BULAN_LABELS[idx]}>
                    <TooltipTrigger asChild>
                      <div className="group flex flex-1 cursor-pointer flex-col items-center justify-end gap-1">
                        <span className="text-[10px] font-semibold text-slate-500">
                          {total > 0 ? total : ""}
                        </span>
                        <div className="flex w-full max-w-8 flex-col justify-end overflow-hidden rounded-t-md bg-slate-100/80 transition-opacity group-hover:opacity-85">
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
                          {total === 0 && <div className="h-1.5 w-full bg-slate-200/70" />}
                        </div>
                        <span className="text-[11px] font-medium text-slate-500">
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
            <CardTitle className="text-base">Rekap Jenis Surat Keluar</CardTitle>
            <CardDescription>Berdasarkan kode klasifikasi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {klasifikasiList.map((k) => {
              const count = perJenis[k.kode] ?? 0;
              return (
                <div
                  key={k.kode}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 text-sm"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-mono text-xs font-bold text-indigo-700">{k.kode}</span>
                    <p className="truncate text-xs text-slate-500">{k.nama}</p>
                  </div>
                  <Badge variant={count > 0 ? "blue" : "secondary"}>{count} surat</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
