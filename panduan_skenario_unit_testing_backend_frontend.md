# Panduan & Skenario Unit Testing — Sistem Informasi Buku Induk Siswa

> Dokumen ini memuat standar, konfigurasi, matriks kasus uji (*test cases*), dan contoh kode *unit testing* untuk sisi **Backend** (`backend-buku-induk`) dan **Frontend** (`frontend`) pada proyek **Sistem Informasi Buku Induk Siswa Berbasis Web Intranet — SDN Batu Ampar 12 Pagi**.  
> **PIC Quality Assurance / Tester:** Daniel Ezra Tua Siboro & Diaz Wahyu Saputra (Kelompok 1)

---

## 1. Strategi & Prinsip Unit Testing

*Unit testing* bertujuan memverifikasi setiap unit terkecil dari kode (fungsi utilitas, *middleware* RBAC, *controller*, *custom hooks*, *API service*, dan komponen UI) secara terisolasi sebelum dilakukan pengujian integrasi penuh maupun *User Acceptance Test* (UAT) bersama pihak sekolah.

### Prinsip Pengujian:
1. **Isolasi Penuh (*Mocking*):** Pengujian *unit* di sisi *backend* tidak boleh mengubah data pada database produksi (`db_buku_induk_sdn12`); koneksi `mysql2/promise` harus di-*mock*. Di sisi *frontend*, seluruh pemanggilan `fetch` / `apiClient` harus di-*mock*.
2. **Penegakan Keamanan RBAC 3 Aktor:** Setiap skenario pengujian wajib memverifikasi pemisahan hak akses antara `OPERATOR`, `GURU`, dan `SISWA` (termasuk penguncian `nisn` pada portal mandiri).
3. **Target Cakupan (*Code Coverage*):** Minimal **80%** pada modul logika bisnis kritis (*middlewares*, *controllers*, *services*, dan *hooks*).

---

## 2. Unit Testing Sisi Backend (`backend-buku-induk`)

### 2.1 Stack & Konfigurasi Pengujian Backend

Pengujian *backend* menggunakan **Jest** sebagai *test runner* dan *assertion library*, serta **Supertest** untuk menguji lapisan *routing* dan *middleware* HTTP tanpa harus menjalankan *port* server secara nyata.

Instalasi dependensi pengujian pada direktori `backend-buku-induk`:

```bash
npm install --save-dev jest supertest
```

Tambahkan skrip berikut pada `backend-buku-induk/package.json`:

```json
{
  "scripts": {
    "test": "jest --runInBand",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### 2.2 Struktur Direktori Test Backend

```text
backend-buku-induk/
├── src/
│   ├── config/database.js
│   ├── middlewares/
│   ├── controllers/
│   └── routes/
└── tests/
    └── unit/
        ├── middlewares/
        │   ├── authMiddleware.test.js
        │   └── roleMiddleware.test.js
        ├── controllers/
        │   ├── authController.test.js
        │   ├── siswaController.test.js
        │   ├── raporController.test.js
        │   └── pdfController.test.js
        └── utils/
            └── validator.test.js
