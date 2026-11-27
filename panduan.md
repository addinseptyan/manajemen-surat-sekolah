# Panduan Pengembangan & Rilis Bertahap (SDLC Model D)

Dokumen ini mencatat riwayat rilis, alur kerja Git berbasis Pull Request (PR), serta SOP rilis otomatis dari repositori pengembangan (`addinseptyan/manajemen-surat-sekolah`) menuju repositori produksi organisasi sekolah (`smknusantaralab/manajemen-surat-sekolah` -> Vercel).

- **Target Rilis Aktif:** **`v1.0.6`**
- **Workflow CI & Auto-Mirror:** `.github/workflows/ci.yml` & `.github/workflows/mirror.yml`

---

## Riwayat Roadmap & Rilis (`v0.1.0` -> `v1.0.6`)

- [x] **Inisialisasi Fondasi (`v0.1.0`)** — Kerangka Next.js 16 App Router (`src/`), TypeScript ketat, CI GitHub Actions (`ci.yml`), dan workflow sinkronisasi otomatis berdasarkan *tag* rilis (`mirror.yml`).
- [x] **PR #1 (`feat/ui-design-system` -> `v0.2.0`)** — Sistem desain shadcn/ui, warna semantik halaman, navigasi responsif Desktop + HP (*Bottom Nav*), dan Dark Mode bebas *flicker*.
- [x] **PR #2 (`feat/dashboard-analytics` -> `v0.3.0`)** — Dashboard analitik eksekutif, filter tahun arsip, pantauan slot *Belum Lengkap*, dan grafik tren aktivitas bulanan.
- [x] **PR #3 (`feat/surat-numbering-preview` -> `v0.4.0`)** — CRUD Surat Keluar & Masuk, penomoran otomatis lintas tahun, lompat nomor urut (*reserve slot*), disposisi cepat, ekspor CSV Excel (UTF-8 BOM), dan modal pratinjau dokumen.
- [x] **PR #4 (`feat/admin-settings-users` -> `v0.5.0`)** — Manajemen akun pegawai & halaman Pengaturan 4-tab (Profil & Nama Aplikasi, Pola Nomor *live preview*, CRUD Tujuan Disposisi, Klasifikasi A–Z).
- [x] **PR #5 (`feat/auth-pin-session` -> `v0.6.0`)** — Autentikasi PIN kompatibel 100% dengan Apps Script (`'h' + SHA256(salt + pin)`), sesi cookie `httpOnly` HMAC-SHA256 (12 jam standar / opsi 7 hari perangkat pribadi), pembatasan 5x percobaan PIN gagal, dan RBAC ketat Admin (`src/proxy.ts`).
- [x] **PR #6 (`feat/google-sheets-drive-api` -> `v1.0.0` — RILIS PRODUKSI PERDANA)** — Integrasi penuh Google Sheets API v4 & Google Drive API v3 dengan dukungan akun gratis `@gmail.com` (OAuth2 Refresh Token 15 GB), tab khusus `Disposisi` otomatis, serta proxy streaming dokumen `/api/files/[fileId]` bebas *"Request Access"*.
- [x] **Patch `v1.0.1` (`fix/year-modal-jump-urut` -> `v1.0.1`)** — Dropdown tahun dinamis mulai `2026` mengikuti tahun berjalan WIB secara otomatis (`2027`, `2028`, dst. tanpa `2025`), pembukaan modal surat netral tanpa *auto-focus* pada input tanggal, serta validasi ketat *Lompati Nomor Urut* (`>= normalNextUrut`).
- [x] **Patch `v1.0.2` (`fix/mobile-ui-search-and-file-format` -> `v1.0.2`)** — Perbaikan tampilan panah `Select` di HP, posisi modal Aksi Cepat di atas keyboard HP, sinkronisasi pencarian Aksi Cepat bebas macet (klik surat memfilter daftar tanpa membuka detail otomatis), reset pencarian saat menekan ulang menu Sidebar, serta pembacaan ekstensi asli berkas (`.pdf`, `.png`, `.jpg`, `.docx`, `.xlsx`) dari Google Drive.
- [x] **Rilis `v1.0.3` (`feat/split-login-and-docx-preview` -> `v1.0.3`)** — Pratinjau langsung berkas Microsoft Word (`.docx`) di dalam modal tanpa unduh terlebih dahulu (`docx-preview`), format *title* tab browser dinamis SSR (`Nama Aplikasi - Nama Sekolah`), indikator versi terpadu pada Login, Sidebar, dan Dashboard, serta tautan halus pengembang.
- [x] **Patch `v1.0.4` (`fix/gap-slot-protection-and-recovery` -> `v1.0.4`)** — Tata kelola ketertiban nomor tengah (menghapus surat *Lengkap* di tengah urutan otomatis mengosongkan isi & mengembalikannya menjadi slot *Belum Lengkap*, menjaga slot kosong tengah agar tidak bolong, dan mengizinkan hapus permanen untuk urutan paling akhir) ditambah pemulihan otomatis (*self-healing chip*) untuk mengisi nomor sela yang sebelumnya terlanjur terhapus.
- [x] **Rilis `v1.0.5` (`feat/minimalist-login-ui` -> `v1.0.5`)** — Penyegaran antarmuka halaman Login menjadi lebih bersih dan minimalis pada satu kanvas terang/gelap senada ekosistem aplikasi sekolah, kartu form membulat dengan tombol kapsul Indigo, serta tampilan terpusat bebas gangguan pada layar di bawah desktop (`< 1024px`).
- [x] **Patch `v1.0.6` (`fix/login-scrollbar-and-docs` -> `v1.0.6`)** — Perbaikan *double vertical scrollbar* pada halaman Login akibat *overflow* lapisan pendar dekoratif (`fixed inset-0 overflow-hidden`) serta pembaruan SOP ekstraksi arsip pada `panduan.md` tanpa `--strip-components=1`.

