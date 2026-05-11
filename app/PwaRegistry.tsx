'use client'

import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'

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

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      const dismissed = sessionStorage.getItem('vault_pwa_dismissed')
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
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    sessionStorage.setItem('vault_pwa_dismissed', 'true')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden p-4">
      <div className="bg-vault-bg-2 border border-vault-border rounded-[12px] p-4 shadow-[0_-8px_30px_rgb(0,0,0,0.5)] flex items-center justify-between gap-4 animate-in slide-in-from-bottom-full duration-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-vault-accent rounded-[8px] flex items-center justify-center shrink-0">
            <span className="text-[#0D0D0F] font-bold text-[18px]">V</span>
          </div>
          <div className="flex flex-col">
            <span className="text-vault-text text-[14px] font-bold">Install Vault</span>
            <span className="text-vault-text-3 text-[11px]">Personal intelligence offline.</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleInstall}
            className="bg-vault-accent text-[#0D0D0F] text-[12px] px-4 py-2 rounded-[6px] font-bold flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Install
          </button>
          <button 
            onClick={handleDismiss}
            className="text-vault-text-3 p-2 hover:text-vault-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
