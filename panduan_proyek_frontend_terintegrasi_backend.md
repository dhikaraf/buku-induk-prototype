# Panduan Proyek Frontend — Sistem Informasi Buku Induk Siswa SD

> Dokumen ini menjelaskan kerangka *frontend* yang sudah ada beserta panduan penyelarasan dan integrasinya dengan arsitektur *backend* (`backend.md`) dan basis data MySQL (`database_buku_induk.sql`) untuk **SD Negeri Batu Ampar 12 Pagi**. Sumber kebenaran implementasi antarmuka tetap berada pada kode di `frontend/src`.

---

## 1. Ringkasan

*Frontend* adalah aplikasi *Single-Page Application* (SPA) berbasis React untuk **Sistem Informasi Buku Induk Siswa Berbasis Web Intranet (LAN)** di SD Negeri Batu Ampar 12 Pagi. Aplikasi menyediakan halaman *login* dan *dashboard* terpisah untuk tiga aktor utama sesuai skema RBAC *backend*: **Operator Sekolah (`OPERATOR`)**, **Guru Kelas/Mapel (`GURU`)**, dan **Siswa/Orang Tua (`SISWA`)**. Seluruh antarmuka menggunakan Bahasa Indonesia.

Saat ini kerangka UI dasar dan navigasi tiap peran telah tersedia menggunakan data contoh (*mock data*) dan `sessionStorage`. Tahap pengembangan berikutnya adalah menghubungkan seluruh layar antarmuka tersebut ke **RESTful API Backend** (`http://<ip-server-lokal>:5000/api`) menggunakan autentikasi **JWT (*JSON Web Token*)** serta menyelaraskan kontrak *field* formulir/tabel dengan 9 entitas pada database `db_buku_induk_sdn12`.

---

## 2. Teknologi dan Perintah

* **Core UI:** React 19 dan React DOM 19
* **Build Tool:** Vite 8 dengan plugin React
* **Bahasa & Styling:** JavaScript ES Modules, JSX, dan CSS biasa terlingkup per halaman/komponen
* **Linter:** `oxlint`
* **Komunikasi HTTP & State:** Fetch API (terpusat di lapisan `src/services/`) serta penyimpanan token/sesi di `sessionStorage`

Jalankan perintah berikut dari direktori `frontend`:

```powershell
npm install
npm run dev
npm run lint
npm run build
npm run preview  # menyajikan hasil build produksi secara lokal
```

Konfigurasi variabel lingkungan (*environment*) ditambahkan pada file `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 3. Peta Struktur Direktori

```text
frontend/
├── .env                              # Konfigurasi VITE_API_BASE_URL
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx                      # Bootstrap React, StrictMode, CSS global
    ├── App.jsx                       # Penjaga sesi JWT & pemilih dashboard berdasarkan role
    ├── index.css                     # Reset dan dasar global
    ├── assets/                       # Logo sekolah, foto kampus, ilustrasi
    ├── hooks/
    │   └── useSessionState.js        # State navigasi yang disimpan di sessionStorage
    ├── services/                     # [BARU - INTEGRASI] Lapisan komunikasi REST API
    │   ├── apiClient.js              # Wrapper fetch + injeksi header Authorization Bearer & handler 401
    │   ├── authService.js            # Endpoint /api/auth/*
    │   ├── userService.js            # Endpoint /api/users/* (Operator)
    │   ├── siswaService.js           # Endpoint /api/siswa/* & /api/buku-induk/*
    │   ├── raporService.js           # Endpoint /api/rapor/* (Guru & Operator)
    │   └── portalService.js          # Endpoint /api/portal/* (Siswa/Orang Tua)
    └── pages/
        ├── loginpage/                # Halaman login & stylesheet
        └── dashboard/
            ├── DashboardPage.jsx     # Shell & dashboard utama Operator
            ├── OperatorModulePage.jsx# Pemetaan dan dispatcher modul Operator
            ├── modules/              # Komponen bersama dan layar Operator
            ├── teacher/              # Dashboard, komponen, dan layar Guru
            └── student/              # Dashboard, komponen, dan layar Siswa/Orang Tua
