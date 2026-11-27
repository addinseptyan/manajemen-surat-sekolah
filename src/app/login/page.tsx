"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  Eye,
  EyeOff,
  Loader2,
  MailCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import type { Role } from "@/lib/types";
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
    <div className="relative flex min-h-dvh flex-col justify-between overflow-x-hidden bg-[#F8FAFC] text-slate-900 dark:bg-[#0B0F19] dark:text-slate-100">
      {/* Pendar Halus Sudut Kanan Atas & Kiri Bawah */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-36 -right-36 size-[460px] rounded-full bg-indigo-500/[0.08] blur-[120px] dark:bg-indigo-500/[0.14]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-40 size-[380px] rounded-full bg-indigo-400/[0.04] blur-[120px] dark:bg-indigo-500/[0.07]"
      />

      {/* Bar Atas: Identitas Aplikasi & Sekolah + Toggle Tema */}
      <header className="relative z-10 mx-auto flex w-full max-w-[1060px] items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs sm:size-10 sm:rounded-2xl dark:bg-indigo-500">
            <MailCheck className="size-4.5 sm:size-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm leading-tight font-bold tracking-tight text-slate-900 sm:text-[15px] dark:text-white">
              {displayAppName}
            </div>
            <div className="mt-0.5 truncate text-[11px] leading-tight text-slate-500 sm:text-xs dark:text-slate-400">
              {displaySchoolName}
            </div>
          </div>
        </div>

        <ThemeToggle className="size-9 shrink-0 rounded-full border-slate-200/90 bg-white shadow-xs ring-4 ring-indigo-500/10 hover:bg-slate-50 sm:size-10 dark:border-slate-800 dark:bg-slate-900 dark:ring-indigo-400/15 dark:hover:bg-slate-800" />
      </header>

      {/* Konten Tengah:
          - < 1024px (Di bawah Desktop / Non-Split-Screen): Section pertama disembunyikan penuh; hanya Kartu Login yang tampil rapi tepat di tengah layar.
          - >= 1024px (Desktop lg Split-Screen): Tampil 2 kolom penuh (Editorial Kiri + Kartu Login Kanan). */}
      <main className="relative z-10 mx-auto my-auto flex w-full max-w-[1060px] items-center justify-center px-5 py-6 sm:px-8 sm:py-8 lg:grid lg:grid-cols-12 lg:gap-12">
        {/* Section Pertama: Khusus Desktop Split-Screen (lg >= 1024px) */}
        <section className="hidden lg:col-span-7 lg:flex lg:flex-col lg:items-start lg:pr-8 lg:text-left">
          <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-indigo-200/70 bg-indigo-50/90 px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-indigo-700 uppercase dark:border-indigo-800/60 dark:bg-indigo-950/60 dark:text-indigo-300">
            <Sparkles className="size-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span className="truncate">{displaySchoolName}</span>
          </div>

          <h1 className="mt-5 text-5xl leading-[1.1] font-extrabold tracking-tight text-slate-900 xl:text-[3.25rem] dark:text-white">
            Tertib arsip,{" "}
            <span className="mt-1 block text-indigo-600 dark:text-indigo-400">
              siap melangkah.
            </span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-500 dark:text-slate-400">
            Masuk menggunakan akun pegawai untuk mengelola penomoran surat keluar,
            registrasi surat masuk, dan arsip digital sekolah.
          </p>

          <div className="mt-7 flex w-full max-w-[420px] items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3.5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.04)] dark:border-slate-800/80 dark:bg-slate-900/70">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
              <BookOpenCheck className="size-4.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                Siapkan akun pegawai
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Pilih nama pengguna terdaftar dan masukkan PIN keamanan Anda.
              </div>
            </div>
          </div>
        </section>

        {/* Section Kedua: Kartu Form Login (Tengah penuh saat < 1024px, Kolom Kanan saat >= 1024px) */}
        <section className="w-full max-w-[420px] lg:col-span-5 lg:ml-auto">
          <div className="w-full rounded-[24px] border border-slate-200/85 bg-white p-6 shadow-[0_12px_36px_-12px_rgba(15,23,42,0.06)] sm:rounded-[28px] sm:p-8 dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-none">
            <div>
              <p className="text-[11px] font-bold tracking-[0.12em] text-indigo-600 uppercase dark:text-indigo-400">
                Selamat Datang
              </p>
              <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 sm:text-[1.45rem] dark:text-white">
                Masuk sebagai pegawai
              </h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-[13px] dark:text-slate-400">
                Gunakan identitas yang sesuai dengan akun persuratan sekolah.
              </p>
            </div>

            {error && (
              <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-red-200/90 bg-red-50/60 px-3.5 py-3 text-xs leading-relaxed text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Nama pengguna
                </Label>
                <Select
                  disabled={loadingUsers}
                  value={selectedUserId}
                  onValueChange={handleSelectUser}
                >
                  <SelectTrigger className="h-11 w-full rounded-xl border-slate-200/90 bg-white px-3.5 text-sm shadow-none dark:border-slate-800 dark:bg-slate-950">
                    <SelectValue
                      placeholder={
                        loadingUsers
                          ? "Memuat daftar pengguna..."
                          : "Pilih nama pengguna"
                      }
                    />
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

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="pin"
                    className="text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    PIN keamanan
                  </Label>
                  <button
                    type="button"
                    onClick={() =>
                      toast.info("Lupa PIN Keamanan?", {
                        description:
                          "Silakan hubungi Admin Tata Usaha untuk mengatur ulang PIN akun Anda melalui menu Manajemen Pegawai.",
                      })
                    }
                    className="cursor-pointer text-xs font-medium text-slate-400 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    Lupa PIN?
                  </button>
                </div>

                <div className="relative">
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
                    className="h-11 rounded-xl border-slate-200/90 bg-white px-3.5 pr-10 text-sm shadow-none dark:border-slate-800 dark:bg-slate-950"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPin((prev) => !prev)}
                    aria-label={showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer p-1 text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    {showPin ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Opsi Sesi Ringkas */}
              <div className="flex items-center justify-between gap-3 pt-0.5">
                <Label
                  htmlFor="remember-device"
                  className="cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Ingat perangkat selama 7 hari
                </Label>
                <Switch
                  id="remember-device"
                  checked={rememberDevice}
                  onCheckedChange={setRememberDevice}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoggingIn || loadingUsers}
                className="mt-1 h-11 w-full rounded-full bg-indigo-600 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition-colors hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    Masuk ke aplikasi
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>

              <p className="pt-0.5 text-center text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                Setelah lima percobaan gagal, akses dikunci sementara untuk keamanan.
              </p>
            </form>

            {/* Garis Pemisah Bawah Kartu: Status Versi + Tautan Pengembang */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800/80 dark:text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>Sistem Normal</span>
                <span aria-hidden="true">&bull;</span>
                <span className="font-mono text-[11px]">{APP_VERSION}</span>
              </span>

              <a
                href={DEVELOPER_PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 transition-colors hover:text-slate-700 hover:underline dark:hover:text-slate-300"
              >
                <span>Pengembang Sistem</span>
                <ArrowUpRight className="size-3 opacity-75" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Catatan Keamanan Terpusat di Bawah Halaman */}
      <footer className="relative z-10 px-5 pt-1 pb-5 text-center text-xs text-slate-400 sm:pb-6 dark:text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
          <span>Gunakan perangkat dan jaringan yang dipercaya.</span>
        </span>
      </footer>
    </div>
  );
}
