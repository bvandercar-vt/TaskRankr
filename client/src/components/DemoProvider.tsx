import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface DemoContextValue {
  isDemo: boolean
  enterDemo: () => void
  exitDemo: () => void
}

const DemoContext = createContext<DemoContextValue | null>(null)

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [isDemo, setIsDemo] = useState(false)

  const enterDemo = useCallback(() => setIsDemo(true), [])
  const exitDemo = useCallback(() => setIsDemo(false), [])

  const value = useMemo(
    () => ({
      isDemo,
      enterDemo,
      exitDemo,
    }),
    [isDemo, enterDemo, exitDemo],
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export const useDemo = () => {
  const context = useContext(DemoContext)
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider')
  }
  return context
}

export const useDemoSafe = () => {
  const context = useContext(DemoContext)
  return context ?? { isDemo: false, enterDemo: () => {}, exitDemo: () => {} }
}
