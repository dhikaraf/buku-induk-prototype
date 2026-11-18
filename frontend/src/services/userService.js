import { request, json } from './apiClient.js'
export const userService = {
  list: () => request('/users'),
  create: (data) => request('/users', json('POST', data)),
  update: (id, data) => request(`/users/${id}`, json('PUT', data)),
  remove: (id) => request(`/users/${id}`, { method: 'DELETE' }),
}
