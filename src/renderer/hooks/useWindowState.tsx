import { createContext, useContext, useState, ReactNode } from 'react'

interface WindowState {
  isMaximized: boolean
  setIsMaximized: (value: boolean) => void
}

const WindowStateContext = createContext<WindowState>({
  isMaximized: false,
  setIsMaximized: () => {}
})

export function WindowStateProvider({ children }: { children: ReactNode }) {
  const [isMaximized, setIsMaximized] = useState(false)

  return (
    <WindowStateContext.Provider value={{ isMaximized, setIsMaximized }}>
      {children}
    </WindowStateContext.Provider>
  )
}

export const useWindowState = () => useContext(WindowStateContext)
