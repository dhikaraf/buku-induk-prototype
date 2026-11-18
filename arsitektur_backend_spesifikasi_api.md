# Rancangan Arsitektur Backend (`backend.md`)
**Sistem Informasi Buku Induk Siswa Berbasis Web Intranet**  
**Mitra:** SDN Batu Ampar 12 Pagi, Jakarta Timur  
**Tim Pengembang:** Kelompok 1 (Programmer: Ahmad Mulki Thunasin & Aufa Dahana)

---

## 1. Arsitektur & Teknologi Backend

Sistem dirancang menggunakan arsitektur **RESTful API** berbasis jaringan lokal (**Intranet LAN**) dengan memisahkan logika bisnis (*Back-End*), antarmuka pengguna (*Front-End*), dan basis data relasional (*MySQL/MariaDB*).

* **Lingkungan Server Lokal:** XAMPP / Laragon (Apache/Nginx + MySQL 8.0 / MariaDB 10.4+) pada PC Server Sekolah.
* **Runtime & Framework (Rekomendasi Utama):** Node.js (v18+ LTS) dengan **Express.js** (atau dapat diadaptasi menggunakan PHP 8.2+ Native / Laravel).
* **Driver Basis Data:** `mysql2/promise` (menggunakan *Connection Pooling* & *Prepared Statements* untuk mencegah SQL Injection).
* **Autentikasi & Keamanan:** JSON Web Token (**JWT**) untuk manajemen sesi dan **Bcrypt** (10 salt rounds) untuk enkripsi kata sandi.
* **PDF Generator Engine:** **Puppeteer** (HTML-to-PDF) atau **PDFKit** untuk merender template baku Buku Induk Siswa siap cetak dalam waktu `< 5 detik`.
* **Excel/CSV Parser:** `xlsx` / `multer` untuk fitur *bulk import* data siswa eksisting dari operator.

---

## 2. Struktur Direktori Proyek Backend

```text
backend-buku-induk/
├── src/
│   ├── config/
│   │   └── database.js           # Konfigurasi koneksi pool MySQL
│   ├── middlewares/
│   │   ├── authMiddleware.js     # Verifikasi JWT Token
│   │   ├── roleMiddleware.js     # Pembatasan hak akses RBAC (OPERATOR, GURU, SISWA)
│   │   └── errorHandler.js       # Penanganan error terpusat
│   ├── controllers/
│   │   ├── authController.js     # Login, profil saya, ganti password
│   │   ├── userController.js     # Manajemen akun pengguna (Operator)
│   │   ├── siswaController.js    # CRUD Master Siswa (Biodata, Keluarga, Riwayat) & Import
│   │   ├── raporController.js    # CRUD Nilai Mapel, P5, Ekskul, & Presensi (Guru)
│   │   ├── portalController.js   # Endpoint Read-Only khusus Siswa/Orang Tua
│   │   └── pdfController.js      # Generator cetak Buku Induk PDF & Backup SQL
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── siswaRoutes.js
│   │   ├── raporRoutes.js
│   │   ├── portalRoutes.js
│   │   └── pdfRoutes.js
│   ├── templates/
│   │   └── buku_induk.html       # Template cetak resmi Buku Induk SD (Kurikulum Merdeka)
│   └── app.js                    # Entry point Express server
├── .env                          # Variabel lingkungan (DB_HOST, DB_USER, DB_NAME, JWT_SECRET)
└── package.json
```

---

## 3. Mekanisme Keamanan & Otorisasi (RBAC 3 Aktor)

Setiap *request* ke endpoint terproteksi wajib menyertakan header `Authorization: Bearer <token>`. Payload JWT menyimpan informasi berikut:

```json
{
  "id_user": 1,
  "username": "operator_sdn12",
  "role": "OPERATOR",
  "nisn": null
}
```

