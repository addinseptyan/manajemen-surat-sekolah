import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
