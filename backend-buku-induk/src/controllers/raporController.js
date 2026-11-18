const db = require('../config/database');
const { success, fail } = require('../utils/http');
const headerFields = ['nisn','id_user','kelas','fase','semester','tahun_pelajaran','absensi_sakit','absensi_izin','absensi_tanpa_ket','catatan_wali_kelas','keputusan_akhir'];
const tables = { mapel: ['nilai_mapel',['kategori_mapel','nama_mapel','nilai_akhir','capaian_kompetensi'],'id_nilai_mapel'], p5: ['profil_pancasila',['dimensi','elemen','sub_elemen','target_pencapaian'],'id_profil'], ekskul: ['nilai_ekstrakurikuler',['rumpun_ekskul','nama_ekskul','predikat','keterangan'],'id_ekskul'] };

async function listByStudent(req, res) {
  const [rows] = await db.execute('SELECT * FROM rapor_capaian WHERE nisn=? ORDER BY kelas, tahun_pelajaran, semester', [req.params.nisn]);
  return success(res, rows);
}
async function detail(req, res) {
  const [rows] = await db.execute('SELECT * FROM rapor_capaian WHERE id_rapor=?', [req.params.id_rapor]);
  if (!rows.length) return fail(res, 404, 'Rapor tidak ditemukan.');
  const rapor = rows[0];
  const [[mapel],[p5],[ekskul]] = await Promise.all([
    db.execute('SELECT * FROM nilai_mapel WHERE id_rapor=? ORDER BY id_nilai_mapel', [rapor.id_rapor]),
    db.execute('SELECT * FROM profil_pancasila WHERE id_rapor=? ORDER BY id_profil', [rapor.id_rapor]),
    db.execute('SELECT * FROM nilai_ekstrakurikuler WHERE id_rapor=? ORDER BY id_ekskul', [rapor.id_rapor])
  ]);
  return success(res, { ...rapor, nilai_mapel: mapel, profil_pancasila: p5, nilai_ekstrakurikuler: ekskul });
}
async function create(req, res) {
  const data = { ...(req.body || {}), id_user: req.user.id_user }; const errors = [];
  for (const field of ['nisn','kelas','fase','semester','tahun_pelajaran']) if (!data[field]) errors.push({ field, detail: `${field} wajib diisi.` });
  if (!['A','B','C'].includes(data.fase)) errors.push({ field:'fase', detail:'Fase harus A, B, atau C.' });
  if (!['Ganjil','Genap'].includes(data.semester)) errors.push({ field:'semester', detail:'Semester harus Ganjil atau Genap.' });
  if (errors.length) return fail(res, 400, 'Validasi rapor gagal.', errors);
  const cols = headerFields.filter((field) => data[field] !== undefined);
  const [result] = await db.execute(`INSERT INTO rapor_capaian (${cols.map((f)=>`\`${f}\``).join(',')}) VALUES (${cols.map(()=>'?').join(',')})`, cols.map((f)=>data[f]));
  return success(res, { id_rapor: result.insertId }, 'Header rapor berhasil dibuat.', 201);
}
async function update(req, res) {
  const allowed = headerFields.filter((f) => !['nisn','id_user'].includes(f)); const cols = allowed.filter((f)=>req.body?.[f] !== undefined);
  if (!cols.length) return fail(res, 400, 'Tidak ada field rapor yang dapat diperbarui.');
  const [result] = await db.execute(`UPDATE rapor_capaian SET ${cols.map((f)=>`\`${f}\`=?`).join(',')} WHERE id_rapor=?`, [...cols.map((f)=>req.body[f]), req.params.id_rapor]);
  if (!result.affectedRows) return fail(res, 404, 'Rapor tidak ditemukan.');
  return success(res, { id_rapor: Number(req.params.id_rapor) }, 'Rapor berhasil diperbarui.');
}
async function saveItems(req, res, type) {
  const [table, allowed] = tables[type]; const rows = Array.isArray(req.body?.data) ? req.body.data : (Array.isArray(req.body) ? req.body : [req.body || {}]);
  if (!rows.length) return fail(res, 400, 'Data item wajib diisi.');
  if (type === 'mapel' && rows.some((r)=>!r.nama_mapel || !r.kategori_mapel || !Number.isInteger(Number(r.nilai_akhir)) || Number(r.nilai_akhir)<0 || Number(r.nilai_akhir)>100)) return fail(res, 400, 'Nilai mapel harus bilangan bulat 0 sampai 100 dan nama serta kategori wajib diisi.');
  if (type === 'p5' && rows.some((r)=>!['BB','MB','BSH','SB'].includes(r.target_pencapaian))) return fail(res, 400, 'Target pencapaian P5 harus BB, MB, BSH, atau SB.');
  if (type === 'ekskul' && rows.some((r)=>!['Krida','Karya Ilmiah','Latihan Olah Bakat dan Minat','Keagamaan'].includes(r.rumpun_ekskul) || !['Sangat Baik','Baik','Cukup'].includes(r.predikat))) return fail(res, 400, 'Rumpun atau predikat ekstrakurikuler tidak valid.');
  const [headers] = await db.execute('SELECT id_rapor FROM rapor_capaian WHERE id_rapor=?', [req.params.id_rapor]);
  if (!headers.length) return fail(res, 404, 'Rapor tidak ditemukan.');
  const conn=await db.getConnection();
  try { await conn.beginTransaction(); const saved=[];
    for (const item of rows) {
      const values = allowed.map((field)=>item[field] ?? null); const idField = tables[type][2]; const existingId = item[idField];
      if (existingId) {
        const updateFields=allowed.filter((field)=>item[field] !== undefined);
        const [result]=await conn.execute(`UPDATE ${table} SET ${updateFields.map((f)=>`\`${f}\`=?`).join(',')} WHERE ${idField}=? AND id_rapor=?`, [...updateFields.map((f)=>item[f]),existingId,req.params.id_rapor]);
        if (!result.affectedRows) throw Object.assign(new Error('Item rapor tidak ditemukan.'), { status:404 }); saved.push(existingId);
      } else {
        const [result]=await conn.execute(`INSERT INTO ${table} (id_rapor,${allowed.map((f)=>`\`${f}\``).join(',')}) VALUES (${[req.params.id_rapor,...values].map(()=>'?').join(',')})`,[req.params.id_rapor,...values]); saved.push(result.insertId);
      }
    }
    await conn.commit(); return success(res,{items:saved},'Data rapor berhasil disimpan.');
  } catch(error) { await conn.rollback(); if(error.status) return fail(res,error.status,error.message); throw error; } finally { conn.release(); }
}
module.exports = { listByStudent, detail, create, update, saveItems };
