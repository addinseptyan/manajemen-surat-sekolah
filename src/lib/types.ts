export type Role = "admin" | "pegawai";
export type Arah = "keluar" | "masuk";
export type StatusSurat = "Lengkap" | "Belum Lengkap";
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
  fileMime?: string;
  status: StatusSurat;
  pembuat: string;
  dibuat: string;
}

export interface Klasifikasi {
  kode: string;
  nama: string;
}

export interface DisposisiJabatan {
  id: string;
  nama: string;
  aktif: boolean;
}

export interface Pengaturan {
  namaAplikasi: string;
  instansiInduk: string;
  namaSekolah: string;
  alamatSekolah: string;
  kotaSurat: string;
  namaKepsek: string;
  nipKepsek: string;
  format: string;
  pad: number;
}
