# Manajemen Surat Sekolah

Aplikasi web modern untuk manajemen surat keluar & surat masuk sekolah berbasis **Next.js 16 (App Router + `src/`)**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**, dan **Lucide Icons**.

> **Catatan Portfolio:** Seluruh data bawaan di repositori ini adalah data contoh (*mock*) untuk keperluan demo & peninjauan kode. Tidak ada data atau kredensial asli sekolah di dalam repositori ini.

## Tech Stack
- **Framework:** Next.js 16 (App Router, `src/` directory) + React 19 + TypeScript
- **UI & Styling:** Tailwind CSS v4 + **shadcn/ui** (Radix UI Primitives) + **Lucide React**
- **Arsitektur Frontend:** DRY shared components (`SuratView`, `PageHeader`, `StatCard`, `AppShell`) + Interactive Demo Context
- **Database & Storage (Produksi):** Google Sheets API + Google Drive API via Service Account (100% gratis)
- **CI/CD & Hosting:** GitHub Actions (CI + Auto-Mirror Release) + Vercel

## Menjalankan Demo Lokal (2 Menit, Tanpa Setup Google)

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` → pilih **Admin Tata Usaha**, PIN demo `123456`, lalu klik **Masuk Aplikasi**.

## Fitur Utama (Mode Demo Interaktif)
- **Login PIN:** Pilihan pengguna aktif & input PIN keamanan.
- **Dashboard Analitik:** Kartu statistik berwarna per kategori, simulator nomor surat keluar berikutnya (salin 1 klik), grafik bulanan dengan *tooltip*, dan rekap per klasifikasi.
- **Surat Keluar & Surat Masuk (DRY):** Pencarian instan, filter jenis/status/tahun, ekspor CSV, modal **Buat/Ubah Surat** dengan *live preview* nomor otomatis, konfirmasi **Batalkan Nomor** dengan alasan, serta *pagination*.
- **Impor Arsip Lama:** Tab **Impor Massal CSV** (beserta unduhan template kosong & contoh terisi) dan **Input Satuan Arsip Lama**.
- **Pengaturan Sistem:** Editor pola nomor surat (`{urut}`, `{jenis}`, `{bulan}`, `{tahun}`) dengan pratinjau langsung, *Switch* Mode Percobaan, dan manajemen **Kode Klasifikasi** (terkunci otomatis bila sudah dipakai surat).
- **Manajemen Pegawai:** Tabel staf dengan avatar inisial, *Switch* status aktif/nonaktif, dan modal tambah/ubah/reset PIN.

## Struktur Direktori
```text
src/
├── app/
│   ├── (app)/               # Grup halaman dengan Sidebar & Mobile Drawer
│   │   ├── dashboard/
│   │   ├── surat-keluar/
│   │   ├── surat-masuk/
│   │   ├── impor/
│   │   ├── pengaturan/
│   │   └── pegawai/
│   ├── login/               # Halaman autentikasi mandiri
│   ├── globals.css          # Tema Tailwind v4 & variabel shadcn/ui
│   └── layout.tsx
├── components/
│   ├── layout/              # AppShell (Sidebar desktop + Sheet mobile)
│   ├── shared/              # Komponen DRY (PageHeader, StatCard, SuratView)
│   └── ui/                  # Komponen resmi shadcn/ui
├── context/                 # State interaktif mode demo
└── lib/                     # Types, utilitas format nomor, tema warna, mock data
```

## Dokumentasi Lengkap
- [`INSTALASI.md`](./INSTALASI.md) — Panduan instalasi untuk pengguna lain (Mode Demo & Setup Google Workspace + Vercel).
- [`panduan.md`](./panduan.md) — Panduan SDLC owner: workflow branch baru, Pull Request, CI/CD, dan auto-mirror rilis ke GitHub sekolah.

## Lisensi
MIT
