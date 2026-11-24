import crypto from "node:crypto";
import { INITIAL_USERS } from "./mock-data";
import { hashPin, isValidPinFormat, safeEqual } from "./auth";
import { isDemoMode } from "./google";
import {
  appendAuditLog,
  appendSheetRows,
  deleteSheetRow,
  normalizeSheetDate,
  readSheetRows,
  updateSheetRow,
} from "./sheets-db";
import type { Role, User } from "./types";

interface StoredUserRecord extends User {
  pinHash: string;
  _row?: number;
}

export const DEMO_ADMIN_PIN = "123456";
export const DEMO_PEGAWAI_PIN = "654321";

export { isDemoMode };

const globalForUsers = globalThis as unknown as {
  __demoUsersStore?: StoredUserRecord[];
};

function parseSheetBool(raw: string | undefined, defaultVal = true): boolean {
  if (raw === undefined || raw === "") return defaultVal;
  const v = raw.trim().toLowerCase();
  if (v === "false" || v === "0" || v === "tidak") return false;
  return true;
}

async function getAllStoredUsers(): Promise<StoredUserRecord[]> {
  if (isDemoMode()) {
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

  let rows = await readSheetRows("Users");
  if (rows.length === 0) {
    // Jika Spreadsheet baru & tab Users masih kosong, buat akun Admin awal (PIN 123456) seperti setup() di Config.gs
    const adminHash = await hashPin("123456");
    const today = new Date().toISOString().slice(0, 10);
    await appendSheetRows("Users", [
      {
        id: crypto.randomUUID(),
        nama: "Admin",
        role: "admin",
        pinHash: adminHash,
        aktif: true,
        dibuat: today,
      },
    ]);
    rows = await readSheetRows("Users");
  }

  return rows.map((r) => ({
    _row: r._row,
    id: r.id,
    nama: r.nama,
    role: r.role === "admin" ? "admin" : "pegawai",
    pinHash: r.pinHash || "",
    aktif: parseSheetBool(r.aktif, true),
    dibuat: normalizeSheetDate(r.dibuat),
  }));
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

export async function listPublicActiveUsers(): Promise<
  Array<{ id: string; nama: string; role: Role }>
> {
  const store = await getAllStoredUsers();
  return store
    .filter((u) => u.aktif !== false)
    .map((u) => ({ id: u.id, nama: u.nama, role: u.role }));
}

export async function listAllUsersForAdmin(): Promise<User[]> {
  const store = await getAllStoredUsers();
  return store.map(toPublicUser);
}

export async function findActiveUserById(id: string): Promise<User | null> {
  const store = await getAllStoredUsers();
  const found = store.find((u) => u.id === id && u.aktif !== false);
  return found ? toPublicUser(found) : null;
}

export async function verifyUserCredentials(
  id: string,
  pin: string
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  if (!id || !pin) {
    return { ok: false, error: "Pilih nama pengguna dan masukkan PIN." };
  }
  const store = await getAllStoredUsers();
  const candidateHash = await hashPin(String(pin));
  const found = store.find(
    (u) => u.id === id && u.aktif !== false && safeEqual(u.pinHash, candidateHash)
  );
  if (!found) {
    return { ok: false, error: "PIN salah atau akun sudah tidak aktif." };
  }
  if (!isDemoMode()) {
    void appendAuditLog(found.nama, "login", "");
  }
  return { ok: true, user: toPublicUser(found) };
}

export async function changeOwnPin(
  userId: string,
  pinLama: string,
  pinBaru: string
): Promise<{ ok: boolean; error?: string }> {
  const store = await getAllStoredUsers();
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

  const crossRoleConflict = store.some(
    (u) => u.id !== target.id && u.role !== target.role && safeEqual(u.pinHash, newHash)
  );
  if (crossRoleConflict) {
    return {
      ok: false,
      error: "Demi keamanan, PIN Admin dan PIN Pegawai tidak boleh sama.",
    };
  }

  if (isDemoMode()) {
    target.pinHash = newHash;
  } else if (target._row) {
    await updateSheetRow("Users", target._row, {
      id: target.id,
      nama: target.nama,
      role: target.role,
      pinHash: newHash,
      aktif: target.aktif,
      dibuat: target.dibuat,
    });
    void appendAuditLog(target.nama, "user.changePin", target.nama);
  }

  return { ok: true };
}

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

  const store = await getAllStoredUsers();
  const adminUser = store.find((u) => u.id === adminId);
  const existing = input.id ? store.find((u) => u.id === input.id) : undefined;

  if (existing && existing.id === adminId) {
    if (!input.aktif) {
      return { ok: false, error: "Tidak dapat menonaktifkan akun Anda sendiri." };
    }
    if (existing.role === "admin" && input.role !== "admin") {
      return { ok: false, error: "Tidak dapat menurunkan peran Admin akun Anda sendiri." };
    }
  }

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
    if (isDemoMode()) {
      existing.nama = cleanNama;
      existing.role = input.role;
      existing.pinHash = nextPinHash;
      existing.aktif = input.aktif;
      return { ok: true, user: toPublicUser(existing) };
    }

    if (existing._row) {
      await updateSheetRow("Users", existing._row, {
        id: existing.id,
        nama: cleanNama,
        role: input.role,
        pinHash: nextPinHash,
        aktif: input.aktif,
        dibuat: existing.dibuat,
      });
      void appendAuditLog(adminUser?.nama || "Admin", "user.save", cleanNama);
    }

    return {
      ok: true,
      user: {
        id: existing.id,
        nama: cleanNama,
        role: input.role,
        aktif: input.aktif,
        dibuat: existing.dibuat,
      },
    };
  }

  const created: StoredUserRecord = {
    id: crypto.randomUUID(),
    nama: cleanNama,
    role: input.role,
    pinHash: nextPinHash,
    aktif: input.aktif,
    dibuat: new Date().toISOString().slice(0, 10),
  };

  if (isDemoMode()) {
    store.push(created);
  } else {
    await appendSheetRows("Users", [
      {
        id: created.id,
        nama: created.nama,
        role: created.role,
        pinHash: created.pinHash,
        aktif: created.aktif,
        dibuat: created.dibuat,
      },
    ]);
    void appendAuditLog(adminUser?.nama || "Admin", "user.save", created.nama);
  }

  return { ok: true, user: toPublicUser(created) };
}

export async function deleteUserByAdmin(
  adminId: string,
  targetId: string
): Promise<{ ok: boolean; error?: string }> {
  const store = await getAllStoredUsers();
  const adminUser = store.find((u) => u.id === adminId);
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

  if (isDemoMode()) {
    store.splice(idx, 1);
  } else if (target._row) {
    await deleteSheetRow("Users", target._row);
    void appendAuditLog(adminUser?.nama || "Admin", "user.delete", target.nama);
  }

  return { ok: true };
}
