export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

function getAuthToken(): string | null {
  try {
    return localStorage.getItem('school_sos_auth_token')
  }
  catch {
    return null
  }
}

export async function request<T>(url: string, init: RequestInit = {}, timeoutMs = 20_000): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  const headers = new Headers(init.headers)

  // Add auth token if available
  const token = getAuthToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (init.body && !headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json')

  let res: Response
  try {
    res = await fetch(url, { ...init, headers, signal: init.signal ?? controller.signal })
  }
  catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw new ApiError('การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่', 408)
    throw new ApiError('ไม่สามารถเชื่อมต่อ Backend ได้ กรุณาลองใหม่', 0)
  }
  finally {
    window.clearTimeout(timer)
  }

  // Handle 401 — clear stored token
  if (res.status === 401) {
    localStorage.removeItem('school_sos_auth_token')
    localStorage.removeItem('school_sos_auth_user')
  }

  const contentType = res.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')

  if (!res.ok) {
    if (isJson) {
      const err = await res.json().catch(() => null) as { error?: { message?: string } } | null
      throw new ApiError(err?.error?.message ?? `HTTP ${res.status}`, res.status)
    }
    throw new ApiError(`HTTP ${res.status} — Backend ตอบกลับในรูปแบบที่ไม่รองรับ`, res.status)
  }

  if (!isJson)
    throw new ApiError('Backend ตอบกลับในรูปแบบที่ไม่รองรับ', res.status)

  return res.json()
}
