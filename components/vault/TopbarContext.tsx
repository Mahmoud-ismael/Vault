'use client'

import { createContext, useContext, useState } from 'react'

export type TopbarAction = {
  label: string
  onClick: () => void
}

type TopbarContextType = {
  title: React.ReactNode
  setTitle: (title: React.ReactNode) => void
  action: TopbarAction | null
  setAction: (action: TopbarAction | null) => void
  leftNode: React.ReactNode | null
  setLeftNode: (node: React.ReactNode | null) => void
  rightNode: React.ReactNode | null
  setRightNode: (node: React.ReactNode | null) => void
}

const TopbarContext = createContext<TopbarContextType | null>(null)

export function TopbarProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState<React.ReactNode>('')
  const [action, setAction] = useState<TopbarAction | null>(null)
  const [leftNode, setLeftNode] = useState<React.ReactNode | null>(null)
  const [rightNode, setRightNode] = useState<React.ReactNode | null>(null)

  return (
    <TopbarContext.Provider value={{ title, setTitle, action, setAction, leftNode, setLeftNode, rightNode, setRightNode }}>
      {children}
    </TopbarContext.Provider>
  )
}

export function useTopbar() {
  const context = useContext(TopbarContext)
  if (!context) throw new Error('useTopbar must be used within TopbarProvider')
  return context
}
