"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  INITIAL_DISPOSISI,
  INITIAL_KLASIFIKASI,
  INITIAL_PENGATURAN,
  INITIAL_SURAT,
  INITIAL_USERS,
} from "@/lib/mock-data";
import type {
  Arah,
  DisposisiJabatan,
  Klasifikasi,
  Pengaturan,
  Role,
  Surat,
  User,
} from "@/lib/types";
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
  fileUrl?: string;
  fileMime?: string;
}

export interface SaveSuratResult {
  saved: Surat;
  generatedGaps: number[];
}

interface AppContextValue {
  currentUser: User;
  users: User[];
  suratList: Surat[];
  klasifikasiList: Klasifikasi[];
  disposisiList: DisposisiJabatan[];
  pengaturan: Pengaturan;
  login: (userId: string) => void;
  getNextUrut: (tahun: number) => number;
  getMissingUrutBefore: (tahun: number, targetUrut: number) => number[];
  saveSurat: (input: SaveSuratInput) => SaveSuratResult;
  deleteSurat: (id: string) => void;
  savePengaturan: (next: Pengaturan) => void;
  saveKlasifikasi: (item: Klasifikasi, oldKode?: string) => { ok: boolean; error?: string };
  deleteKlasifikasi: (kode: string) => { ok: boolean; error?: string };
  saveDisposisi: (input: {
    id?: string;
    nama: string;
    aktif: boolean;
  }) => { ok: boolean; error?: string };
  deleteDisposisi: (id: string) => void;
  saveUser: (input: { id?: string; nama: string; role: Role; aktif: boolean }) => void;
  toggleUserAktif: (id: string, aktif: boolean) => void;
}

