"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Input, PrimaryButton } from "@/components/ui";
import { mockUsers } from "@/lib/mock-data";

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(mockUsers[0].id);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Mode demo: PIN apa pun diterima, contoh 123456. Backend asli akan memvalidasi hash PIN.
    if (!pin.trim()) { setError("Masukkan PIN (demo: 123456)"); return; }
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto mt-24 max-w-sm">
      <Card className="border-t-4 border-t-indigo-600">
        <h1 className="text-xl font-bold">Manajemen Surat</h1>
        <p className="mb-4 text-sm text-slate-500">Pilih nama dan masukkan PIN (mode demo)</p>
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm font-medium">Nama
            <select value={userId} onChange={(e) => setUserId(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              {mockUsers.map((u) => <option key={u.id} value={u.id}>{u.nama}{u.role === "admin" ? " (Admin)" : ""}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium">PIN
            <Input type="password" inputMode="numeric" maxLength={8} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="123456" />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <PrimaryButton type="submit" className="w-full">Masuk</PrimaryButton>
        </form>
        <p className="mt-3 text-xs text-slate-400">Demo: pilih Admin, PIN 123456. Tidak ada data asli.</p>
      </Card>
    </div>
  );
}
