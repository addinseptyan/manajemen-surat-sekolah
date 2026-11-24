"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
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
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  demoMode: boolean;
  users: User[];
  suratList: Surat[];
  klasifikasiList: Klasifikasi[];
  disposisiList: DisposisiJabatan[];
  pengaturan: Pengaturan;
  loginWithPin: (input: {
    id: string;
    pin: string;
    remember: boolean;
  }) => Promise<{ ok: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  changeOwnPin: (
    pinLama: string,
    pinBaru: string
  ) => Promise<{ ok: boolean; error?: string }>;
  refreshUsers: () => Promise<void>;
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
  saveUser: (input: {
    id?: string;
    nama: string;
    role: Role;
    pin?: string;
    aktif: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  toggleUserAktif: (
    user: User,
    aktif: boolean
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteUser: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

function sortKlasifikasi(list: Klasifikasi[]): Klasifikasi[] {
  return [...list].sort((a, b) =>
    a.kode.localeCompare(b.kode, "id", { sensitivity: "base" })
  );
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [demoMode, setDemoMode] = useState<boolean>(true);

  const [suratList, setSuratList] = useState<Surat[]>(INITIAL_SURAT);
  const [rawKlasifikasi, setRawKlasifikasi] = useState<Klasifikasi[]>(INITIAL_KLASIFIKASI);
  const [disposisiList, setDisposisiList] =
    useState<DisposisiJabatan[]>(INITIAL_DISPOSISI);
  const [pengaturan, setPengaturan] = useState<Pengaturan>(INITIAL_PENGATURAN);

  const klasifikasiList = useMemo(() => sortKlasifikasi(rawKlasifikasi), [rawKlasifikasi]);
  const currentUser = authUser ?? INITIAL_USERS[0];
  const isAuthenticated = Boolean(authUser);

  useEffect(() => {
    document.title = `${pengaturan.namaAplikasi} — ${pengaturan.namaSekolah}`;
  }, [pengaturan.namaAplikasi, pengaturan.namaSekolah]);

  const refreshUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { ok: boolean; users?: User[] };
      if (data.ok && data.users) {
        setUsers(data.users);
      }
    } catch {
      // Abaikan gangguan jaringan sementara
    }
  }, []);

  // Sinkronisasi sesi aktif dari httpOnly cookie
  useEffect(() => {
    if (pathname === "/login") {
      setIsAuthLoading(false);
      return;
    }

    let cancelled = false;
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) {
            setAuthUser(null);
            setIsAuthLoading(false);
          }
          return;
        }
        const data = (await res.json()) as {
          ok: boolean;
          demoMode?: boolean;
          user?: User;
        };
        if (!cancelled && data.ok && data.user) {
          setAuthUser(data.user);
          if (typeof data.demoMode === "boolean") setDemoMode(data.demoMode);
          if (data.user.role === "admin") {
            void refreshUsers();
          }
        }
      } catch {
        // Pertahankan state bila gagal fetch
      } finally {
        if (!cancelled) setIsAuthLoading(false);
      }
    }

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, [pathname, refreshUsers]);

  async function loginWithPin(input: { id: string; pin: string; remember: boolean }) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as {
        ok: boolean;
        user?: User;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.user) {
        return { ok: false, error: data.error || "PIN salah." };
      }
      setAuthUser(data.user);
      if (data.user.role === "admin") {
        void refreshUsers();
      }
      return { ok: true, user: data.user };
    } catch {
      return { ok: false, error: "Gagal menghubungi server autentikasi." };
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setAuthUser(null);
    }
  }

  async function changeOwnPin(pinLama: string, pinBaru: string) {
    try {
      const res = await fetch("/api/auth/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinLama, pinBaru }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error || "Gagal mengubah PIN." };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Gagal menghubungi server." };
    }
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

  async function saveUser(input: {
    id?: string;
    nama: string;
    role: Role;
    pin?: string;
    aktif: boolean;
  }) {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as {
        ok: boolean;
        users?: User[];
        user?: User;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error || "Gagal menyimpan akun pegawai." };
      }
      if (data.users) setUsers(data.users);
      if (data.user && authUser && data.user.id === authUser.id) {
        setAuthUser(data.user);
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Gagal menghubungi server." };
    }
  }

  async function toggleUserAktif(user: User, aktif: boolean) {
    return saveUser({
      id: user.id,
      nama: user.nama,
      role: user.role,
      aktif,
    });
  }

  async function deleteUser(id: string) {
    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as {
        ok: boolean;
        users?: User[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error || "Gagal menghapus pegawai." };
      }
      if (data.users) setUsers(data.users);
      return { ok: true };
    } catch {
      return { ok: false, error: "Gagal menghubungi server." };
    }
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isAuthLoading,
        demoMode,
        users,
        suratList,
        klasifikasiList,
        disposisiList,
        pengaturan,
        loginWithPin,
        logout,
        changeOwnPin,
        refreshUsers,
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
        deleteUser,
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
