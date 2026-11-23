# Manajemen Surat Sekolah

Aplikasi web modern untuk penertiban administrasi surat keluar & surat masuk sekolah berbasis **Next.js 16 (App Router + `src/`)**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**, **Sonner**, **cmdk**, dan **Lucide Icons**.

> **Catatan Portfolio:** Seluruh data bawaan di repositori ini adalah data contoh (*mock*) untuk keperluan demo & peninjauan kode. Tidak ada data atau kredensial asli sekolah di dalam repositori ini.

## Tech Stack
- **Framework:** Next.js 16 (App Router, `src/` directory) + React 19 + TypeScript
- **UI & UX 2026:** Tailwind CSS v4 + **shadcn/ui** (Radix UI Primitives) + **cmdk** (Combobox & `Ctrl+K` Command Palette) + **Sonner** (Interactive Toast) + **Lucide React**
- **Database & Storage (Produksi):** Google Sheets API + Google Drive API via Service Account (100% gratis)
- **CI/CD & Hosting:** GitHub Actions (CI + Auto-Mirror Release) + Vercel

## Menjalankan Demo Lokal (2 Menit, Tanpa Setup Google)

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` → pilih **Admin Tata Usaha**, PIN demo `123456`, lalu klik **Masuk Aplikasi**.

## Fitur Unggulan
- **Penertiban Nomor Lompat & Reset Tahun Baru (`001`):** Jika arsip lama (mis. nomor `005–006`) belum ketemu tetapi surat baru (`007`) harus terbit hari ini, sistem otomatis meng-generate slot pengingat **`Belum Lengkap`** lengkap dengan *banner* peringatan penertiban. Memasuki tahun baru (`2027`), nomor urut otomatis kembali ke `001`.
- **Draggable & Editable Format Nomor Surat:** Susun pola nomor surat (`{urut}/34.114/{jenis}/SMKNST/{bulan}/{tahun}`) secara visual dengan *drag & drop* maupun edit teks langsung.
- **In-App Document Preview + Unduh:** Pratinjau berkas PDF/gambar surat langsung di dalam modal aplikasi (tanpa masalah *Request Access* Google Drive) lengkap dengan tombol unduh.
- **Searchable `Combobox` Klasifikasi (A–Z):** Kode dan nama jenis surat terurut abjad otomatis dan dapat dicari cepat.
- **Impor CSV Terpadu & Cetak Buku Agenda Resmi:** Impor CSV melebur langsung di halaman Surat Keluar/Masuk, dan cetak Buku Agenda A4 *landscape* otomatis menarik profil sekolah serta nama/NIP Kepala Sekolah dari Pengaturan.

## Dokumentasi Lengkap
- [`INSTALASI.md`](./INSTALASI.md) — Panduan instalasi untuk pengguna lain (Mode Demo & Setup Google Workspace + Vercel).
- [`panduan.md`](./panduan.md) — Panduan SDLC owner: workflow branch baru, Pull Request, CI/CD, dan auto-mirror rilis ke GitHub sekolah.

## Lisensi
MIT
