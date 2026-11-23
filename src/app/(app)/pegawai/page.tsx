"use client";

import { useState } from "react";
import { KeyRound, Pencil, Plus, Shield, Users } from "lucide-react";
import { useApp } from "@/context/app-context";
import { THEMES } from "@/lib/theme";
import type { Role, User } from "@/lib/types";
import { getInitials } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PegawaiPage() {
  const theme = THEMES.rose;
  const { users, currentUser, saveUser, toggleUserAktif } = useApp();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [nama, setNama] = useState("");
  const [role, setRole] = useState<Role>("pegawai");
  const [pinBaru, setPinBaru] = useState("");
  const [aktif, setAktif] = useState(true);

  function openCreate() {
    setEditingUser(null);
    setNama("");
    setRole("pegawai");
    setPinBaru("");
    setAktif(true);
    setDialogOpen(true);
  }

  function openEdit(u: User) {
    setEditingUser(u);
    setNama(u.nama);
    setRole(u.role);
    setPinBaru("");
    setAktif(u.aktif);
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim()) return;
    saveUser({
      id: editingUser?.id,
      nama: nama.trim(),
      role,
      aktif,
    });
    setDialogOpen(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pegawai"
        description="Kelola akun staf Tata Usaha, peran akses (Admin/Pegawai), serta status keaktifan."
        icon={Users}
        theme="rose"
        actions={
          <Button className={theme.buttonPrimary} onClick={openCreate}>
            <Plus className="size-4" />
            Tambah Pegawai
          </Button>
        }
      />

      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Pegawai</TableHead>
              <TableHead className="w-36">Peran</TableHead>
              <TableHead className="w-36">Terdaftar</TableHead>
              <TableHead className="w-36">Status Akses</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const isSelf = u.id === currentUser.id;
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-rose-100 text-rose-700">
                          {getInitials(u.nama)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-slate-900">
                          {u.nama}
                          {isSelf && (
                            <span className="ml-2 text-xs font-normal text-slate-400">
                              (Anda)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">PIN terenkripsi SHA-256</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "violet" : "blue"}>
                      {u.role === "admin" && <Shield className="size-3" />}
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">{u.dibuat}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={u.aktif}
                        disabled={isSelf}
                        onCheckedChange={(checked) => toggleUserAktif(u.id, checked)}
                      />
                      <span className="text-xs font-medium text-slate-600">
                        {u.aktif ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                      <Pencil className="size-3.5" />
                      Ubah
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog Tambah / Ubah Pegawai */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Ubah Akun Pegawai" : "Tambah Pegawai Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Kosongkan kolom PIN jika tidak ingin mereset PIN pegawai."
                : "Tetapkan nama, hak akses, dan PIN awal untuk login aplikasi."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nama-pegawai">Nama Lengkap & Gelar</Label>
              <Input
                id="nama-pegawai"
                required
                placeholder="Contoh: Dewi Lestari, S.Kom"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Peran (Role)</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pegawai">Pegawai</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pin-pegawai">
                  {editingUser ? "Reset PIN (Opsional)" : "PIN Awal"}
                </Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="pin-pegawai"
                    type="password"
                    inputMode="numeric"
                    required={!editingUser}
                    placeholder="6 digit angka"
                    value={pinBaru}
                    onChange={(e) => setPinBaru(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <div>
                <div className="text-sm font-medium text-slate-900">Izinkan Login</div>
                <p className="text-xs text-slate-500">
                  Akun nonaktif tidak muncul di pilihan halaman Login.
                </p>
              </div>
              <Switch checked={aktif} onCheckedChange={setAktif} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className={theme.buttonPrimary}>
                {editingUser ? "Simpan Perubahan" : "Tambah Pegawai"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
