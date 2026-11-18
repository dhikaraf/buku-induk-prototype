import { request } from './apiClient.js'
export const portalService = {
  profile: () => request('/portal/profil'),
  reports: () => request('/portal/rapor'),
  downloadBook: () => request('/portal/cetak-pdf', { responseType: 'blob' }),
  downloadStudentBook: (nisn) => request(`/buku-induk/${encodeURIComponent(nisn)}/pdf`, { responseType: 'blob' }),
  backup: () => request('/system/backup-sql', { responseType: 'blob' }),
}
