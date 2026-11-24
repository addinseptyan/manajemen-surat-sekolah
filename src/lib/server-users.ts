import { INITIAL_USERS } from "./mock-data";
import { hashPin, isValidPinFormat, safeEqual } from "./auth";
import type { Role, User } from "./types";

interface StoredUserRecord extends User {
  pinHash: string;
}

export const DEMO_ADMIN_PIN = "123456";
export const DEMO_PEGAWAI_PIN = "654321";

// Penyimpanan in-memory sisi server untuk Mode Demo (USE_MOCK !== 'false').
// Pada PR #6 nanti, saat USE_MOCK === 'false', fungsi-fungsi async di bawah langsung membaca/menulis tab `Users` di Google Sheets!
const globalForUsers = globalThis as unknown as {
  __demoUsersStore?: StoredUserRecord[];
};

export function isDemoMode(): boolean {
  return process.env.USE_MOCK !== "false";
}

async function getDemoStore(): Promise<StoredUserRecord[]> {
  if (!globalForUsers.__demoUsersStore) {
    const adminHash = await hashPin(DEMO_ADMIN_PIN);
    const pegawaiHash = await hashPin(DEMO_PEGAWAI_PIN);
    globalForUsers.__demoUsersStore = INITIAL_USERS.map((u) => ({
      ...u,
      pinHash: u.role === "admin" ? adminHash : pegawaiHash,
    }));
  }
  return globalForUsers.__demoUsersStore;
}

function toPublicUser(u: StoredUserRecord): User {
  return {
    id: u.id,
    nama: u.nama,
    role: u.role,
    aktif: u.aktif,
    dibuat: u.dibuat,
  };
}

/** Sesuai action 'publicUsers' di Code.gs: hanya akun aktif & tanpa membocorkan pinHash. */
export async function listPublicActiveUsers(): Promise<
  Array<{ id: string; nama: string; role: Role }>
> {
  const store = await getDemoStore();
  return store
    .filter((u) => u.aktif !== false)
    .map((u) => ({ id: u.id, nama: u.nama, role: u.role }));
}

export async function listAllUsersForAdmin(): Promise<User[]> {
  const store = await getDemoStore();
  return store.map(toPublicUser);
}

export async function findActiveUserById(id: string): Promise<User | null> {
  const store = await getDemoStore();
  const found = store.find((u) => u.id === id && u.aktif !== false);
  return found ? toPublicUser(found) : null;
}

export async function verifyUserCredentials(
  id: string,
  pin: string
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  if (!id || !pin) {
    return { ok: false, error: "Pilih nama pegawai dan masukkan PIN." };
  }
  const store = await getDemoStore();
  const candidateHash = await hashPin(String(pin));
  const found = store.find(
    (u) => u.id === id && u.aktif !== false && safeEqual(u.pinHash, candidateHash)
  );
  if (!found) {
    return { ok: false, error: "PIN salah atau akun sudah tidak aktif." };
  }
  return { ok: true, user: toPublicUser(found) };
}

/**
 * Fitur Ubah PIN Sendiri (untuk Admin maupun Pegawai).
 * Tetap mematuhi aturan Users.gs: 4-8 angka & PIN Admin tidak boleh sama dengan PIN Pegawai.
 */
export async function changeOwnPin(
  userId: string,
  pinLama: string,
  pinBaru: string
): Promise<{ ok: boolean; error?: string }> {
  const store = await getDemoStore();
  const target = store.find((u) => u.id === userId && u.aktif !== false);
  if (!target) {
    return { ok: false, error: "Akun pengguna tidak ditemukan." };
  }

  const oldHash = await hashPin(String(pinLama));
  if (!safeEqual(target.pinHash, oldHash)) {
    return { ok: false, error: "PIN saat ini salah." };
  }

  if (!isValidPinFormat(pinBaru)) {
    return { ok: false, error: "PIN baru harus terdiri dari 4–8 angka." };
  }

  const newHash = await hashPin(String(pinBaru));
  if (safeEqual(oldHash, newHash)) {
    return { ok: false, error: "PIN baru harus berbeda dari PIN lama." };
  }

  // Aturan Users.gs: PIN admin harus berbeda dari semua PIN pegawai (dan sebaliknya)
  const crossRoleConflict = store.some(
    (u) => u.id !== target.id && u.role !== target.role && safeEqual(u.pinHash, newHash)
  );
  if (crossRoleConflict) {
    return {
      ok: false,
      error: "Demi keamanan, PIN Admin dan PIN Pegawai tidak boleh sama.",
    };
  }

  target.pinHash = newHash;
  return { ok: true };
}

