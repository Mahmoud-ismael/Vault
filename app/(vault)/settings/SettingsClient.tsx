'use client'

import { useState } from 'react'
import { SetTopbar } from '@/components/vault/SetTopbar'
import { createClient } from '@/lib/supabase/client'
import { useSettings } from '@/lib/hooks/useSettings'
import JSZip from 'jszip'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type Tab = 'General' | 'AI & Search' | 'Privacy' | 'Export & Backup'

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative w-[40px] h-[22px] rounded-full transition-colors duration-150 outline-none flex-shrink-0 ${
      checked ? 'bg-vault-accent' : 'bg-vault-bg-4'
    }`}
  >
    <div 
      className={`absolute top-[3px] left-[3px] w-[16px] h-[16px] bg-[#0D0D0F] rounded-full transition-transform duration-150 ${
        checked ? 'translate-x-[18px]' : 'translate-x-0 bg-vault-text-3'
      }`} 
    />
  </button>
)

export default function SettingsClient({ initialProfile, user }: { initialProfile: any, user: any }) {
  const supabase = createClient()
  const { settings, setSetting, loaded } = useSettings()
  
  const [activeTab, setActiveTab] = useState<Tab>('General')
  const [name, setName] = useState(initialProfile?.name || '')
  const [savingName, setSavingName] = useState(false)
  const [exporting, setExporting] = useState(false)
  
  const [lastExport, setLastExport] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('vault_last_export') : null
  )

  const saveName = async () => {
    setSavingName(true)
    const { error } = await supabase.from('profiles').update({ name }).eq('id', user.id)
    setSavingName(false)
    if (!error) toast.success('Profile updated')
  }

  const exportAsJson = async () => {
    setExporting(true)
    try {
      const [stances, journal, notes, docs] = await Promise.all([
        supabase.from('stances').select('*'),
        supabase.from('journal_entries').select('*'),
        supabase.from('notes').select('*'),
        supabase.from('documents').select('id, title, file_path, file_type, summary, tags, annotations, created_at')
      ])

      const data = {
        exported_at: new Date().toISOString(),
        vault_version: "1.0",
        stances: stances.data || [],
        journal_entries: journal.data || [],
        notes: notes.data || [],
        documents: docs.data || []
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      downloadBlob(blob, `vault-export-${new Date().toISOString().split('T')[0]}.json`)
      updateLastExport()
      toast.success('Export downloaded')
    } catch(e) {
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const tiptapJsonToMarkdown = (node: any): string => {
    if (!node) return ''
    if (node.type === 'text') {
      let text = node.text || ''
      if (node.marks) {
        node.marks.forEach((m: any) => {
          if (m.type === 'bold') text = `**${text}**`
          if (m.type === '') text = `_${text}_`
          if (m.type === 'strike') text = `~~${text}~~`
          if (m.type === 'code') text = `\`${text}\``
          if (m.type === 'link') text = `[${text}](${m.attrs?.href})`
        })
      }
      return text
    }
    
    const content = node.content ? node.content.map((c: any) => tiptapJsonToMarkdown(c)).join('') : ''
    
    switch (node.type) {
      case 'heading':
        return '\n' + '#'.repeat(node.attrs?.level || 1) + ' ' + content + '\n'
      case 'paragraph':
        return content + '\n\n'
      case 'bulletList':
        return node.content?.map((c: any) => `- ${tiptapJsonToMarkdown(c)}`).join('') + '\n'
      case 'orderedList':
        return node.content?.map((c: any, i: number) => `${i + 1}. ${tiptapJsonToMarkdown(c)}`).join('') + '\n'
      case 'listItem':
        return content
      case 'taskList':
        return node.content?.map((c: any) => `- [${c.attrs?.checked ? 'x' : ' '}] ${tiptapJsonToMarkdown(c)}`).join('') + '\n'
      case 'taskItem':
        return content
      case 'blockquote':
        return '\n> ' + content.split('\n').join('\n> ').trim() + '\n\n'
      case 'codeBlock':
        return '\n```\n' + content + '\n```\n\n'
      case 'horizontalRule':
        return '\n---\n\n'
      case 'callout':
        return '\n> 💡 **Note**\n> ' + content.split('\n').join('\n> ').trim() + '\n\n'
      default:
        return content
    }
  }

  const exportAsMarkdown = async () => {
    setExporting(true)
    try {
      const [stances, journal, notes] = await Promise.all([
        supabase.from('stances').select('*'),
        supabase.from('journal_entries').select('*'),
        supabase.from('notes').select('*')
      ])

      const zip = new JSZip()
      
      const stancesFolder = zip.folder("stances")
      stances.data?.forEach(s => {
        const content = `# ${s.topic}
**Status:** ${s.status} | **Category:** ${s.category} | **Last Updated:** ${new Date(s.updated_at || s.created_at).toLocaleDateString()}

## My Stance
${s.my_stance || 'Not provided.'}

## Why I Hold This
${s.why_i_hold_this || 'Not provided.'}

## Strongest Counter-Argument
${s.strongest_counter || 'Not provided.'}

## My Rebuttal
${s.my_rebuttal || 'Not provided.'}

## Where I'm Uncertain
${s.uncertainties || 'Not provided.'}

## How This Affects My Life
${s.life_impact || 'Not provided.'}

## Sources
${s.sources || 'Not provided.'}
`
        stancesFolder?.file(`${s.topic.replace(/[/\\?%*:|"<>]/g, '-')}.md`, content)
      })

      const journalFolder = zip.folder("journal")
      journal.data?.forEach(j => {
        const tagsStr = j.tags ? JSON.stringify(j.tags) : '[]'
        const content = `---
title: ${j.title || 'Untitled'}
date: ${new Date(j.created_at).toISOString()}
tags: ${tagsStr}
---

${tiptapJsonToMarkdown(j.content)}
`
        journalFolder?.file(`${j.title.replace(/[/\\?%*:|"<>]/g, '-')}.md`, content)
      })

      const notesFolder = zip.folder("notes")
      notes.data?.forEach(n => {
        const tagsStr = n.tags ? JSON.stringify(n.tags) : '[]'
        const content = `---
title: ${n.title || 'Untitled'}
date: ${new Date(n.created_at).toISOString()}
tags: ${tagsStr}
---

${tiptapJsonToMarkdown(n.content)}
`
        notesFolder?.file(`${n.title.replace(/[/\\?%*:|"<>]/g, '-')}.md`, content)
      })

      const blob = await zip.generateAsync({ type: 'blob' })
      downloadBlob(blob, `vault-markdown-${new Date().toISOString().split('T')[0]}.zip`)
      updateLastExport()
      toast.success('Markdown export downloaded')
    } catch(e) {
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const updateLastExport = () => {
    const date = new Date().toLocaleString()
    setLastExport(date)
    localStorage.setItem('vault_last_export', date)
  }

  if (!loaded) return null

  return (
    <div className="w-full min-h-screen bg-vault-bg py-6 md:py-10 px-4 md:px-8">
      <SetTopbar title="Settings" />
      
      <div className="max-w-[1000px] mx-auto flex flex-col lg:flex-row gap-6 md:gap-8 mt-4">
        
        {/* NAV PANEL */}
        <div className="w-full lg:w-[200px] shrink-0 flex flex-row lg:flex-col gap-1 bg-vault-bg-2 border border-vault-border rounded-[6px] overflow-x-auto no-scrollbar lg:self-start p-1.5 md:p-2">
          {(['General', 'AI & Search', 'Privacy', 'Export & Backup'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap text-left text-[13px] md:text-[14px] px-4 py-2.5 md:py-3 rounded-[4px] transition-colors flex-1 lg:flex-none ${
                activeTab === tab
                  ? 'bg-vault-accent-dim text-vault-accent font-bold'
                  : 'text-vault-text-2 hover:bg-vault-bg-3 hover:text-vault-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SETTINGS PANEL */}
        <div className="flex-1 bg-vault-bg-2 border border-vault-border rounded-[6px] p-6 md:p-10 flex flex-col gap-8 md:gap-10">
          <h2 className="text-[24px] md:text-[28px] text-vault-text pb-4 md:pb-6 border-b border-vault-border font-bold">
            {activeTab}
          </h2>

          {activeTab === 'General' && (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2 w-full md:max-w-sm">
                <label className="text-[10px] uppercase tracking-normal text-vault-text-3 font-bold">Profile Name</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="flex-1 bg-vault-bg border border-vault-border rounded-[4px] px-3 py-2.5 text-[15px] md:text-[14px] text-vault-text focus:border-vault-accent focus:outline-none transition-colors"
                  />
                  <button 
                    onClick={saveName}
                    disabled={savingName || name === initialProfile?.name}
                    className="h-11 sm:h-auto bg-vault-bg-4 hover:bg-vault-bg-3 text-vault-text text-[13px] px-6 py-2 rounded-[4px] border border-vault-border transition-colors disabled:opacity-50 font-bold"
                  >
                    {savingName ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full md:max-w-sm">
                <label className="text-[10px] uppercase tracking-normal text-vault-text-3 font-bold">Theme</label>
                <div className="flex items-center gap-3 bg-vault-bg border border-vault-border rounded-[4px] px-3 py-2.5 cursor-not-allowed opacity-70">
                  <div className="w-4 h-4 rounded-full bg-[#0D0D0F] border border-vault-border" />
                  <span className="text-[15px] md:text-[14px] text-vault-text">Industrial Dark (Locked)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'AI & Search' && (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2 w-full md:max-w-sm">
                <label className="text-[10px] uppercase tracking-normal text-vault-text-3 font-bold">Primary Reasoning Model</label>
                <select 
                  value={settings.primaryModel}
                  onChange={e => setSetting('primaryModel', e.target.value)}
                  className="w-full bg-vault-bg border border-vault-border rounded-[4px] px-3 py-2.5 text-[15px] md:text-[14px] text-vault-text focus:border-vault-accent focus:outline-none transition-colors appearance-none h-11"
                >
                  <option value="llama-70b">Llama 3.1 70B (Powerful)</option>
                  <option value="llama-8b">Llama 3.1 8B (Fast)</option>
                </select>
                <span className="text-[11px] text-vault-text-3">Powered by NVIDIA NIM · Free tier</span>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between py-3 border-b border-vault-border border-dashed">
                  <div className="flex flex-col gap-1 pr-4">
                    <span className="text-[15px] md:text-[14px] text-vault-text font-medium">Live Web Search</span>
                    <span className="text-[12px] text-vault-text-3 leading-snug">Allow AI to search the internet for missing context.</span>
                  </div>
                  <Toggle checked={settings.liveWebSearch} onChange={v => setSetting('liveWebSearch', v)} />
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-vault-border border-dashed">
                  <div className="flex flex-col gap-1 pr-4">
                    <span className="text-[15px] md:text-[14px] text-vault-text font-medium">Show AI Friction Prompts</span>
                    <span className="text-[12px] text-vault-text-3 leading-snug">Show "what do you think?" prompts after AI responses.</span>
                  </div>
                  <Toggle checked={settings.showFrictionPrompts} onChange={v => setSetting('showFrictionPrompts', v)} />
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-vault-border border-dashed">
                  <div className="flex flex-col gap-1 pr-4">
                    <span className="text-[15px] md:text-[14px] text-vault-text font-medium">Flag Unverified AI Summaries</span>
                    <span className="text-[12px] text-vault-text-3 leading-snug">Visually highlight AI abstracts that haven't been reviewed.</span>
                  </div>
                  <Toggle checked={settings.flagUnverifiedSummaries} onChange={v => setSetting('flagUnverifiedSummaries', v)} />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-vault-border border-dashed">
                  <div className="flex flex-col gap-1 pr-4">
                    <span className="text-[15px] md:text-[14px] text-vault-text font-medium">90-Day Stance Review Nudges</span>
                    <span className="text-[12px] text-vault-text-3 leading-snug">Remind you to revisit stances older than 3 months.</span>
                  </div>
                  <Toggle checked={settings.stanceReviewNudges} onChange={v => setSetting('stanceReviewNudges', v)} />
                </div>

                <div className="flex items-center justify-between py-3 border-b border-vault-border border-dashed">
                  <div className="flex flex-col gap-1 pr-4">
                    <span className="text-[15px] md:text-[14px] text-vault-text font-medium">Daily Reflection Prompt</span>
                    <span className="text-[12px] text-vault-text-3 leading-snug">Show a philosophical question on your dashboard.</span>
                  </div>
                  <Toggle checked={settings.dailyReflectionPrompt} onChange={v => setSetting('dailyReflectionPrompt', v)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Privacy' && (
            <div className="flex flex-col gap-8">
              <div className="bg-vault-accent-dim border border-vault-accent-border p-5 rounded-[6px]">
                <h3 className="font-bold text-[15px] md:text-[14px] text-vault-text mb-1">Vault is Private</h3>
                <p className="text-[13px] text-vault-text-2 leading-relaxed">
                  Your data is encrypted in transit and at rest. AI features only send context explicitly when you invoke them. No data is used to train foundational models.
                </p>
              </div>

              <div className="flex flex-col gap-2 w-full md:max-w-sm">
                <label className="text-[10px] uppercase tracking-normal text-vault-text-3 font-bold">Session Timeout</label>
                <select 
                  value={settings.sessionTimeout}
                  onChange={e => setSetting('sessionTimeout', e.target.value)}
                  className="w-full bg-vault-bg border border-vault-border rounded-[4px] px-3 py-2.5 text-[15px] md:text-[14px] text-vault-text focus:border-vault-accent focus:outline-none transition-colors appearance-none h-11"
                >
                  <option>Never</option>
                  <option>1 hour</option>
                  <option>8 hours</option>
                  <option>24 hours</option>
                </select>
                <div className="text-[12px] text-vault-text-3 mt-1">
                  How long before you are automatically logged out.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Export & Backup' && (
            <div className="flex flex-col gap-4 md:gap-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-vault-bg border border-vault-border p-5 rounded-[6px]">
                <div className="flex flex-col gap-1">
                  <span className="text-[15px] md:text-[14px] text-vault-text font-bold">Export as JSON</span>
                  <span className="text-[13px] text-vault-text-3">Raw database export containing all metadata and content.</span>
                </div>
                <button 
                  onClick={exportAsJson}
                  disabled={exporting}
                  className="h-12 sm:h-auto flex items-center justify-center gap-2 bg-vault-bg-3 border border-vault-border hover:border-vault-text-3 text-vault-text text-[13px] px-6 py-2 rounded-[4px] transition-colors disabled:opacity-50 font-bold"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} JSON
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-vault-bg border border-vault-border p-5 rounded-[6px]">
                <div className="flex flex-col gap-1">
                  <span className="text-[15px] md:text-[14px] text-vault-text font-bold">Export as Markdown</span>
                  <span className="text-[13px] text-vault-text-3">Bundles entries into a flat ZIP of .md files.</span>
                </div>
                <button 
                  onClick={exportAsMarkdown}
                  disabled={exporting}
                  className="h-12 sm:h-auto flex items-center justify-center gap-2 bg-vault-bg-3 border border-vault-border hover:border-vault-text-3 text-vault-text text-[13px] px-6 py-2 rounded-[4px] transition-colors disabled:opacity-50 font-bold"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} ZIP
                </button>
              </div>

              {lastExport && (
                <div className="text-[10px] uppercase tracking-normal text-vault-text-3 mt-2 text-center sm:text-left">
                  Last exported: {lastExport}
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  )
}
