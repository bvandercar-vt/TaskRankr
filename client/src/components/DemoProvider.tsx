import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface OfflineModeContextValue {
  isOfflineMode: boolean
  enterOfflineMode: () => void
  exitOfflineMode: () => void
}

const OfflineModeContext = createContext<OfflineModeContextValue | null>(null)

export const OfflineModeProvider = ({ children }: { children: ReactNode }) => {
  const [isOfflineMode, setIsOfflineMode] = useState(false)

  const enterOfflineMode = useCallback(() => setIsOfflineMode(true), [])
  const exitOfflineMode = useCallback(() => setIsOfflineMode(false), [])

  const value = useMemo(
    () => ({
      isOfflineMode,
      enterOfflineMode,
      exitOfflineMode,
    }),
    [isOfflineMode, enterOfflineMode, exitOfflineMode],
  )

  return <OfflineModeContext.Provider value={value}>{children}</OfflineModeContext.Provider>
}

export const useOfflineMode = () => {
  const context = useContext(OfflineModeContext)
  if (!context) {
    throw new Error('useOfflineMode must be used within an OfflineModeProvider')
  }
  return context
}

export const useOfflineModeSafe = () => {
  const context = useContext(OfflineModeContext)
  return context ?? { isOfflineMode: false, enterOfflineMode: () => {}, exitOfflineMode: () => {} }
}

export const DemoProvider = OfflineModeProvider
export const useDemo = useOfflineMode
export const useDemoSafe = useOfflineModeSafe
