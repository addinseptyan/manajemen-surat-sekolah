"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, Pencil, Plus, Shield, Users } from "lucide-react";
import { useApp } from "@/context/app-context";
import { THEMES } from "@/lib/theme";
import type { Role, User } from "@/lib/types";
import { cn, formatTanggalIndo, getInitials, sleep } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { TablePageSkeleton } from "@/components/shared/page-skeletons";
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
  const isAdmin = currentUser.role === "admin";

  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [nama, setNama] = useState("");
  const [role, setRole] = useState<Role>("pegawai");
  const [pinBaru, setPinBaru] = useState("");
  const [aktif, setAktif] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 220);
    return () => clearTimeout(timer);
  }, []);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim() || isSaving) return;
    setIsSaving(true);
    await sleep(260);
    saveUser({
      id: editingUser?.id,
      nama: nama.trim(),
      role,
      aktif,
    });
    setIsSaving(false);
    setDialogOpen(false);
    toast.success(
      editingUser ? "Data akun pegawai diperbarui" : "Pegawai baru berhasil ditambahkan",
      { description: `${nama.trim()} (${role})` }
    );
  }

  if (initialLoading) {
    return <TablePageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pegawai"
        description="Kelola akun staf Tata Usaha, peran akses (Admin/Pegawai), serta status keaktifan."
        icon={Users}
        theme="rose"
        actions={
          isAdmin ? (
            <Button className={cn("w-full sm:w-auto", theme.buttonPrimary)} onClick={openCreate}>
              <Plus className="size-4" />
              Tambah Pegawai
            </Button>
          ) : undefined
        }
      />

      <Card className="overflow-hidden py-0">
        {/* TAMPILAN DESKTOP */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Pegawai</TableHead>
                <TableHead className="w-36">Peran</TableHead>
                <TableHead className="w-44">Terdaftar</TableHead>
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
                          <AvatarFallback className="bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300">
                            {getInitials(u.nama)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-foreground font-medium">
                            {u.nama}
                            {isSelf && (
                              <span className="text-muted-foreground ml-2 text-xs font-normal">
                                (Anda)
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            PIN terenkripsi SHA-256
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === "admin" ? "violet" : "blue"}>
                        {u.role === "admin" && <Shield className="size-3" />}
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatTanggalIndo(u.dibuat)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={u.aktif}
                          disabled={isSelf || !isAdmin}
                          onCheckedChange={(checked) => {
                            toggleUserAktif(u.id, checked);
                            toast.info(
                              checked
                                ? `Akses ${u.nama} diaktifkan`
                                : `Akses ${u.nama} dinonaktifkan`
                            );
                          }}
                        />
                        <span className="text-muted-foreground text-xs font-medium">
                          {u.aktif ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!isAdmin}
                        onClick={() => openEdit(u)}
                      >
                        <Pencil className="size-3.5" />
                        Ubah
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* TAMPILAN MOBILE: Kartu Pegawai */}
        <div className="divide-y divide-border md:hidden">
          {users.map((u) => {
            const isSelf = u.id === currentUser.id;
            return (
              <div key={u.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-9 shrink-0">
                      <AvatarFallback className="bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300">
                        {getInitials(u.nama)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="text-foreground truncate text-sm font-semibold">
                        {u.nama}
                        {isSelf && (
                          <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                            (Anda)
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Terdaftar {formatTanggalIndo(u.dibuat)}
                      </div>
                    </div>
                  </div>
                  <Badge variant={u.role === "admin" ? "violet" : "blue"}>
                    {u.role === "admin" && <Shield className="size-3" />}
                    {u.role}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={u.aktif}
                      disabled={isSelf || !isAdmin}
                      onCheckedChange={(checked) => {
                        toggleUserAktif(u.id, checked);
                        toast.info(
                          checked
                            ? `Akses ${u.nama} diaktifkan`
                            : `Akses ${u.nama} dinonaktifkan`
                        );
                      }}
                    />
                    <span className="text-muted-foreground text-xs font-medium">
                      {u.aktif ? "Akses Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  {isAdmin && (
                    <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                      <Pencil className="size-3.5" />
                      Ubah
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
              <Label htmlFor="nama-pegawai">Nama Lengkap &amp; Gelar</Label>
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
                  <KeyRound className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
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

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <div className="text-foreground text-sm font-medium">Izinkan Login</div>
                <p className="text-muted-foreground text-xs">
                  Akun nonaktif tidak muncul di pilihan halaman Login.
                </p>
              </div>
              <Switch checked={aktif} onCheckedChange={setAktif} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSaving} className={theme.buttonPrimary}>
                {isSaving && <Loader2 className="size-4 animate-spin" />}
                {isSaving
                  ? "Menyimpan..."
                  : editingUser
                    ? "Simpan Perubahan"
                    : "Tambah Pegawai"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
