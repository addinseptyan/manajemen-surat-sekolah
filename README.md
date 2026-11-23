# Manajemen Surat Sekolah

Aplikasi web manajemen surat sekolah (surat keluar & surat masuk) dengan Next.js.
Versi ini adalah **mode demo/UI**: berjalan dengan data contoh, tanpa perlu setup Google.

> Data di repo ini adalah data dummy untuk portfolio. Bukan data asli sekolah mana pun.

## Teknologi
- Next.js (App Router) + TypeScript
- Tailwind CSS (komponen bergaya shadcn/ui)
- Google Sheets + Google Drive sebagai database & penyimpanan (direncanakan, lihat `INSTALASI.md` Jalur 2)
- Deploy: Vercel (gratis)

## Coba demo (2 menit, tanpa Google)
```bash
npm install
npm run dev
```
Buka http://localhost:3000 → login demo: pilih **Admin**, PIN **123456**.

## Fitur (mode demo)
- Login PIN (demo)
- Dashboard: statistik, grafik surat per bulan, nomor berikutnya
- Surat Keluar / Surat Masuk: tabel, pencarian, filter jenis
- Impor Data: tampilan template CSV
- Pengaturan: format nomor surat & klasifikasi
- Pegawai: daftar pengguna & role

## Dokumentasi
- `INSTALASI.md` — petunjuk instalasi untuk orang lain (demo + setup Google Workspace asli)
- `panduan.md` — panduan owner: workflow branch, Pull Request, CI/CD, dan mirror ke repo sekolah

## Keamanan
- Jangan commit `.env.local` atau kunci Service Account. Lihat `.env.example`.
- Credential (ID Spreadsheet/Drive, kunci, SALT) disimpan di Environment Variables Vercel + `.env.local` lokal.

## Lisensi
MIT
