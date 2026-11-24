# Manajemen Surat Sekolah

Aplikasi web modern untuk penertiban administrasi surat keluar & surat masuk sekolah berbasis **Next.js 16 (App Router + `src/`)**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**, **next-themes**, **Sonner**, **cmdk**, dan **Lucide Icons**.

> **Catatan Portfolio:** Seluruh data bawaan di repositori ini adalah data contoh (*mock*) untuk keperluan demo & peninjauan kode. Tidak ada data atau kredensial asli sekolah di dalam repositori ini.

## Tech Stack
- **Framework:** Next.js 16 (App Router, `src/` directory, Route Handlers & `proxy.ts` Guard) + React 19 + TypeScript
- **Autentikasi & Keamanan:** Hash PIN `'h' + SHA256(SALT + pin)` (kompatibel penuh dengan Spreadsheet Apps Script sekolah) + Signed `httpOnly` Cookie HMAC-SHA256
- **UI & UX 2026:** Tailwind CSS v4 + **shadcn/ui** (Radix UI Primitives) + **next-themes** (Dark/Light Mode dengan transisi halus) + **cmdk** (Combobox & `Ctrl+K` Command Palette) + **Sonner** (Interactive Toast) + **Lucide React**
- **Database & Storage (Produksi):** Google Sheets API + Google Drive API via Service Account (100% gratis)
- **CI/CD & Hosting:** GitHub Actions (CI + Auto-Mirror Release) + Vercel

## Menjalankan Demo Lokal (2 Menit, Tanpa Setup Google)

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`:
- Login **Admin Tata Usaha** → PIN demo: `123456` (akses penuh termasuk *Manajemen Pegawai* & *Pengaturan*)
- Login **Pegawai** (*Budi Santoso, S.Pd* / *Siti Rahayu, M.Pd*) → PIN demo: `654321` (akses operasional harian + *Ubah PIN Saya*)

## Fitur Unggulan
- **Autentikasi PIN SHA-256 + Session `httpOnly` Hybrid (12 Jam / 7 Hari):** Sesi default otomatis terkunci setelah 12 jam demi keamanan komputer bersama ruang TU, disertai opsi *Ingat perangkat ini selama 7 hari* untuk HP/laptop pribadi, proteksi ketat rute Admin, dan fitur **Ubah PIN Saya**.
- **Mobile-Friendly Card View & Desktop Table:** Tabel lengkap di layar desktop dan kartu interaktif ramah jempol di layar HP tanpa perlu menggeser tabel ke samping.
- **Dark / Light Mode dengan Transisi Halus & Favicon Kustom:** Nyaman di mata siang maupun malam, sementara hasil cetak Buku Agenda tetap otomatis hitam-putih resmi.
- **Sakelar Pengaman Lompat Nomor Urut + Slot Pengingat:** Nomor urut terkunci otomatis sesuai urutan berikutnya (dan kembali ke `001` tiap tahun baru). Jika ada arsip fisik terselip, sakelar **Lompati Nomor Urut** memunculkan peringatan jelas dan membuat slot **`Belum Lengkap`**.
- **Admin CRUD Tujuan Disposisi & Nama Aplikasi Editable:** Kelola daftar jabatan tujuan disposisi Surat Masuk, nama aplikasi, serta profil sekolah langsung dari menu Pengaturan.
- **In-App Document Preview & Cetak Buku Agenda Berbahasa Indonesia:** Pratinjau berkas scan PDF/gambar langsung di dalam aplikasi serta format tanggal resmi Indonesia (`24 November 2026`).

## Dokumentasi Lengkap
- [`INSTALASI.md`](./INSTALASI.md) — Panduan instalasi untuk pengguna lain (Mode Demo & Setup Google Workspace + Vercel).
- [`panduan.md`](./panduan.md) — Panduan SDLC owner: workflow branch baru, Pull Request, CI/CD, dan auto-mirror rilis ke GitHub sekolah.

## Lisensi
MIT