```

### 2.3 Matriks Skenario Unit Test Backend

| ID Test | Modul / Unit | Skenario Pengujian | Input / Kondisi | Ekspektasi Output |
| :--- | :--- | :--- | :--- | :--- |
| **UT-BE-01** | `authController` | Login berhasil dengan kredensial valid | `username` & `password` cocok dengan hash Bcrypt | Status `200`, mengembalikan JWT token berisi `id_user`, `role`, dan `nisn` |
| **UT-BE-02** | `authController` | Login gagal karena password salah | `username` valid, `password` tidak cocok | Status `401`, `status: "error"`, tidak mengeluarkan token |
| **UT-BE-03** | `authMiddleware` | Akses endpoint terproteksi tanpa/invalid token | Header `Authorization` kosong atau token kedaluwarsa | Status `401`, pesan *"Token tidak valid atau sesi berakhir"* |
| **UT-BE-04** | `roleMiddleware` | Pembatasan RBAC (Guru mencoba akses fitur Operator) | Token dengan `role: "GURU"` mengakses `POST /api/users` | Status `403 Forbidden`, akses ditolak |
| **UT-BE-05** | `portalController` | Penguncian data Portal Mandiri Siswa | Token `role: "SISWA"`, `nisn: "0184920115"` | Query SQL otomatis menggunakan `WHERE nisn = '0184920115'` dari JWT |
| **UT-BE-06** | `siswaController` | Validasi format NISN (10 digit) & NIK (16 digit) | `POST /api/siswa` dengan `nisn: "123"` (kurang dari 10 digit) | Status `400 Bad Request`, `errors` menunjuk field `nisn` |
| **UT-BE-07** | `siswaController` | Transaksi ACID simpan siswa baru berhasil | Payload lengkap `siswa`, `keluarga_siswa`, `riwayat_masuk_siswa` | Memanggil `beginTransaction()`, 3x `execute()`, dan `commit()` (`201 Created`) |
| **UT-BE-08** | `siswaController` | Rollback transaksi saat duplikasi NISN/NIS | Database melempar error `ER_DUP_ENTRY` pada `keluarga_siswa` | Memanggil `rollback()` dan mengembalikan status `409 Conflict` |
| **UT-BE-09** | `raporController` | Validasi input nilai mapel & skala P5 | `nilai_akhir: 105` atau `target_pencapaian: "XYZ"` | Status `400 Bad Request`, menolak nilai di luar `0-100` dan enum P5 (`BB/MB/BSH/SB`) |
| **UT-BE-10** | `pdfController` | Render dokumen Buku Induk PDF | `GET /api/buku-induk/0184920115/pdf` dengan data valid | Header `Content-Type: application/pdf`, buffer biner tidak kosong, waktu `< 5000ms` |

### 2.4 Contoh Implementasi Kode Unit Test Backend

#### A. Pengujian Middleware RBAC (`tests/unit/middlewares/roleMiddleware.test.js`)

```javascript
const { authorizeRoles } = require('../../../src/middlewares/roleMiddleware');

