# Panduan Workflow Pengembangan, PR, CI/CD & Auto-Mirror GitHub

Dokumen ini adalah panduan operasional langkah demi langkah untuk **owner/developer utama** (`https://github.com/addinseptyan/manajemen-surat-sekolah`) agar:
1. Pengembangan dilakukan rapi di laptop memakai prosedur **SDLC & CI/CD yang baik** (branch baru → Pull Request → CI otomatis → merge).
2. Repo pribadi (`addinseptyan/manajemen-surat-sekolah`) tetap menjadi **portfolio & source of truth**.
3. Repo sekolah (`https://github.com/smknusantaralab/manajemen-surat-sekolah`) **ter-update otomatis** hanya saat Anda merilis versi stabil (tag release), lalu otomatis ter-deploy ke hosting sekolah (Vercel).

---

## Panduan Cepat: Menerapkan Paket UX 2026 + Searchable Combobox + Skeleton via Pull Request #2

Karena **PR #1 (`src/` + Next.js 16 + `shadcn/ui`) sudah di-merge ke `main`**, Anda tidak perlu menghapus folder lama apa pun lagi. Cukup ikuti 5 langkah bersih ini untuk membuat **Pull Request #2**:

1. **Sinkronkan `main` lokal terlebih dahulu:**
   ```bash
   cd ~/path/ke/manajemen-surat-sekolah
   git checkout main
   git pull origin main
   ```

2. **Buat branch fitur baru untuk PR #2:**
   ```bash
   git checkout -b feat/ux-2026-enhancements
   ```

3. **Ekstrak & timpa isi `manajemen-surat-sekolah.zip` ke folder project Anda**
   *(Folder `.git`, `.vscode`, dan `.env.local` tetap aman).*

4. **Install dependensi tambahan (`cmdk`, `@radix-ui/react-popover`, `sonner`) & verifikasi lokal:**
   ```bash
   npm install
   npm run typecheck
   npm run build
   npm run dev
   ```
   *(Coba fitur baru di `http://localhost:3000`: ketik di Searchable Combobox jenis surat, klik baris tabel untuk Detail Panel kanan, tekan `Ctrl + K`, klik Cetak Agenda, dan perhatikan Skeleton + Toast Sonner).*

5. **Commit, push branch, dan buka Pull Request #2 di GitHub:**
   ```bash
   git status
   git add -A
   git commit -m "feat: add searchable combobox, detail sheet, command palette, print agenda, and skeletons"
   git push -u origin feat/ux-2026-enhancements
   ```
   - Buka `https://github.com/addinseptyan/manajemen-surat-sekolah` → klik **Compare & pull request**.
   - Tunggu **CI / build** centang hijau ✅ → klik **Squash and merge** → **Delete branch**.
   - Tarik kembali ke `main` di laptop:
     ```bash
     git checkout main
     git pull origin main
     git branch -d feat/ux-2026-enhancements
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
   └── Buat Tag Release (mis. v0.3.0 / v1.0.0) — DITUNDA SAMPAI SIAP RILIS KE SEKOLAH
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

> **Kapan Bab 5 dijalankan?** Tunda dulu selama Anda masih menyempurnakan aplikasi atau menyambungkan backend Google Sheets & Drive API. Jalankan hanya ketika versi di `main` sudah siap dikirim resmi ke `smknusantaralab`.

1. **Hubungkan Hosting Vercel Sekolah** ke repo **`smknusantaralab/manajemen-surat-sekolah`** (`main`) dan isi seluruh Environment Variables produksi (`USE_MOCK=false`, `GOOGLE_SPREADSHEET_ID`, `GOOGLE_DRIVE_FOLDER_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `SALT`).
2. **Dorong Rilis Otomatis ke Repo Sekolah via Tag SemVer:**
   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.0.0 -m "Release v1.0.0: Rilis perdana manajemen surat sekolah"
   git push origin v1.0.0
   ```
   GitHub Actions otomatis me-mirror `main` + tag ke repo sekolah dan Vercel sekolah otomatis melakukan deploy terbaru.
