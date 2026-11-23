# Panduan Pengelolaan & Pengembangan (Owner Guide — SDLC Model D)

Dokumen ini adalah panduan operasional khusus pemilik proyek (**`addinseptyan`**) untuk mengembangkan aplikasi secara rapi menggunakan standar **Branch → Pull Request → CI Check → Merge → SemVer Tag Release** hingga tersinkronisasi otomatis ke GitHub sekolah (**`smknusantaralab`**) dan **Vercel**.

---

## 1. Gambaran Arsitektur Repositori (Model D)

```text
Laptop Lokal (VS Code)
   │
   ▼  git push origin feat/...
GitHub Pribadi: addinseptyan/manajemen-surat-sekolah (Public Portfolio)
   ├── Pull Request ─► GitHub Actions CI (Lint + Typecheck + Build)
   ├── Merge ke branch `main`
   └── Push Tag Rilis (`v0.5.0`, `v1.0.0`, dst.)
          │
          ▼  GitHub Actions (`mirror.yml`) otomatis berjalan
GitHub Sekolah: smknusantaralab/manajemen-surat-sekolah
          │
          ▼  Auto-Deploy Production
Vercel Sekolah (Terhubung ke Environment Variables Google Sheets & Drive Asli)
```

---

## 2. Langkah Eksekusi PR #4 (`feat/ux-polish-disposisi-crud-mobile` — v0.5.0)

PR #1, PR #2, dan PR #3 sudah berhasil di-*merge* ke `main`. Sekarang jalankan langkah berikut di **Windows 11 PowerShell** (di dalam folder kerja lokal `manajemen-surat-sekolah`) untuk membuat **PR #4**:

### Langkah 1 — Sinkronkan `main` terbaru & buat branch fitur baru
```bash
git checkout main
git pull origin main
git checkout -b feat/ux-polish-disposisi-crud-mobile
```

### Langkah 2 — Bersihkan file CSV Import lama & cache `.next`
Karena fitur Impor CSV telah dihapus sepenuhnya dari Surat Masuk & Surat Keluar:
```bash
git rm -f "src/components/shared/csv-import-dialog.tsx"
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
```

### Langkah 3 — Timpa file terbaru dari ZIP yang baru diunduh
Setelah mengunduh `manajemen-surat-sekolah.zip` terbaru ke folder `Downloads`, jalankan perintah PowerShell ini:
```bash
$zip = Get-ChildItem "$HOME\Downloads\manajemen-surat-sekolah*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Write-Host "Mengekstrak:" $zip.FullName
tar -xf $zip.FullName --strip-components=1
```

### Langkah 4 — Install package baru (`next-themes`) & verifikasi kualitas kode
```bash
npm install
npm run typecheck
npm run build
```
*(Bila ingin mencoba langsung di browser: jalankan `npm run dev` lalu buka `http://localhost:3000` — uji tombol Dark/Light Mode, tampilan Mobile di DevTools HP, sakelar Lompati Nomor Urut pada Buat Surat Keluar, serta tab Profil & Tujuan Disposisi di Pengaturan).*

### Langkah 5 — Commit & Push branch PR #4 ke GitHub Pribadi
```bash
git status
git add -A
git commit -m "feat(ui): mobile card view, dark mode, disposisi crud, and ux refinements"
git push -u origin feat/ux-polish-disposisi-crud-mobile
```

### Langkah 6 — Buka Pull Request #4 & Merge di GitHub
1. Buka `https://github.com/addinseptyan/manajemen-surat-sekolah`.
2. Klik tombol hijau **Compare & pull request** pada banner `feat/ux-polish-disposisi-crud-mobile`.
3. Isi judul PR:
   `feat(ui): mobile card view, dark mode, disposisi crud, and ux refinements`
4. Tunggu **GitHub Actions CI (`build-and-verify`)** centang hijau ✅.
5. Klik **Squash and merge** → **Confirm squash and merge** → klik **Delete branch**.
6. Kembali ke terminal lokal dan sinkronkan `main`:
   ```bash
   git checkout main
   git pull origin main
   ```

---

## 3. Cara Mengirim Rilis Stabil ke GitHub Sekolah (Auto-Mirror)

Setiap kali milestone fitur siap dinaikkan ke akun sekolah (`smknusantaralab/manajemen-surat-sekolah`):

### Persiapan Satu Kali (Jika Belum Dilakukan)
1. Buat Fine-Grained Personal Access Token di akun **`smknusantaralab`** dengan izin **Contents: Read and write** pada repo `manajemen-surat-sekolah`.
2. Simpan token tersebut di repo **`addinseptyan/manajemen-surat-sekolah`** → **Settings → Secrets and variables → Actions → New repository secret** dengan nama:
   - Name: `SCHOOL_REPO_TOKEN`
   - Secret: *(isi token)*

### Menerbitkan Tag Rilis SemVer
```bash
git checkout main
git pull origin main
git tag -a v0.5.0 -m "Release v0.5.0: Mobile-friendly UI, Dark/Light mode, Disposisi CRUD & UX polish"
git push origin v0.5.0
```
Begitu tag `v*` di-*push*, workflow `.github/workflows/mirror.yml` otomatis mendorong kode bersih ke `smknusantaralab/manajemen-surat-sekolah`.

---

## 4. Aturan Keamanan Data Sekolah (Wajib Dipatuhi)

1. **Dilarang keras melakukan `git add` pada file `.env` atau `.env.local`** yang berisi kunci asli `GOOGLE_PRIVATE_KEY` atau `SALT` PIN sekolah.
2. Semua kredensial asli sekolah **hanya boleh dipasang di Dashboard Vercel** (*Project Settings → Environment Variables*) milik sekolah.
3. Untuk pengembangan lokal dengan Google Sheets/Drive asli nanti, salin `.env.example` menjadi `.env.local` (otomatis diabaikan oleh `.gitignore`).

---

## 5. Peta Jalan PR Berikutnya (Roadmap ke v1.0.0)

1. ~~**PR #1 (`v0.2.0`):** Restrukturisasi ke `src/` + UI modern v2.~~ ✅ *Selesai & Merged*
2. ~~**PR #2 (`v0.3.0`):** Upgrade full **shadcn/ui** + Sonner + Command Palette.~~ ✅ *Selesai & Merged*
3. ~~**PR #3 (`v0.4.0`):** Penertiban nomor lompat, reset `001` tahun baru, In-App Document Preview, dan Draggable Format Builder.~~ ✅ *Selesai & Merged*
4. **PR #4 (`v0.5.0` — Saat Ini):** Mobile Card View, Dark/Light Mode transisi halus, penghapusan CSV Import, sakelar pengaman Lompat Nomor Urut, Admin CRUD Tujuan Disposisi, Nama Aplikasi editable, Favicon logo, & tanggal Bahasa Indonesia.
5. **PR #5 (`feat/auth-pin-session`):** Autentikasi PIN nyata berbasis SHA-256 + `SALT` + `httpOnly` session cookie & proteksi penuh akses Admin/Pegawai.
6. **PR #6 (`feat/google-sheets-drive-api` — Rilis `v1.0.0`):** Integrasi penuh Google Sheets API + Google Drive Service Account Proxy (`/api/files/[fileId]`) sehingga preview & download PDF berjalan langsung di dalam aplikasi tanpa kendala *Request Access*.
