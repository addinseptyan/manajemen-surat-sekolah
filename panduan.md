# Panduan Workflow Pengembangan, PR, CI/CD & Auto-Mirror GitHub

Dokumen ini adalah panduan operasional langkah demi langkah untuk **owner/developer utama** (`https://github.com/addinseptyan/manajemen-surat-sekolah`) agar:
1. Pengembangan dilakukan rapi di laptop memakai prosedur **SDLC & CI/CD yang baik** (branch baru → Pull Request → CI otomatis → merge).
2. Repo pribadi (`addinseptyan/manajemen-surat-sekolah`) tetap menjadi **portfolio & source of truth**.
3. Repo sekolah (`https://github.com/smknusantaralab/manajemen-surat-sekolah`) **ter-update otomatis** hanya saat Anda merilis versi stabil (tag release), lalu otomatis ter-deploy ke hosting sekolah (Vercel).

---

## Panduan Cepat: Menerapkan Update Struktur `src/` + Next.js 16 + `shadcn/ui` via Pull Request Pertama

Karena **Bab 1 s/d Bab 4 sudah dijalankan** di repo `addinseptyan/manajemen-surat-sekolah`, **jangan** push langsung ke `main` dan **jangan** menghapus folder `.git` atau `.vscode` Anda. Terapkan ZIP revisi ini sebagai **Pull Request (PR) pertama** Anda dengan langkah bersih berikut:

1. **Masuk ke folder project lokal & pastikan di `main` terbaru:**
   ```bash
   cd ~/path/ke/manajemen-surat-sekolah
   git checkout main
   git pull origin main
   ```

2. **Buat branch baru khusus refactor UI & struktur `src/`:**
   ```bash
   git checkout -b refactor/nextjs16-shadcn-src
   ```

3. **Hapus folder lama di luar `src/` agar tidak bentrok / menyisakan file yatim (*orphan*):**
   ```bash
   git rm -rf app components lib next.config.mjs tailwind.config.ts
   ```

4. **Salin seluruh isi hasil ekstrak `manajemen-surat-sekolah.zip` baru ke folder project Anda**
   *(Timpa `package.json`, `tsconfig.json`, `.github/`, `README.md`, `panduan.md`, dll. Folder `.git`, `.vscode`, dan `.env.local` Anda tetap aman).*

5. **Install dependensi baru & verifikasi lokal (wajib lolos sebelum commit):**
   ```bash
   npm install
   npm run typecheck
   npm run build
   npm run dev
   ```
   *(Cek tampilan di `http://localhost:3000`, lalu tekan `Ctrl+C` jika sudah sesuai).*

6. **Commit, push branch baru, dan buat Pull Request di GitHub:**
   ```bash
   git status
   git add -A
   git commit -m "refactor: upgrade to nextjs 16 with src directory and full shadcn ui"
   git push -u origin refactor/nextjs16-shadcn-src
   ```
   - Buka `https://github.com/addinseptyan/manajemen-surat-sekolah` → klik **Compare & pull request**.
   - Isi ringkasan PR, tunggu **CI / build** centang hijau ✅, lalu klik **Squash and merge** dan **Delete branch**.
   - Tarik kembali hasilnya di laptop:
     ```bash
     git checkout main
     git pull origin main
     git branch -d refactor/nextjs16-shadcn-src
     ```

---

## Arsitektur Alur Kerja (Model D — Auto Mirror via Release Tag)

```text
Laptop Anda (branch feature/* atau refactor/*)
   │
   ▼ git push
Repo Pribadi: github.com/addinseptyan/manajemen-surat-sekolah
   ├── Buka Pull Request (branch -> main)
   ├── GitHub Actions CI jalan otomatis (typecheck + build)
   ├── Squash & Merge PR ke main
   └── Buat Tag Release (mis. v0.2.0 / v1.0.0) — DITUNDA SAMPAI SIAP RILIS KE SEKOLAH
          │
          ▼ GitHub Actions (mirror.yml) otomatis jalan saat tag di-push!
Repo Sekolah: github.com/smknusantaralab/manajemen-surat-sekolah (branch main)
          │
          ▼ Webhook otomatis
Vercel Sekolah (Production Hosting Resmi Sekolah)
```

---

## Bab 1 — Persiapan Awal Repo Pertama Kali *(Selesai Dijalankan)*

