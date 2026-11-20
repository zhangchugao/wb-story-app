import axios, { type AxiosInstance } from 'axios'
import type { ApiResult } from '@/types'
import { ElMessage } from 'element-plus'

const http: AxiosInstance = axios.create({
  baseURL: '/api/admin',
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResult<unknown>
    if (body.code === 0) return body.data as never
    ElMessage.error(body.message || '请求失败')
    return Promise.reject(new Error(body.message))
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      if (location.hash !== '#/login') location.hash = '#/login'
    }
    ElMessage.error(error.response?.data?.message || '网络错误，请稍后重试')
    return Promise.reject(error)
  },
)

export const authApi = {
  login: (username: string, password: string) =>
    http.post<never, { token: string; userInfo: unknown }>('/login', { username, password }),
  check: () => http.get<never, { valid: boolean }>('/check'),
}

export const statsApi = {
  get: () => http.get<never, import('@/types').Stats>('/stats'),
}

export const storyApi = {
  list: (params: Record<string, unknown>) =>
    http.get<never, import('@/types').PageData<import('@/types').Story>>('/stories', { params }),
  create: (data: import('@/types').StoryPayload) => http.post<never, import('@/types').Story>('/stories', data),
  update: (id: number, data: Partial<import('@/types').StoryPayload>) =>
    http.put<never, import('@/types').Story>(`/stories/${id}`, data),
  remove: (id: number) => http.delete<never, { deleted: boolean }>(`/stories/${id}`),
  setStatus: (id: number, status: number) =>
    http.post<never, import('@/types').Story>(`/stories/${id}/status`, { status }),
  episodes: (storyId: number) => http.get<never, import('@/types').Episode[]>(`/stories/${storyId}/episodes`),
  addEpisode: (storyId: number, data: Record<string, unknown>) =>
    http.post<never, import('@/types').Episode>(`/stories/${storyId}/episodes`, data),
  updateEpisode: (id: number, data: Record<string, unknown>) =>
    http.put<never, import('@/types').Episode>(`/episodes/${id}`, data),
  removeEpisode: (id: number) => http.delete<never, { deleted: boolean }>(`/episodes/${id}`),
}

export const categoryApi = {
  list: () => http.get<never, import('@/types').Category[]>('/categories'),
  create: (data: Record<string, unknown>) => http.post<never, import('@/types').Category>('/categories', data),
  update: (id: number, data: Record<string, unknown>) =>
    http.put<never, import('@/types').Category>(`/categories/${id}`, data),
  remove: (id: number) => http.delete<never, { deleted: boolean }>(`/categories/${id}`),
}

export const hotKeywordApi = {
  list: () => http.get<never, import('@/types').HotKeyword[]>('/hot-keywords'),
  create: (data: Record<string, unknown>) => http.post<never, import('@/types').HotKeyword>('/hot-keywords', data),
  remove: (id: number) => http.delete<never, { deleted: boolean }>(`/hot-keywords/${id}`),
}

export const userApi = {
  list: (params: Record<string, unknown>) =>
    http.get<never, import('@/types').PageData<import('@/types').UserItem>>('/users', { params }),
}

export const uploadApi = {
  audio: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return http.post<never, { url: string; filename: string }>('/upload/audio', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  image: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return http.post<never, { url: string; filename: string }>('/upload/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export default http
