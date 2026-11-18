import { request, json } from './apiClient.js'
export const siswaService = {
  list: (params = {}) => request(`/siswa?${new URLSearchParams(params)}`),
  detail: (nisn) => request(`/siswa/${encodeURIComponent(nisn)}`),
  create: (data) => request('/siswa', json('POST', data)),
  update: (nisn, data) => request(`/siswa/${encodeURIComponent(nisn)}`, json('PUT', data)),
  remove: (nisn) => request(`/siswa/${encodeURIComponent(nisn)}`, { method: 'DELETE' }),
  recordExit: (nisn, data) => request(`/siswa/${encodeURIComponent(nisn)}/keluar`, json('POST', data)),
  import: (file) => { const body = new FormData(); body.append('file', file); return request('/siswa/import', { method: 'POST', body }) },
}
