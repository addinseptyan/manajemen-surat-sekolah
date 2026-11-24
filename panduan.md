# Panduan Pengelolaan & Pengembangan (Owner Guide — SDLC Model D)

Dokumen ini adalah panduan operasional khusus pemilik proyek (**`addinseptyan`**) untuk mengembangkan aplikasi secara rapi menggunakan standar **Branch → Pull Request → CI Check → Merge → SemVer Tag Release** hingga tersinkronisasi otomatis ke GitHub sekolah (**`smknusantaralab`**) dan **Vercel**.

---

## 1. Gambaran Arsitektur Repositori (Model D)

```text
Laptop Lokal (VS Code)
   │
   ▼  git push origin feat/...
GitHub Pribadi: addinseptyan/manajemen-surat-sekolah (Public Portfolio)
   ├── Pull Request ─► GitHub Actions CI (Typecheck + Build)
   ├── Merge ke branch `main`
   └── Push Tag Rilis (`v0.6.0`, `v1.0.0`, dst.)
          │
          ▼  GitHub Actions (`mirror.yml`) otomatis berjalan
GitHub Sekolah: smknusantaralab/manajemen-surat-sekolah
          │
          ▼  Auto-Deploy Production
Vercel Sekolah (Terhubung ke Environment Variables Google Sheets & Drive Asli)
```

---

## 2. Langkah Eksekusi PR #5 (`feat/auth-pin-session` — v0.6.0)

PR #1 sampai PR #4 sudah berhasil di-*merge* ke `main`. Sekarang jalankan urutan perintah berikut di **Windows 11 PowerShell** (di dalam folder kerja lokal `manajemen-surat-sekolah`) untuk membuat **PR #5**:

### Langkah 1 — Sinkronkan `main` terbaru & buat branch fitur baru
```bash
git checkout main
git pull origin main
git checkout -b feat/auth-pin-session
```

### Langkah 2 — Bersihkan cache `.next` lama
```bash
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
```

### Langkah 3 — Timpa file terbaru dari ZIP yang baru diunduh
Setelah mengunduh `manajemen-surat-sekolah.zip` terbaru ke folder `Downloads`, jalankan perintah PowerShell ini:
```bash
$zip = Get-ChildItem "$HOME\Downloads\manajemen-surat-sekolah*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Write-Host "Mengekstrak:" $zip.FullName
tar -xf $zip.FullName --strip-components=1
```

### Langkah 4 — Verifikasi kualitas kode (Typecheck & Build)
```bash
npm install
npm run typecheck
npm run build
```
*(Bila ingin menguji langsung di browser: jalankan `npm run dev` lalu buka `http://localhost:3000` — coba akses `/dashboard` sebelum login [otomatis diarahkan ke `/login`], login sebagai Admin dengan PIN `123456`, klik tombol Logout lalu login sebagai Pegawai dengan PIN `654321` [menu Pegawai & Pengaturan otomatis tersembunyi & terkunci], serta uji fitur Ubah PIN Saya lewat ikon kunci di pojok kiri bawah).*

### Langkah 5 — Commit & Push branch PR #5 ke GitHub Pribadi
```bash
git status
git add -A
git commit -m "feat(auth): legacy-compatible sha256 pin auth, httponly session, and strict rbac"
git push -u origin feat/auth-pin-session
```

### Langkah 6 — Buka Pull Request #5 & Merge di GitHub
1. Buka `https://github.com/addinseptyan/manajemen-surat-sekolah`.
2. Klik tombol hijau **Compare & pull request** pada banner `feat/auth-pin-session`.
3. Isi judul PR:
   `feat(auth): legacy-compatible sha256 pin auth, httponly session, and strict rbac`
4. Tunggu **GitHub Actions CI** centang hijau ✅.
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
git tag -a v0.6.0 -m "Release v0.6.0: SHA-256 PIN auth, httpOnly session & strict RBAC"
git push origin v0.6.0
```
Begitu tag `v*` di-*push*, workflow `.github/workflows/mirror.yml` otomatis mendorong kode bersih ke `smknusantaralab/manajemen-surat-sekolah`.

---

## 4. Aturan Keamanan Data Sekolah (Wajib Dipatuhi)

1. **Dilarang keras melakukan `git add` pada file `.env` atau `.env.local`** yang berisi kunci asli `GOOGLE_PRIVATE_KEY`, `SALT`, atau `SESSION_SECRET`.
2. Semua kredensial asli sekolah **hanya boleh dipasang di Dashboard Vercel** (*Project Settings → Environment Variables*) milik sekolah.
3. Salin nilai `SALT` persis dari *Project Settings → Script Properties* di editor Apps Script lama Anda agar seluruh PIN pegawai di Spreadsheet lama langsung berlaku tanpa reset.

---

## 5. Peta Jalan PR Berikutnya (Roadmap ke v1.0.0)

1. ~~**PR #1 (`v0.2.0`):** Restrukturisasi ke `src/` + UI modern v2.~~ ✅ *Selesai & Merged*
2. ~~**PR #2 (`v0.3.0`):** Upgrade full **shadcn/ui** + Sonner + Command Palette.~~ ✅ *Selesai & Merged*
3. ~~**PR #3 (`v0.4.0`):** Penertiban nomor lompat, reset `001` tahun baru, In-App Document Preview, dan Draggable Format Builder.~~ ✅ *Selesai & Merged*
4. ~~**PR #4 (`v0.5.0`):** Mobile Card View, Dark/Light Mode transisi halus, penghapusan CSV Import, sakelar Lompat Nomor Urut, Admin CRUD Tujuan Disposisi, Nama Aplikasi editable, & Favicon.~~ ✅ *Selesai & Merged*
5. **PR #5 (`v0.6.0` — Saat Ini):** Autentikasi PIN nyata `'h' + SHA256(SALT + pin)` kompatibel Spreadsheet lama, `httpOnly` HMAC Session Cookie (12 jam default / 7 hari opsional), proteksi route `proxy.ts`, RBAC ketat Admin vs Pegawai, & fitur Ubah PIN Saya.
6. **PR #6 (`feat/google-sheets-drive-api` — Rilis `v1.0.0`):** Integrasi penuh Google Sheets API + Google Drive Service Account Proxy (`/api/files/[fileId]`) sehingga database Spreadsheet lama & preview/download PDF berjalan 100% live di produksi.
