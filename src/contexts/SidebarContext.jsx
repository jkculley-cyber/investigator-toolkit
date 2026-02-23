import { createContext, useContext, useState } from 'react'

const SidebarContext = createContext({ sidebarOpen: false, setSidebarOpen: () => {} })

export const useSidebar = () => useContext(SidebarContext)

export function SidebarProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}
