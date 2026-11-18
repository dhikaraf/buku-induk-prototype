import { request, json } from './apiClient.js'
export const raporService = {
  byStudent: (nisn) => request(`/rapor/siswa/${encodeURIComponent(nisn)}`),
  detail: (id) => request(`/rapor/${id}`),
  create: (data) => request('/rapor', json('POST', data)),
  update: (id, data) => request(`/rapor/${id}`, json('PUT', data)),
  saveItems: (id, type, items) => request(`/rapor/${id}/${type}`, json('POST', items)),
}
