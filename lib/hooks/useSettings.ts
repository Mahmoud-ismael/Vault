'use client'

import { useState, useEffect } from 'react'

export type Settings = {
  primaryModel: string
  liveWebSearch: boolean
  showFrictionPrompts: boolean
  flagUnverifiedSummaries: boolean
  stanceReviewNudges: boolean
  dailyReflectionPrompt: boolean
  sessionTimeout: string
}

const DEFAULT_SETTINGS: Settings = {
  primaryModel: 'Claude Sonnet',
  liveWebSearch: true,
  showFrictionPrompts: true,
  flagUnverifiedSummaries: true,
  stanceReviewNudges: true,
  dailyReflectionPrompt: true,
  sessionTimeout: 'Never'
}

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('vault_settings')
    if (stored) {
      try {
        setSettingsState({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) })
      } catch (e) {}
    }
    setLoaded(true)
  }, [])

  const setSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettingsState(prev => {
      const next = { ...prev, [key]: value }
      localStorage.setItem('vault_settings', JSON.stringify(next))
      return next
    })
  }

  return { settings, setSetting, loaded }
}
