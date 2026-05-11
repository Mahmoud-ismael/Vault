'use client'

import { useEffect, useState } from 'react'

export function PwaRegistry() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => console.log('SW registered: ', registration.scope),
          (err) => console.log('SW registration failed: ', err)
        )
      })
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      const dismissed = localStorage.getItem('vault_pwa_dismissed')
      if (!dismissed) {
        setShowBanner(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    }
    setDeferredPrompt(null)
    setShowBanner(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('vault_pwa_dismissed', 'true')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-vault-bg-2 border-t border-vault-border p-4 z-[100] flex items-center justify-between shadow-2xl md:hidden">
      <div className="flex flex-col">
        <span className="text-[18px] text-vault-text">Install Vault</span>
        <span className="text-[12px] text-vault-text-3">Add to your home screen for quick access.</span>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={handleDismiss} className="text-[12px] text-vault-text-3 hover:text-vault-text transition-colors">
          Dismiss
        </button>
        <button onClick={handleInstall} className="bg-vault-accent text-[#0D0D0F] text-[10px] uppercase tracking-normal px-4 py-2 rounded-[4px] hover:bg-vault-accent-2 transition-colors">
          Install
        </button>
      </div>
    </div>
  )
}
