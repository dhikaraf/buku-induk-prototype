import { request, json } from './apiClient.js'
export const authService = {
  login: (data) => request('/auth/login', json('POST', data)),
  me: () => request('/auth/me'),
  changePassword: (data) => request('/auth/password', json('PUT', data)),
}
