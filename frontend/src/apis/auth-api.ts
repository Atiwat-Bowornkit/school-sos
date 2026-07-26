import { request } from './request'

export interface LoginBody {
  username: string
  password: string
}

export interface RegisterBody {
  username: string
  password: string
  displayName: string
  registrationKey: string
}

export interface AuthUser {
  id: string
  username: string
  displayName: string
  role: string
}

export interface AuthResponse {
  data: {
    token: string
    user: AuthUser
  }
}

export interface MeResponse {
  data: {
    id: string
    username: string
    role: string
  }
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787').replace(/\/$/, '')
const BASE = `${BACKEND_URL}/api/v1/auth`

export const authApi = {
  login: (body: LoginBody) =>
    request<AuthResponse>(`${BASE}/login`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  register: (body: RegisterBody) =>
    request<AuthResponse>(`${BASE}/register`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: (token: string) =>
    request<MeResponse>(`${BASE}/me`, {
      headers: authHeaders(token),
    }),
}
