"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, MailCheck, ShieldCheck } from "lucide-react";
import { useApp } from "@/context/app-context";
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
  const { users, login } = useApp();
  const activeUsers = users.filter((u) => u.aktif);

  const [selectedUserId, setSelectedUserId] = useState(activeUsers[0]?.id ?? "u1");
  const [pin, setPin] = useState("123456");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim() || pin.trim().length < 4) {
      setError("Masukkan PIN minimal 4 digit (contoh demo: 123456).");
      return;
    }
    login(selectedUserId);
    router.push("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4">
      {/* Latar dekoratif lembut */}
      <div className="pointer-events-none absolute -top-32 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-200/50 via-blue-100/40 to-emerald-100/40 blur-3xl" />

      <div className="relative w-full max-w-md space-y-5">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25">
            <MailCheck className="size-6" />
          </div>
          <Badge variant="amber" className="mb-2">
            Mode Demo Portfolio
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Surat Sekolah
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sistem penomoran otomatis & arsip surat digital Tata Usaha
          </p>
        </div>

        <Card className="border-slate-200/90 shadow-lg shadow-slate-200/50">
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
                  <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
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
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                size="lg"
              >
                Masuk Aplikasi
                <ArrowRight className="size-4" />
              </Button>
            </form>

            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-indigo-600" />
              <div>
                <b>Info Demo:</b> PIN sudah terisi <code className="font-mono">123456</code>. Pada
                mode produksi, PIN divalidasi dengan hash SHA-256 + SALT yang kompatibel dengan
                database Google Sheets sekolah.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