/**
 * Sesuai saveUser_ di Users.gs:
 * - PIN wajib untuk pengguna baru (4-8 angka)
 * - PIN admin dan pegawai tidak boleh sama
 * - Minimal harus ada 1 admin aktif
 * - Admin tidak dapat menonaktifkan atau menurunkan peran akunnya sendiri
 */
export async function upsertUserByAdmin(
  adminId: string,
  input: {
    id?: string;
    nama: string;
    role: Role;
    pin?: string;
    aktif: boolean;
  }
): Promise<{ ok: boolean; user?: User; error?: string }> {
  const cleanNama = String(input.nama || "").trim();
  if (!cleanNama || !["admin", "pegawai"].includes(input.role)) {
    return { ok: false, error: "Nama lengkap dan peran wajib diisi." };
  }

  const store = await getDemoStore();
  const existing = input.id ? store.find((u) => u.id === input.id) : undefined;

  if (existing && existing.id === adminId) {
    if (!input.aktif) {
      return { ok: false, error: "Tidak dapat menonaktifkan akun Anda sendiri." };
    }
    if (existing.role === "admin" && input.role !== "admin") {
      return { ok: false, error: "Tidak dapat menurunkan peran Admin akun Anda sendiri." };
    }
  }

  // Pastikan minimal tetap ada 1 admin aktif
  if (existing && existing.role === "admin" && (input.role !== "admin" || !input.aktif)) {
    const otherActiveAdmins = store.filter(
      (u) => u.id !== existing.id && u.role === "admin" && u.aktif !== false
    );
    if (otherActiveAdmins.length < 1) {
      return { ok: false, error: "Minimal harus ada 1 Admin aktif di sistem." };
    }
  }

  const cleanPin = String(input.pin || "").trim();
  let nextPinHash = existing?.pinHash ?? "";

  if (cleanPin) {
    if (!isValidPinFormat(cleanPin)) {
      return { ok: false, error: "PIN harus terdiri dari 4–8 angka." };
    }
    nextPinHash = await hashPin(cleanPin);
  } else if (!existing) {
    return { ok: false, error: "PIN awal wajib diisi untuk pegawai baru." };
  }

  // Cek konflik PIN lintas role (termasuk bila role diubah tanpa ganti PIN!)
  if (nextPinHash) {
    const crossRoleConflict = store.some(
      (u) =>
        u.id !== existing?.id &&
        u.role !== input.role &&
        safeEqual(u.pinHash, nextPinHash)
    );
    if (crossRoleConflict) {
      return {
        ok: false,
        error: "PIN Admin dan PIN Pegawai tidak boleh sama. Gunakan kombinasi PIN lain.",
      };
    }
  }

  if (existing) {
    existing.nama = cleanNama;
    existing.role = input.role;
    existing.pinHash = nextPinHash;
    existing.aktif = input.aktif;
    return { ok: true, user: toPublicUser(existing) };
  }

  const created: StoredUserRecord = {
    id: `u-${Date.now()}`,
    nama: cleanNama,
    role: input.role,
    pinHash: nextPinHash,
    aktif: input.aktif,
    dibuat: new Date().toISOString().slice(0, 10),
  };
  store.push(created);
  return { ok: true, user: toPublicUser(created) };
}

/** Sesuai deleteUser_ di Users.gs: tidak bisa hapus diri sendiri & minimal tersisa 1 admin aktif. */
export async function deleteUserByAdmin(
  adminId: string,
  targetId: string
): Promise<{ ok: boolean; error?: string }> {
  const store = await getDemoStore();
  const idx = store.findIndex((u) => u.id === targetId);
  if (idx === -1) {
    return { ok: false, error: "Akun pegawai tidak ditemukan." };
  }
  const target = store[idx];
  if (target.id === adminId) {
    return { ok: false, error: "Tidak dapat menghapus akun Anda sendiri." };
  }
  if (target.role === "admin" && target.aktif !== false) {
    const otherActiveAdmins = store.filter(
      (u) => u.id !== target.id && u.role === "admin" && u.aktif !== false
    );
    if (otherActiveAdmins.length < 1) {
      return { ok: false, error: "Minimal harus ada 1 Admin aktif." };
    }
  }
  store.splice(idx, 1);
  return { ok: true };
}
