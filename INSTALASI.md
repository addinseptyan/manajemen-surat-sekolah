# Petunjuk Instalasi — Manajemen Surat Sekolah

Dokumen ini ditujukan untuk **siapa pun yang ingin mencoba atau memasang aplikasi ini dari GitHub** untuk sekolah/instansinya sendiri.

Tersedia **2 jalur instalasi**:
- **Jalur 1 — Mode Demo (2 menit, tanpa Google):** langsung jalan memakai data contoh ber-autentikasi PIN nyata. Cocok untuk mencoba UI atau meninjau portfolio.
- **Jalur 2 — Pakai Sungguhan dengan Google Workspace Sendiri:** terhubung ke Google Sheets (database) & Google Drive (arsip file surat), 100% kompatibel dengan Spreadsheet Apps Script versi lama, lalu deploy gratis ke Vercel.

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
   Buka `http://localhost:3000`:
   - Akun **Admin Tata Usaha** → PIN demo: `123456`
   - Akun **Pegawai** (*Budi Santoso, S.Pd* / *Siti Rahayu, M.Pd*) → PIN demo: `654321`

---

## Jalur 2 — Instalasi Penuh (Google Sheets + Google Drive + Vercel)

### Langkah 1 — Siapkan Google Spreadsheet & Folder Google Drive
Jika Anda **migrasi dari versi Google Apps Script lama**, Anda dapat langsung memakai Spreadsheet lama Anda tanpa mengubah data yang sudah ada!

Jika membuat **Google Spreadsheet baru**, catat **Spreadsheet ID** dari URL browser (`https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_ANDA/edit`) lalu siapkan 5 tab (sheet) dengan nama & kolom baris pertama berikut:
- **`Users`**: `id | nama | role | pinHash | aktif`
- **`Surat`**: `id | arah | nomor | urut | tahun | jenis | tanggal | pihak | perihal | catatan | fileUrl | status | pembuat | dibuat | alasanBatal | batalOleh | batalWaktu`
- **`Klasifikasi`**: `kode | nama`
- **`Pengaturan`**: `key | value`
- **`Log`**: `waktu | user | aksi | detail`

Siapkan juga **1 folder khusus** di Google Drive untuk menyimpan scan surat dan catat **Folder ID** dari URL-nya (`https://drive.google.com/drive/folders/FOLDER_ID_ANDA`).

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
   SALT=isi_salt_dari_script_properties_apps_script_lama
   SESSION_SECRET=isi_string_acak_panjang_minimal_32_karakter
   ```
   > **Penting tentang `SALT`:** Rumus hash PIN aplikasi ini adalah `'h' + SHA256(SALT + pin)` — identik 100% dengan `Auth.gs` Apps Script lama. Jika Anda menyalin nilai `SALT` dari *Project Settings → Script Properties* di Apps Script lama, **seluruh PIN Admin & Pegawai yang sudah ada di Spreadsheet langsung bisa dipakai login tanpa perlu reset!**

3. Uji di lokal:
   ```bash
   npm run dev
   ```

### Langkah 5 — Deploy ke Vercel (Gratis)
1. Fork atau push kode ini ke repositori GitHub milik Anda/sekolah.
2. Login ke [Vercel](https://vercel.com) → **Add New Project** → pilih repositori GitHub tersebut.
3. Sebelum klik **Deploy**, buka bagian **Environment Variables** di halaman setup Vercel, lalu tambahkan semua variabel dari `.env.local` (`USE_MOCK`, `GOOGLE_SPREADSHEET_ID`, `GOOGLE_DRIVE_FOLDER_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `SALT`, `SESSION_SECRET`) untuk environment **Production** dan **Preview**.
4. Klik **Deploy**. Aplikasi siap diakses online.
