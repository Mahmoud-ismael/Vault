'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function KeyboardShortcuts() {
  const router = useRouter()
  const pathname = usePathname()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ? for shortcuts modal
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        if (!(e.target as HTMLElement).closest('.ProseMirror')) {
          e.preventDefault()
          setShowModal(true)
        }
      }

      // Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (pathname !== '/search') {
          router.push('/search')
        } else {
          document.querySelector('input')?.focus()
        }
      }

      // Cmd/Ctrl + N
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        if (pathname.startsWith('/notes')) {
          router.push('/notes/new')
        } else {
          router.push('/journal/new')
        }
      }

      // Cmd/Ctrl + S
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        // We let individual editors handle this if they want, or we can dispatch a custom event
        const event = new CustomEvent('vault-manual-save')
        window.dispatchEvent(event)
        e.preventDefault()
      }

      // Esc
      if (e.key === 'Escape') {
        const event = new CustomEvent('vault-escape')
        window.dispatchEvent(event)
        setShowModal(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, pathname])

  if (!showModal) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0D0D0F]/80 backdrop-blur-sm" onClick={() => setShowModal(false)}>
      <div className="bg-vault-bg-2 border border-vault-border rounded-[8px] p-8 w-[400px] shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <h2 className="text-[24px] text-vault-text mb-6">Keyboard Shortcuts</h2>
        
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-vault-border-2">
            <span className="text-[14px] text-vault-text-2">Search Vault</span>
            <span className="text-[11px] bg-vault-bg-4 px-2 py-1 rounded text-vault-text-3">Cmd + K</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-vault-border-2">
            <span className="text-[14px] text-vault-text-2">New Entry / Note</span>
            <span className="text-[11px] bg-vault-bg-4 px-2 py-1 rounded text-vault-text-3">Cmd + N</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-vault-border-2">
            <span className="text-[14px] text-vault-text-2">Save Document</span>
            <span className="text-[11px] bg-vault-bg-4 px-2 py-1 rounded text-vault-text-3">Cmd + S</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-vault-border-2">
            <span className="text-[14px] text-vault-text-2">Close AI Panels</span>
            <span className="text-[11px] bg-vault-bg-4 px-2 py-1 rounded text-vault-text-3">Esc</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-vault-border-2">
            <span className="text-[14px] text-vault-text-2">Show Shortcuts</span>
            <span className="text-[11px] bg-vault-bg-4 px-2 py-1 rounded text-vault-text-3">?</span>
          </div>
        </div>
      </div>
    </div>
  )
}
