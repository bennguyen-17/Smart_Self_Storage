import { useState, useEffect } from "react"

export interface StoredUser {
  id?: string
  fullName?: string
  phoneNumber?: string
  role?: string
  isVerified?: boolean
  status?: string
  [key: string]: any
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  let token = localStorage.getItem("token") || sessionStorage.getItem("token")
  if (!token) {
    try {
      const rawAuth = localStorage.getItem("auth_session") || sessionStorage.getItem("auth_session")
      if (rawAuth) {
        const parsed = JSON.parse(rawAuth)
        token = parsed?.token || null
      }
    } catch {
      // ignore
    }
  }
  return token
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null
  try {
    const u = localStorage.getItem("user") || sessionStorage.getItem("user")
    if (u) return JSON.parse(u)

    const rawAuth = localStorage.getItem("auth_session") || sessionStorage.getItem("auth_session")
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth)
      if (parsed?.user) return parsed.user
    }
  } catch {
    // ignore
  }
  return null
}

export function clearAuthData() {
  if (typeof window === "undefined") return
  localStorage.removeItem("token")
  sessionStorage.removeItem("token")
  localStorage.removeItem("user")
  sessionStorage.removeItem("user")
  localStorage.removeItem("auth_session")
  sessionStorage.removeItem("auth_session")
}

export function useAuthSession() {
  const [token, setToken] = useState<string | null>(getStoredToken)
  const [user, setUser] = useState<StoredUser | null>(getStoredUser)

  useEffect(() => {
    const syncAuth = () => {
      setToken(getStoredToken())
      setUser(getStoredUser())
    }

    window.addEventListener("storage", syncAuth)
    window.addEventListener("focus", syncAuth)

    return () => {
      window.removeEventListener("storage", syncAuth)
      window.removeEventListener("focus", syncAuth)
    }
  }, [])

  const logout = () => {
    clearAuthData()
    setToken(null)
    setUser(null)
    window.location.reload()
  }

  return {
    token,
    user,
    isAuthenticated: Boolean(token),
    logout,
  }
}
