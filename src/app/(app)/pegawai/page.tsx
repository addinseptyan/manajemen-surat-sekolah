"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Loader2, Pencil, Plus, Shield, Trash2, Users } from "lucide-react";
import { useApp } from "@/context/app-context";
import { THEMES } from "@/lib/theme";
import type { Role, User } from "@/lib/types";
import { cn, formatTanggalIndo, getInitials } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { TablePageSkeleton } from "@/components/shared/page-skeletons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const router = useRouter();
  const theme = THEMES.rose;
  const {
    users,
    currentUser,
    isAuthLoading,
    refreshUsers,
    saveUser,
    toggleUserAktif,
    deleteUser,
  } = useApp();

  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const [nama, setNama] = useState("");
  const [role, setRole] = useState<Role>("pegawai");
  const [pinBaru, setPinBaru] = useState("");
  const [aktif, setAktif] = useState(true);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!isAuthLoading && currentUser.role !== "admin") {
      router.replace("/dashboard?denied=admin");
      return;
    }
    void refreshUsers();
    const timer = setTimeout(() => setInitialLoading(false), 200);
    return () => clearTimeout(timer);
  }, [isAuthLoading, currentUser.role, refreshUsers, router]);

  function openCreate() {
    setEditingUser(null);
    setNama("");
    setRole("pegawai");
    setPinBaru("");
    setAktif(true);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(u: User) {
    setEditingUser(u);
    setNama(u.nama);
    setRole(u.role);
    setPinBaru("");
    setAktif(u.aktif);
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nama.trim() || isSaving) return;
    setIsSaving(true);
    setFormError("");

    const res = await saveUser({
      id: editingUser?.id,
      nama: nama.trim(),
      role,
      pin: pinBaru.trim() || undefined,
      aktif,
    });
    setIsSaving(false);

    if (!res.ok) {
      setFormError(res.error ?? "Gagal menyimpan data pegawai.");
      return;
    }

    setDialogOpen(false);
    toast.success(
      editingUser ? "Data akun pegawai diperbarui" : "Pegawai baru berhasil ditambahkan",
      { description: `${nama.trim()} (${role})` }
    );
  }

  async function handleToggleAktif(u: User, checked: boolean) {
    const res = await toggleUserAktif(u, checked);
    if (!res.ok) {
      toast.error("Tidak dapat mengubah status", { description: res.error });
      return;
    }
    toast.info(
      checked ? `Akses ${u.nama} diaktifkan` : `Akses ${u.nama} dinonaktifkan`
    );
  }

  async function handleConfirmDelete() {
    if (!deletingUser) return;
    const res = await deleteUser(deletingUser.id);
    if (!res.ok) {
      toast.error("Gagal menghapus akun", { description: res.error });
      setDeletingUser(null);
      return;
    }
    toast.success("Akun pegawai dihapus", { description: deletingUser.nama });
    setDeletingUser(null);
  }

  if (initialLoading || isAuthLoading || currentUser.role !== "admin") {
    return <TablePageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pegawai"
        description="Kelola akun staf Tata Usaha, peran akses (Admin/Pegawai), reset PIN SHA-256, serta status keaktifan."
        icon={Users}
        theme="rose"
        actions={
          <Button className={cn("w-full sm:w-auto", theme.buttonPrimary)} onClick={openCreate}>
            <Plus className="size-4" />
            Tambah Pegawai
          </Button>
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
                <TableHead className="w-28 text-right">Aksi</TableHead>
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
                            Hash &apos;h&apos; + SHA-256(SALT + PIN)
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
                      {u.dibuat ? formatTanggalIndo(u.dibuat) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={u.aktif}
                          disabled={isSelf}
                          onCheckedChange={(checked) => handleToggleAktif(u, checked)}
                        />
                        <span className="text-muted-foreground text-xs font-medium">
                          {u.aktif ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(u)}
                          title="Ubah / Reset PIN"
                        >
                          <Pencil className="text-muted-foreground size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isSelf}
                          onClick={() => setDeletingUser(u)}
                          title={
                            isSelf
                              ? "Tidak dapat menghapus akun sendiri"
                              : "Hapus akun pegawai"
                          }
                        >
                          <Trash2 className="size-4 text-red-500" />
                        </Button>
                      </div>
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
                        {u.dibuat ? `Terdaftar ${formatTanggalIndo(u.dibuat)}` : "Akun aktif"}
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
                      disabled={isSelf}
                      onCheckedChange={(checked) => handleToggleAktif(u, checked)}
                    />
                    <span className="text-muted-foreground text-xs font-medium">
                      {u.aktif ? "Akses Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                      <Pencil className="size-3.5" />
                      Ubah
                    </Button>
                    {!isSelf && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingUser(u)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
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
                : "Tetapkan nama, peran, dan PIN awal (4–8 angka). PIN Admin dan Pegawai tidak boleh sama."}
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
                onChange={(e) => {
                  setNama(e.target.value);
                  setFormError("");
                }}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Peran (Role)</Label>
                <Select
                  value={role}
                  disabled={Boolean(editingUser && editingUser.id === currentUser.id)}
                  onValueChange={(v) => {
                    setRole(v as Role);
                    setFormError("");
                  }}
                >
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
                  {editingUser ? "Reset PIN (Opsional)" : "PIN Awal (4–8 Angka)"}
                </Label>
                <div className="relative">
                  <KeyRound className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="pin-pegawai"
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    required={!editingUser}
                    placeholder="4–8 angka"
                    value={pinBaru}
                    onChange={(e) => {
                      setPinBaru(e.target.value);
                      setFormError("");
                    }}
                    className="pl-9 tracking-widest"
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
              <Switch
                checked={aktif}
                disabled={Boolean(editingUser && editingUser.id === currentUser.id)}
                onCheckedChange={setAktif}
              />
            </div>

            {formError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-950/60 dark:text-red-300">
                {formError}
              </p>
            )}

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

      {/* AlertDialog Konfirmasi Hapus Pegawai */}
      <AlertDialog
        open={Boolean(deletingUser)}
        onOpenChange={(open) => !open && setDeletingUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akun Pegawai Ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun <b className="text-foreground">{deletingUser?.nama}</b> akan dihapus dari
              daftar pengguna. Riwayat nama pembuat pada arsip surat yang pernah dicatat tetap
              tersimpan aman.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Ya, Hapus Akun
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
