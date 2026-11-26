# Panduan Pengembangan & Rilis Bertahap (SDLC Model D)

Dokumen ini mencatat alur kerja Git, Pull Request (PR), dan rilis otomatis dari repositori portofolio pengembang (`addinseptyan/manajemen-surat-sekolah`) menuju repositori produksi organisasi sekolah (`smknusantaralab/manajemen-surat-sekolah` -> Vercel).

---

## Status Roadmap Modernisasi (`v0.1.0` -> `v1.0.0`)

- [x] **Inisialisasi Fondasi (`v0.1.0`)** — Kerangka Next.js 16, CI GitHub Actions, dan workflow sinkronisasi rilis (`sync-release.yml`).
- [x] **PR #1 (`feat/ui-design-system` -> `v0.2.0`)** — Sistem desain shadcn/ui, warna semantik halaman, navigasi responsif Desktop + HP, dan Dark Mode bebas *flicker*.
- [x] **PR #2 (`feat/dashboard-analytics` -> `v0.3.0`)** — Dashboard analitik eksekutif, filter tahun arsip, pantauan slot *Belum Lengkap*, dan tren aktivitas bulanan.
- [x] **PR #3 (`feat/surat-numbering-preview` -> `v0.4.0`)** — CRUD Surat Keluar & Masuk, penomoran otomatis lintas tahun, lompat nomor urut (*reserve slot*), disposisi cepat, ekspor CSV Excel, dan modal pratinjau dokumen.
- [x] **PR #4 (`feat/admin-settings-users` -> `v0.5.0`)** — Manajemen akun pegawai & halaman Pengaturan 4-tab (Profil & Nama Aplikasi, Pola Nomor live preview, CRUD Tujuan Disposisi, Klasifikasi A–Z).
- [x] **PR #5 (`feat/auth-pin-session` -> `v0.6.0`)** — Autentikasi PIN sesungguhnya kompatibel Apps Script (`'h' + SHA256(salt + pin)`), sesi cookie `httpOnly` HMAC-SHA256 (12 jam / 7 hari), pembatasan percobaan PIN, dan RBAC ketat Admin (`src/proxy.ts`).
- [x] **PR #6 (`feat/google-sheets-drive-api` -> `v1.0.0` — RILIS PRODUKSI FINAL)** — Integrasi penuh Google Sheets API v4 & Google Drive API v3 dengan dukungan akun gratis `@gmail.com` (OAuth2 Refresh Token 15 GB), tab khusus `Disposisi` otomatis, serta proxy streaming dokumen `/api/files/[fileId]` bebas *"Request Access"*.
- [x] **Patch `v1.0.1` (`fix/year-modal-jump-urut` -> `v1.0.1`)** — Dropdown tahun dinamis mulai `2026` mengikuti tahun kalender berjalan WIB secara otomatis (`2027`, `2028`, dst. tanpa `2025`), pembukaan modal surat netral tanpa *auto-focus* pada input tanggal, serta validasi ketat *Lompati Nomor Urut* (hanya mengizinkan nomor urut berikutnya atau lebih besar).
- [x] **Patch `v1.0.2` (`fix/mobile-ui-search-and-file-format` -> `v1.0.2`)** — Perbaikan overflow panah `Select` di layar HP, posisi modal Aksi Cepat di atas keyboard HP, sinkronisasi penuh pencarian Aksi Cepat ke seluruh arsip + anti-macet saat dihapus, reset otomatis kolom pencarian saat menekan ulang menu di Sidebar, serta pembacaan ekstensi & format berkas asli (`.pdf`, `.png`, `.jpg`, `.docx`, `.xlsx`) langsung dari Google Drive.
- [x] **Rilis `v1.0.3` (`feat/split-login-and-docx-preview` -> `v1.0.3`)** — Redesain halaman Login bergaya *Split-Screen Enterprise SaaS* dengan kartu *glassmorphic* ringan berbasis SVG, pratinjau langsung berkas `.docx` tanpa perlu unduh terlebih dahulu (`docx-preview`), penyesuaian format *title* tab browser (`Nama Aplikasi - Nama Sekolah`), serta indikator versi aplikasi pada Login, Sidebar, dan Dashboard.

---

## Perintah Git Windows 11 PowerShell untuk PR #6 & Rilis `v1.0.0`

Jalankan perintah berikut di **PowerShell** pada folder proyek lokal Anda:

```bash
# 1. Pastikan berada di branch main terbaru setelah PR #5 di-merge
git checkout main
git pull origin main

# 2. Buat branch fitur terakhir PR #6
git checkout -b feat/google-sheets-drive-api

# 3. Bersihkan isi kode lama (kecuali .git dan .env.local) lalu ekstrak ZIP terbaru
Get-ChildItem -Force | Where-Object { $_.Name -notin @('.git', '.env.local', '.env') } | Remove-Item -Recurse -Force
$zip = Get-ChildItem "$HOME\Downloads\manajemen-surat-sekolah*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Write-Host "Mengekstrak: $($zip.FullName)"
tar -xf $zip.FullName --strip-components=1

# 4. Uji kualitas kode & build produksi di lokal
npm install
npm run typecheck
npm run build

# 5. Commit dan push branch PR #6 ke GitHub
git status
git add .
git commit -m "feat(cloud): integrate Google Sheets v4 & Drive v3 API with Gmail OAuth2 and file proxy (v1.0.0)"
git push -u origin feat/google-sheets-drive-api
```

### Setelah PR #6 Hijau & Di-Merge ke `main` di GitHub:

Saatnya menerbitkan tag **`v1.0.0`** agar GitHub Actions (`sync-release.yml`) otomatis menyalin rilis bersih ke repositori sekolah `smknusantaralab/manajemen-surat-sekolah` dan men-deploy ke Vercel:

```bash
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release v1.0.0: Production-ready School Letter Management with Google Sheets & Drive API"
git push origin v1.0.0
```

Selanjutnya, buka panduan **[INSTALASI.md](./INSTALASI.md)** Bagian 3–5 untuk mengisi kredensial OAuth2 Gmail sekolah (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_SPREADSHEET_ID`, `GOOGLE_DRIVE_FOLDER_ID`, `SALT`, `SESSION_SECRET`) pada **Environment Variables Vercel** sekolah.
