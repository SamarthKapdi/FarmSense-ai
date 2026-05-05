import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from 'react'
import { getCurrentUser, refreshAccessToken } from '../services/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback((authResponse) => {
    localStorage.setItem('farmsense_token', authResponse.token)
    if (authResponse.refreshToken) {
      localStorage.setItem('farmsense_refresh_token', authResponse.refreshToken)
    }
    setToken(authResponse.token)
    setUser({
      userId: authResponse.userId,
      email: authResponse.email,
      fullName: authResponse.fullName,
      role: authResponse.role,
      emailVerified: authResponse.emailVerified,
    })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('farmsense_token')
    localStorage.removeItem('farmsense_refresh_token')
    setUser(null)
    setToken(null)
  }, [])

  useEffect(() => {
    let active = true

    const restoreSession = async () => {
      const savedToken = localStorage.getItem('farmsense_token')
      if (!savedToken) {
        return
      }

      setIsLoading(true)
      try {
        const currentUser = await getCurrentUser(savedToken)
        if (!active) {
          return
        }

        if (currentUser?.userId) {
          setToken(savedToken)
          setUser({
            userId: currentUser.userId,
            email: currentUser.email,
            fullName: currentUser.fullName,
            role: currentUser.role,
            emailVerified: currentUser.emailVerified,
          })
        } else {
          // Try refresh token
          const savedRefresh = localStorage.getItem('farmsense_refresh_token')
          if (savedRefresh) {
            try {
              const refreshed = await refreshAccessToken(savedRefresh)
              if (active && refreshed?.token) {
                localStorage.setItem('farmsense_token', refreshed.token)
                setToken(refreshed.token)
                setUser({
                  userId: refreshed.userId,
                  email: refreshed.email,
                  fullName: refreshed.fullName,
                  role: refreshed.role,
                })
                return
              }
            } catch { /* refresh failed */ }
          }
          localStorage.removeItem('farmsense_token')
          localStorage.removeItem('farmsense_refresh_token')
        }
      } catch {
        localStorage.removeItem('farmsense_token')
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      active = false
    }
  }, [])

  const getToken = useCallback(() => token, [token])

  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        setIsLoading,
        login,
        logout,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
