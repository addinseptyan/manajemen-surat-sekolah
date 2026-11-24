"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  Clock,
  KeyRound,
  Loader2,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import type { Role } from "@/lib/types";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const [isDemo, setIsDemo] = useState(true);
  const [demoPins, setDemoPins] = useState<{ adminPin: string; pegawaiPin: string } | null>(
    null
  );
  const [brandInfo, setBrandInfo] = useState<{
    namaAplikasi: string;
    namaSekolah: string;
  } | null>(null);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [pin, setPin] = useState("");
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
          if (data.brand) setBrandInfo(data.brand);
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
    if (isLoggingIn || loadingUsers) return;
    if (!selectedUserId) {
      setError("Pilih nama pengguna terlebih dahulu.");
      return;
    }
    if (!/^\d{4,8}$/.test(pin.trim())) {
      setError("PIN harus terdiri dari 4–8 digit angka.");
      return;
    }

    setIsLoggingIn(true);
    setError("");
    const res = await loginWithPin({
      id: selectedUserId,
      pin: pin.trim(),
      remember: rememberDevice,
    });
    setIsLoggingIn(false);

    if (!res.ok || !res.user) {
      setError(res.error ?? "PIN salah.");
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
        : "Sesi aktif selama 12 jam (otomatis terkunci besok).",
    });
    router.push(safeRedirect);
    router.refresh();
  }

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="pointer-events-none absolute -top-32 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-200/50 via-blue-100/40 to-emerald-100/40 blur-3xl dark:from-indigo-900/30 dark:via-violet-900/20 dark:to-emerald-950/20" />

      <div className="relative w-full max-w-md space-y-5">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25">
            <MailCheck className="size-6" />
          </div>
          {isDemo && (
            <Badge variant="amber" className="mb-2">
              Mode Demo Portfolio
            </Badge>
          )}
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            {brandInfo?.namaAplikasi || pengaturan.namaAplikasi}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {brandInfo?.namaSekolah || pengaturan.namaSekolah} — Arsip &amp; penomoran surat digital
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">Masuk ke Ruang Kerja</CardTitle>
            <CardDescription>
              Pilih nama pengguna aktif dan masukkan PIN keamanan Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nama Pengguna</Label>
                <Select
                  disabled={loadingUsers}
                  value={selectedUserId}
                  onValueChange={handleSelectUser}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingUsers ? "Memuat daftar pengguna..." : "Pilih pengguna"
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
                <Label htmlFor="pin">PIN Keamanan (4–8 Angka)</Label>
                <div className="relative">
                  <KeyRound className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    required
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      setError("");
                    }}
                    placeholder="Masukkan PIN"
                    className="pl-9 tracking-widest"
                  />
                </div>
              </div>

              {/* Opsi Durasi Sesi Hybrid: Default 12 Jam vs 7 Hari */}
              <div className="bg-muted/40 flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5">
                <div className="min-w-0">
                  <Label
                    htmlFor="remember-device"
                    className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold"
                  >
                    <Clock className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                    Ingat perangkat ini selama 7 hari
                  </Label>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">
                    {rememberDevice
                      ? "Cocok untuk HP atau laptop pribadi Anda."
                      : "Default 12 jam — aman untuk komputer bersama ruang TU."}
                  </p>
                </div>
                <Switch
                  id="remember-device"
                  checked={rememberDevice}
                  onCheckedChange={setRememberDevice}
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-950/60 dark:text-red-300">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoggingIn || loadingUsers}
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                size="lg"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Memverifikasi PIN...
                  </>
                ) : (
                  <>
                    Masuk Aplikasi
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            {isDemo && demoPins ? (
              <div className="bg-muted/50 text-muted-foreground mt-4 flex items-start gap-2.5 rounded-xl border border-border p-3 text-xs">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <div className="leading-relaxed">
                  <b className="text-foreground">Info Demo Autentikasi Nyata:</b> PIN Admin
                  bawaan <code className="font-mono font-bold">{demoPins.adminPin}</code> · PIN
                  Pegawai bawaan <code className="font-mono font-bold">{demoPins.pegawaiPin}</code>
                  . Diverifikasi di server memakai rumus{" "}
                  <code className="font-mono">&apos;h&apos; + SHA256(SALT + pin)</code> yang 100%
                  kompatibel dengan Spreadsheet sekolah.
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 text-muted-foreground mt-4 flex items-start gap-2.5 rounded-xl border border-border p-3 text-xs">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  Koneksi diamankan dengan sesi <code className="font-mono">httpOnly</code>{" "}
                  terenkripsi HMAC-SHA256. Jangan gunakan opsi 7 hari pada komputer publik.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
