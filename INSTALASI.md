# Panduan Instalasi & Konfigurasi Produksi (`v1.0.0`)

Dokumen ini memandu instalasi **Manajemen Surat Sekolah v1.0.0** baik untuk **Mode Demo Lokal / Portfolio** maupun **Mode Produksi Sekolah** menggunakan akun **Gmail Sekolah biasa (`@gmail.com` gratis 15 GB)** yang terhubung ke **Google Sheets API v4** dan **Google Drive API v3** di Vercel.

---

## Daftar Isi

1. [Prasyarat Lokal](#1-prasyarat-lokal)
2. [Menjalankan Mode Demo (Tanpa Google API)](#2-menjalankan-mode-demo-tanpa-google-api)
3. [Persiapan Google Cloud untuk Akun `@gmail.com` (15 GB Gratis)](#3-persiapan-google-cloud-untuk-akun-gmailcom-15-gb-gratis)
4. [Migrasi Mulus dari Spreadsheet Apps Script Lama](#4-migrasi-mulus-dari-spreadsheet-apps-script-lama)
5. [Deploy Produksi ke Vercel](#5-deploy-produksi-ke-vercel)
6. [Alternatif: Google Workspace berbayar (Service Account)](#6-alternatif-google-workspace-berbayar-service-account)

---

## 1. Prasyarat Lokal

- **Node.js** versi `20.x` atau `22.x` LTS
- **Git**

```bash
git clone https://github.com/addinseptyan/manajemen-surat-sekolah.git
cd manajemen-surat-sekolah
npm install
cp .env.example .env.local
```

---

## 2. Menjalankan Mode Demo (Tanpa Google API)

Secara bawaan, `.env.example` mengaktifkan `USE_MOCK=true` sehingga aplikasi berjalan mandiri di memori server tanpa kredensial Google Cloud:

```env
USE_MOCK=true
SALT=demo-salt-smk-nusantara-2026
SESSION_SECRET=ganti-dengan-minimal-32-karakter-acak-rahasia-sekolah-2026
```

Jalankan server pengembangan:

```bash
npm run dev
```

Buka `http://localhost:3000`:
- **Admin Tata Usaha** — PIN: `123456`
- **Pegawai (`Budi Santoso, S.Pd`)** — PIN: `654321`

---

## 3. Persiapan Google Cloud untuk Akun `@gmail.com` (15 GB Gratis)

> **Mengapa menggunakan OAuth2 Refresh Token (bukan Service Account)?**  
> Sejak kebijakan terbaru Google Drive, **Service Account memiliki kuota penyimpanan 0 byte** dan akan gagal (`403 storageQuotaExceeded`) saat mengunggah PDF ke folder milik akun `@gmail.com` gratis. Dengan **OAuth2 Refresh Token**, aplikasi mengunggah berkas menggunakan kuota **15 GB asli milik akun Gmail sekolah**, sekaligus menjaga folder Google Drive tetap **100% Privat** (tanpa perlu *"Anyone with the link"*).

Ikuti 4 langkah mudah ini satu kali saja (sekitar 5–7 menit) sambil login menggunakan **akun Gmail arsip sekolah**:

### Langkah 3.1 — Buat Project & Aktifkan 2 API di Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com/) menggunakan akun Gmail sekolah.
2. Buat project baru, misalnya **`Arsip-Surat-Sekolah`**.
3. Buka menu **APIs & Services → Library**, cari dan klik **Enable** pada dua layanan berikut:
   - **Google Sheets API**
   - **Google Drive API**

### Langkah 3.2 — Konfigurasi OAuth Consent Screen (**PENTING!**)
1. Buka **APIs & Services → OAuth consent screen** (atau **Google Auth Platform → Audience**).
2. Pilih **External**, lalu klik **Create**.
3. Isi:
   - **App name**: `Manajemen Surat Sekolah`
   - **User support email**: alamat Gmail sekolah Anda
   - **Developer contact information**: alamat Gmail sekolah Anda
4. Klik **Save and Continue** sampai selesai kembali ke halaman ringkasan **Audience / OAuth consent screen**.
5. **WAJIB KLIK TOMBOL `"PUBLISH APP"` → `"Confirm"`** agar status berubah dari *Testing* menjadi **"In production"**.
   - *Catatan:* Anda **tidak perlu** mengajukan verifikasi logo/dokumen ke Google (cukup abaikan peringatan *Verification not required*). Mengubah status ke **In production** mencegah Refresh Token kedaluwarsa setiap 7 hari!

### Langkah 3.3 — Buat OAuth 2.0 Client ID
1. Buka **APIs & Services → Credentials** → klik **+ Create Credentials → OAuth client ID**.
2. Pilih **Application type**: **Web application**.
3. Beri nama: `OAuth Playground Generator`.
4. Pada bagian **Authorized redirect URIs**, klik **+ Add URI** dan masukkan persis:
   ```text
   https://developers.google.com/oauthplayground
   ```
5. Klik **Create**. Salin dan simpan:
   - **`Client ID`** → untuk `GOOGLE_CLIENT_ID`
   - **`Client Secret`** → untuk `GOOGLE_CLIENT_SECRET`

### Langkah 3.4 — Ambil `GOOGLE_REFRESH_TOKEN` di OAuth Playground
1. Buka [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
2. Klik ikon **Gerigi Pengaturan (⚙️ OAuth 2.0 Configuration)** di pojok kanan atas:
   - Centang kotak **Use your own OAuth credentials**.
   - Tempel **OAuth Client ID** dan **OAuth Client Secret** dari Langkah 3.3, lalu klik **Close**.
3. Pada kolom kiri (**Step 1 — Select & authorize APIs**), gulir ke bawah ke kotak input manual *Input your own scopes* dan tempel dua baris ini (dipisahkan spasi atau koma):
   ```text
   https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive
   ```
4. Klik tombol biru **Authorize APIs**:
   - Pilih akun Gmail arsip sekolah Anda.
   - Jika muncul layar *"Google hasn't verified this app"*, klik **Advanced** → klik **Go to Manajemen Surat Sekolah (unsafe)** → klik **Continue / Allow**.
5. Pada **Step 2 — Exchange authorization code for tokens**, klik tombol **Exchange authorization code for tokens**.
6. Salin nilai **`Refresh token`** (biasanya diawali `1//0...`) → ini adalah nilai **`GOOGLE_REFRESH_TOKEN`** Anda!

---

## 4. Migrasi Mulus dari Spreadsheet Apps Script Lama

Aplikasi **v1.0.0** dirancang **100% kompatibel mundur** dengan database Google Spreadsheet dari versi Google Apps Script lama:

1. **Ambil `GOOGLE_SPREADSHEET_ID`** dari URL Google Spreadsheet sekolah:  
   `https://docs.google.com/spreadsheets/d/`**`ID_SPREADSHEET_ANDA`**`/edit`
2. **Ambil `GOOGLE_DRIVE_FOLDER_ID`** dari URL Folder Arsip Google Drive sekolah:  
   `https://drive.google.com/drive/folders/`**`ID_FOLDER_DRIVE_ANDA`**
3. **Salin nilai `SALT` lama dari `Config.gs`** di Apps Script Anda:
   - Karena rumus hash PIN di v1.0.0 identik persis (`'h' + SHA256_HEX(SALT + pin)`), seluruh akun Admin & Guru/TU di tab `Users` langsung bisa login dengan PIN lama mereka tanpa perlu di-reset!
4. **Migrasi Skema Otomatis:**
   - Saat aplikasi pertama kali diakses dengan `USE_MOCK=false`, sistem otomatis memeriksa tab `Users`, `Surat`, `Klasifikasi`, `Pengaturan`, dan `Log` tanpa menimpa data lama.
   - Tab baru **`Disposisi`** (`id | nama | aktif`) akan dibuat dan diisi 8 jabatan awal sekolah secara otomatis!
   - Seluruh link berkas surat lama (`https://drive.google.com/file/d/...`) otomatis dialihkan ke proxy terautentikasi `/api/files/[fileId]` sehingga langsung tampil di pratinjau PDF dalam aplikasi tanpa *"Request Access"*.

---

## 5. Deploy Produksi ke Vercel

1. Masuk ke dashboard **Vercel** milik organisasi sekolah (`smknusantaralab`) dan impor repositori `smknusantaralab/manajemen-surat-sekolah`.
2. Buka **Project Settings → Environment Variables**, lalu tambahkan variabel berikut untuk environment **Production**:

| Nama Variabel | Nilai |
|---|---|
| `USE_MOCK` | `false` |
| `SALT` | Nilai `SALT` dari `Config.gs` lama (atau teks rahasia baru jika mulai dari nol) |
| `SESSION_SECRET` | String acak minimal 32 karakter (contoh: buat dengan `openssl rand -hex 32`) |
| `GOOGLE_SPREADSHEET_ID` | ID Google Spreadsheet arsip sekolah |
| `GOOGLE_DRIVE_FOLDER_ID` | ID Folder induk Google Drive arsip sekolah |
| `GOOGLE_CLIENT_ID` | Client ID dari Langkah 3.3 |
| `GOOGLE_CLIENT_SECRET` | Client Secret dari Langkah 3.3 |
| `GOOGLE_REFRESH_TOKEN` | Refresh Token (`1//0...`) dari Langkah 3.4 |

3. Klik **Deploy** (atau **Redeploy**). Selesai! Aplikasi siap digunakan di ponsel dan komputer tata usaha sekolah.

---

## 6. Alternatif: Google Workspace Berbayar (Service Account)

Apabila sekolah di masa depan beralih ke **Google Workspace Shared Drive** (berbayar) dan ingin memakai Service Account:
- Kosongkan `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, dan `GOOGLE_REFRESH_TOKEN`.
- Isi `GOOGLE_SERVICE_ACCOUNT_EMAIL` dan `GOOGLE_PRIVATE_KEY`, lalu bagikan Spreadsheet & Shared Drive ke email Service Account sebagai **Editor / Content Manager**. Sistem otomatis mendeteksi dan menggunakan jalur Service Account.