describe('Unit Test: roleMiddleware (RBAC 3 Aktor)', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('UT-BE-04a: Mengizinkan OPERATOR mengakses endpoint khusus admin', () => {
    req.user = { id_user: 1, role: 'OPERATOR', nisn: null };
    const middleware = authorizeRoles('OPERATOR');

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('UT-BE-04b: Menolak GURU mengakses endpoint khusus OPERATOR (403 Forbidden)', () => {
    req.user = { id_user: 2, role: 'GURU', nisn: null };
    const middleware = authorizeRoles('OPERATOR');

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: expect.stringMatching(/akses ditolak/i)
      })
    );
  });

  test('UT-BE-05: Menolak akses portal jika role SISWA tidak memiliki NISN terikat', () => {
    req.user = { id_user: 3, role: 'SISWA', nisn: null };
    const middleware = authorizeRoles('SISWA');

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
```

#### B. Pengujian Transaksi Database Siswa (`tests/unit/controllers/siswaController.test.js`)

```javascript
const db = require('../../../src/config/database');
const { createSiswa } = require('../../../src/controllers/siswaController');

jest.mock('../../../src/config/database');

describe('Unit Test: siswaController - Transaksi Simpan Siswa Baru', () => {
  let mockConnection, req, res;

  beforeEach(() => {
    mockConnection = {
      beginTransaction: jest.fn(),
      execute: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    db.getConnection = jest.fn().mockResolvedValue(mockConnection);

    req = {
      body: {
        nisn: '0184920115',
        nis: '252601001',
        nik: '3175041205180002',
        no_kk: '3175040101150009',
        nama_lengkap: 'Budi Santoso',
        jenis_kelamin: 'L',
        tempat_lahir: 'Jakarta',
        tanggal_lahir: '2018-05-12',
        agama: 'Islam',
        alamat: 'Jl. Batu Ampar III',
        nama_ayah: 'Hendra Santoso',
        nama_ibu: 'Rina Marlina',
        status_masuk: 'Baru',
        asal_tk_nama: 'TK Islam Al-Falah'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  test('UT-BE-07: Melakukan COMMIT transaksi jika seluruh tabel berhasil disimpan', async () => {
    mockConnection.execute.mockResolvedValue([{ affectedRows: 1 }]);

    await createSiswa(req, res);

    expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
    expect(mockConnection.execute).toHaveBeenCalledTimes(3); // siswa, keluarga, riwayat_masuk
    expect(mockConnection.commit).toHaveBeenCalledTimes(1);
    expect(mockConnection.rollback).not.toHaveBeenCalled();
    expect(mockConnection.release).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('UT-BE-08: Melakukan ROLLBACK dan merespons 409 jika terjadi duplikasi NISN', async () => {
    const dupError = new Error("Duplicate entry '0184920115' for key 'PRIMARY'");
    dupError.code = 'ER_DUP_ENTRY';
    mockConnection.execute.mockRejectedValueOnce(dupError);

    await createSiswa(req, res);

    expect(mockConnection.beginTransaction).toHaveBeenCalledTimes(1);
    expect(mockConnection.rollback).toHaveBeenCalledTimes(1);
    expect(mockConnection.commit).not.toHaveBeenCalled();
    expect(mockConnection.release).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(409);
  });
});
```

---

## 3. Unit Testing Sisi Frontend (`frontend`)

### 3.1 Stack & Konfigurasi Pengujian Frontend

Karena *frontend* dibangun menggunakan **React 19** dan **Vite 8**, pengujian unit menggunakan **Vitest** (kompatibel penuh dengan konfigurasi Vite) dan **React Testing Library** dengan lingkungan DOM simulasi `jsdom`.

Instalasi dependensi pengujian pada direktori `frontend`:

```powershell
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Perbarui konfigurasi `frontend/vite.config.js` untuk mendukung Vitest:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setupTests.js'
  }
});
```

Tambahkan skrip pada `frontend/package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 3.2 Struktur Direktori Test Frontend

```text
frontend/src/
└── __tests__/
    ├── setupTests.js                   # Import @testing-library/jest-dom & reset sessionStorage
    ├── hooks/
    │   └── useSessionState.test.js     # Pengujian persistensi navigasi tab
    ├── services/
    │   ├── apiClient.test.js           # Pengujian header JWT, handler 401, & blob PDF
    │   └── siswaService.test.js        # Pengujian kontrak payload master siswa
    └── components/
        ├── App.test.jsx                # Pengujian pemetaan role & pembersihan logout
        ├── LoginPage.test.jsx          # Pengujian form login, toggle sandi, & alert error
        └── SiswaFormModal.test.jsx     # Pengujian form kondisional status Baru vs Pindahan
```

### 3.3 Matriks Skenario Unit Test Frontend

| ID Test | Komponen / Modul | Skenario Pengujian | Aksi / Kondisi Uji | Ekspektasi Hasil UI / State |
| :--- | :--- | :--- | :--- | :--- |
| **UT-FE-01** | `useSessionState` | Menyimpan dan membaca state valid di `sessionStorage` | Set menu `"Data Induk Siswa"` pada key valid | Nilai tersimpan di `sessionStorage` dan bertahan saat hook di-render ulang |
| **UT-FE-02** | `useSessionState` | Fallback ke nilai awal jika nilai `sessionStorage` ilegal | Isi `sessionStorage` dengan `"Menu-Tidak-Valid"` | Hook mengembalikan `initialValue` (`"Dashboard"`) |
| **UT-FE-03** | `apiClient` | Injeksi otomatis header `Authorization: Bearer` | Panggil `apiClient('/siswa')` saat `sd-induk.token` ada | Request `fetch` menyertakan `Authorization: Bearer <token>` |
| **UT-FE-04** | `apiClient` | Penanganan otomatis sesi kedaluwarsa (`401`) | Server merespons status `401 Unauthorized` | Token di `sessionStorage` dihapus dan memicu callback *logout* |
| **UT-FE-05** | `apiClient` | Unduhan file biner PDF Buku Induk | Panggil `downloadPdf('/buku-induk/0184920115/pdf')` | Memanggil `response.blob()` tanpa error JSON parsing |
| **UT-FE-06** | `App.jsx` | Routing dashboard otomatis sesuai role JWT | Set `sd-induk.user` dengan `role: "GURU"` | Merender `TeacherDashboardPage`, bukan halaman login atau operator |
| **UT-FE-07** | `App.jsx` | Pembersihan seluruh kunci `sd-induk.*` saat Logout | Klik tombol **Keluar** pada shell dashboard | Seluruh kunci `sd-induk.token`, `sd-induk.user`, dan navigasi terhapus |
| **UT-FE-08** | `LoginPage.jsx` | Validasi input kosong & interaksi toggle sandi | Klik tombol lihat sandi, lalu submit form kosong | Tipe input berubah `password` $\rightarrow$ `text`; muncul pesan validasi |
| **UT-FE-09** | `LoginPage.jsx` | Menampilkan pesan error server pada `role="alert"` | `authService.login` melempar error *"Username atau sandi salah"* | Elemen `role="alert"` tampil dengan teks kesalahan dari backend |
| **UT-FE-10** | `SiswaFormModal` | Input kondisional Riwayat Masuk (`Baru` vs `Pindahan`) | Ubah pilihan `status_masuk` dari `"Baru"` ke `"Pindahan"` | Input TK tersembunyi; muncul input `asal_sekolah_pindahan` & `dari_tingkat` |

### 3.4 Contoh Implementasi Kode Unit Test Frontend

#### A. Pengujian Wrapper HTTP `apiClient.js` (`src/__tests__/services/apiClient.test.js`)

```javascript
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { apiRequest } from '../../services/apiClient';

describe('Unit Test: apiClient HTTP Wrapper', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  test('UT-FE-03: Menyertakan header Authorization Bearer token dari sessionStorage', async () => {
    sessionStorage.setItem('sd-induk.token', 'jwt-token-rahasia-123');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ status: 'success', data: [] })
    });

    await apiRequest('/siswa');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/siswa'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-token-rahasia-123'
        })
      })
    );
  });

  test('UT-FE-04: Menghapus sesi dan melempar error jika server merespons 401 Unauthorized', async () => {
    sessionStorage.setItem('sd-induk.token', 'token-expired');
    sessionStorage.setItem('sd-induk.user', JSON.stringify({ role: 'OPERATOR' }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' },
      json: async () => ({ status: 'error', message: 'Sesi berakhir' })
    });

    await expect(apiRequest('/siswa')).rejects.toThrow(/sesi berakhir/i);
    expect(sessionStorage.getItem('sd-induk.token')).toBeNull();
    expect(sessionStorage.getItem('sd-induk.user')).toBeNull();
  });
});
```

#### B. Pengujian Komponen `LoginPage.jsx` (`src/__tests__/components/LoginPage.test.jsx`)

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import LoginPage from '../../pages/loginpage/LoginPage';
import * as authService from '../../services/authService';

describe('Unit Test: Komponen LoginPage', () => {
  test('UT-FE-08: Tombol tampil/sembunyikan kata sandi mengubah atribut tipe input', async () => {
    const user = userEvent.setup();
    render(<LoginPage onLoginSuccess={vi.fn()} />);

    const passwordInput = screen.getByLabelText(/kata sandi|password/i);
    const toggleButton = screen.getByRole('button', { name: /tampilkan|lihat sandi/i });

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('UT-FE-09: Menampilkan pesan kesalahan pada role="alert" ketika autentikasi gagal', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'login').mockRejectedValueOnce(
      new Error('Username atau kata sandi tidak sesuai.')
    );

    render(<LoginPage onLoginSuccess={vi.fn()} />);

    await user.type(screen.getByLabelText(/username/i), 'operator_salah');
    await user.type(screen.getByLabelText(/kata sandi|password/i), 'salah123');
    await user.click(screen.getByRole('button', { name: /masuk|login/i }));

    const alertBox = await screen.findByRole('alert');
    expect(alertBox).toHaveTextContent('Username atau kata sandi tidak sesuai.');
  });
});
```

---

## 4. Checklist Eksekusi & Kriteria Kelulusan QA

Sebelum kode digabungkan (*merge*) ke cabang utama untuk pengujian integrasi dan UAT bersama SDN Batu Ampar 12 Pagi, tim pengembang dan QA wajib memastikan checklist berikut terpenuhi:

- [ ] Seluruh *test suite* backend (`npm test` di `backend-buku-induk`) lulus **100% PASS** tanpa *unhandled promise rejection*.
- [ ] Seluruh *test suite* frontend (`npm test` di `frontend`) lulus **100% PASS** dan tidak ada *warning* aksesibilitas pada query React Testing Library.
- [ ] Linter frontend (`npm run lint`) dan build produksi (`npm run build`) berjalan bersih tanpa error.
- [ ] Skenario keamanan **UT-BE-04** (RBAC antar-peran) dan **UT-BE-05** (isolasi data `nisn` siswa) terbukti lulus pada setiap pembaruan *endpoint*.