---

## SOP Rilis & Ekstraksi ZIP (Windows 11 PowerShell)

> **Penting:** Isi berkas `manajemen-surat-sekolah.zip` berada langsung di akar arsip (`package.json`, `src/`, `.gitignore`, `.github/`, dll.). **Jangan gunakan `--strip-components=1`** karena opsi tersebut akan memotong level pertama sehingga berkas akar terlewati dan isi `src/` keluar ke luar folder `src/`. Gunakan `Expand-Archive -LiteralPath` seperti di bawah ini.

```bash
# 1. Pastikan berada di branch main terbaru & kondisi kerja bersih
git checkout main
git reset --hard origin/main
git clean -fd
git pull origin main

# 2. Buat branch patch / fitur baru (contoh untuk v1.0.6)
git checkout -b fix/login-scrollbar-and-docs

# 3. Bersihkan berkas lama (TETAP JAGA .git, .gitignore, .github, .env*, dan node_modules)
Get-ChildItem -Force | Where-Object { $_.Name -notin @('.git', '.gitignore', '.github', '.env', '.env.local', 'node_modules') } | Remove-Item -Recurse -Force

# 4. Ambil ZIP paling baru di folder Downloads (aman walau ada akhiran (1), (2), dst.) lalu ekstrak utuh
$zip = Get-ChildItem "$HOME\Downloads\manajemen-surat-sekolah*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Write-Host "Mengekstrak arsip terbaru: $($zip.FullName)"
Expand-Archive -LiteralPath $zip.FullName -DestinationPath . -Force

# 5. Verifikasi instalasi paket, pemeriksaan tipe, & build produksi lokal
npm install
npm run typecheck
npm run build

# 6. Cek status Git (pastikan struktur src/ utuh & tanpa node_modules), lalu commit & push
git status
git add .
git commit -m "fix(login): eliminate double vertical scrollbar and update release guide (v1.0.6)"
git push -u origin fix/login-scrollbar-and-docs
```

### Penerbitan Tag Produksi Setelah PR Di-Merge ke `main`

Setelah Pull Request berstatus hijau (lolos CI) dan di-*merge* ke `main` pada repositori `addinseptyan/manajemen-surat-sekolah`, terbitkan *tag* versi agar GitHub Actions (`mirror.yml`) otomatis menyinkronkan rilis bersih ke `smknusantaralab/manajemen-surat-sekolah` dan memicu *deploy* otomatis di Vercel:

```bash
git checkout main
git pull origin main
git tag -a v1.0.6 -m "Release v1.0.6: Fix login double vertical scrollbar & update SOP guide"
git push origin v1.0.6
```

---

## Catatan Pengaman Operasional Produksi

1. **Jangan Pernah Menyertakan Kredensial Sekolah ke Git**: Berkas `.env` dan `.env.local` berisi `GOOGLE_SPREADSHEET_ID`, `GOOGLE_DRIVE_FOLDER_ID`, `GOOGLE_REFRESH_TOKEN`, `SALT`, dan `SESSION_SECRET` hanya disimpan di komputer lokal dan **Environment Variables Vercel** (lihat detail penyiapan awal pada **[INSTALASI.md](./INSTALASI.md)**).
2. **Kuota Google Drive Akun `@gmail.com` (15 GB)**: Pastikan OAuth Consent Screen proyek Google Cloud sekolah berstatus **"In production" (Published)** agar `GOOGLE_REFRESH_TOKEN` tidak kedaluwarsa setiap 7 hari.
3. **Pemulihan Cepat Jika Struktur Folder Lokal Berantakan / Salah Ekstrak**:
   ```bash
   # Mengembalikan seluruh kode persis ke origin/main tanpa menghapus .env / .env.local / node_modules
   git reset --hard origin/main
   git clean -fd
   ```
