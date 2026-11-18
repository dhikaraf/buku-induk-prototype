import React from 'react'
import { X } from 'lucide-react'
import './formDialog.css'

function Field({ label, name, type = 'text', defaultValue, required = false, disabled = false, ...props }) {
  return <label>{label}<input name={name} type={type} defaultValue={defaultValue ?? ''} required={required} disabled={disabled} {...props}/></label>
}

function SelectField({ label, name, options, defaultValue = '', required = false }) {
  return <label>{label}<select name={name} defaultValue={defaultValue} required={required}>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
}

const statusOptions = [['Aktif', 'Aktif'], ['Lulus', 'Lulus'], ['Pindah', 'Pindah'], ['Keluar', 'Keluar']]
const categoryOptions = [['Wajib', 'Wajib'], ['Agama Adaptif', 'Agama Adaptif'], ['Seni Budaya', 'Seni Budaya'], ['Muatan Lokal', 'Muatan Lokal']]
const extracurricularOptions = [['Krida', 'Krida'], ['Karya Ilmiah', 'Karya Ilmiah'], ['Latihan Olah Bakat dan Minat', 'Latihan Olah Bakat dan Minat'], ['Keagamaan', 'Keagamaan']]

export default function FormDialog({ type, onClose, onSubmit, busy, student, account }) {
  const submit = (event) => {
    event.preventDefault()
    onSubmit(Object.fromEntries(new FormData(event.currentTarget).entries()))
  }
  const title = { student: 'Tambah data siswa', studentEdit: 'Ubah data siswa', account: 'Buat akun pengguna', accountEdit: 'Ubah akun pengguna', grade: 'Input nilai rapor', exit: 'Catat siswa keluar', security: 'Ubah kata sandi' }[type]
  const isStudent = type === 'student' || type === 'studentEdit'
  const isAccount = type === 'account' || type === 'accountEdit'

  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="form-modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="modal-heading"><div><span className="eyebrow muted">BUKU INDUK DIGITAL</span><h2 id="dialog-title">{title}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Tutup"><X size={19}/></button></div>
      <form className="modal-form" onSubmit={submit}>
        {isStudent && <div className="form-grid">
          <Field label="NISN" name="nisn" inputMode="numeric" maxLength="10" defaultValue={student?.nisn} disabled={type === 'studentEdit'} required/>
          <Field label="NIS" name="nis" defaultValue={student?.nis} required/>
          <Field label="NIK" name="nik" inputMode="numeric" maxLength="16" defaultValue={student?.nik} required/>
          <Field label="Nomor kartu keluarga" name="no_kk" inputMode="numeric" maxLength="16" defaultValue={student?.no_kk} required/>
          <Field label="Nama lengkap" name="nama_lengkap" defaultValue={student?.nama_lengkap} required/>
          <Field label="Nama panggilan" name="nama_panggilan" defaultValue={student?.nama_panggilan}/>
          <SelectField label="Jenis kelamin" name="jenis_kelamin" defaultValue={student?.jenis_kelamin || ''} required options={ [['', 'Pilih'], ['L', 'Laki-laki'], ['P', 'Perempuan']] }/>
          <Field label="Tempat lahir" name="tempat_lahir" defaultValue={student?.tempat_lahir} required/>
          <Field label="Tanggal lahir" name="tanggal_lahir" type="date" defaultValue={student?.tanggal_lahir?.slice(0, 10)} required/>
          <Field label="Agama" name="agama" defaultValue={student?.agama} required/>
          <Field label="Kewarganegaraan" name="kewarganegaraan" defaultValue={student?.kewarganegaraan || 'Indonesia'} required/>
          <Field label="Jumlah saudara" name="jumlah_saudara" type="number" min="0" defaultValue={student?.jumlah_saudara ?? 0}/>
          <Field label="Bahasa sehari-hari" name="bahasa_sehari_hari" defaultValue={student?.bahasa_sehari_hari}/>
          <SelectField label="Golongan darah" name="golongan_darah" defaultValue={student?.golongan_darah || ''} options={ [['', 'Tidak diketahui'], ['A', 'A'], ['B', 'B'], ['AB', 'AB'], ['O', 'O']] }/>
          <Field label="Nomor telepon" name="nomor_telepon" defaultValue={student?.nomor_telepon}/>
          <Field label="Bertempat tinggal pada" name="bertempat_tinggal_pada" defaultValue={student?.bertempat_tinggal_pada}/>
          <Field label="Jarak ke sekolah" name="jarak_sekolah" defaultValue={student?.jarak_sekolah}/>
          <SelectField label="Status siswa" name="status_siswa" defaultValue={student?.status_siswa || 'Aktif'} options={statusOptions}/>
          <Field label="Alamat lengkap" name="alamat" defaultValue={student?.alamat} required/>
          <h3 className="form-section-title">Orang tua dan wali</h3>
          <Field label="Nama ayah" name="nama_ayah" defaultValue={student?.nama_ayah} required/>
          <Field label="Pendidikan ayah" name="pendidikan_ayah" defaultValue={student?.pendidikan_ayah}/>
          <Field label="Pekerjaan ayah" name="pekerjaan_ayah" defaultValue={student?.pekerjaan_ayah}/>
          <Field label="Nama ibu" name="nama_ibu" defaultValue={student?.nama_ibu} required/>
          <Field label="Pendidikan ibu" name="pendidikan_ibu" defaultValue={student?.pendidikan_ibu}/>
          <Field label="Pekerjaan ibu" name="pekerjaan_ibu" defaultValue={student?.pekerjaan_ibu}/>
          <Field label="Nama wali (opsional)" name="nama_wali" defaultValue={student?.nama_wali}/>
          <Field label="Hubungan dengan wali" name="hubungan_wali" defaultValue={student?.hubungan_wali}/>
          <Field label="Pendidikan wali" name="pendidikan_wali" defaultValue={student?.pendidikan_wali}/>
          <Field label="Pekerjaan wali" name="pekerjaan_wali" defaultValue={student?.pekerjaan_wali}/>
          <h3 className="form-section-title">Riwayat masuk</h3>
          <SelectField label="Status masuk" name="status_masuk" defaultValue={student?.status_masuk || 'Baru'} options={ [['Baru', 'Siswa baru'], ['Pindahan', 'Siswa pindahan']] }/>
          <Field label="Asal TK" name="asal_tk_nama" defaultValue={student?.asal_tk_nama}/>
          <Field label="Tanggal STTB TK" name="tgl_sttb_tk" type="date" defaultValue={student?.tgl_sttb_tk?.slice(0, 10)}/>
          <Field label="Nomor STTB TK" name="no_sttb_tk" defaultValue={student?.no_sttb_tk}/>
          <Field label="Asal sekolah pindahan" name="asal_sekolah_pindahan" defaultValue={student?.asal_sekolah_pindahan}/>
          <Field label="Dari tingkat" name="dari_tingkat" defaultValue={student?.dari_tingkat}/>
          <Field label="Tanggal diterima" name="tgl_diterima" type="date" defaultValue={student?.tgl_diterima?.slice(0, 10)}/>
          {type === 'student' && <label className="check-field"><input type="checkbox" name="buat_akun"/> Buat akun siswa otomatis</label>}
        </div>}
        {isAccount && <div className="form-grid">
          <Field label="Nama lengkap" name="nama_lengkap" defaultValue={account?.nama_lengkap} required/>
          {type === 'account' && <Field label="Username" name="username" required/>}
          <Field label={type === 'accountEdit' ? 'Kata sandi baru (opsional)' : 'Kata sandi awal'} name="password" type="password" minLength="8" required={type === 'account'}/>
          <SelectField label="Role" name="role" defaultValue={account?.role || 'GURU'} options={ [['GURU', 'Guru'], ['SISWA', 'Siswa'], ['OPERATOR', 'Operator']] }/>
          <Field label="NISN (khusus akun siswa)" name="nisn" inputMode="numeric" maxLength="10" defaultValue={account?.nisn}/>
        </div>}
        {type === 'grade' && <div className="form-grid">
          <Field label="NISN siswa" name="nisn" defaultValue={student?.nisn} required/><Field label="Kelas" name="kelas" required/>
          <SelectField label="Fase" name="fase" options={ [['A','A'],['B','B'],['C','C']] }/><SelectField label="Semester" name="semester" options={ [['Ganjil','Ganjil'],['Genap','Genap']] }/>
          <Field label="Tahun pelajaran" name="tahun_pelajaran" placeholder="2026/2027" required/><SelectField label="Kategori mapel" name="kategori_mapel" options={categoryOptions}/>
          <Field label="Mata pelajaran" name="nama_mapel" required/><Field label="Nilai akhir" name="nilai_akhir" type="number" min="0" max="100" required/>
          <Field label="Capaian kompetensi" name="capaian_kompetensi"/><label className="form-wide">Mapel tambahan<textarea name="mapel_tambahan" rows="3" placeholder="Nama mapel | Kategori | Nilai | Capaian (satu per baris)"/></label>
          <Field label="Dimensi P5" name="dimensi"/><Field label="Elemen P5" name="elemen"/><Field label="Sub-elemen P5" name="sub_elemen"/>
          <SelectField label="Target P5" name="target_pencapaian" options={ [['','Tidak diisi'],['BB','BB'],['MB','MB'],['BSH','BSH'],['SB','SB']] }/>
          <label className="form-wide">Capaian P5 tambahan<textarea name="p5_tambahan" rows="2" placeholder="Dimensi | Elemen | Sub-elemen | BB/MB/BSH/SB (satu per baris)"/></label>
          <Field label="Nama ekstrakurikuler" name="nama_ekskul"/><SelectField label="Rumpun ekskul" name="rumpun_ekskul" options={extracurricularOptions}/>
          <SelectField label="Predikat ekskul" name="predikat" options={ [['','Tidak diisi'],['Sangat Baik','Sangat Baik'],['Baik','Baik'],['Cukup','Cukup']] }/>
          <Field label="Keterangan ekskul" name="keterangan"/><label className="form-wide">Ekstrakurikuler tambahan<textarea name="ekskul_tambahan" rows="2" placeholder="Rumpun | Nama | Predikat | Keterangan (satu per baris)"/></label>
          <Field label="Sakit" name="absensi_sakit" type="number" min="0" defaultValue="0"/><Field label="Izin" name="absensi_izin" type="number" min="0" defaultValue="0"/><Field label="Tanpa keterangan" name="absensi_tanpa_ket" type="number" min="0" defaultValue="0"/>
          <Field label="Keputusan akhir" name="keputusan_akhir"/><label className="form-wide">Catatan wali kelas<textarea name="catatan_wali_kelas" rows="2"/></label>
        </div>}
        {type === 'exit' && <div className="form-grid"><Field label="Siswa" name="nama" defaultValue={student?.nama_lengkap} disabled/><SelectField label="Status keluar" name="status_keluar" options={ [['Lulus','Lulus'],['Pindah','Pindah'],['Keluar','Keluar']] }/><Field label="Tanggal keluar" name="tanggal_keluar" type="date" required/><Field label="Nomor ijazah/STTB" name="no_ijazah_sttb"/><Field label="Sekolah lanjutan" name="sekolah_lanjutan_tujuan"/><Field label="Alasan keluar" name="alasan_keluar"/></div>}
        {type === 'security' && <div className="form-grid"><Field label="Kata sandi saat ini" name="password_lama" type="password" minLength="8" required/><Field label="Kata sandi baru" name="password_baru" type="password" minLength="8" required/></div>}
        <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Batal</button><button className="primary-button" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button></div>
      </form>
    </section>
  </div>
}