```

Setiap halaman/fitur menyimpan berkas `.jsx` dan `.css` berdampingan. CSS per halaman diimpor langsung oleh JSX-nya. Seluruh pemanggilan jaringan (*HTTP request*) wajib dipusatkan di dalam `src/services/` dan tidak ditulis langsung di dalam komponen tampilan.

---

## 4. Alur Aplikasi, Pemetaan Role, dan Autentikasi JWT

### A. Pemetaan Nama Role Frontend ke Backend

Backend menggunakan nilai `ENUM('OPERATOR', 'GURU', 'SISWA')` pada tabel `pengguna` dan payload JWT. Lakukan normalisasi pemetaan peran di `App.jsx` dan `LoginPage.jsx`:

| Role Backend (`JWT` & DB) | Identifier UI Frontend | Shell Dashboard Tujuan | Hak Akses Utama |
| :--- | :--- | :--- | :--- |
| `OPERATOR` | `operator` | `DashboardPage.jsx` | CRUD Akun, CRUD Master Siswa, Mutasi/Kelulusan, Import Excel, Cetak PDF, Backup SQL. |
| `GURU` | `teacher` | `TeacherDashboardPage.jsx` | Read Profil Siswa, CRUD Nilai Rapor Kurikulum Merdeka (Mapel, P5, Ekskul, Presensi). |
| `SISWA` | `student` | `StudentDashboardPage.jsx` | Read-Only Profil & Keluarga Pribadi, Rekap Nilai Semester 1–12, Unduh PDF Mandiri. |

### B. Alur Sesi & Autentikasi

1. **[main.jsx](./frontend/src/main.jsx)** memasang `<App />` dalam `StrictMode` dan mengimpor `index.css`.
2. **[LoginPage.jsx](./frontend/src/pages/loginpage/LoginPage.jsx)** mengirimkan `username` dan `password` ke `POST /api/auth/login`.
   * *Catatan UI:* Pemilih peran manual di halaman login dapat dihapus atau dijadikan indikator informasi saja, karena peran pengguna ditentukan secara otomatis dan aman dari *response* JWT server (`data.user.role`).
3. Jika login berhasil, simpan `token` JWT pada `sessionStorage` (`sd-induk.token`) beserta profil pengguna (`sd-induk.user` berisi `id_user`, `username`, `role`, `nama_lengkap`, dan `nisn`).
4. **[App.jsx](./frontend/src/App.jsx)** memeriksa keberadaan token dan `role` aktif. Jika kosong atau token kedaluwarsa (`401 Unauthorized`), arahkan kembali ke `LoginPage`. Jika valid (`OPERATOR`, `GURU`, atau `SISWA`), tampilkan *dashboard* peran terkait.
5. Navigasi menu terakhir tiap *dashboard* tetap disimpan menggunakan hook **[useSessionState.js](./frontend/src/hooks/useSessionState.js)**.
6. Saat pengguna menekan tombol **Keluar (Logout)**, seluruh kunci `sd-induk.*` (termasuk `sd-induk.token`, `sd-induk.user`, dan kunci menu aktif) dihapus dari `sessionStorage` lalu kembali ke `LoginPage`.

---

## 5. Pemetaan Area Fitur Frontend terhadap Backend API

Karena purwarupa awal *frontend* memiliki beberapa menu tambahan yang berada di luar ruang lingkup proyek (*Out-of-Scope* pada Project Charter & ERD), pengembangan integrasi dibagi menjadi **Fitur Inti (Terhubung API)** dan **Penyesuaian Menu Out-of-Scope**.

### A. Operator Sekolah (`role: OPERATOR`)

Navigasi utama berada di `DashboardPage.jsx` dan dispatcher layar di `OperatorModulePage.jsx`.

| Menu UI Frontend | Status Integrasi | Endpoint Backend Terkait | Tabel Database Terkait |
| :--- | :---: | :--- | :--- |
| **Dashboard** | **Terhubung API** | `GET /api/siswa` (agregasi statistik aktif/lulus/pindah) | `siswa`, `rapor_capaian` |
| **Data Induk Siswa** (Biodata & Import) | **Terhubung API** | `GET /api/siswa`, `POST /api/siswa`, `PUT /api/siswa/:nisn`, `DELETE /api/siswa/:nisn`, `POST /api/siswa/import` | `siswa`, `keluarga_siswa`, `riwayat_masuk_siswa` |
| **Orang Tua / Wali** | **Terhubung API** | `GET /api/siswa/:nisn`, `PUT /api/siswa/:nisn` (terintegrasi dalam form/tab detail siswa) | `keluarga_siswa` |
| **Riwayat Siswa** (Masuk & Keluar) | **Terhubung API** | `GET /api/siswa/:nisn`, `PUT /api/siswa/:nisn` (riwayat masuk) | `riwayat_masuk_siswa` |
| **Mutasi Siswa & Alumni** | **Terhubung API** | `POST /api/siswa/:nisn/keluar`, `GET /api/siswa?status=Lulus` / `Pindah` | `siswa`, `riwayat_keluar_siswa` |
| **Rekap Siswa & Rekap Per Kelas** | **Terhubung API** | `GET /api/rapor/siswa/:nisn`, `GET /api/buku-induk/:nisn/pdf` | `siswa`, `rapor_capaian`, `nilai_mapel`, `profil_pancasila`, `nilai_ekstrakurikuler` |
| **Manajemen Akun & Backup** | **Terhubung API** | `GET/POST/PUT/DELETE /api/users`, `GET /api/system/backup-sql` | `pengguna` |
| **Profil Sekolah** | **Statis / Lokal** | Konten profil SDN Batu Ampar 12 Pagi (tidak memerlukan tabel khusus) | — |
| *Data Guru, Data Kelas, Tahun Ajaran, Kenaikan Kelas* | **Diselaraskan** | Dikelola melalui atribut pada tabel `pengguna` (`role='GURU'`) dan header `rapor_capaian` (`kelas`, `tahun_pelajaran`, `keputusan_akhir`) | `pengguna`, `rapor_capaian` |
| *Ekspor Dapodik, Persetujuan Pengajuan, Audit Log* | **Nonaktif / Phase 2** | **Out-of-Scope** (disembunyikan dari navigasi produksi agar sesuai Project Charter) | — |

### B. Guru Kelas / Mata Pelajaran (`role: GURU`)

Navigasi berada di `TeacherDashboardPage.jsx` dan pemetaan layar di `TeacherScreens.jsx`.

| Menu UI Frontend | Status Integrasi | Endpoint Backend Terkait | Tabel Database Terkait |
| :--- | :---: | :--- | :--- |
| **Daftar Siswa Binaan** | **Terhubung API** | `GET /api/siswa`, `GET /api/siswa/:nisn` (akses *Read-Only* profil) | `siswa`, `keluarga_siswa` |
| **Input Nilai & Asesmen** | **Terhubung API** | `POST /api/rapor`, `GET /api/rapor/:id_rapor`, `POST /api/rapor/:id_rapor/mapel` | `rapor_capaian`, `nilai_mapel` |
| **Rekap Presensi Siswa** | **Terhubung API** | `POST /api/rapor`, `PUT /api/rapor/:id_rapor` (`absensi_sakit`, `absensi_izin`, `absensi_tanpa_ket`) | `rapor_capaian` |
| **Catatan Karakter & P5** | **Terhubung API** | `POST /api/rapor/:id_rapor/p5`, `PUT /api/rapor/:id_rapor` (`catatan_wali_kelas`, `keputusan_akhir`) | `profil_pancasila`, `rapor_capaian` |
| **Kegiatan Ekstrakurikuler** *(Tambahan)* | **Terhubung API** | `POST /api/rapor/:id_rapor/ekskul` (4 rumpun: Krida, Karya Ilmiah, Olah Bakat/Minat, Keagamaan) | `nilai_ekstrakurikuler` |
| **Leger Nilai Kelas & Verifikasi Rapor** | **Terhubung API** | `GET /api/rapor/siswa/:nisn`, `GET /api/buku-induk/:nisn/pdf` | `rapor_capaian`, `nilai_mapel` |
| **Profil Guru & Akun** | **Terhubung API** | `GET /api/auth/me`, `PUT /api/auth/password` | `pengguna` |
| *Jadwal Mengajar, Usulan Koreksi Data* | **Nonaktif / Phase 2** | **Out-of-Scope** (tidak ada pada skema database `db_buku_induk_sdn12`) | — |

### C. Siswa / Orang Tua Siswa (`role: SISWA`)

Navigasi berada di `StudentDashboardPage.jsx` dan pemetaan layar di `StudentScreens.jsx`. Seluruh endpoint `/api/portal/*` secara otomatis dikunci oleh *backend* menggunakan `nisn` di dalam token JWT.

| Menu UI Frontend | Status Integrasi | Endpoint Backend Terkait | Tabel Database Terkait |
| :--- | :---: | :--- | :--- |
| **Biodata Pribadi Saya** | **Terhubung API** | `GET /api/portal/profil` (*Read-Only* biodata, keluarga, & riwayat masuk) | `siswa`, `keluarga_siswa`, `riwayat_masuk_siswa` |
| **Rapor & Hasil Belajar** | **Terhubung API** | `GET /api/portal/rapor` (nilai mapel, P5, ekskul, presensi, & catatan wali) | `rapor_capaian`, `nilai_mapel`, `profil_pancasila`, `nilai_ekstrakurikuler` |
| **Riwayat Akademik** | **Terhubung API** | `GET /api/portal/rapor` (ringkasan lintas kelas I–VI / semester 1–12) | `rapor_capaian` |
| **Transkrip Saya (Cetak Buku Induk)** | **Terhubung API** | `GET /api/portal/cetak-pdf` (unduh otomatis dokumen PDF Buku Induk pribadi) | Seluruh relasi `siswa` |
| **Keamanan & Akun** | **Terhubung API** | `GET /api/auth/me`, `PUT /api/auth/password` | `pengguna` |
| *Jadwal Pelajaran, Unggah Dokumen, Pengajuan Perubahan Data* | **Nonaktif / Phase 2** | **Out-of-Scope** (tidak tersedia pada skema database saat ini) | — |

---

## 6. Kontrak Data & Penamaan Field (Schema Alignment)

Seluruh formulir input dan komponen tabel di *frontend* wajib menggunakan nama properti (*key*) yang sama persis dengan kolom pada `database_buku_induk.sql` agar tidak memerlukan transformasi berlapis:

1. **Objek Master Siswa (`POST /api/siswa` & `PUT /api/siswa/:nisn`):**
   * **Identitas (`siswa`):** `nisn` (10 digit, PK), `nis` (Unique), `nik` (16 digit, Unique), `no_kk` (16 digit), `nama_lengkap`, `nama_panggilan`, `jenis_kelamin` (`'L'` | `'P'`), `tempat_lahir`, `tanggal_lahir` (`YYYY-MM-DD`), `agama`, `kewarganegaraan`, `jumlah_saudara`, `bahasa_sehari_hari`, `golongan_darah`, `alamat`, `nomor_telepon`, `bertempat_tinggal_pada`, `jarak_sekolah`, `status_siswa` (`'Aktif'` | `'Lulus'` | `'Pindah'` | `'Keluar'`).
   * **Keluarga (`keluarga_siswa`):** `nama_ayah`, `pendidikan_ayah`, `pekerjaan_ayah`, `nama_ibu`, `pendidikan_ibu`, `pekerjaan_ibu`, serta opsional `nama_wali`, `hubungan_wali`, `pendidikan_wali`, `pekerjaan_wali`.
   * **Riwayat Masuk (`riwayat_masuk_siswa`):** `status_masuk` (`'Baru'` | `'Pindahan'`). Jika `'Baru'`, kirim `asal_tk_nama`, `tgl_sttb_tk`, `no_sttb_tk`. Jika `'Pindahan'`, kirim `asal_sekolah_pindahan`, `dari_tingkat`, `tgl_diterima`.
2. **Objek Rapor Kurikulum Merdeka (`/api/rapor`):**
   * **Header (`rapor_capaian`):** `nisn`, `kelas`, `fase` (`'A'` | `'B'` | `'C'`), `semester` (`'Ganjil'` | `'Genap'`), `tahun_pelajaran` (misal `'2025/2026'`), `absensi_sakit`, `absensi_izin`, `absensi_tanpa_ket`, `catatan_wali_kelas`, `keputusan_akhir`.
   * **Nilai Mapel (`nilai_mapel`):** `kategori_mapel` (`'Wajib'` | `'Agama Adaptif'` | `'Seni Budaya'` | `'Muatan Lokal'`), `nama_mapel`, `nilai_akhir` (angka `0–100`), `capaian_kompetensi`.
   * **Capaian P5 (`profil_pancasila`):** `dimensi`, `elemen`, `sub_elemen`, `target_pencapaian` (`'BB'` | `'MB'` | `'BSH'` | `'SB'`).
   * **Ekstrakurikuler (`nilai_ekstrakurikuler`):** `rumpun_ekskul` (`'Krida'` | `'Karya Ilmiah'` | `'Latihan Olah Bakat dan Minat'` | `'Keagamaan'`), `nama_ekskul`, `predikat` (`'Sangat Baik'` | `'Baik'` | `'Cukup'`), `keterangan`.

---

## 7. Standar Komunikasi HTTP & Penanganan Response

### A. Header & Format Response Standar

Setiap permintaan ke endpoint terproteksi wajib menyertakan header `Authorization: Bearer <token>`. Wrapper `apiClient.js` memproses standar JSON dari *backend*:

* **Sukses (`200` / `201`):**
  ```json
  {
    "status": "success",
    "message": "Data siswa berhasil disimpan.",
    "data": { ... }
  }
  ```
* **Gagal (`400` / `401` / `403` / `409`):**
  ```json
  {
    "status": "error",
    "message": "Validasi gagal: NISN sudah terdaftar pada sistem.",
    "errors": [{ "field": "nisn", "detail": "..." }]
  }
  ```

### B. Penanganan Unduhan File Binary (PDF & Backup SQL)

Untuk endpoint `GET /api/buku-induk/:nisn/pdf`, `GET /api/portal/cetak-pdf`, dan `GET /api/system/backup-sql`, *backend* mengirimkan aliran biner (`application/pdf` atau `application/sql`), bukan JSON. Gunakan `response.blob()` pada `apiClient.js` lalu buat URL sementara (`URL.createObjectURL(blob)`) untuk memicu unduhan atau pratinjau cetak di tab baru.

### C. Manajemen Status UI (Loading, Empty, Error)

Setiap halaman yang mengambil data dari API wajib menangani 3 kondisi eksplisit:
1. **Loading State:** Menampilkan indikator pemuatan saat *request* berjalan dan menonaktifkan tombol *submit* (`disabled`) untuk mencegah pengiriman ganda (*double submit*).
2. **Empty State:** Menampilkan pesan informatif apabila daftar siswa atau riwayat rapor masih kosong (`data.length === 0`).
3. **Error State:** Menampilkan pesan kesalahan dari `response.message` (dan detail `errors` per kolom bila ada) menggunakan elemen umpan balik `role="status"` atau `role="alert"`.

---

## 8. Pola Implementasi dan Pengembangan Halaman

1. **Pertahankan Pemisahan Role:** `OPERATOR`, `GURU`, dan `SISWA` memiliki *shell*, navigasi, dan *dispatcher* masing-masing.
2. **Gunakan Komponen Reusable:** Untuk tampilan berbasis tabel dan ringkasan metrik, gunakan `ModuleDataPage.jsx` (Operator), `TeacherDataPage.jsx` (Guru), atau `StudentDataPage.jsx` (Siswa).
3. **Konsistensi Label Navigasi:** Teks label pada array grup navigasi di *dashboard* harus identik dengan kunci pemetaan pada `OperatorModulePage.jsx`, `TeacherScreens.jsx`, atau `StudentScreens.jsx`.
4. **Aksesibilitas & CSS Terlingkup:** Impor file `.css` fitur langsung di dalam file `.jsx` terkait. Gunakan `type="button"` pada tombol non-submit, sediakan `label`/`aria-label` pada seluruh input formulir, serta pastikan tampilan responsif pada layar desktop maupun perangkat seluler.
5. **Validasi Sebelum Commit:** Jalankan `npm run lint` dan `npm run build` setelah melakukan perubahan kode untuk memastikan tidak ada kesalahan sintaks atau *import* yang rusak.

---

## 9. File Rujukan Utama

* **[backend.md](./backend.md)** — Spesifikasi lengkap RESTful API, middleware RBAC 3 aktor, struktur direktori *backend*, dan transaksi database.
* **[database_buku_induk.sql](./database_buku_induk.sql)** — Skrip DDL MySQL (`db_buku_induk_sdn12`), relasi 9 tabel, dan data *seed* awal untuk pengujian.
* **[App.jsx](./frontend/src/App.jsx)** — Pengelola sesi autentikasi JWT, pemetaan *role*, dan pembersihan sesi saat *logout*.
* **[DashboardPage.jsx](./frontend/src/pages/dashboard/DashboardPage.jsx)** & **[OperatorModulePage.jsx](./frontend/src/pages/dashboard/OperatorModulePage.jsx)** — *Shell* dan pemetaan layar peran `OPERATOR`.
* **[TeacherDashboardPage.jsx](./frontend/src/pages/dashboard/teacher/TeacherDashboardPage.jsx)** & **[TeacherScreens.jsx](./frontend/src/pages/dashboard/teacher/screens/TeacherScreens.jsx)** — *Shell* dan pemetaan layar peran `GURU`.
* **[StudentDashboardPage.jsx](./frontend/src/pages/dashboard/student/StudentDashboardPage.jsx)** & **[StudentScreens.jsx](./frontend/src/pages/dashboard/student/screens/StudentScreens.jsx)** — *Shell* dan pemetaan layar peran `SISWA`.
* **[useSessionState.js](./frontend/src/hooks/useSessionState.js)** — Persistensi state navigasi per tab di `sessionStorage`.