"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  INITIAL_KLASIFIKASI,
  INITIAL_PENGATURAN,
  INITIAL_SURAT,
  INITIAL_USERS,
} from "@/lib/mock-data";
import type { Arah, Klasifikasi, Pengaturan, Role, Surat, User } from "@/lib/types";
import { formatNomorSurat } from "@/lib/utils";

export interface SaveSuratInput {
  id?: string;
  arah: Arah;
  nomorManual?: string;
  urutManual?: number;
  jenis: string;
  tanggal: string;
  pihak: string;
  perihal: string;
  catatan: string;
  fileName?: string;
}

interface AppContextValue {
  currentUser: User;
  users: User[];
  suratList: Surat[];
  klasifikasiList: Klasifikasi[];
  pengaturan: Pengaturan;
  login: (userId: string) => void;
  getNextUrut: (tahun: number) => number;
  saveSurat: (input: SaveSuratInput) => Surat;
  cancelSurat: (id: string, alasan: string) => void;
  deleteSurat: (id: string) => void;
  importCsvSurat: (rows: Omit<Surat, "id" | "dibuat" | "pembuat" | "status" | "fileUrl">[]) => number;
  savePengaturan: (next: Pengaturan) => void;
  saveKlasifikasi: (item: Klasifikasi, oldKode?: string) => { ok: boolean; error?: string };
  deleteKlasifikasi: (kode: string) => { ok: boolean; error?: string };
  saveUser: (input: { id?: string; nama: string; role: Role; aktif: boolean }) => void;
  toggleUserAktif: (id: string, aktif: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUserId, setCurrentUserId] = useState<string>(INITIAL_USERS[0].id);
  const [suratList, setSuratList] = useState<Surat[]>(INITIAL_SURAT);
  const [klasifikasiList, setKlasifikasiList] = useState<Klasifikasi[]>(INITIAL_KLASIFIKASI);
  const [pengaturan, setPengaturan] = useState<Pengaturan>(INITIAL_PENGATURAN);

  const currentUser = users.find((u) => u.id === currentUserId) ?? users[0];

  function login(userId: string) {
    const found = users.find((u) => u.id === userId && u.aktif);
    if (found) setCurrentUserId(found.id);
  }

  function getNextUrut(tahun: number): number {
    const maxUrut = suratList
      .filter((s) => s.arah === "keluar" && s.tahun === tahun && typeof s.urut === "number")
      .reduce((max, s) => Math.max(max, Number(s.urut) || 0), 0);
    return maxUrut + 1;
  }

  function saveSurat(input: SaveSuratInput): Surat {
    const tahun = Number(input.tanggal.slice(0, 4)) || new Date().getFullYear();
    const today = new Date().toISOString().slice(0, 10);

    if (input.id) {
      let updatedItem!: Surat;
      setSuratList((prev) =>
        prev.map((item) => {
          if (item.id !== input.id) return item;
          const nextNomor =
            item.arah === "keluar" && typeof item.urut === "number"
              ? formatNomorSurat(pengaturan.format, pengaturan.pad, item.urut, input.jenis, input.tanggal)
              : input.nomorManual ?? item.nomor;
          updatedItem = {
            ...item,
            jenis: item.arah === "keluar" ? input.jenis : "",
            nomor: nextNomor,
            tahun,
            tanggal: input.tanggal,
            pihak: input.pihak,
            perihal: input.perihal,
            catatan: input.catatan,
            fileName: input.fileName ?? item.fileName,
            fileUrl: input.fileName ? "#demo-file" : item.fileUrl,
          };
          return updatedItem;
        })
      );
      return updatedItem;
    }

    const urut =
      input.arah === "keluar" ? input.urutManual ?? getNextUrut(tahun) : "";
    const nomor =
      input.arah === "keluar"
        ? input.nomorManual?.trim() ||
          formatNomorSurat(pengaturan.format, pengaturan.pad, Number(urut), input.jenis, input.tanggal)
        : input.nomorManual?.trim() ?? "";

    const created: Surat = {
      id: `s-${Date.now()}`,
      arah: input.arah,
      nomor,
      urut,
      tahun,
      jenis: input.arah === "keluar" ? input.jenis : "",
      tanggal: input.tanggal,
      pihak: input.pihak,
      perihal: input.perihal,
      catatan: input.catatan,
      fileName: input.fileName,
      fileUrl: input.fileName ? "#demo-file" : "",
      status: "Aktif",
      pembuat: currentUser.nama,
      dibuat: today,
    };

    setSuratList((prev) => [created, ...prev]);
    return created;
  }

