export type Role = "admin" | "pegawai";
export type Arah = "keluar" | "masuk";

export interface User {
  id: string;
  nama: string;
  role: Role;
  aktif: boolean;
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
  fileUrl: string;
  status: "Aktif" | "Batal";
  pembuat: string;
  dibuat: string;
  alasanBatal?: string;
  bataloleh?: string;
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