### Aturan Penegakan Hak Akses (*Middleware*):
1. **`OPERATOR` (Administrator):** Memiliki akses penuh (`CRUD`) ke manajemen pengguna, master data siswa, pencetakan PDF Buku Induk, impor data massal, dan *backup* database.
2. **`GURU` (Pengelola Akademik):** Memiliki akses `READ` pada daftar/profil siswa serta `CRUD` pada modul rapor semester (`rapor_capaian`, `nilai_mapel`, `profil_pancasila`, `nilai_ekstrakurikuler`).
3. **`SISWA` (Portal Mandiri Read-Only):** Hanya diizinkan mengakses grup endpoint `/api/portal/*`. Sistem secara otomatis mengambil nilai `req.user.nisn` dari token JWT untuk mengunci query `WHERE nisn = ?`, sehingga siswa/orang tua **tidak dapat melihat atau memanipulasi data siswa lain**.

---

## 4. Spesifikasi Endpoint REST API

### A. Modul Autentikasi (`/api/auth`)

| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | Publik | Validasi `username` & `password`, mengembalikan JWT token & profil peran. |
| `GET` | `/api/auth/me` | Semua Role | Mengambil data profil pengguna yang sedang login. |
| `PUT` | `/api/auth/password` | Semua Role | Mengubah kata sandi akun sendiri (wajib verifikasi password lama). |

### B. Modul Manajemen Akun Pengguna (`/api/users`)

| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/users` | `OPERATOR` | Menampilkan seluruh akun (`OPERATOR`, `GURU`, `SISWA`) dengan filter role. |
| `POST` | `/api/users` | `OPERATOR` | Membuat akun baru. Jika `role = 'SISWA'`, wajib menyertakan `nisn` valid. |
| `PUT` | `/api/users/:id` | `OPERATOR` | Memperbarui nama lengkap, role, atau mereset kata sandi pengguna. |
| `DELETE` | `/api/users/:id` | `OPERATOR` | Menghapus akun pengguna dari sistem. |

### C. Modul Master Data Siswa (`/api/siswa`)

| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/siswa` | `OPERATOR`, `GURU` | Pencarian & daftar siswa (`?search=nisn/nama&status=Aktif`). Target `< 5 detik`. |
| `GET` | `/api/siswa/:nisn` | `OPERATOR`, `GURU` | Detail lengkap siswa (`JOIN` tabel `siswa`, `keluarga_siswa`, `riwayat_masuk_siswa`, `riwayat_keluar_siswa`). |
| `POST` | `/api/siswa` | `OPERATOR` | Menyimpan data siswa baru beserta keluarga & riwayat masuk dalam **1 transaksi SQL** (*ACID*). |
| `PUT` | `/api/siswa/:nisn` | `OPERATOR` | Memperbarui biodata siswa, data orang tua/wali, atau riwayat masuk. |
| `POST` | `/api/siswa/:nisn/keluar` | `OPERATOR` | Mencatat mutasi keluar / kelulusan kelas 6 ke `riwayat_keluar_siswa` dan mengubah `status_siswa`. |
| `POST` | `/api/siswa/import` | `OPERATOR` | Impor massal data siswa awal dari file `.xlsx` atau `.csv`. |
| `DELETE` | `/api/siswa/:nisn` | `OPERATOR` | Menghapus data siswa (akan melakukan *cascade delete* pada relasi terkait). |

### D. Modul Rapor & Capaian Kurikulum Merdeka (`/api/rapor`)

| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/rapor/siswa/:nisn` | `OPERATOR`, `GURU` | Mengambil seluruh riwayat rapor siswa dari kelas 1 hingga kelas 6. |
| `GET` | `/api/rapor/:id_rapor` | `OPERATOR`, `GURU` | Mengambil detail 1 rapor lengkap dengan daftar `nilai_mapel`, `profil_pancasila`, dan `nilai_ekstrakurikuler`. |
| `POST` | `/api/rapor` | `OPERATOR`, `GURU` | Membuat header rapor semester baru (`kelas`, `fase`, `semester`, `tahun_pelajaran`, presensi, catatan wali). |
| `PUT` | `/api/rapor/:id_rapor` | `OPERATOR`, `GURU` | Memperbarui rekap absensi, catatan wali kelas, dan keputusan akhir kenaikan kelas. |
| `POST` | `/api/rapor/:id_rapor/mapel` | `OPERATOR`, `GURU` | Menambah/memperbarui batch nilai mata pelajaran (`kategori_mapel`, `nama_mapel`, `nilai_akhir`, `capaian_kompetensi`). |
| `POST` | `/api/rapor/:id_rapor/p5` | `OPERATOR`, `GURU` | Menambah/memperbarui penilaian P5 (`dimensi`, `elemen`, `sub_elemen`, `target_pencapaian`). |
| `POST` | `/api/rapor/:id_rapor/ekskul` | `OPERATOR`, `GURU` | Menambah/memperbarui catatan ekstrakurikuler (`rumpun_ekskul`, `nama_ekskul`, `predikat`, `keterangan`). |

### E. Modul Portal Mandiri Siswa / Orang Tua (`/api/portal`)

| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/portal/profil` | `SISWA` | Mengambil biodata pribadi, keluarga, dan riwayat masuk milik siswa yang login. |
| `GET` | `/api/portal/rapor` | `SISWA` | Mengambil seluruh rekapitulasi nilai rapor semester 1–12 milik siswa yang login. |
| `GET` | `/api/portal/cetak-pdf` | `SISWA` | Mengunduh salinan digital Buku Induk PDF pribadi. |

### F. Modul Output Buku Induk & Utilitas Server (`/api/buku-induk`)

| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/buku-induk/:nisn/pdf` | `OPERATOR`, `GURU` | Merender dan mengunduh lembar resmi Buku Induk Siswa berformat PDF. |
| `GET` | `/api/system/backup-sql` | `OPERATOR` | Mengekspor salinan lengkap database `.sql` untuk cadangan lokal sekolah. |

---

## 5. Standar Format Response JSON

Seluruh endpoint mengembalikan struktur JSON yang seragam agar mudah dikonsumsi oleh tim *Front-End*:

### Response Sukses (`200 OK` / `201 Created`)
```json
{
  "status": "success",
  "message": "Data siswa berhasil disimpan.",
  "data": {
    "nisn": "0154829101",
    "nis": "242501001",
    "nama_lengkap": "Budi Santoso"
  }
}
```

### Response Error (`400 Bad Request` / `401 Unauthorized` / `403 Forbidden` / `409 Conflict`)
```json
{
  "status": "error",
  "message": "Validasi gagal: NISN sudah terdaftar pada sistem.",
  "errors": [
    {
      "field": "nisn",
      "detail": "Duplicate entry '0154829101' for key 'PRIMARY'"
    }
  ]
}
```

---

## 6. Alur Transaksi Database Penting (Database Transactions)

1. **Pendaftaran Siswa Baru (`POST /api/siswa`):**
   Wajib dibungkus dengan `BEGIN TRANSACTION` $\rightarrow$ `INSERT INTO siswa` $\rightarrow$ `INSERT INTO keluarga_siswa` $\rightarrow$ `INSERT INTO riwayat_masuk_siswa` $\rightarrow$ (opsional) `INSERT INTO pengguna` (auto-create akun portal siswa dengan username = `nisn` dan password default = `tanggal_lahir` format `DDMMYYYY`) $\rightarrow$ `COMMIT`. Jika salah satu tabel gagal, lakukan `ROLLBACK` agar tidak ada data yatim (*orphan records*).
2. **Generate PDF Buku Induk (`GET /api/buku-induk/:nisn/pdf`):**
   Melakukan 1 query master untuk profil (`siswa` + `keluarga_siswa` + `riwayat_masuk_siswa` + `riwayat_keluar_siswa`) dan 1 query terurut (`ORDER BY kelas ASC, semester ASC`) untuk seluruh record `rapor_capaian` beserta detail `nilai_mapel`, `profil_pancasila`, dan `nilai_ekstrakurikuler`, lalu menyuntikkannya ke mesin render HTML-to-PDF.