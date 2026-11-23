import type { Klasifikasi, Pengaturan, Surat, User } from "./types";

// Data dummy untuk mode demo. Bukan data asli sekolah mana pun.
export const mockUsers: User[] = [
  { id: "u1", nama: "Admin", role: "admin", aktif: true },
  { id: "u2", nama: "Budi Santoso", role: "pegawai", aktif: true },
  { id: "u3", nama: "Siti Rahayu", role: "pegawai", aktif: true },
];

export const mockKlasifikasi: Klasifikasi[] = [
  { kode: "B", nama: "Surat Biasa" },
  { kode: "SK", nama: "Surat Keputusan" },
  { kode: "SKet", nama: "Surat Keterangan" },
  { kode: "ST", nama: "Surat Tugas" },
  { kode: "UND", nama: "Undangan" },
];

export const mockPengaturan: Pengaturan = {
  format: "34.114/{urut}/{jenis}/SMKNST/{bulan}/{tahun}",
  pad: 3,
  trial: true,
};

export const mockSurat: Surat[] = [
  {
    id: "s1", arah: "keluar", nomor: "34.114/001/SK/SMKNST/I/2026", urut: 1, tahun: 2026,
    jenis: "SK", tanggal: "2026-01-05", pihak: "Seluruh Guru dan Staf",
    perihal: "Penetapan Wali Kelas Semester Genap", catatan: "", fileUrl: "",
    status: "Aktif", pembuat: "Admin", dibuat: "2026-01-05",
  },
  {
    id: "s2", arah: "keluar", nomor: "34.114/002/ST/SMKNST/I/2026", urut: 2, tahun: 2026,
    jenis: "ST", tanggal: "2026-01-12", pihak: "Budi Santoso S.Pd",
    perihal: "Tugas Mengikuti Workshop Kurikulum", catatan: "", fileUrl: "",
    status: "Aktif", pembuat: "Budi Santoso", dibuat: "2026-01-12",
  },
  {
    id: "s3", arah: "keluar", nomor: "34.114/003/UND/SMKNST/II/2026", urut: 3, tahun: 2026,
    jenis: "UND", tanggal: "2026-02-03", pihak: "Orang Tua Siswa Kelas XII",
    perihal: "Undangan Rapat Pleno", catatan: "Dibatalkan karena jadwal bentrok", fileUrl: "",
    status: "Batal", pembuat: "Admin", dibuat: "2026-02-03",
    alasanBatal: "Jadwal bentrok dengan ujian", bataloleh: "Admin", batalWaktu: "2026-02-04",
  },
  {
    id: "s4", arah: "masuk", nomor: "421.5/112/DISDIK/2026", urut: "", tahun: 2026,
    jenis: "", tanggal: "2026-01-08", pihak: "Dinas Pendidikan Provinsi",
    perihal: "Edaran Jadwal Asesmen Tahun 2026", catatan: "Diteruskan ke Waka Kurikulum", fileUrl: "",
    status: "Aktif", pembuat: "Siti Rahayu", dibuat: "2026-01-08",
  },
  {
    id: "s5", arah: "masuk", nomor: "", urut: "", tahun: 2026,
    jenis: "", tanggal: "2026-02-10", pihak: "PT Maju Jaya",
    perihal: "Penawaran Kerja Sama Praktik Kerja Lapangan", catatan: "", fileUrl: "",
    status: "Aktif", pembuat: "Admin", dibuat: "2026-02-10",
  },
];
