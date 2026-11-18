# Backend Buku Induk

REST API intranet berbasis Express dan MySQL untuk Sistem Informasi Buku Induk SDN Batu Ampar 12 Pagi.

## Menjalankan

1. Pastikan Node.js 18+ dan MySQL/MariaDB aktif.
2. Buat database `db_buku_induk_sdn12`, lalu impor [`../tables_buku_induk_sdn12.sql`](../tables_buku_induk_sdn12.sql).
3. Salin `.env.example` menjadi `.env`, sesuaikan konfigurasi MySQL, lalu ganti `JWT_SECRET` dengan secret acak minimal 32 karakter.
4. Jalankan `npm install`, lalu `npm run dev` (pengembangan) atau `npm start`.

API berjalan pada `http://localhost:5000/api`. Endpoint pemeriksaan: `GET /api/health`.

Seed SQL menyediakan akun contoh dengan sandi `password`:

| Username | Role |
| --- | --- |
| `operator.sdn12` | OPERATOR |
| `guru.kelas4a` | GURU |
| `0145678901` | SISWA |

Gunakan akun contoh hanya untuk lingkungan pengembangan dan ganti sandinya sebelum dipakai di jaringan sekolah.

## Kontrak ringkas

- Respons JSON mengikuti `{ status, message, data }`; validasi mengembalikan `errors`.
- Endpoint terlindungi menggunakan `Authorization: Bearer <token>`.
- `POST /api/siswa` menerima `{ siswa, keluarga, riwayat_masuk, buat_akun? }` dan menyimpan relasi dalam satu transaksi.
- `POST /api/siswa/import` menerima unggahan `.xlsx` atau `.csv` pada field multipart `file` (maksimal 5 MB). Kolom header mengikuti nama kolom skema; data keluarga dan riwayat masuk dapat disertakan pada baris yang sama.
- Endpoint rapor menerima satu objek atau `{ "data": [...] }` untuk penyimpanan batch item. Sertakan id item (`id_nilai_mapel`, `id_profil`, atau `id_ekskul`) untuk memperbarui nilai yang sudah ada.
- PDF dihasilkan dengan PDFKit; backup SQL mengekspor data semua tabel dalam format SQL.

## Endpoint

Sesuai [`arsitektur_backend_spesifikasi_api.md`](../arsitektur_backend_spesifikasi_api.md): `/auth`, `/users`, `/siswa`, `/rapor`, `/portal`, `/buku-induk`, dan `/system/backup-sql`.
