'use client'

import { Search, Menu } from 'lucide-react'
import { useTopbar } from './TopbarContext'

export function Topbar() {
  const { title, action, leftNode, rightNode, setSidebarOpen } = useTopbar()

  return (
    <div className="flex items-center justify-between h-full px-4 md:px-8 lg:px-10">
      <div className="flex items-center gap-4">
        {/* Hamburger - Mobile only */}
        <button 
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 -ml-2 text-vault-text-2 hover:text-vault-text"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo - Mobile only */}
        <div className="lg:hidden text-[14px] uppercase tracking-widest text-vault-accent font-bold">
          VAULT
        </div>

        {/* Left Node / Title - Desktop or specific mobile overrides */}
        <div className="hidden lg:flex items-center gap-4">
          {leftNode}
          <div className="text-[16px] text-vault-text-2">
            {title}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        {rightNode ? (
          rightNode
        ) : (
          <>
            {/* Desktop Search */}
            <button className="hidden md:flex items-center gap-2 text-vault-text-3 hover:text-vault-text transition-colors duration-150 text-[13px] border border-vault-border bg-vault-bg-4 hover:bg-vault-bg-3 rounded-[4px] px-3 py-1.5">
              <Search className="w-3.5 h-3.5" />
              <span className="text-[10px]">Ctrl + K</span>
            </button>
            
            {/* Mobile Search Icon Only */}
            <button className="md:hidden p-2 text-vault-text-3 hover:text-vault-text transition-colors">
              <Search className="w-5 h-5" />
            </button>
            
            {/* Desktop Action Button */}
            {action && (
              <button 
                onClick={action.onClick}
                className="hidden md:block bg-vault-accent text-[#0D0D0F] text-[11px] uppercase tracking-widest py-1.5 px-4 rounded-[4px] hover:bg-vault-accent-2 transition-colors duration-150"
              >
                {action.label}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}