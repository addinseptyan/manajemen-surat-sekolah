"use client";

import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
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

interface ChangePinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePinDialog({ open, onOpenChange }: ChangePinDialogProps) {
  const { currentUser, changeOwnPin } = useApp();

  const [pinLama, setPinLama] = useState("");
  const [pinBaru, setPinBaru] = useState("");
  const [konfirmasiPin, setKonfirmasiPin] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function resetForm() {
    setPinLama("");
    setPinBaru("");
    setKonfirmasiPin("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSaving) return;

    if (!/^\d{4,8}$/.test(pinBaru)) {
      setError("PIN baru harus terdiri dari 4–8 digit angka.");
      return;
    }
    if (pinBaru !== konfirmasiPin) {
      setError("Konfirmasi PIN baru tidak cocok.");
      return;
    }

    setIsSaving(true);
    const res = await changeOwnPin(pinLama, pinBaru);
    setIsSaving(false);

    if (!res.ok) {
      setError(res.error ?? "Gagal mengubah PIN.");
      return;
    }

    resetForm();
    onOpenChange(false);
    toast.success("PIN keamanan berhasil diperbarui", {
      description: `PIN baru untuk ${currentUser.nama} langsung aktif untuk login berikutnya.`,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-indigo-600 dark:text-indigo-400" />
            Ubah PIN Saya
          </DialogTitle>
          <DialogDescription>
            Perbarui PIN akses untuk <b>{currentUser.nama}</b> ({currentUser.role}). PIN
            dienkripsi satu arah menggunakan <code className="font-mono">SHA-256 + SALT</code>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="pin-lama">PIN Saat Ini</Label>
            <Input
              id="pin-lama"
              type="password"
              inputMode="numeric"
              maxLength={8}
              required
              placeholder="Masukkan PIN lama"
              value={pinLama}
              onChange={(e) => {
                setPinLama(e.target.value);
                setError("");
              }}
              className="tracking-widest"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pin-baru">PIN Baru (4–8 Angka)</Label>
              <Input
                id="pin-baru"
                type="password"
                inputMode="numeric"
                maxLength={8}
                required
                placeholder="PIN baru"
                value={pinBaru}
                onChange={(e) => {
                  setPinBaru(e.target.value);
                  setError("");
                }}
                className="tracking-widest"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pin-konfirmasi">Ulangi PIN Baru</Label>
              <Input
                id="pin-konfirmasi"
                type="password"
                inputMode="numeric"
                maxLength={8}
                required
                placeholder="Ulangi PIN"
                value={konfirmasiPin}
                onChange={(e) => {
                  setKonfirmasiPin(e.target.value);
                  setError("");
                }}
                className="tracking-widest"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-950/60 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="bg-muted/50 text-muted-foreground flex items-start gap-2 rounded-xl border border-border p-3 text-[11px]">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              Sesuai kebijakan keamanan sekolah, PIN akun <b>Admin</b> dan <b>Pegawai</b> tidak
              boleh menggunakan kombinasi angka yang sama.
            </span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {isSaving ? "Menyimpan..." : "Simpan PIN Baru"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
