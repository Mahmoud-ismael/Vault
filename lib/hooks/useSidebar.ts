'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextType {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  toggleCollapsed: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('vault_sidebar_collapsed')
    if (saved !== null) {
      setCollapsed(saved === 'true')
    }
    setMounted(true)
  }, [])

  const handleSetCollapsed = (val: boolean) => {
    setCollapsed(val)
    localStorage.setItem('vault_sidebar_collapsed', String(val))
  }

  const toggleCollapsed = () => {
    const newVal = !collapsed
    setCollapsed(newVal)
    localStorage.setItem('vault_sidebar_collapsed', String(newVal))
  }

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed: handleSetCollapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
