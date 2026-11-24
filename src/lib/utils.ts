import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sleep(ms = 260): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const APP_START_YEAR = 2026;

/**
 * Mengembalikan tanggal hari ini ("YYYY-MM-DD") berdasarkan zona waktu WIB (Asia/Jakarta),
 * sehingga pergantian tahun baru tepat pukul 00:00 WIB (tidak terlambat 7 jam oleh UTC).
 */
export function getTodayIsoWib(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Mengembalikan tahun kalender aktif (WIB), minimal mulai dari APP_START_YEAR (2026).
 * Saat memasuki 1 Januari 2027 WIB -> otomatis bernilai 2027, dst.
 */
export function getCurrentYearWib(): number {
  const yr = Number(getTodayIsoWib().slice(0, 4)) || APP_START_YEAR;
  return Math.max(APP_START_YEAR, yr);
}

/**
 * Menyusun daftar pilihan tahun dropdown secara dinamis mulai dari 2026 hingga tahun berjalan
 * (atau tahun tertinggi yang tercatat di arsip surat), diurutkan dari terbaru ke terlama.
 */
export function getAvailableYears(suratYears: number[] = []): number[] {
  const currentYr = getCurrentYearWib();
  const validDataYears = suratYears.filter(
    (y) => Number.isFinite(y) && y >= APP_START_YEAR
  );
  const maxYear = Math.max(currentYr, ...validDataYears);
  const years: number[] = [];
  for (let y = maxYear; y >= APP_START_YEAR; y--) {
    years.push(y);
  }
  return years;
}

const ROMAN_MONTHS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

const NAMA_BULAN_INDO = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function toRomanMonth(monthOneBased: number): string {
  return ROMAN_MONTHS[Math.max(0, Math.min(11, monthOneBased - 1))] ?? "I";
}

/**
 * Mengubah tanggal format ISO "YYYY-MM-DD" menjadi format resmi Indonesia "24 November 2026".
 * Bebas pergeseran zona waktu karena langsung mem-parsing komponen string.
 */
export function formatTanggalIndo(isoDate: string): string {
  if (!isoDate) return "-";
  const match = isoDate.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return isoDate;
  const tahun = match[1];
  const bulanIdx = Number(match[2]) - 1;
  const hari = Number(match[3]);
  const namaBulan = NAMA_BULAN_INDO[bulanIdx];
  if (!namaBulan || !hari) return isoDate;
  return `${hari} ${namaBulan} ${tahun}`;
}

export function formatNomorSurat(
  template: string,
  pad: number,
  urut: number,
  jenis: string,
  tanggal: string
): string {
  const parts = tanggal.split("-");
  const tahun = parts[0] || String(new Date().getFullYear());
  const bulanNum = Number(parts[1]) || new Date().getMonth() + 1;
  const urutStr = String(Math.max(1, urut)).padStart(Math.max(1, pad), "0");

  return template
    .replace("{urut}", urutStr)
    .replace("{jenis}", jenis || "B")
    .replace("{bulan}", toRomanMonth(bulanNum))
    .replace("{tahun}", tahun);
}

export function getInitials(nama: string): string {
  return nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const DISPOSISI_REGEX = /^\[Disposisi:\s*([^\]]+)\]\s*/i;

/**
 * Mengekstrak daftar chip tujuan disposisi dari kolom `catatan` tanpa mengubah skema kolom Google Sheets.
 * Format kompatibel: "[Disposisi: Kepala Sekolah, Waka Kurikulum] Isi catatan..."
 */
export function parseDisposisi(catatan: string): {
  tags: string[];
  cleanNote: string;
} {
  if (!catatan) return { tags: [], cleanNote: "" };
  const match = catatan.match(DISPOSISI_REGEX);
  if (!match) return { tags: [], cleanNote: catatan };
  const tags = match[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const cleanNote = catatan.slice(match[0].length).trim();
  return { tags, cleanNote };
}

export function composeDisposisi(tags: string[], cleanNote: string): string {
  const unique = Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean)));
  const note = cleanNote.trim();
  if (unique.length === 0) return note;
  return `[Disposisi: ${unique.join(", ")}]${note ? ` ${note}` : ""}`;
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escapeCsv = (val: string) => {
    const clean = val ?? "";
    return /[",\n]/.test(clean) ? `"${clean.replace(/"/g, '""')}"` : clean;
  };
  const csvContent = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
