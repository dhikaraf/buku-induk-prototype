-- ============================================================================
-- SKRIP DDL & SEED DATA: SISTEM INFORMASI BUKU INDUK SISWA (WEB INTRANET)
-- Mitra   : SDN Batu Ampar 12 Pagi, Kramat Jati, Jakarta Timur
-- Engine  : MySQL 8.0+ / MariaDB 10.4+ (InnoDB, utf8mb4)
-- Catatan : Skrip ini TIDAK berisi perintah CREATE DATABASE maupun USE.
--           Buat dan pilih database terlebih dahulu sebelum menjalankan/import.
-- ============================================================================

SET NAMES utf8mb4;
SET time_zone = '+07:00';
SET FOREIGN_KEY_CHECKS = 0;

-- Hapus tabel lama jika sudah ada (urutan anak ke induk)
DROP TABLE IF EXISTS `nilai_ekstrakurikuler`;
DROP TABLE IF EXISTS `profil_pancasila`;
DROP TABLE IF EXISTS `nilai_mapel`;
DROP TABLE IF EXISTS `rapor_capaian`;
DROP TABLE IF EXISTS `riwayat_keluar_siswa`;
DROP TABLE IF EXISTS `riwayat_masuk_siswa`;
DROP TABLE IF EXISTS `keluarga_siswa`;
DROP TABLE IF EXISTS `pengguna`;
DROP TABLE IF EXISTS `siswa`;

