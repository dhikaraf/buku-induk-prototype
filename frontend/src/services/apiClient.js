const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
export class ApiError extends Error {
  constructor(message, status, errors = []) { super(message); this.status = status; this.errors = errors }
}
export async function request(path, options = {}) {
  const token = sessionStorage.getItem('sd-induk.token')
  const headers = new Headers(options.headers || {})
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!response.ok) {
    let result = {}
    try { result = await response.json() } catch { /* non-JSON error */ }
    if (response.status === 401) window.dispatchEvent(new Event('sd-induk:unauthorized'))
    throw new ApiError(result.message || `Permintaan gagal (${response.status}).`, response.status, result.errors || [])
  }
  if (options.responseType === 'blob') return response.blob()
  if (response.status === 204) return null
  const result = await response.json()
  return result.data ?? result
}
export const json = (method, data) => ({ method, body: JSON.stringify(data) })
