# Panduan Workflow Pengembangan, PR, CI/CD & Auto-Mirror GitHub

Dokumen ini adalah panduan operasional langkah demi langkah untuk **owner/developer utama** (`https://github.com/addinseptyan`) agar:
1. Pengembangan dilakukan rapi di laptop memakai prosedur **SDLC & CI/CD yang baik** (branch baru → Pull Request → CI otomatis → merge).
2. Repo pribadi (`addinseptyan`) tetap menjadi **portfolio & source of truth**.
3. Repo sekolah (`https://github.com/smknusantaralab`) **ter-update otomatis** setiap kali Anda merilis versi stabil (tag release), lalu otomatis ter-deploy ke hosting sekolah (Vercel).

---

## Arsitektur Alur Kerja (Model D — Auto Mirror via Release Tag)

```text
Laptop Anda (branch feature/*)
   │
   ▼ git push
Repo Pribadi: github.com/addinseptyan/manajemen-surat-sekolah
   ├── Buat Pull Request (feature/* -> main)
   ├── GitHub Actions CI jalan otomatis (typecheck + build)
   ├── Merge PR ke main (Preview Vercel pribadi ter-update)
   └── Buat Tag Release (mis. v0.1.0)
          │
          ▼ GitHub Actions (mirror.yml) otomatis jalan!
Repo Sekolah: github.com/smknusantaralab/manajemen-surat-sekolah (branch main)
          │
          ▼ Webhook otomatis
Vercel Sekolah (Production Hosting Resmi Sekolah)
```

**Keuntungan alur ini:**
- Anda **bebas bereksperimen** di branch/PR repo pribadi tanpa mengganggu aplikasi sekolah yang sedang dipakai staf.
- Repo sekolah hanya menerima kode yang **sudah lulus CI, sudah di-merge ke `main`, dan sudah Anda beri tag rilis**.
- Tidak perlu copy-paste manual antar folder atau antar repo.

---

## Bab 1 — Persiapan Awal Repo Pertama Kali (Copy Zip ke Laptop)

1. **Siapkan repositori kosong di GitHub Pribadi (`addinseptyan`)**
   - Buka GitHub pribadi → **New repository**.
   - Nama repo: `manajemen-surat-sekolah` (Public, agar tampil sebagai portfolio).
   - **Jangan** centang *Add a README / .gitignore* dulu agar bersih saat push pertama.

2. **Ekstrak file ZIP ke laptop Anda**
   - Ekstrak `manajemen-surat-sekolah.zip` ke folder kerja Anda, misalnya `~/projects/manajemen-surat-sekolah`.
   - Buka terminal di folder tersebut:
     ```bash
     cd ~/projects/manajemen-surat-sekolah
     npm install
     npm run typecheck
     npm run build
     ```
   - Pastikan `typecheck` dan `build` sukses di laptop sebelum lanjut.

3. **Inisialisasi Git & Push Fondasi Awal (`main`)**
   Khusus inisialisasi pertama kali saja kita mendorong kerangka dasar ke `main`. Setelah langkah ini selesai, `main` akan dikunci (branch protection) dan **semua perubahan berikutnya wajib lewat branch baru + Pull Request**.
   ```bash
   git init -b main
   git add .
   git status   # Pastikan TIDAK ADA file .env.local di daftar ini!
   git commit -m "chore: initial scaffold nextjs ui mock and ci workflow"
   git remote add origin git@github.com:addinseptyan/manajemen-surat-sekolah.git
   git push -u origin main
   ```
   *(Jika laptop Anda memakai HTTPS, ganti URL remote menjadi `https://github.com/addinseptyan/manajemen-surat-sekolah.git`).*

---

## Bab 2 — Mengunci Branch `main` (Prosedur SDLC yang Baik)

Agar disiplin CI/CD terjaga dan tidak ada yang tidak sengaja `git push` langsung ke `main`:

