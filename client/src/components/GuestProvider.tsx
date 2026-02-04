import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

interface GuestModeContextValue {
  isGuestMode: boolean
  enterGuestMode: () => void
  exitGuestMode: () => void
}

const GuestModeContext = createContext<GuestModeContextValue | null>(null)

export const GuestModeProvider = ({ children }: { children: ReactNode }) => {
  const [isGuestMode, setIsGuestMode] = useState(false)

  const enterGuestMode = useCallback(() => setIsGuestMode(true), [])
  const exitGuestMode = useCallback(() => setIsGuestMode(false), [])

  const value = useMemo(
    () => ({
      isGuestMode,
      enterGuestMode,
      exitGuestMode,
    }),
    [isGuestMode, enterGuestMode, exitGuestMode],
  )

  return (
    <GuestModeContext.Provider value={value}>
      {children}
    </GuestModeContext.Provider>
  )
}

export const useGuestMode = () => {
  const context = useContext(GuestModeContext)
  if (!context) {
    throw new Error('useGuestMode must be used within a GuestModeProvider')
  }
  return context
}