-- ============================================================================
-- 1. TABEL MASTER SISWA (Data Statis & Status Keaktifan)
-- ============================================================================
CREATE TABLE `siswa` (
  `nisn` VARCHAR(10) NOT NULL,
  `nis` VARCHAR(20) NOT NULL,
  `nik` VARCHAR(16) NOT NULL,
  `no_kk` VARCHAR(16) NOT NULL,
  `nama_lengkap` VARCHAR(100) NOT NULL,
  `nama_panggilan` VARCHAR(50) DEFAULT NULL,
  `jenis_kelamin` ENUM('L', 'P') NOT NULL,
  `tempat_lahir` VARCHAR(50) NOT NULL,
  `tanggal_lahir` DATE NOT NULL,
  `agama` VARCHAR(20) NOT NULL,
  `kewarganegaraan` VARCHAR(30) NOT NULL DEFAULT 'Indonesia',
  `jumlah_saudara` INT NOT NULL DEFAULT 0,
  `bahasa_sehari_hari` VARCHAR(50) DEFAULT NULL,
  `golongan_darah` VARCHAR(3) DEFAULT NULL,
  `alamat` TEXT NOT NULL,
  `nomor_telepon` VARCHAR(15) DEFAULT NULL,
  `bertempat_tinggal_pada` VARCHAR(100) DEFAULT NULL,
  `jarak_sekolah` VARCHAR(50) DEFAULT NULL,
  `status_siswa` ENUM('Aktif', 'Lulus', 'Pindah', 'Keluar') NOT NULL DEFAULT 'Aktif',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`nisn`),
  UNIQUE KEY `uq_siswa_nis` (`nis`),
  UNIQUE KEY `uq_siswa_nik` (`nik`),
  KEY `idx_siswa_nama` (`nama_lengkap`),
  KEY `idx_siswa_status` (`status_siswa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. TABEL PENGGUNA (Autentikasi & RBAC 3 Aktor: OPERATOR, GURU, SISWA)
-- ============================================================================
CREATE TABLE `pengguna` (
  `id_user` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('OPERATOR', 'GURU', 'SISWA') NOT NULL,
  `nama_lengkap` VARCHAR(100) NOT NULL,
  `nisn` VARCHAR(10) DEFAULT NULL COMMENT 'Diisi jika role = SISWA untuk mengikat akses read-only ke data siswa terkait',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `uq_pengguna_username` (`username`),
  UNIQUE KEY `uq_pengguna_nisn` (`nisn`),
  CONSTRAINT `fk_pengguna_siswa`
    FOREIGN KEY (`nisn`) REFERENCES `siswa` (`nisn`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. TABEL KELUARGA SISWA (Data Orang Tua Kandung & Wali)
-- ============================================================================
CREATE TABLE `keluarga_siswa` (
  `id_keluarga` INT NOT NULL AUTO_INCREMENT,
  `nisn` VARCHAR(10) NOT NULL,
  `nama_ayah` VARCHAR(100) NOT NULL,
  `pendidikan_ayah` VARCHAR(50) DEFAULT NULL,
  `pekerjaan_ayah` VARCHAR(50) DEFAULT NULL,
  `nama_ibu` VARCHAR(100) NOT NULL,
  `pendidikan_ibu` VARCHAR(50) DEFAULT NULL,
  `pekerjaan_ibu` VARCHAR(50) DEFAULT NULL,
  `nama_wali` VARCHAR(100) DEFAULT NULL,
  `hubungan_wali` VARCHAR(50) DEFAULT NULL,
  `pendidikan_wali` VARCHAR(50) DEFAULT NULL,
  `pekerjaan_wali` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`id_keluarga`),
  UNIQUE KEY `uq_keluarga_nisn` (`nisn`),
  CONSTRAINT `fk_keluarga_siswa`
    FOREIGN KEY (`nisn`) REFERENCES `siswa` (`nisn`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. TABEL RIWAYAT MASUK SISWA (Siswa Baru Asal TK / Siswa Pindahan)
-- ============================================================================
CREATE TABLE `riwayat_masuk_siswa` (
  `id_riwayat` INT NOT NULL AUTO_INCREMENT,
  `nisn` VARCHAR(10) NOT NULL,
  `status_masuk` ENUM('Baru', 'Pindahan') NOT NULL,
  `asal_tk_nama` VARCHAR(100) DEFAULT NULL,
  `tgl_sttb_tk` DATE DEFAULT NULL,
  `no_sttb_tk` VARCHAR(50) DEFAULT NULL,
  `asal_sekolah_pindahan` VARCHAR(100) DEFAULT NULL,
  `dari_tingkat` INT DEFAULT NULL,
  `tgl_diterima` DATE DEFAULT NULL,
  PRIMARY KEY (`id_riwayat`),
  UNIQUE KEY `uq_riwayat_masuk_nisn` (`nisn`),
  CONSTRAINT `fk_riwayat_masuk_siswa`
    FOREIGN KEY (`nisn`) REFERENCES `siswa` (`nisn`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. TABEL RIWAYAT KELUAR SISWA (Kelulusan Kelas 6 / Mutasi Pindah Keluar)
-- ============================================================================
CREATE TABLE `riwayat_keluar_siswa` (
  `id_riwayat_keluar` INT NOT NULL AUTO_INCREMENT,
  `nisn` VARCHAR(10) NOT NULL,
  `status_keluar` ENUM('Lulus', 'Pindah', 'Keluar') NOT NULL,
  `tanggal_keluar` DATE NOT NULL,
  `no_ijazah_sttb` VARCHAR(50) DEFAULT NULL,
  `sekolah_lanjutan_tujuan` VARCHAR(100) DEFAULT NULL,
  `alasan_keluar` TEXT DEFAULT NULL,
  PRIMARY KEY (`id_riwayat_keluar`),
  UNIQUE KEY `uq_riwayat_keluar_nisn` (`nisn`),
  CONSTRAINT `fk_riwayat_keluar_siswa`
    FOREIGN KEY (`nisn`) REFERENCES `siswa` (`nisn`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. TABEL RAPOR CAPAIAN (Header Rapor Per Semester & Rekap Presensi)
-- ============================================================================
CREATE TABLE `rapor_capaian` (
  `id_rapor` INT NOT NULL AUTO_INCREMENT,
  `nisn` VARCHAR(10) NOT NULL,
  `id_user` INT NOT NULL COMMENT 'ID Guru yang menginput/memverifikasi rapor',
  `kelas` VARCHAR(10) NOT NULL,
  `fase` ENUM('A', 'B', 'C') NOT NULL,
  `semester` ENUM('Ganjil', 'Genap') NOT NULL,
  `tahun_pelajaran` VARCHAR(10) NOT NULL,
  `absensi_sakit` INT NOT NULL DEFAULT 0,
  `absensi_izin` INT NOT NULL DEFAULT 0,
  `absensi_tanpa_ket` INT NOT NULL DEFAULT 0,
  `catatan_wali_kelas` TEXT DEFAULT NULL,
  `keputusan_akhir` VARCHAR(50) DEFAULT NULL COMMENT 'Contoh: Naik ke Kelas IV / Lulus',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_rapor`),
  UNIQUE KEY `uq_rapor_siswa_periode` (`nisn`, `semester`, `tahun_pelajaran`),
  KEY `idx_rapor_user` (`id_user`),
  CONSTRAINT `fk_rapor_siswa`
    FOREIGN KEY (`nisn`) REFERENCES `siswa` (`nisn`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_rapor_pengguna`
    FOREIGN KEY (`id_user`) REFERENCES `pengguna` (`id_user`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. TABEL NILAI MATA PELAJARAN (Kurikulum Merdeka)
-- ============================================================================
CREATE TABLE `nilai_mapel` (
  `id_nilai_mapel` INT NOT NULL AUTO_INCREMENT,
  `id_rapor` INT NOT NULL,
  `kategori_mapel` VARCHAR(50) NOT NULL COMMENT 'Wajib, Muatan Lokal, Pilihan',
  `nama_mapel` VARCHAR(100) NOT NULL,
  `nilai_akhir` INT NOT NULL,
  `capaian_kompetensi` TEXT DEFAULT NULL,
  PRIMARY KEY (`id_nilai_mapel`),
  KEY `idx_nilai_mapel_rapor` (`id_rapor`),
  CONSTRAINT `fk_nilai_mapel_rapor`
    FOREIGN KEY (`id_rapor`) REFERENCES `rapor_capaian` (`id_rapor`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. TABEL PROFIL PELAJAR PANCASILA / P5
-- ============================================================================
CREATE TABLE `profil_pancasila` (
  `id_profil` INT NOT NULL AUTO_INCREMENT,
  `id_rapor` INT NOT NULL,
  `dimensi` VARCHAR(100) NOT NULL,
  `elemen` VARCHAR(100) NOT NULL,
  `sub_elemen` VARCHAR(100) NOT NULL,
  `target_pencapaian` ENUM('BB', 'MB', 'BSH', 'SB') NOT NULL,
  PRIMARY KEY (`id_profil`),
  KEY `idx_p5_rapor` (`id_rapor`),
  CONSTRAINT `fk_p5_rapor`
    FOREIGN KEY (`id_rapor`) REFERENCES `rapor_capaian` (`id_rapor`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. TABEL NILAI EKSTRAKURIKULER (4 Rumpun Ekskul Sekolah)
-- ============================================================================
CREATE TABLE `nilai_ekstrakurikuler` (
  `id_ekskul` INT NOT NULL AUTO_INCREMENT,
  `id_rapor` INT NOT NULL,
  `rumpun_ekskul` ENUM('Krida', 'Karya Ilmiah', 'Latihan Olah Bakat dan Minat', 'Keagamaan') NOT NULL,
  `nama_ekskul` VARCHAR(100) NOT NULL,
  `predikat` ENUM('Sangat Baik', 'Baik', 'Cukup') NOT NULL,
  `keterangan` TEXT DEFAULT NULL,
  PRIMARY KEY (`id_ekskul`),
  KEY `idx_ekskul_rapor` (`id_rapor`),
  CONSTRAINT `fk_ekskul_rapor`
    FOREIGN KEY (`id_rapor`) REFERENCES `rapor_capaian` (`id_rapor`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- DATA AWAL (SEED DATA) UNTUK PENGUJIAN LOGIN & RELASI 3 AKTOR
-- Password default seluruh akun contoh di bawah adalah: "password"
-- (Hash Bcrypt 10 rounds: $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi)
-- ============================================================================

INSERT INTO `siswa` (
  `nisn`, `nis`, `nik`, `no_kk`, `nama_lengkap`, `nama_panggilan`, `jenis_kelamin`,
  `tempat_lahir`, `tanggal_lahir`, `agama`, `kewarganegaraan`, `jumlah_saudara`,
  `bahasa_sehari_hari`, `golongan_darah`, `alamat`, `nomor_telepon`,
  `bertempat_tinggal_pada`, `jarak_sekolah`, `status_siswa`
) VALUES (
  '0145678901', '2025001', '3175041205140001', '3175040101100001',
  'Ahmad Fauzan Pratama', 'Fauzan', 'L',
  'Jakarta', '2014-05-12', 'Islam', 'Indonesia', 1,
  'Bahasa Indonesia', 'O', 'Jl. Batu Ampar III RT.09/RW.03, Kramat Jati, Jakarta Timur', '081234567890',
  'Orang Tua Kandung', '500 meter', 'Aktif'
);

INSERT INTO `pengguna` (`username`, `password`, `role`, `nama_lengkap`, `nisn`) VALUES
('operator.sdn12', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'OPERATOR', 'Admin Operator SDN Batu Ampar 12 Pagi', NULL),
('guru.kelas4a', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'GURU', 'Siti Rahmawati, S.Pd.', NULL),
('0145678901', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'SISWA', 'Ahmad Fauzan Pratama', '0145678901');

INSERT INTO `keluarga_siswa` (
  `nisn`, `nama_ayah`, `pendidikan_ayah`, `pekerjaan_ayah`,
  `nama_ibu`, `pendidikan_ibu`, `pekerjaan_ibu`
) VALUES (
  '0145678901', 'Budi Santoso', 'S1', 'Karyawan Swasta',
  'Rina Marlina', 'SMA/SMK', 'Ibu Rumah Tangga'
);

INSERT INTO `riwayat_masuk_siswa` (
  `nisn`, `status_masuk`, `asal_tk_nama`, `tgl_sttb_tk`, `no_sttb_tk`, `tgl_diterima`
) VALUES (
  '0145678901', 'Baru', 'TK Islam Al-Azhar Batu Ampar', '2021-06-15', 'TK-2021-0891', '2021-07-12'
);