function sortKlasifikasi(list: Klasifikasi[]): Klasifikasi[] {
  return [...list].sort((a, b) =>
    a.kode.localeCompare(b.kode, "id", { sensitivity: "base" })
  );
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUserId, setCurrentUserId] = useState<string>(INITIAL_USERS[0].id);
  const [suratList, setSuratList] = useState<Surat[]>(INITIAL_SURAT);
  const [rawKlasifikasi, setRawKlasifikasi] = useState<Klasifikasi[]>(INITIAL_KLASIFIKASI);
  const [disposisiList, setDisposisiList] =
    useState<DisposisiJabatan[]>(INITIAL_DISPOSISI);
  const [pengaturan, setPengaturan] = useState<Pengaturan>(INITIAL_PENGATURAN);

  const klasifikasiList = useMemo(() => sortKlasifikasi(rawKlasifikasi), [rawKlasifikasi]);
  const currentUser = users.find((u) => u.id === currentUserId) ?? users[0];

  useEffect(() => {
    document.title = `${pengaturan.namaAplikasi} — ${pengaturan.namaSekolah}`;
  }, [pengaturan.namaAplikasi, pengaturan.namaSekolah]);

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

  function getMissingUrutBefore(tahun: number, targetUrut: number): number[] {
    if (targetUrut <= 1) return [];
    const existing = new Set(
      suratList
        .filter((s) => s.arah === "keluar" && s.tahun === tahun && typeof s.urut === "number")
        .map((s) => Number(s.urut))
    );
    const gaps: number[] = [];
    for (let n = 1; n < targetUrut; n++) {
      if (!existing.has(n)) gaps.push(n);
    }
    return gaps;
  }

  function saveSurat(input: SaveSuratInput): SaveSuratResult {
    const tahun = Number(input.tanggal.slice(0, 4)) || new Date().getFullYear();
    const today = new Date().toISOString().slice(0, 10);

    // 1. Mode Ubah / Lengkapi Slot yang sudah ada
    if (input.id) {
      let updatedItem!: Surat;
      setSuratList((prev) =>
        prev.map((item) => {
          if (item.id !== input.id) return item;
          const finalUrut =
            item.arah === "keluar"
              ? input.urutManual ?? (typeof item.urut === "number" ? item.urut : 1)
              : "";
          const nextNomor =
            item.arah === "keluar" && typeof finalUrut === "number"
              ? input.nomorManual?.trim() ||
                formatNomorSurat(
                  pengaturan.format,
                  pengaturan.pad,
                  finalUrut,
                  input.jenis,
                  input.tanggal
                )
              : input.nomorManual ?? item.nomor;

          updatedItem = {
            ...item,
            urut: finalUrut,
            jenis: item.arah === "keluar" ? input.jenis : "",
            nomor: nextNomor,
            tahun,
            tanggal: input.tanggal,
            pihak: input.pihak,
            perihal: input.perihal,
            catatan: input.catatan,
            fileName: input.fileName ?? item.fileName,
            fileUrl:
              input.fileUrl ??
              (input.fileName ? item.fileUrl || "#demo-file" : item.fileUrl),
            fileMime: input.fileMime ?? item.fileMime,
            status: "Lengkap",
            pembuat:
              item.status === "Belum Lengkap" ? currentUser.nama : item.pembuat,
          };
          return updatedItem;
        })
      );
      return { saved: updatedItem, generatedGaps: [] };
    }

    // 2. Mode Buat Baru
    const targetUrut =
      input.arah === "keluar"
        ? Math.max(1, input.urutManual ?? getNextUrut(tahun))
        : ("" as const);

    if (input.arah === "keluar" && typeof targetUrut === "number") {
      const existingGapSlot = suratList.find(
        (s) =>
          s.arah === "keluar" &&
          s.tahun === tahun &&
          s.urut === targetUrut &&
          s.status === "Belum Lengkap"
      );
      if (existingGapSlot) {
        return saveSurat({ ...input, id: existingGapSlot.id, urutManual: targetUrut });
      }
    }

    const generatedGaps =
      input.arah === "keluar" && typeof targetUrut === "number"
        ? getMissingUrutBefore(tahun, targetUrut)
        : [];

    const gapItems: Surat[] = generatedGaps.map((n) => {
      const padStr = String(n).padStart(pengaturan.pad, "0");
      return {
        id: `gap-${tahun}-${n}-${Date.now()}`,
        arah: "keluar",
        nomor: formatNomorSurat(pengaturan.format, pengaturan.pad, n, "---", input.tanggal),
        urut: n,
        tahun,
        jenis: "",
        tanggal: input.tanggal,
        pihak: "— (Berkas fisik belum ditemukan)",
        perihal: `Slot Nomor Urut ${padStr} Kosong — Harap cari arsip fisik & unggah scan`,
        catatan: `Tergenerate otomatis saat lompat ke nomor ${String(targetUrut).padStart(
          pengaturan.pad,
          "0"
        )}`,
        fileUrl: "",
        status: "Belum Lengkap",
        pembuat: "Sistem Penertiban",
        dibuat: today,
      };
    });

    const nomor =
      input.arah === "keluar" && typeof targetUrut === "number"
        ? input.nomorManual?.trim() ||
          formatNomorSurat(
            pengaturan.format,
            pengaturan.pad,
            targetUrut,
            input.jenis,
            input.tanggal
          )
        : input.nomorManual?.trim() ?? "";

    const created: Surat = {
      id: `s-${Date.now()}`,
      arah: input.arah,
      nomor,
      urut: targetUrut,
      tahun,
      jenis: input.arah === "keluar" ? input.jenis : "",
      tanggal: input.tanggal,
      pihak: input.pihak,
      perihal: input.perihal,
      catatan: input.catatan,
      fileName: input.fileName,
      fileUrl: input.fileUrl ?? (input.fileName ? "#demo-file" : ""),
      fileMime: input.fileMime,
      status: "Lengkap",
      pembuat: currentUser.nama,
      dibuat: today,
    };

    setSuratList((prev) => [created, ...gapItems, ...prev]);
    return { saved: created, generatedGaps };
  }

  function deleteSurat(id: string) {
    setSuratList((prev) => prev.filter((s) => s.id !== id));
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
        return {
          ok: false,
          error: "Kode sudah dipakai di surat keluar sehingga tidak boleh diubah.",
        };
      }
    }
    const conflict = rawKlasifikasi.some(
      (k) => k.kode.toLowerCase() === cleanKode.toLowerCase() && k.kode !== oldKode
    );
    if (conflict) {
      return { ok: false, error: `Kode "${cleanKode}" sudah terdaftar.` };
    }

    if (oldKode) {
      setRawKlasifikasi((prev) =>
        prev.map((k) => (k.kode === oldKode ? { kode: cleanKode, nama: cleanNama } : k))
      );
    } else {
      setRawKlasifikasi((prev) => [...prev, { kode: cleanKode, nama: cleanNama }]);
    }
    return { ok: true };
  }

  function deleteKlasifikasi(kode: string) {
    const dipakai = suratList.some((s) => s.jenis === kode);
    if (dipakai) {
      return {
        ok: false,
        error: "Jenis surat sudah dipakai pada arsip dan tidak dapat dihapus.",
      };
    }
    setRawKlasifikasi((prev) => prev.filter((k) => k.kode !== kode));
    return { ok: true };
  }

  function saveDisposisi(input: { id?: string; nama: string; aktif: boolean }) {
    const clean = input.nama.trim();
    if (!clean) {
      return { ok: false, error: "Nama jabatan disposisi wajib diisi." };
    }
    const duplicate = disposisiList.some(
      (d) => d.nama.toLowerCase() === clean.toLowerCase() && d.id !== input.id
    );
    if (duplicate) {
      return { ok: false, error: `"${clean}" sudah ada di daftar disposisi.` };
    }

    if (input.id) {
      setDisposisiList((prev) =>
        prev.map((d) =>
          d.id === input.id ? { ...d, nama: clean, aktif: input.aktif } : d
        )
      );
    } else {
      setDisposisiList((prev) => [
        ...prev,
        { id: `d-${Date.now()}`, nama: clean, aktif: input.aktif },
      ]);
    }
    return { ok: true };
  }

  function deleteDisposisi(id: string) {
    setDisposisiList((prev) => prev.filter((d) => d.id !== id));
  }

  function saveUser(input: { id?: string; nama: string; role: Role; aktif: boolean }) {
    const today = new Date().toISOString().slice(0, 10);
    if (input.id) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === input.id
            ? { ...u, nama: input.nama, role: input.role, aktif: input.aktif }
            : u
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
        disposisiList,
        pengaturan,
        login,
        getNextUrut,
        getMissingUrutBefore,
        saveSurat,
        deleteSurat,
        savePengaturan,
        saveKlasifikasi,
        deleteKlasifikasi,
        saveDisposisi,
        deleteDisposisi,
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
