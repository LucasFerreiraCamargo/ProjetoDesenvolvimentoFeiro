const API_BASE = (process.env.EXPO_PUBLIC_API_URL as string) || 'http://localhost:3001'

export async function adminFetch(
  path: string,
  options?: RequestInit,
  token?: string
) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const response = await fetch(`${API_BASE.replace(/\/$/, '')}${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers || {}) },
  })
  return response
}
