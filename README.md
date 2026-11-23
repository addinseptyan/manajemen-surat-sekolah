# Manajemen Surat Sekolah

Aplikasi web modern untuk penertiban administrasi surat keluar & surat masuk sekolah berbasis **Next.js 16 (App Router + `src/`)**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**, **next-themes**, **Sonner**, **cmdk**, dan **Lucide Icons**.

> **Catatan Portfolio:** Seluruh data bawaan di repositori ini adalah data contoh (*mock*) untuk keperluan demo & peninjauan kode. Tidak ada data atau kredensial asli sekolah di dalam repositori ini.

## Tech Stack
- **Framework:** Next.js 16 (App Router, `src/` directory) + React 19 + TypeScript
- **UI & UX 2026:** Tailwind CSS v4 + **shadcn/ui** (Radix UI Primitives) + **next-themes** (Dark/Light Mode dengan transisi halus) + **cmdk** (Combobox & `Ctrl+K` Command Palette) + **Sonner** (Interactive Toast) + **Lucide React**
- **Database & Storage (Produksi):** Google Sheets API + Google Drive API via Service Account (100% gratis)
- **CI/CD & Hosting:** GitHub Actions (CI + Auto-Mirror Release) + Vercel

## Menjalankan Demo Lokal (2 Menit, Tanpa Setup Google)

```bash
npm install
npm run dev
```

Buka `http://localhost:3000` → pilih **Admin Tata Usaha**, PIN demo `123456`, lalu klik **Masuk Aplikasi**.

## Fitur Unggulan
- **Mobile-Friendly Card View & Desktop Table:** Tampilan otomatis beradaptasi — tabel penuh di layar desktop dan kartu interaktif ramah jempol di layar HP tanpa perlu menggeser tabel ke samping.
- **Dark / Light Mode dengan Transisi Halus & Favicon Kustom:** Beralih antara mode terang dan gelap dengan nyaman, sementara hasil cetak Buku Agenda tetap otomatis hitam-putih resmi.
- **Sakelar Pengaman Lompat Nomor Urut + Slot Pengingat:** Nomor urut terkunci otomatis sesuai urutan berikutnya (dan kembali ke `001` tiap tahun baru). Jika ada arsip fisik terselip, sakelar **Lompati Nomor Urut** menampilkan peringatan jelas dan meng-generate slot **`Belum Lengkap`** untuk nomor yang terlewat.
- **Admin CRUD Tujuan Disposisi & Nama Aplikasi Editable:** Kelola daftar jabatan tujuan disposisi Surat Masuk serta nama aplikasi, profil sekolah, dan Kepala Sekolah langsung dari menu Pengaturan.
- **Draggable & Editable Format Nomor Surat:** Susun pola nomor surat (`{urut}/34.114/{jenis}/SMKNST/{bulan}/{tahun}`) secara visual dengan *drag & drop* maupun edit teks langsung.
- **In-App Document Preview & Cetak Buku Agenda Berbahasa Indonesia:** Pratinjau berkas scan PDF/gambar langsung di dalam aplikasi (bebas masalah *Request Access* Google Drive) serta format tanggal resmi Indonesia (`24 November 2026`) pada tabel dan cetakan Buku Agenda.

## Dokumentasi Lengkap
- [`INSTALASI.md`](./INSTALASI.md) — Panduan instalasi untuk pengguna lain (Mode Demo & Setup Google Workspace + Vercel).
- [`panduan.md`](./panduan.md) — Panduan SDLC owner: workflow branch baru, Pull Request, CI/CD, dan auto-mirror rilis ke GitHub sekolah.

## Lisensi
MIT