1. Buka repo `addinseptyan/manajemen-surat-sekolah` di GitHub → **Settings → Branches** (atau **Rules → Rulesets**).
2. Klik **Add branch protection rule**:
   - **Branch name pattern:** `main`
   - Centang **Require a pull request before merging**
     *(Karena Anda developer tunggal di repo pribadi, biarkan "Require approvals" = 0 atau tidak dicentang agar Anda tetap bisa merge PR sendiri setelah cek CI).*
   - Centang **Require status checks to pass before merging** → cari dan pilih job **`build`** (muncul setelah workflow CI jalan minimal sekali).
   - Centang **Do not allow bypassing the above settings** (opsional, disarankan agar tetap disiplin).
3. Klik **Create / Save changes**.

---

## Bab 3 — Siklus Harian: Persiapan Pull Request Pertama & Seterusnya

Setiap kali Anda ingin menambah fitur, memperbaiki bug, atau mengubah tampilan, **selalu ikuti 6 langkah ini**:

### Langkah 1: Pastikan posisi di `main` terbaru
```bash
git checkout main
git pull origin main
```

### Langkah 2: Buat branch baru sesuai jenis pekerjaan
Gunakan penamaan standar industri:
- `feature/nama-fitur` (fitur baru, contoh: `feature/dialog-tambah-surat`)
- `fix/nama-bug` (perbaikan bug, contoh: `fix/filter-tanggal-kosong`)
- `docs/nama-dokumen` (perubahan dokumentasi)
- `chore/nama-tugas` (update config/dependency)

Contoh untuk **Pull Request pertama Anda**:
```bash
git checkout -b feature/identitas-sekolah-demo
```

### Langkah 3: Koding & verifikasi lokal sebelum commit
Setelah mengubah kode, selalu jalankan pengecekan yang sama dengan CI:
```bash
npm run typecheck
npm run build
```

### Langkah 4: Commit yang rapi (Conventional Commits) & Push branch
```bash
git status
git add .
git commit -m "feat: sesuaikan header dan contoh nomor surat"
git push -u origin feature/identitas-sekolah-demo
```

### Langkah 5: Buka Pull Request (PR) di GitHub
1. Buka repo GitHub Anda — akan muncul banner kuning **"Compare & pull request"**, klik tombol tersebut.
2. Template PR (`.github/pull_request_template.md`) akan otomatis terisi.
3. Isi **Ringkasan**, centang **Checklist**, dan tempel **Screenshot** jika ada perubahan UI.
4. Klik **Create pull request**.

### Langkah 6: Tunggu CI Hijau → Squash & Merge → Hapus Branch
1. Di halaman PR, tunggu sekitar 30–60 detik sampai pengecekan **CI / build** bertanda centang hijau ✅.
   - Jika merah ❌: perbaiki di laptop pada branch yang sama → `git commit` → `git push`. PR akan otomatis mengulang CI.
2. Klik **Squash and merge** (disarankan agar riwayat commit di `main` bersih: 1 PR = 1 commit rapi).
3. Klik **Delete branch** di GitHub, lalu bersihkan di laptop:
   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/identitas-sekolah-demo
   ```

---

## Bab 4 — Setup Auto-Mirror ke GitHub Sekolah (`smknusantaralab`)

Setup ini hanya perlu dilakukan **satu kali saja**.

### 1. Buat repo tujuan di akun GitHub Sekolah
- Login/minta admin organisasi `https://github.com/smknusantaralab` membuat repo baru bernama **`manajemen-surat-sekolah`** (kosong, tanpa README).

### 2. Buat pasangan SSH Deploy Key khusus mirror
Di terminal laptop Anda, jalankan perintah ini (jangan timpa SSH key utama laptop Anda — kita buat file terpisah di `/tmp`):
```bash
ssh-keygen -t ed25519 -C "mirror-smknusantaralab" -f /tmp/mirror_sekolah_key -N ""
```
Perintah ini menghasilkan 2 file sementara:
- `/tmp/mirror_sekolah_key.pub` (Public Key → dipasang di **repo sekolah**)
- `/tmp/mirror_sekolah_key` (Private Key → dipasang di **repo pribadi Anda**)

