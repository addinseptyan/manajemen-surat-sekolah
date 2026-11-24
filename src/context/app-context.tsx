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
  file?: File;
}

export interface SaveSuratResult {
  ok: boolean;
  saved?: Surat;
  generatedGaps: number[];
  error?: string;
}

interface AppContextValue {
  currentUser: User;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isDataLoading: boolean;
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
  refreshBootstrap: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  getNextUrut: (tahun: number) => number;
  getMissingUrutBefore: (tahun: number, targetUrut: number) => number[];
  saveSurat: (input: SaveSuratInput) => Promise<SaveSuratResult>;
  deleteSurat: (id: string) => Promise<{ ok: boolean; error?: string }>;
  savePengaturan: (
    next: Pengaturan
  ) => Promise<{ ok: boolean; error?: string }>;
  saveKlasifikasi: (
    item: Klasifikasi,
    oldKode?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteKlasifikasi: (kode: string) => Promise<{ ok: boolean; error?: string }>;
  saveDisposisi: (input: {
    id?: string;
    nama: string;
    aktif: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  deleteDisposisi: (id: string) => Promise<{ ok: boolean; error?: string }>;
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
    a.kode.localeCompare(b.kode, "id", { sensitivity: "base", numeric: true })
  );
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [demoMode, setDemoMode] = useState<boolean>(true);

  const [suratList, setSuratList] = useState<Surat[]>(INITIAL_SURAT);
  const [rawKlasifikasi, setRawKlasifikasi] =
    useState<Klasifikasi[]>(INITIAL_KLASIFIKASI);
  const [disposisiList, setDisposisiList] =
    useState<DisposisiJabatan[]>(INITIAL_DISPOSISI);
  const [pengaturan, setPengaturan] = useState<Pengaturan>(INITIAL_PENGATURAN);

  const klasifikasiList = useMemo(
    () => sortKlasifikasi(rawKlasifikasi),
    [rawKlasifikasi]
  );
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

  const refreshBootstrap = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const res = await fetch("/api/bootstrap", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) {
          setAuthUser(null);
        }
        return;
      }
      const data = (await res.json()) as {
        ok: boolean;
        demoMode?: boolean;
        user?: User;
        suratList?: Surat[];
        klasifikasiList?: Klasifikasi[];
        disposisiList?: DisposisiJabatan[];
        pengaturan?: Pengaturan;
      };
      if (data.ok) {
        if (typeof data.demoMode === "boolean") setDemoMode(data.demoMode);
        if (data.user) {
          setAuthUser(data.user);
          if (data.user.role === "admin") {
            void refreshUsers();
          }
        }
        if (data.suratList) setSuratList(data.suratList);
        if (data.klasifikasiList) setRawKlasifikasi(data.klasifikasiList);
        if (data.disposisiList) setDisposisiList(data.disposisiList);
        if (data.pengaturan) setPengaturan(data.pengaturan);
      }
    } catch {
      // Pertahankan state terakhir jika offline sementara
    } finally {
      setIsAuthLoading(false);
      setIsDataLoading(false);
    }
  }, [refreshUsers]);

  useEffect(() => {
    if (pathname === "/login") {
      setIsAuthLoading(false);
      setIsDataLoading(false);
      return;
    }
    void refreshBootstrap();
  }, [pathname, refreshBootstrap]);

  async function loginWithPin(input: {
    id: string;
    pin: string;
    remember: boolean;
  }) {
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
      void refreshBootstrap();
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
      .filter(
        (s) =>
          s.arah === "keluar" &&
          s.tahun === tahun &&
          typeof s.urut === "number"
      )
      .reduce((max, s) => Math.max(max, Number(s.urut) || 0), 0);
    return maxUrut + 1;
  }

  function getMissingUrutBefore(tahun: number, targetUrut: number): number[] {
    if (targetUrut <= 1) return [];
    const existing = new Set(
      suratList
        .filter(
          (s) =>
            s.arah === "keluar" &&
            s.tahun === tahun &&
            typeof s.urut === "number"
        )
        .map((s) => Number(s.urut))
    );
    const gaps: number[] = [];
    for (let n = 1; n < targetUrut; n++) {
      if (!existing.has(n)) gaps.push(n);
    }
    return gaps;
  }

  async function saveSurat(input: SaveSuratInput): Promise<SaveSuratResult> {
    try {
      const fd = new FormData();
      if (input.id) fd.set("id", input.id);
      fd.set("arah", input.arah);
      if (input.urutManual !== undefined) {
        fd.set("urutManual", String(input.urutManual));
      }
      if (input.nomorManual !== undefined) {
        fd.set("nomorManual", input.nomorManual);
      }
      fd.set("jenis", input.jenis);
      fd.set("tanggal", input.tanggal);
      fd.set("pihak", input.pihak);
      fd.set("perihal", input.perihal);
      fd.set("catatan", input.catatan);
      if (input.file) {
        fd.set("file", input.file);
      }

      const res = await fetch("/api/surat", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as {
        ok: boolean;
        saved?: Surat;
        suratList?: Surat[];
        generatedGaps?: number[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        return {
          ok: false,
          generatedGaps: [],
          error: data.error || "Gagal menyimpan surat.",
        };
      }
      if (data.suratList) setSuratList(data.suratList);
      return {
        ok: true,
        saved: data.saved,
        generatedGaps: data.generatedGaps ?? [],
      };
    } catch {
      return {
        ok: false,
        generatedGaps: [],
        error: "Gagal menghubungi server saat menyimpan surat.",
      };
    }
  }

  async function deleteSurat(id: string) {
    try {
      const res = await fetch(`/api/surat?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as {
        ok: boolean;
        suratList?: Surat[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error || "Gagal menghapus surat." };
      }
      if (data.suratList) setSuratList(data.suratList);
      return { ok: true };
    } catch {
      return { ok: false, error: "Gagal menghubungi server." };
    }
  }

  async function savePengaturan(next: Pengaturan) {
    try {
      const res = await fetch("/api/pengaturan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = (await res.json()) as {
        ok: boolean;
        pengaturan?: Pengaturan;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error || "Gagal menyimpan pengaturan." };
      }
      if (data.pengaturan) setPengaturan(data.pengaturan);
      return { ok: true };
    } catch {
      return { ok: false, error: "Gagal menghubungi server." };
    }
  }

  async function saveKlasifikasi(item: Klasifikasi, oldKode?: string) {
    try {
      const res = await fetch("/api/klasifikasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, oldKode }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        klasifikasiList?: Klasifikasi[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error: data.error || "Gagal menyimpan klasifikasi.",
        };
      }
      if (data.klasifikasiList) setRawKlasifikasi(data.klasifikasiList);
      return { ok: true };
    } catch {
      return { ok: false, error: "Gagal menghubungi server." };
    }
  }

  async function deleteKlasifikasi(kode: string) {
    try {
      const res = await fetch(
        `/api/klasifikasi?kode=${encodeURIComponent(kode)}`,
        { method: "DELETE" }
      );
      const data = (await res.json()) as {
        ok: boolean;
        klasifikasiList?: Klasifikasi[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error: data.error || "Gagal menghapus klasifikasi.",
        };
      }
      if (data.klasifikasiList) setRawKlasifikasi(data.klasifikasiList);
      return { ok: true };
    } catch {
      return { ok: false, error: "Gagal menghubungi server." };
    }
  }

  async function saveDisposisi(input: {
    id?: string;
    nama: string;
    aktif: boolean;
  }) {
    try {
      const res = await fetch("/api/disposisi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as {
        ok: boolean;
        disposisiList?: DisposisiJabatan[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error: data.error || "Gagal menyimpan tujuan disposisi.",
        };
      }
      if (data.disposisiList) setDisposisiList(data.disposisiList);
      return { ok: true };
    } catch {
      return { ok: false, error: "Gagal menghubungi server." };
    }
  }

  async function deleteDisposisi(id: string) {
    try {
      const res = await fetch(`/api/disposisi?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as {
        ok: boolean;
        disposisiList?: DisposisiJabatan[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        return {
          ok: false,
          error: data.error || "Gagal menghapus tujuan disposisi.",
        };
      }
      if (data.disposisiList) setDisposisiList(data.disposisiList);
      return { ok: true };
    } catch {
      return { ok: false, error: "Gagal menghubungi server." };
    }
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
        return {
          ok: false,
          error: data.error || "Gagal menyimpan akun pegawai.",
        };
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
        isDataLoading,
        demoMode,
        users,
        suratList,
        klasifikasiList,
        disposisiList,
        pengaturan,
        loginWithPin,
        logout,
        changeOwnPin,
        refreshBootstrap,
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
