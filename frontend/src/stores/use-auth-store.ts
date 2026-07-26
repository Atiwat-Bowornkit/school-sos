import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '@/apis/auth-api'
import type { AuthUser } from '@/apis/auth-api'

const TOKEN_KEY = 'school_sos_auth_token'
const USER_KEY = 'school_sos_auth_user'

export const useAuthStore = defineStore('AuthStore', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<AuthUser | null>(loadUserFromStorage())

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isResponder = computed(() => isLoggedIn.value && user.value?.role === 'responder')
  const displayName = computed(() => user.value?.displayName ?? '')

  function loadUserFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? JSON.parse(raw) : null
    }
    catch {
      return null
    }
  }

  function persistAuth(authToken: string, authUser: AuthUser) {
    token.value = authToken
    user.value = authUser
    localStorage.setItem(TOKEN_KEY, authToken)
    localStorage.setItem(USER_KEY, JSON.stringify(authUser))
  }

  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  async function login(username: string, password: string) {
    const response = await authApi.login({ username, password })
    persistAuth(response.data.token, response.data.user)
    return response.data.user
  }

  async function register(username: string, password: string, displayName: string, registrationKey: string) {
    const response = await authApi.register({ username, password, displayName, registrationKey })
    persistAuth(response.data.token, response.data.user)
    return response.data.user
  }

  function logout() {
    clearAuth()
  }

  function getToken(): string | null {
    return token.value
  }

  // Verify the stored token is still valid
  async function verifySession() {
    if (!token.value) {
      clearAuth()
      return false
    }
    try {
      await authApi.me(token.value)
      return true
    }
    catch {
      clearAuth()
      return false
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    isResponder,
    displayName,
    login,
    register,
    logout,
    getToken,
    verifySession,
  }
})