### 3. Pasang Public Key di Repo Sekolah (`smknusantaralab`)
1. Tampilkan isi public key:
   ```bash
   cat /tmp/mirror_sekolah_key.pub
   ```
2. Buka `https://github.com/smknusantaralab/manajemen-surat-sekolah` → **Settings → Deploy keys → Add deploy key**.
3. Title: `Auto Mirror dari addinseptyan`
4. Key: tempel isi `/tmp/mirror_sekolah_key.pub`.
5. **WAJIB centang:** ✅ **Allow write access**.
6. Klik **Add key**.

### 4. Pasang Private Key di Repo Pribadi (`addinseptyan`)
1. Tampilkan isi private key (salin seluruhnya dari `-----BEGIN OPENSSH PRIVATE KEY-----` sampai `-----END OPENSSH PRIVATE KEY-----`):
   ```bash
   cat /tmp/mirror_sekolah_key
   ```
2. Buka `https://github.com/addinseptyan/manajemen-surat-sekolah` → **Settings → Secrets and variables → Actions → New repository secret**.
3. Name: **`SCHOOL_REPO_SSH_KEY`** *(harus persis sama dengan yang tertulis di `.github/workflows/mirror.yml`)*
4. Secret: tempel seluruh isi private key tadi → klik **Add secret**.

### 5. Hapus file key sementara dari laptop
```bash
rm /tmp/mirror_sekolah_key /tmp/mirror_sekolah_key.pub
```

> **Catatan jika nama repo sekolah berbeda:** Jika di `smknusantaralab` nama reponya bukan `manajemen-surat-sekolah`, cukup ubah baris `SCHOOL_REPO_SSH` di `.github/workflows/mirror.yml` lewat sebuah Pull Request.

---

## Bab 5 — Cara Merilis Update ke Repo Sekolah & Hosting Vercel

### 1. Hubungkan Hosting Sekolah ke Repo `smknusantaralab`
- Buat project Vercel untuk sekolah (bisa memakai akun Vercel sekolah) dan hubungkan ke **`smknusantaralab/manajemen-surat-sekolah`** (branch `main`).
- Isi **Environment Variables** asli sekolah (`GOOGLE_SPREADSHEET_ID`, `GOOGLE_DRIVE_FOLDER_ID`, kunci Service Account, `SALT`, dll.) di dashboard **Vercel Sekolah** (lihat `INSTALASI.md` Jalur 2).
- Sementara itu, repo pribadi Anda (`addinseptyan`) bisa dihubungkan ke Vercel pribadi Anda dengan `USE_MOCK=true` sebagai **Live Demo Portfolio** yang aman untuk publik!

### 2. Mengirim Update Otomatis ke Sekolah (Setiap Siap Rilis)
Kapan pun satu atau beberapa PR di repo pribadi sudah di-merge ke `main` dan siap dipakai sekolah, cukup buat **Tag Versi (SemVer)**:

- `v0.1.0` → rilis awal
- `v0.1.1` → perbaikan bug kecil (*patch*)
- `v0.2.0` → tambahan fitur baru (*minor*)
- `v1.0.0` → rilis produksi penuh (*major*)

Jalankan dari branch `main` terbaru di laptop Anda:
```bash
git checkout main
git pull origin main
git tag -a v0.1.0 -m "Release v0.1.0: UI awal manajemen surat"
git push origin v0.1.0
```

**Apa yang terjadi otomatis setelah `git push origin v0.1.0`?**
1. GitHub Actions menjalankan `.github/workflows/mirror.yml` di repo `addinseptyan`.
2. Kode `main` + tag `v0.1.0` otomatis ter-push ke `smknusantaralab/manajemen-surat-sekolah`.
3. Vercel sekolah mendeteksi perubahan di `main` repo sekolah dan otomatis mem-build & men-deploy versi terbaru ke website sekolah tanpa Anda perlu menyentuh repo sekolah sama sekali.
