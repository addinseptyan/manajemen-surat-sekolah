"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Hash,
  Inbox,
  KeyRound,
  Loader2,
  Lock,
  MailCheck,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import type { Role } from "@/lib/types";
import { getInitials } from "@/lib/utils";
import {
  APP_VERSION,
  DEVELOPER_PORTFOLIO_URL,
  formatBrowserTitle,
} from "@/lib/version";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
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

interface PublicUserOption {
  id: string;
  nama: string;
  role: Role;
}

export default function LoginPage() {
  const router = useRouter();
  const { pengaturan, loginWithPin } = useApp();

  const [publicUsers, setPublicUsers] = useState<PublicUserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [demoPins, setDemoPins] = useState<{
    adminPin: string;
    pegawaiPin: string;
  } | null>(null);
  const [brandInfo, setBrandInfo] = useState<{
    namaAplikasi: string;
    namaSekolah: string;
  } | null>(null);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchUsers() {
      try {
        const res = await fetch("/api/auth/public-users", { cache: "no-store" });
        const data = (await res.json()) as {
          ok: boolean;
          demoMode?: boolean;
          demoHints?: { adminPin: string; pegawaiPin: string };
          users?: PublicUserOption[];
          brand?: { namaAplikasi: string; namaSekolah: string };
        };
        if (!cancelled && data.ok && data.users) {
          setPublicUsers(data.users);
          if (data.brand) {
            setBrandInfo(data.brand);
            document.title = formatBrowserTitle(
              data.brand.namaAplikasi,
              data.brand.namaSekolah
            );
          }
          const demoFlag = Boolean(data.demoMode);
          setIsDemo(demoFlag);
          setDemoPins(data.demoHints ?? null);
          const first = data.users[0];
          if (first) {
            setSelectedUserId(first.id);
            if (demoFlag && data.demoHints) {
              setPin(
                first.role === "admin"
                  ? data.demoHints.adminPin
                  : data.demoHints.pegawaiPin
              );
            }
          }
        }
      } catch {
        if (!cancelled) {
          setError("Gagal memuat daftar pengguna aktif.");
        }
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    }
    void fetchUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedUser = useMemo(
    () => publicUsers.find((u) => u.id === selectedUserId) ?? null,
    [publicUsers, selectedUserId]
  );

  function handleSelectUser(userId: string) {
    setSelectedUserId(userId);
    setError("");
    if (isDemo && demoPins) {
      const chosen = publicUsers.find((u) => u.id === userId);
      if (chosen) {
        setPin(chosen.role === "admin" ? demoPins.adminPin : demoPins.pegawaiPin);
      }
    } else {
      setPin("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId || !pin.trim() || isLoggingIn) return;
    setError("");
    setIsLoggingIn(true);

    const res = await loginWithPin({
      id: selectedUserId,
      pin: pin.trim(),
      remember: rememberDevice,
    });

    setIsLoggingIn(false);

    if (!res.ok || !res.user) {
      setError(res.error ?? "PIN tidak sesuai. Silakan periksa kembali.");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    const safeRedirect =
      from &&
      from.startsWith("/") &&
      !(
        res.user.role !== "admin" &&
        (from.startsWith("/pegawai") || from.startsWith("/pengaturan"))
      )
        ? from
        : "/dashboard";

    toast.success(`Selamat datang, ${res.user.nama}!`, {
      description: rememberDevice
        ? "Sesi aktif selama 7 hari di perangkat ini."
        : "Sesi aktif selama 12 jam.",
    });
    router.push(safeRedirect);
    router.refresh();
  }

  const displayAppName = brandInfo?.namaAplikasi || pengaturan.namaAplikasi;
  const displaySchoolName = brandInfo?.namaSekolah || pengaturan.namaSekolah;

  return (
    <div className="bg-background grid min-h-screen lg:grid-cols-12">
      {/* SISI KIRI: Split-Screen SaaS Showcase dengan Interactive Glass Mockup Card */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-slate-800/80 bg-[#0B0F1E] px-10 py-9 text-slate-100 lg:col-span-5 lg:flex xl:px-12">
        {/* Lightweight Pure CSS/SVG Ambient Glow & Subtle Noise Grid */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]"
        >
          <defs>
            <pattern
              id="auth-grid"
              width="36"
              height="36"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 36 0 L 0 0 0 36"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
        </svg>
        <div className="pointer-events-none absolute -top-24 -left-20 size-96 rounded-full bg-indigo-600/25 blur-[110px]" />
        <div className="pointer-events-none absolute right-[-4rem] bottom-10 size-80 rounded-full bg-violet-600/20 blur-[100px]" />

        {/* Header Identitas Sekolah */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
            <MailCheck className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-bold tracking-tight text-white">
              {displaySchoolName}
            </div>
            <div className="truncate text-xs text-slate-400">
              {displayAppName} &amp; Arsip Dokumen Resmi
            </div>
          </div>
        </div>

        {/* Tengah: Floating Glassmorphic Workflow Mockup + Editorial Copy di Bawahnya */}
        <div className="relative z-10 my-auto space-y-8 py-8">
          {/* Glassmorphic Stacked System Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-slate-900/65 p-5 shadow-2xl backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
                  Protokol Arsip Terpusat
                </span>
              </div>
              <span className="rounded-md border border-indigo-400/25 bg-indigo-500/15 px-2 py-0.5 font-mono text-[10px] font-medium text-indigo-300">
                Google Cloud Sync
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Baris 1 */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-slate-950/65 px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                    <Hash className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-slate-100">
                      Penomoran Surat Keluar
                    </div>
                    <div className="truncate font-mono text-[10px] text-slate-400">
                      Reset 001 Tahun Baru &bull; Penertiban Sela
                    </div>
                  </div>
                </div>
                <span className="shrink-0 rounded-md border border-emerald-500/25 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  Otomatis
                </span>
              </div>

              {/* Baris 2 */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-slate-950/65 px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                    <Inbox className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-slate-100">
                      Registrasi &amp; Disposisi Masuk
                    </div>
                    <div className="truncate font-mono text-[10px] text-slate-400">
                      Kepsek &bull; Waka &bull; TU &bull; Kaprogli
                    </div>
                  </div>
                </div>
                <span className="shrink-0 rounded-md border border-indigo-500/25 bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                  Aktif
                </span>
              </div>

              {/* Baris 3 */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-slate-950/65 px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-slate-100">
                      Pratinjau Berkas Internal
                    </div>
                    <div className="truncate font-mono text-[10px] text-slate-400">
                      PDF &bull; Gambar &bull; Microsoft Word (.docx)
                    </div>
                  </div>
                </div>
                <span className="shrink-0 rounded-md border border-emerald-500/25 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  Sinkron
                </span>
              </div>
            </div>
          </div>

          {/* Editorial Headline & Description */}
          <div className="space-y-2.5">
            <h2 className="text-2xl leading-snug font-bold tracking-tight text-white xl:text-[1.7rem]">
              Administrasi persuratan sekolah modern, aman &amp; terpadu.
            </h2>
            <p className="text-xs leading-relaxed text-slate-400 xl:text-[13px]">
              Mempercepat tata kelola penomoran surat keluar, pencatatan surat masuk,
              disposisi pimpinan, dan arsip digital {displaySchoolName} secara rapi serta
              akuntabel.
            </p>
          </div>
        </div>

        {/* Footer Micro-Trust Indicators */}
        <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Check className="size-3.5 text-emerald-400" />
            Arsip Drive Privat
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="size-3.5 text-indigo-400" />
            Sesi HMAC-SHA256
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="size-3.5 text-amber-400" />
            Siap Mobile &amp; Desktop
          </span>
        </div>
      </aside>

      {/* SISI KANAN: Clean Enterprise Authentication Canvas */}
      <main className="bg-background relative flex flex-col justify-between px-6 py-6 sm:px-10 sm:py-8 lg:col-span-7 xl:px-16">
        {/* Bar Atas: Identitas Ringkas Mobile + Theme Toggle */}
        <div className="flex items-center justify-between lg:justify-end">
          <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xs">
              <MailCheck className="size-4.5" />
            </div>
            <div className="min-w-0">
              <div className="text-foreground truncate text-sm font-bold tracking-tight">
                {displaySchoolName}
              </div>
              <div className="text-muted-foreground truncate text-[11px]">
                {displayAppName}
              </div>
            </div>
          </div>

          <ThemeToggle />
        </div>

        {/* Kontainer Form Utama */}
        <div className="mx-auto my-auto w-full max-w-[420px] py-6">
          <div className="mb-7 space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3 py-1 text-[11px] font-semibold text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/50 dark:text-indigo-300">
              <span className="size-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              Portal Akses Pegawai &amp; Staf TU
            </div>
            <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-[1.75rem]">
              {displayAppName}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field Pilih Pengguna */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
                  Pilih Pengguna
                </Label>
                <span className="rounded-md border border-indigo-200/70 bg-indigo-50/70 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:border-indigo-800/60 dark:bg-indigo-950/50 dark:text-indigo-300">
                  Akun Terdaftar
                </span>
              </div>

              <Select
                disabled={loadingUsers}
                value={selectedUserId}
                onValueChange={handleSelectUser}
              >
                <SelectTrigger className="h-12 rounded-xl px-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {selectedUser ? getInitials(selectedUser.nama) : "TU"}
                    </span>
                    <SelectValue
                      placeholder={
                        loadingUsers ? "Memuat daftar pengguna..." : "Pilih pengguna"
                      }
                    />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {publicUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nama} {u.role === "admin" ? "(Admin)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Field PIN Keamanan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="pin"
                  className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase"
                >
                  PIN Keamanan
                </Label>
                <button
                  type="button"
                  onClick={() =>
                    toast.info("Lupa PIN Keamanan?", {
                      description:
                        "Silakan hubungi Admin Tata Usaha untuk mengatur ulang PIN akun Anda melalui menu Manajemen Pegawai.",
                    })
                  }
                  className="cursor-pointer text-[11px] font-semibold text-indigo-600 transition-colors hover:text-indigo-700 hover:underline dark:text-indigo-400"
                >
                  Lupa PIN?
                </button>
              </div>

              <div className="relative">
                <KeyRound className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
                <Input
                  id="pin"
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={8}
                  required
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError("");
                  }}
                  placeholder="Masukkan PIN keamanan"
                  className="h-12 rounded-xl pr-10 pl-10 tracking-widest"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPin((prev) => !prev)}
                  aria-label={showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer p-1 transition-colors"
                >
                  {showPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              <div className="text-muted-foreground flex items-center justify-between px-0.5 text-[11px]">
                <span>Format: 4–8 digit angka</span>
                <span>Batas: 5x percobaan</span>
              </div>
            </div>

            {/* Switch Durasi Sesi */}
            <div className="bg-muted/35 flex items-center justify-between gap-3 rounded-xl border border-border/80 px-3.5 py-3">
              <div className="min-w-0">
                <Label
                  htmlFor="remember-device"
                  className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold"
                >
                  <Clock className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                  Ingat perangkat selama 7 hari
                </Label>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  {rememberDevice
                    ? "Tetap masuk pada HP atau laptop pribadi Anda."
                    : "Sesi standar 12 jam untuk komputer bersama di ruang TU."}
                </p>
              </div>
              <Switch
                id="remember-device"
                checked={rememberDevice}
                onCheckedChange={setRememberDevice}
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-600 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoggingIn || loadingUsers}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:from-indigo-700 hover:to-violet-700"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Masuk Aplikasi
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>

            {/* Kotak Pengingat Keamanan Sesi (Soft Emerald) */}
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3.5 py-3 text-[11px] leading-relaxed text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/35 dark:text-emerald-200">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                Sesi terenkripsi <code className="font-mono">httpOnly</code>. Pastikan Anda
                menekan tombol <b>Keluar</b> setelah selesai bertugas pada perangkat bersama.
              </span>
            </div>
          </form>
        </div>

        {/* Status Bar Bawah: Versi (Hanya 1x) di Kiri + Tautan Halus Pengembang di Kanan */}
        <footer className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Sistem Normal</span>
            <span aria-hidden="true" className="opacity-40">
              &bull;
            </span>
            <span className="font-mono text-[11px]">{APP_VERSION}</span>
          </div>

          <a
            href={DEVELOPER_PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground inline-flex items-center gap-1 underline-offset-4 transition-colors hover:underline"
          >
            <span>Pengembang Sistem</span>
            <ArrowUpRight className="size-3 opacity-75" />
          </a>
        </footer>
      </main>
    </div>
  );
}
