import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sleep(ms = 260): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ROMAN_MONTHS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export function toRomanMonth(monthOneBased: number): string {
  return ROMAN_MONTHS[Math.max(0, Math.min(11, monthOneBased - 1))] ?? "I";
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

export const DISPOSISI_OPTIONS = [
  "Waka Kurikulum",
  "Waka Kesiswaan",
  "Waka Humas / Hubin",
  "Waka Sarpras",
  "Kepala TU",
  "Arsip",
] as const;

const DISPOSISI_REGEX = /^\[Disposisi:\s*([^\]]+)\]\s*/i;

/**
 * Mengekstrak daftar chip tujuan disposisi dari kolom `catatan` tanpa mengubah skema kolom Google Sheets.
 * Format kompatibel: "[Disposisi: Waka Kurikulum, Kepala TU] Isi catatan..."
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
