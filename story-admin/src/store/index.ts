import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '@/api'
import type { AdminUser } from '@/types'

export const useAdminStore = defineStore('admin', () => {
  const token = ref<string>(localStorage.getItem('admin_token') || '')
  const userInfo = ref<AdminUser | null>(null)

  async function login(username: string, password: string) {
    const res = await authApi.login(username, password)
    token.value = res.token
    userInfo.value = res.userInfo as AdminUser
    localStorage.setItem('admin_token', res.token)
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('admin_token')
  }

  return { token, userInfo, login, logout }
})