  function cancelSurat(id: string, alasan: string) {
    const today = new Date().toISOString().slice(0, 10);
    setSuratList((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: "Batal",
              alasanBatal: alasan,
              batalOleh: currentUser.nama,
              batalWaktu: today,
            }
          : s
      )
    );
  }

  function deleteSurat(id: string) {
    setSuratList((prev) => prev.filter((s) => s.id !== id));
  }

  function importCsvSurat(
    rows: Omit<Surat, "id" | "dibuat" | "pembuat" | "status" | "fileUrl">[]
  ): number {
    const today = new Date().toISOString().slice(0, 10);
    const created: Surat[] = rows.map((r, idx) => ({
      ...r,
      id: `imp-${Date.now()}-${idx}`,
      fileUrl: r.fileName ? "#demo-file" : "",
      status: "Aktif",
      pembuat: currentUser.nama,
      dibuat: today,
    }));
    setSuratList((prev) => [...created, ...prev]);
    return created.length;
  }

  function savePengaturan(next: Pengaturan) {
    setPengaturan(next);
  }

  function saveKlasifikasi(item: Klasifikasi, oldKode?: string) {
    const cleanKode = item.kode.trim();
    const cleanNama = item.nama.trim();
    if (!cleanKode || !cleanNama) {
      return { ok: false, error: "Kode dan nama jenis surat wajib diisi." };
    }
    if (oldKode && oldKode !== cleanKode) {
      const dipakai = suratList.some((s) => s.jenis === oldKode);
      if (dipakai) {
        return { ok: false, error: "Kode sudah dipakai di surat keluar sehingga tidak boleh diubah." };
      }
    }
    const conflict = klasifikasiList.some(
      (k) => k.kode.toLowerCase() === cleanKode.toLowerCase() && k.kode !== oldKode
    );
    if (conflict) {
      return { ok: false, error: `Kode "${cleanKode}" sudah terdaftar.` };
    }

    if (oldKode) {
      setKlasifikasiList((prev) =>
        prev.map((k) => (k.kode === oldKode ? { kode: cleanKode, nama: cleanNama } : k))
      );
    } else {
      setKlasifikasiList((prev) => [...prev, { kode: cleanKode, nama: cleanNama }]);
    }
    return { ok: true };
  }

  function deleteKlasifikasi(kode: string) {
    const dipakai = suratList.some((s) => s.jenis === kode);
    if (dipakai) {
      return { ok: false, error: "Jenis surat sudah dipakai pada arsip dan tidak dapat dihapus." };
    }
    setKlasifikasiList((prev) => prev.filter((k) => k.kode !== kode));
    return { ok: true };
  }

  function saveUser(input: { id?: string; nama: string; role: Role; aktif: boolean }) {
    const today = new Date().toISOString().slice(0, 10);
    if (input.id) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === input.id ? { ...u, nama: input.nama, role: input.role, aktif: input.aktif } : u
        )
      );
      return;
    }
    setUsers((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        nama: input.nama,
        role: input.role,
        aktif: input.aktif,
        dibuat: today,
      },
    ]);
  }

  function toggleUserAktif(id: string, aktif: boolean) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, aktif } : u)));
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        suratList,
        klasifikasiList,
        pengaturan,
        login,
        getNextUrut,
        saveSurat,
        cancelSurat,
        deleteSurat,
        importCsvSurat,
        savePengaturan,
        saveKlasifikasi,
        deleteKlasifikasi,
        saveUser,
        toggleUserAktif,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp harus digunakan di dalam AppProvider");
  return ctx;
}
