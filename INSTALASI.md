# Petunjuk Instalasi — Manajemen Surat Sekolah

Dokumen ini ditujukan untuk **siapa pun yang ingin mencoba atau memasang aplikasi ini dari GitHub** untuk sekolah/instansinya sendiri.

Tersedia **2 jalur instalasi**:
- **Jalur 1 — Mode Demo (2 menit, tanpa Google):** langsung jalan memakai data contoh. Cocok untuk mencoba UI atau meninjau portfolio.
- **Jalur 2 — Pakai Sungguhan dengan Google Workspace Sendiri:** terhubung ke Google Sheets (database) & Google Drive (arsip file surat), lalu deploy gratis ke Vercel.

---

## Prasyarat Umum
- **Node.js** versi 20 LTS atau lebih baru (`node -v`)
- **Git** (`git --version`)
- Akun GitHub & Vercel (khusus jika ingin deploy online)

---

## Jalur 1 — Mode Demo (Tanpa Setup Google)

1. **Clone repositori**
   ```bash
   git clone https://github.com/addinseptyan/manajemen-surat-sekolah.git
   cd manajemen-surat-sekolah
   ```

2. **Install dependensi**
   ```bash
   npm install
   ```

3. **Siapkan environment lokal (opsional untuk demo)**
   ```bash
   cp .env.example .env.local
   ```
   Pastikan `USE_MOCK=true` di `.env.local`.

4. **Jalankan server lokal**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000`, pilih **Admin**, masukkan PIN demo `123456`, lalu klik **Masuk**.

---

## Jalur 2 — Instalasi Penuh (Google Sheets + Google Drive + Vercel)

> **Catatan status rilis:** Pada versi awal (`v0.1.0`), fokus kode adalah fondasi UI + mock data. Struktur environment variable dan skema Google Sheets di bawah ini sudah disiapkan agar saat konektor Google API diaktifkan (`USE_MOCK=false`), Anda tidak perlu mengubah struktur Spreadsheet maupun konfigurasi Vercel.

### Langkah 1 — Siapkan Google Spreadsheet & Folder Google Drive
1. Buat **Google Spreadsheet** baru di Google Drive Anda.
2. Catat **Spreadsheet ID** dari URL browser:
   `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_ANDA/edit`
3. Buat 5 tab (sheet) dengan nama **persis** berikut beserta baris header (baris ke-1):
   - **`Users`**: `id | nama | pinHash | role | aktif | dibuat`
   - **`Surat`**: `id | arah | nomor | urut | tahun | jenis | tanggal | pihak | perihal | catatan | fileId | fileUrl | status | pembuat | dibuat | alasanBatal | batalOleh | batalWaktu | reqId`
   - **`Klasifikasi`**: `kode | nama`
   - **`Pengaturan`**: `kunci | nilai`
   - **`Log`**: `waktu | user | aksi | detail`
4. Buat **1 folder khusus** di Google Drive untuk menyimpan lampiran/scan surat.
5. Catat **Folder ID** dari URL folder tersebut:
   `https://drive.google.com/drive/folders/FOLDER_ID_ANDA`

### Langkah 2 — Buat Google Cloud Service Account (100% Gratis)
1. Buka [Google Cloud Console](https://console.cloud.google.com/) dan buat Project baru (mis. `manajemen-surat-sekolah`).
2. Masuk ke **APIs & Services → Library**, lalu aktifkan (**Enable**) dua API ini:
   - **Google Sheets API**
   - **Google Drive API**
3. Masuk ke **IAM & Admin → Service Accounts → Create Service Account**:
   - Beri nama mis. `surat-app-bot`, klik **Create and Continue**, lalu **Done**.
4. Klik Service Account yang baru dibuat → tab **Keys** → **Add Key → Create new key → JSON**. File `.json` akan terunduh ke komputer Anda (**simpan baik-baik, jangan pernah upload ke GitHub**).
5. Buka file `.json` tersebut, salin nilai:
   - `client_email` (contoh: `surat-app-bot@nama-project.iam.gserviceaccount.com`)
   - `private_key` (diawali `-----BEGIN PRIVATE KEY-----...`)

### Langkah 3 — Beri Akses Service Account ke Sheets & Drive
1. Buka Google Spreadsheet Anda → klik **Share (Bagikan)** → tempel `client_email` Service Account sebagai **Editor**.
2. Buka Folder Google Drive arsip surat → klik **Share (Bagikan)** → tempel `client_email` Service Account sebagai **Editor**.

### Langkah 4 — Konfigurasi `.env.local` di Komputer
1. Salin template env:
   ```bash
   cp .env.example .env.local
   ```
2. Isi `.env.local`:
   ```env
   USE_MOCK=false
   GOOGLE_SPREADSHEET_ID=isi_spreadsheet_id_anda
   GOOGLE_DRIVE_FOLDER_ID=isi_folder_id_anda
   GOOGLE_SERVICE_ACCOUNT_EMAIL=surat-app-bot@project-anda.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   SALT=isi_string_acak_panjang_minimal_16_karakter
   ```
   > **Penting tentang `SALT`:** Jika Anda migrasi dari versi Apps Script lama dan ingin PIN pegawai tetap sama tanpa reset, isi `SALT` dengan nilai `SALT` yang sama persis seperti di `Config.gs` lama. Jika instalasi baru, buat string acak baru sekali saja dan jangan diubah lagi.

3. Uji di lokal:
   ```bash
   npm run dev
   ```

### Langkah 5 — Deploy ke Vercel (Gratis)
1. Fork atau push kode ini ke repositori GitHub milik Anda/sekolah.
2. Login ke [Vercel](https://vercel.com) → **Add New Project** → pilih repositori GitHub tersebut.
3. Sebelum klik **Deploy**, buka bagian **Environment Variables** di halaman setup Vercel, lalu tambahkan semua variabel dari `.env.local` (`USE_MOCK`, `GOOGLE_SPREADSHEET_ID`, `GOOGLE_DRIVE_FOLDER_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `SALT`) untuk environment **Production** dan **Preview**.
4. Klik **Deploy**. Aplikasi siap diakses online.
5. Setiap ada perubahan variable di Vercel kemudian hari, masuk ke **Project Settings → Environment Variables**, simpan perubahan, lalu klik **Redeploy** pada deployment terakhir.
