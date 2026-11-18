# Frontend Buku Induk

Antarmuka web untuk Sistem Informasi Buku Induk SDN Batu Ampar 12 Pagi. Frontend dibuat dengan React dan Vite, lalu berkomunikasi dengan REST API backend.

## Persiapan

Pastikan Node.js 18 atau lebih baru sudah terpasang. Jalankan backend dan MySQL terlebih dahulu mengikuti [`README backend`](../backend-buku-induk/README.md). API backend secara default tersedia di `http://localhost:5000/api`.

## Menjalankan frontend

Dari folder `frontend`, jalankan:

```bash
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`.

Untuk membuat build produksi:

```bash
npm run build
npm run preview
```

## Alamat API

Secara default frontend menggunakan `http://localhost:5000/api`. Jika backend berada di alamat lain, buat file `.env` di folder `frontend` dan isi:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Ganti alamat tersebut sesuai lokasi backend. Setelah mengubah `.env`, jalankan ulang server Vite. Jika frontend dan backend diakses dari komputer berbeda, gunakan alamat IP/hostname backend yang dapat dijangkau dari browser, dan pastikan konfigurasi CORS backend mengizinkan origin frontend.

## Alur penggunaan

1. Pastikan database MySQL aktif dan skema serta akun contoh sudah dimasukkan sesuai petunjuk backend.
2. Jalankan backend API, kemudian jalankan frontend.
3. Masuk melalui halaman login menggunakan username dan kata sandi akun.
4. Backend memvalidasi kredensial dan mengirim role akun. Frontend menggunakan role tersebut untuk menampilkan menu serta halaman yang sesuai.
5. Gunakan menu **Keluar dari akun** untuk mengakhiri sesi pada browser.

## Akun contoh untuk pengembangan

> Akun berikut berasal dari seed SQL yang dijelaskan di README backend. Akun hanya dapat digunakan jika seed tersebut sudah diimpor ke database.

| Jenis akun di aplikasi | Username | Kata sandi |
| --- | --- | --- |
| Administrator/operator sekolah (`OPERATOR`) | `operator.sdn12` | `password` |
| Guru (`GURU`) | `guru.kelas4a` | `password` |
| Siswa (`SISWA`) | `0145678901` | `password` |

Gunakan akun contoh hanya untuk pengembangan lokal. Ganti kata sandi sebelum aplikasi digunakan pada jaringan sekolah.

### Akun siswa lainnya

Jika operator membuat akun siswa otomatis saat menambahkan data siswa, username awal siswa adalah NISN. Kata sandi awal dibentuk dari tanggal lahir dengan format `DDMMYYYY` (contoh: tanggal lahir 5 Maret 2015 menjadi `05032015`). Minta operator mengganti kata sandi setelah login.

## Halaman berdasarkan role

- **Operator**: ringkasan, data siswa, mutasi dan alumni, manajemen akun, serta profil sekolah. Operator dapat mengelola data dan akun.
- **Guru**: ringkasan, daftar siswa, serta input nilai dan asesmen. Guru dapat melihat rapor dan mengunduh buku induk siswa.
- **Siswa**: ringkasan, biodata pribadi, rapor dan hasil belajar, riwayat akademik, serta keamanan akun.

> Saat ini backend hanya mendukung role `OPERATOR`, `GURU`, dan `SISWA`. Akun orang tua/wali belum tersedia sebagai role tersendiri, sehingga belum dapat masuk ke halaman khusus orang tua.

## Catatan

- Login membutuhkan backend yang berjalan dan database yang dapat diakses backend.
- Sesi login disimpan di `sessionStorage` browser dan akan berakhir saat pengguna keluar atau sesi browser berakhir.
- Endpoint yang bisa digunakan setiap role ditentukan dan divalidasi oleh backend; menyembunyikan menu di frontend bukan pengganti validasi akses backend.
- Perintah `npm run lint` menjalankan Oxlint.
