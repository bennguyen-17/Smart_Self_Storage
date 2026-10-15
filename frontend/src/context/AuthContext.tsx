/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import type { AuthUser } from "@/features/auth/authApi"
import { isTokenValid } from "@/lib/http"

const STORAGE_KEY = "auth_session"

export interface AuthSession {
  token: string
  user: AuthUser
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  signIn: (session: AuthSession, remember: boolean) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function parseSession(raw: string | null): AuthSession | undefined {
  if (!raw) {
    return undefined
  }

  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    return undefined
  }
}

function clearStoredSession() {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem("token")
  sessionStorage.removeItem("token")
  localStorage.removeItem("user")
  sessionStorage.removeItem("user")
}

/**
 * "Ghi nhớ đăng nhập" -> localStorage (giữ qua các lần mở trình duyệt).
 * Không tick -> sessionStorage (mất khi đóng tab).
 * Tự động hủy phiên và đăng xuất nếu JWT token đã hết hạn.
 */
function readStoredSession(): AuthSession | undefined {
  const session =
    parseSession(localStorage.getItem(STORAGE_KEY)) ??
    parseSession(sessionStorage.getItem(STORAGE_KEY))

  if (session && !isTokenValid(session.token)) {
    clearStoredSession()
    return undefined
  }

  return session
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | undefined>(
    readStoredSession
  )

  const signIn = useCallback((nextSession: AuthSession, remember: boolean) => {
    const store = remember ? localStorage : sessionStorage
    const otherStore = remember ? sessionStorage : localStorage

    otherStore.removeItem(STORAGE_KEY)
    otherStore.removeItem("token")
    otherStore.removeItem("user")

    store.setItem(STORAGE_KEY, JSON.stringify(nextSession))
    store.setItem("token", nextSession.token)
    store.setItem("user", JSON.stringify(nextSession.user))
    setSession(nextSession)
  }, [])

  const signOut = useCallback(() => {
    clearStoredSession()
    localStorage.removeItem("token")
    sessionStorage.removeItem("token")
    localStorage.removeItem("user")
    sessionStorage.removeItem("user")
    setSession(undefined)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: session !== undefined,
      signIn,
      signOut,
    }),
    [session, signIn, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
