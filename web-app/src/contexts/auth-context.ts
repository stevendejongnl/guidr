import { createContext } from '@lit/context'

/**
 * Auth state for global consumption via @lit/context
 */
export interface AuthContextValue {
  isAuthenticated: boolean
  isAdmin: boolean
  isBeta: boolean
  userEmail: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

/**
 * Lit context key for auth state
 */
export const authContext = createContext<AuthContextValue>('auth-context')
