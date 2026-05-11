'use client'

import { Search } from 'lucide-react'
import { useTopbar } from './TopbarContext'

export function Topbar() {
  const { title, action, leftNode, rightNode } = useTopbar()

  return (
    <div className="flex items-center justify-between h-full px-8 lg:px-10">
      <div className="flex items-center gap-4">
        {leftNode}
        <div className="text-[16px] text-vault-text-2">
          {title}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {rightNode ? (
          rightNode
        ) : (
          <>
            <button className="flex items-center gap-2 text-vault-text-3 hover:text-vault-text transition-colors duration-150 text-[13px] border border-vault-border bg-vault-bg-4 hover:bg-vault-bg-3 rounded-[4px] px-3 py-1.5">
              <Search className="w-3.5 h-3.5" />
              <span className="text-[10px]">Ctrl + K</span>
            </button>
            
            {action && (
              <button 
                onClick={action.onClick}
                className="bg-vault-accent text-[#0D0D0F] text-[11px] uppercase tracking-[0.1em] py-1.5 px-4 rounded-[4px] hover:bg-vault-accent-2 transition-colors duration-150"
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