1. Buat repositori publik `manajemen-surat-sekolah` di `addinseptyan`.
2. Inisialisasi Git lokal pada branch `main` dan push fondasi awal ke `origin main`.

---

## Bab 2 — Mengunci Branch `main` / Branch Protection *(Selesai Dijalankan)*

Pada `addinseptyan/manajemen-surat-sekolah` → **Settings → Branches / Rulesets**:
- Pola branch: `main`
- Aktifkan **Require a pull request before merging** (Approvals = `0` untuk solo developer).
- Aktifkan **Require status checks to pass before merging** → pilih job **`build`**.

---

## Bab 3 — Siklus Harian Pengembangan (Setiap Ada Fitur / Perbaikan Baru)

Setiap kali mengerjakan fitur berikutnya (mis. menyambungkan API Google Sheets/Drive), selalu ulangi 6 langkah standar ini:

1. **Sinkronkan `main` lokal:**
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Buat branch baru sesuai tujuan:**
   - `feature/nama-fitur` (contoh: `feature/google-sheets-auth`)
   - `fix/nama-bug` (contoh: `fix/validasi-tanggal-surat`)
   - `refactor/nama-perubahan`
   - `docs/nama-dokumen`
   ```bash
   git checkout -b feature/nama-fitur
   ```
3. **Koding & cek kualitas lokal:**
   ```bash
   npm run typecheck
   npm run build
   ```
4. **Commit (Conventional Commits) & push branch:**
   ```bash
   git add -A
   git commit -m "feat: deskripsi singkat perubahan"
   git push -u origin feature/nama-fitur
   ```
5. **Buka Pull Request di GitHub** lengkap dengan checklist & screenshot UI bila ada perubahan tampilan.
6. **Tunggu CI hijau ✅ → Squash and merge → Hapus branch** di GitHub & lokal.

---

## Bab 4 — Setup Auto-Mirror ke GitHub Sekolah *(Selesai Dijalankan)*

Ringkasan konfigurasi yang sudah terpasang:
- Repo tujuan: `https://github.com/smknusantaralab/manajemen-surat-sekolah`
- **Public Key** dipasang di repo sekolah (**Settings → Deploy keys** dengan **Allow write access** ✅).
- **Private Key** dipasang di repo pribadi `addinseptyan/manajemen-surat-sekolah` (**Settings → Secrets and variables → Actions** dengan nama **`SCHOOL_REPO_SSH_KEY`**).

---

## Bab 5 — Cara Merilis Update ke Repo Sekolah & Hosting Vercel *(Jalankan Nanti Saat Siap Rilis)*

> **Kapan Bab 5 dijalankan?** Tunda dulu selama Anda masih menyempurnakan UI di lokal atau menyambungkan backend Google API. Jalankan Bab 5 hanya ketika versi di `main` repo pribadi sudah benar-benar siap dikirim ke `smknusantaralab` dan diakses staf sekolah.

### 1. Hubungkan Hosting Vercel Sekolah
- Login ke Vercel sekolah → **Add New Project** → pilih repo **`smknusantaralab/manajemen-surat-sekolah`** (branch `main`).
- Masukkan seluruh **Environment Variables** produksi (`USE_MOCK=false`, `GOOGLE_SPREADSHEET_ID`, `GOOGLE_DRIVE_FOLDER_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `SALT`) di **Project Settings → Environment Variables** Vercel sekolah (lihat rincian di `INSTALASI.md`).
- Untuk portfolio pribadi Anda, Anda juga boleh men-deploy `addinseptyan/manajemen-surat-sekolah` ke akun Vercel pribadi dengan `USE_MOCK=true` sebagai Live Demo publik.

### 2. Dorong Rilis Otomatis ke Repo Sekolah via Tag SemVer
Setiap kali kumpulan PR di `main` sudah siap dikirim ke sekolah, jalankan:

```bash
git checkout main
git pull origin main
git tag -a v0.2.0 -m "Release v0.2.0: UI modern Next.js 16 dan shadcn/ui"
git push origin v0.2.0
```

Begitu tag `v*.*.*` di-push:
1. Workflow `.github/workflows/mirror.yml` otomatis mendorong `main` + tag tersebut ke `smknusantaralab/manajemen-surat-sekolah`.
2. Vercel sekolah otomatis men-deploy versi terbaru tersebut ke domain sekolah.
