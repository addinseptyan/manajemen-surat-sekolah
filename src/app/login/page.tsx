"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, KeyRound, Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { useApp } from "@/context/app-context";
import { sleep } from "@/lib/utils";
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

export default function LoginPage() {
  const router = useRouter();
  const { users, pengaturan, login } = useApp();
  const activeUsers = users.filter((u) => u.aktif);

  const [selectedUserId, setSelectedUserId] = useState(activeUsers[0]?.id ?? "u1");
  const [pin, setPin] = useState("123456");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoggingIn) return;
    if (!pin.trim() || pin.trim().length < 4) {
      setError("Masukkan PIN minimal 4 digit (contoh demo: 123456).");
      return;
    }
    setIsLoggingIn(true);
    await sleep(260);
    const chosen = activeUsers.find((u) => u.id === selectedUserId);
    login(selectedUserId);
    toast.success(`Selamat datang, ${chosen?.nama ?? "Pengguna"}!`);
    router.push("/dashboard");
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
          <Badge variant="amber" className="mb-2">
            Mode Demo Portfolio
          </Badge>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            {pengaturan.namaAplikasi}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {pengaturan.namaSekolah} — Arsip &amp; penomoran surat digital
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">Masuk ke Ruang Kerja</CardTitle>
            <CardDescription>
              Pilih nama pegawai dan masukkan PIN akses Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nama Pegawai</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pengguna" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nama} {u.role === "admin" ? "(Admin)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pin">PIN Keamanan</Label>
                <div className="relative">
                  <KeyRound className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
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

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-950/60 dark:text-red-300">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoggingIn}
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

            <div className="bg-muted/50 text-muted-foreground mt-4 flex items-start gap-2.5 rounded-xl border border-border p-3 text-xs">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <div>
                <b className="text-foreground">Info Demo:</b> PIN sudah terisi{" "}
                <code className="font-mono">123456</code>. Pada mode produksi, PIN divalidasi
                dengan hash SHA-256 + SALT yang kompatibel dengan database Google Sheets sekolah.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
