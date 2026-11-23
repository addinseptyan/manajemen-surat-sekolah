export type Role = "admin" | "pegawai";
export type Arah = "keluar" | "masuk";
export type StatusSurat = "Aktif" | "Batal";
export type ThemeKey = "indigo" | "blue" | "emerald" | "amber" | "violet" | "rose";

export interface User {
  id: string;
  nama: string;
  role: Role;
  aktif: boolean;
  dibuat: string;
}

export interface Surat {
  id: string;
  arah: Arah;
  nomor: string;
  urut: number | "";
  tahun: number;
  jenis: string;
  tanggal: string; // YYYY-MM-DD
  pihak: string;
  perihal: string;
  catatan: string;
  fileName?: string;
  fileUrl: string;
  status: StatusSurat;
  pembuat: string;
  dibuat: string;
  alasanBatal?: string;
  batalOleh?: string;
  batalWaktu?: string;
}

export interface Klasifikasi {
  kode: string;
  nama: string;
}

export interface Pengaturan {
  format: string;
  pad: number;
  trial: boolean;
}
