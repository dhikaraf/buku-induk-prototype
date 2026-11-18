# Palet Warna Frontend

Dokumentasi palet warna yang digunakan oleh frontend aplikasi Buku Induk SD.
Sumber kebenaran implementasi tetap berada pada stylesheet di `frontend/src`.

## Palet utama

| Kategori | Warna | Hex | Penggunaan |
| --- | --- | --- | --- |
| Primary merah | <span style="color:#BE101B">●</span> | `#BE101B` | Tombol utama, menu aktif, aksen dashboard |
| Primary merah gelap | <span style="color:#A90C16">●</span> | `#A90C16` | Hover, teks error, aksen gelap |
| Maroon login | <span style="color:#A00010">●</span> | `#A00010` | Tombol dan aksen halaman login |
| Teks utama | <span style="color:#17233A">●</span> | `#17233A` | Judul, teks utama, ikon gelap |
| Teks sekunder | <span style="color:#8290A7">●</span> | `#8290A7` | Deskripsi, label, teks pendukung |
| Background aplikasi | <span style="color:#F5F7FB">●</span> | `#F5F7FB` | Latar belakang dashboard |
| Surface/card | <span style="color:#FFFFFF">●</span> | `#FFFFFF` | Sidebar, card, panel, input |
| Border utama | <span style="color:#E8EDF4">●</span> | `#E8EDF4` | Border card dan komponen |
| Border sidebar | <span style="color:#E6EBF2">●</span> | `#E6EBF2` | Pemisah sidebar |

## Warna status dan aksen

| Kategori | Warna | Hex | Penggunaan |
| --- | --- | --- | --- |
| Biru | <span style="color:#357CFF">●</span> | `#357CFF` | Metrik, bantuan, aksi sekunder |
| Hijau sukses | <span style="color:#149B72">●</span> | `#149B72` | Status berhasil, sinkronisasi, lengkap |
| Background sukses | <span style="color:#EAFAF3">●</span> | `#EAFAF3` | Badge dan status sukses |
| Oranye peringatan | <span style="color:#ED8B00">●</span> | `#ED8B00` | Metrik dan status peringatan |
| Background peringatan | <span style="color:#FFF8E9">●</span> | `#FFF8E9` | Badge peringatan |
| Background error | <span style="color:#FFF0F1">●</span> | `#FFF0F1` | Badge dan panel error |

## Pembagian per halaman

### Dashboard operator, guru, dan murid

Ketiga dashboard menggunakan identitas utama yang sama:

- Primary: `#BE101B`
- Primary gelap: `#A90C16`
- Teks utama: `#17233A`
- Teks sekunder: `#8290A7`
- Background: `#F5F7FB`

Perbedaan antardashboard terutama berada pada struktur layout dan prefix token CSS,
bukan pada warna identitas utamanya.

### Halaman login

Halaman login menggunakan variasi warna tambahan:

- Maroon utama: `#A00010`
- Navy teks: `#172033`
- Background lavender: `#F7F8FF`
- Background badge tahun ajaran: `#EDF1FF`
- Teks badge: `#34446F`
- Panel foto sekolah: `#493C38`

## Token CSS utama

Token dashboard didefinisikan pada:

- [`DashboardPage.css`](./frontend/src/pages/dashboard/DashboardPage.css)
- [`TeacherDashboardPage.css`](./frontend/src/pages/dashboard/teacher/TeacherDashboardPage.css)
- [`StudentDashboardPage.css`](./frontend/src/pages/dashboard/student/StudentDashboardPage.css)

Token global dan login didefinisikan pada:

- [`index.css`](./frontend/src/index.css)
- [`LoginPage.css`](./frontend/src/pages/loginpage/LoginPage.css)

> Catatan: stylesheet saat ini masih menggunakan banyak warna langsung di luar token CSS.
> Jika palet perlu dipelihara secara terpusat, warna-warna tersebut dapat dipindahkan ke
> custom properties global secara bertahap.
