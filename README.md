# Manajemen Surat Sekolah

![Versi](https://img.shields.io/badge/rilis-v1.0.4-4f46e5)
![Next.js](https://img.shields.io/badge/Next.js-16.2%20(App%20Router)-000000)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06b6d4)
![Google Cloud](https://img.shields.io/badge/Database-Google%20Sheets%20%26%20Drive%20API-0f9d58)

Sistem informasi manajemen arsip **Surat Masuk**, **Surat Keluar**, **Penomoran Otomatis Lintas Tahun**, dan **Disposisi Digital** untuk Tata Usaha Sekolah — dimodernisasi penuh dari sistem lama Google Apps Script ke arsitektur cloud modern **Next.js 16 + TypeScript + shadcn/ui** dengan penyimpanan gratis menggunakan **Google Sheets API v4** & **Google Drive API v3 (15 GB `@gmail.com`)**.

---

## Fitur Utama (`v1.0.0`)

- **Penomoran Surat Keluar Otomatis & Lompat Nomor Urut (Reserve Slot)**
  - Penomoran otomatis berbasis pola fleksibel (`{urut}`, `{jenis}`, `{bulan}`, `{bulan_angka}`, `{tahun}`) yang otomatis me-reset nomor urut kembali ke `001` setiap pergantian tahun baru.
  - Fitur **Lompat Nomor Urut**: apabila TU menerbitkan nomor urut lebih tinggi (misal lompat ke `010`), nomor sela yang kosong otomatis dicatat sebagai slot **`Belum Lengkap`** agar mudah dilengkapi menyusul tanpa nomor ganda.
- **Pratinjau PDF, Gambar, & Microsoft Word (`.docx`) Dalam Aplikasi (Bebas *"Request Access"*)**
  - Proxy dokumen internal terautentikasi (`/api/files/[fileId]`) mengalirkan berkas PDF, gambar, serta merender halaman **`.docx`** langsung di dalam modal aplikasi (baik berkas baru maupun arsip lama Apps Script), sembari menjaga folder Google Drive sekolah **100% Privat**.
- **Mendukung Penuh Akun `@gmail.com` Sekolah Gratis (15 GB)**
  - Menggunakan kredensial **OAuth2 Refresh Token** sehingga unggahan berkas PDF menggunakan kuota 15 GB akun Gmail sekolah tanpa kendala `storageQuotaExceeded` milik Service Account, plus otomatis mengelompokkan berkas ke subfolder tahun (`2026`, `2027`, dst.) dan memindahkan berkas terhapus ke Trash (aman dipulihkan 30 hari).
- **Disposisi Digital Cepat & Kustomisasi Admin**
  - Pilihan chip tujuan disposisi Surat Masuk yang tersimpan di tab khusus **`Disposisi`** pada Google Spreadsheet dan dapat ditambah/diubah/dinonaktifkan langsung oleh Admin.
- **Keamanan Sesi `httpOnly` & RBAC Ketat**
  - Hash PIN kompatibel 100% dengan sistem lama Apps Script (`'h' + SHA256(SALT + pin)`), sesi cookie `httpOnly` berpenanda tangan HMAC-SHA256 (**12 jam** standar / opsi **7 hari** perangkat tepercaya), proteksi percobaan PIN salah, serta pembatasan rute Admin (`/pegawai` & `/pengaturan`) di tingkat server dan antarmuka.
- **Antarmuka Modern, Responsif Mobile, & Dark Mode**
  - Desain adaptif (Tabel pada layar Desktop, Kartu ringkas + *Bottom Navigation* pada layar HP) lengkap dengan mode terang/gelap tanpa *flicker* dan ekspor laporan CSV ber-BOM UTF-8 siap buka di Microsoft Excel.
- **Dual-Mode (`USE_MOCK=true` vs `USE_MOCK=false`)**
  - Berjalan instan sebagai aplikasi demo portofolio tanpa kredensial (`USE_MOCK=true`), dan beralih ke database Google Sheets + Google Drive nyata hanya dengan mengganti variabel lingkungan (`USE_MOCK=false`).

---

## Tumpukan Teknologi

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js 16.2 (App Router, `src/` directory, Server Route Handlers & `proxy.ts`) |
| Bahasa | TypeScript 5.9 (Strict Mode) |
| UI & Styling | Tailwind CSS v4, shadcn/ui, Radix UI, Lucide Icons, Sonner Toast, next-themes |
| Keamanan | Web Crypto HMAC-SHA256 `httpOnly` Cookie Session + SHA-256 Salted PIN + Server RBAC |
| Cloud Storage | Native REST Google Sheets API v4 & Google Drive API v3 (Zero-bloat, OAuth2 Refresh Token & Service Account support) |
| CI/CD | GitHub Actions (`ci.yml` + `sync-release.yml` auto-mirror ke organisasi sekolah) + Vercel |

---

## Cara Menjalankan Cepat (Mode Demo)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`:
- **Admin Tata Usaha** — PIN: `123456`
- **Pegawai (`Budi Santoso, S.Pd`)** — PIN: `654321`

Untuk panduan menghubungkan ke **Google Spreadsheet & Google Drive sekolah (`@gmail.com` 15 GB)** dan deploy ke **Vercel**, baca selengkapnya di **[INSTALASI.md](./INSTALASI.md)**.

---

## Struktur Proyek

```text
src/
├── app/
│   ├── (app)/               # Halaman terproteksi (Dashboard, Surat Keluar/Masuk, Pegawai, Pengaturan)
│   ├── api/                 # Route Handlers (auth, bootstrap, surat, files/[fileId], users, pengaturan, klasifikasi, disposisi)
│   └── login/               # Halaman masuk berbasis PIN & opsi sesi 12 jam / 7 hari
├── components/
│   ├── layout/              # Sidebar Desktop, Topbar, Bottom Nav Mobile, Dialog Ganti PIN
│   ├── shared/              # Tabel/Kartu Surat, Modal Pratinjau PDF Proxy, Theme Toggle
│   └── ui/                  # Komponen dasar shadcn/ui
├── context/
│   └── app-context.tsx      # Sinkronisasi state klien <-> REST API
├── lib/
│   ├── auth.ts              # Hash PIN (kompatibel Apps Script) & verifikasi token HMAC-SHA256
│   ├── google.ts            # Token provider OAuth2 Refresh Token (@gmail.com) & Service Account
│   ├── sheets-db.ts         # Klien Google Sheets API v4 + auto-migrasi tab & audit Log
│   ├── drive-storage.ts     # Klien Google Drive API v3 (subfolder tahun, multipart upload, stream proxy)
│   ├── repository.ts        # Repositori terpadu Dual-Mode (Mock Memory vs Google Cloud)
│   └── server-users.ts      # Manajemen akun & proteksi brute-force PIN
└── proxy.ts                 # Guard rute server Next.js 16 & RBAC Admin
```

---

## Lisensi

Dirilis di bawah lisensi [MIT](./LICENSE).
