# Panduan Workflow Pengembangan, PR, CI/CD & Auto-Mirror GitHub

Dokumen ini adalah panduan operasional langkah demi langkah untuk **owner/developer utama** (`https://github.com/addinseptyan/manajemen-surat-sekolah`) agar:
1. Pengembangan dilakukan rapi di laptop memakai prosedur **SDLC & CI/CD yang baik** (branch baru → Pull Request → CI otomatis → merge).
2. Repo pribadi (`addinseptyan/manajemen-surat-sekolah`) tetap menjadi **portfolio & source of truth**.
3. Repo sekolah (`https://github.com/smknusantaralab/manajemen-surat-sekolah`) **ter-update otomatis** hanya saat Anda merilis versi stabil (tag release), lalu otomatis ter-deploy ke hosting sekolah (Vercel).

---

## Panduan Cepat: Menerapkan Paket Penertiban Arsip, Draggable Format & In-App Preview via Pull Request #3

Karena pada update ini halaman `/impor` dilebur langsung ke dalam halaman **Surat Keluar & Surat Masuk**, jalankan 1 baris `git rm` di bawah agar folder `/impor` lama ikut bersih terhapus:

1. **Sinkronkan `main` lokal terlebih dahulu:**
   ```bash
   cd ~/path/ke/manajemen-surat-sekolah
   git checkout main
   git pull origin main
   ```

2. **Buat branch fitur baru untuk PR #3 & hapus folder `/impor` lama:**
   ```bash
   git checkout -b feat/archive-gap-preview-and-builder
   git rm -rf "src/app/(app)/impor"
   ```

3. **Ekstrak & timpa isi `manajemen-surat-sekolah.zip` ke folder project Anda**
   *(Folder `.git`, `.vscode`, dan `.env.local` tetap aman).*

4. **Verifikasi lokal sebelum commit:**
   ```bash
   npm install
   npm run typecheck
   npm run build
   npm run dev
   ```
   *(Cek fitur baru di `http://localhost:3000`:*
   - *Dashboard: ganti tahun ke `2027` untuk melihat reset `001`, cek banner pengingat nomor kosong `005–006` & kelengkapan scan.*
   - *Surat Keluar/Masuk: coba lompat nomor urut saat buat surat baru, klik lampiran PDF untuk **In-App Preview + Unduh**, serta tombol **Impor CSV** di header.*
   - *Pengaturan: geser chip **Draggable & Editable Format Nomor**, lengkapi **Profil & Kepala Sekolah**, dan cek urutan **Klasifikasi A–Z**).*

5. **Commit, push branch, dan buka Pull Request #3 di GitHub:**
   ```bash
   git status
   git add -A
   git commit -m "feat: add missing number gap slots, in-app doc preview, draggable format builder, and school profile settings"
   git push -u origin feat/archive-gap-preview-and-builder
   ```
   - Buka `https://github.com/addinseptyan/manajemen-surat-sekolah` → klik **Compare & pull request**.
   - Tunggu **CI / build** centang hijau ✅ → klik **Squash and merge** → **Delete branch**.
   - Tarik kembali ke `main` di laptop:
     ```bash
     git checkout main
     git pull origin main
     git branch -d feat/archive-gap-preview-and-builder
     ```

---

## Arsitektur Alur Kerja (Model D — Auto Mirror via Release Tag)

```text
Laptop Anda (branch feat/* atau fix/*)
   │
   ▼ git push
Repo Pribadi: github.com/addinseptyan/manajemen-surat-sekolah
   ├── Buka Pull Request (branch -> main)
   ├── GitHub Actions CI jalan otomatis (typecheck + build)
   ├── Squash & Merge PR ke main
   └── Buat Tag Release (mis. v1.0.0) — DITUNDA SAMPAI SIAP RILIS KE SEKOLAH
          │
          ▼ GitHub Actions (mirror.yml) otomatis jalan saat tag di-push!
Repo Sekolah: github.com/smknusantaralab/manajemen-surat-sekolah (branch main)
          │
          ▼ Webhook otomatis
Vercel Sekolah (Production Hosting Resmi Sekolah)
```

---

## Bab 1 s/d Bab 4 *(Sudah Selesai Dijalankan)*
- **Bab 1:** Inisialisasi repo publik `addinseptyan/manajemen-surat-sekolah`.
- **Bab 2:** Branch protection `main` (wajib Pull Request + wajib status check CI `build` lulus).
- **Bab 3:** Siklus harian pengembangan selalu melalui branch baru (`feat/*`, `fix/*`, `refactor/*`, `docs/*`) → PR → Squash & Merge.
- **Bab 4:** SSH Deploy Key (`Allow write access`) di `smknusantaralab/manajemen-surat-sekolah` + Secret `SCHOOL_REPO_SSH_KEY` di `addinseptyan/manajemen-surat-sekolah`.

---

## Bab 5 — Cara Merilis Update ke Repo Sekolah & Hosting Vercel *(Jalankan Nanti Saat Siap Rilis)*

1. **Hubungkan Hosting Vercel Sekolah** ke repo **`smknusantaralab/manajemen-surat-sekolah`** (`main`) dan isi seluruh Environment Variables produksi (`USE_MOCK=false`, `GOOGLE_SPREADSHEET_ID`, `GOOGLE_DRIVE_FOLDER_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `SALT`).
2. **Dorong Rilis Otomatis ke Repo Sekolah via Tag SemVer:**
   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.0.0 -m "Release v1.0.0: Rilis perdana manajemen surat sekolah"
   git push origin v1.0.0
   ```
   GitHub Actions otomatis me-mirror `main` + tag ke repo sekolah dan Vercel sekolah otomatis melakukan deploy terbaru.
