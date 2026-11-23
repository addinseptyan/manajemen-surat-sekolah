# Manajemen Surat Sekolah

Aplikasi web modern untuk manajemen surat keluar & surat masuk sekolah berbasis **Next.js 16 (App Router + `src/`)**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**, **Sonner**, **cmdk**, dan **Lucide Icons**.

> **Catatan Portfolio:** Seluruh data bawaan di repositori ini adalah data contoh (*mock*) untuk keperluan demo & peninjauan kode. Tidak ada data atau kredensial asli sekolah di dalam repositori ini.

## Tech Stack
- **Framework:** Next.js 16 (App Router, `src/` directory) + React 19 + TypeScript
- **UI & UX 2026:** Tailwind CSS v4 + **shadcn/ui** (Radix UI Primitives) + **cmdk** (Combobox & `Ctrl+K` Command Palette) + **Sonner** (Interactive Toast) + **Lucide React**
- **Arsitektur Frontend:** DRY shared components (`SuratView`, `KlasifikasiCombobox`, `SuratDetailSheet`, `CommandPalette`, `PageSkeletons`)
- **Database & Storage (Produksi):** Google Sheets API + Google Drive API via Service Account (100% gratis)
- **CI/CD & Hosting:** GitHub Actions (CI + Auto-Mirror Release) + Vercel

## Menjalankan Demo Lokal (2 Menit, Tanpa Setup Google)

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` → pilih **Admin Tata Usaha**, PIN demo `123456`, lalu klik **Masuk Aplikasi**.

## Fitur Unggulan (Mode Demo Interaktif)
- **Searchable `Combobox` Klasifikasi:** Cari jenis surat berdasarkan kode (`SK`, `SPpd`, `MOU`) maupun nama jenis di seluruh filter & form.
- **Slide-Over Detail Panel (`Sheet` Kanan):** Klik baris surat mana pun untuk melihat detail lengkap, tujuan disposisi, riwayat pembuat/pembatalan, salin nomor, dan pratinjau lampiran tanpa pindah halaman.
- **Command Palette Global (`Ctrl + K` / `⌘K`):** Pintasan keyboard cepat untuk membuat surat baru, pindah halaman, atau mencari arsip.
- **Chip Disposisi Surat Masuk (Kompatibel Google Sheets):** Pilih cepat tujuan disposisi (*Waka Kurikulum, Kesiswaan, Humas/Hubin, Sarpras, Kepala TU*) yang tersimpan rapi tanpa mengubah skema kolom Sheet lama.
- **Cetak Buku Agenda Resmi (`Print-Ready`):** Cetak laporan Buku Agenda Surat Keluar/Masuk lengkap kop sekolah & kolom tanda tangan Kepala Sekolah langsung lewat `@media print` (0 KB library PDF tambahan).
- **Toast Interaktif (`Sonner`) + Skeleton & Loading States:** Umpan balik instan dengan tombol **Salin Nomor**, kerangka muat presisi (`loading.tsx`), dan proteksi tombol anti-klik-ganda.

## Dokumentasi Lengkap
- [`INSTALASI.md`](./INSTALASI.md) — Panduan instalasi untuk pengguna lain (Mode Demo & Setup Google Workspace + Vercel).
- [`panduan.md`](./panduan.md) — Panduan SDLC owner: workflow branch baru, Pull Request, CI/CD, dan auto-mirror rilis ke GitHub sekolah.

## Lisensi
MIT
