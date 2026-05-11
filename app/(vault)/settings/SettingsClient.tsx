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
        exportDate: new Date().toISOString(),
        user: user.id,
        stances: stances.data,
        journal_entries: journal.data,
        notes: notes.data,
        documents: docs.data
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

  const exportAsMarkdown = async () => {
    setExporting(true)
    try {
      const [stances, journal] = await Promise.all([
        supabase.from('stances').select('*'),
        supabase.from('journal_entries').select('*')
      ])

      const zip = new JSZip()
      
      const stancesFolder = zip.folder("stances")
      stances.data?.forEach(s => {
        const content = `# ${s.topic}\n\n**Category:** ${s.category}\n**Status:** ${s.status}\n\n## My Stance\n${s.my_stance || ''}\n\n## Why I hold this\n${s.why_i_hold_this || ''}`
        stancesFolder?.file(`${s.topic.replace(/[/\\?%*:|"<>]/g, '-')}.md`, content)
      })

      const journalFolder = zip.folder("journal")
      journal.data?.forEach(j => {
        // Very basic extraction of text from tiptap json
        const extractText = (node: any): string => {
          if (!node) return ''
          if (node.type === 'text') return node.text || ''
          if (node.type === 'heading') return `\n# ${node.content?.map(extractText).join('')}\n`
          if (node.type === 'paragraph') return `${node.content?.map(extractText).join('') || ''}\n`
          if (node.content && Array.isArray(node.content)) return node.content.map(extractText).join('')
          return ''
        }
        const text = extractText(j.content)
        journalFolder?.file(`${j.title.replace(/[/\\?%*:|"<>]/g, '-')}.md`, text)
      })

      const blob = await zip.generateAsync({ type: 'blob' })
      downloadBlob(blob, `vault-export-md-${new Date().toISOString().split('T')[0]}.zip`)
      updateLastExport()
      toast.success('Export downloaded')
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
    <div className="w-full min-h-screen bg-vault-bg py-10 px-8">
      <SetTopbar title="Settings" />
      
      <div className="max-w-[1000px] mx-auto flex gap-8 mt-4">
        
        {/* NAV PANEL */}
        <div className="w-[200px] shrink-0 flex flex-col gap-1 bg-vault-bg-2 border border-vault-border rounded-[6px] overflow-hidden self-start p-2">
          {(['General', 'AI & Search', 'Privacy', 'Export & Backup'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left font-sans text-[14px] px-4 py-3 rounded-[4px] transition-colors ${
                activeTab === tab
                  ? 'bg-vault-accent-dim text-vault-accent'
                  : 'text-vault-text-2 hover:bg-vault-bg-3 hover:text-vault-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SETTINGS PANEL */}
        <div className="flex-1 bg-vault-bg-2 border border-vault-border rounded-[6px] p-10 flex flex-col gap-10">
          <h2 className="font-serif text-[28px] text-vault-text pb-6 border-b border-vault-border">
            {activeTab}
          </h2>

          {activeTab === 'General' && (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2 max-w-sm">
                <label className="font-mono text-[10px] uppercase tracking-widest text-vault-text-3">Profile Name</label>
                <div className="flex gap-2">
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="flex-1 bg-vault-bg border border-vault-border rounded-[4px] px-3 py-2 font-sans text-[14px] text-vault-text focus:border-vault-accent focus:outline-none transition-colors"
                  />
                  <button 
                    onClick={saveName}
                    disabled={savingName || name === initialProfile?.name}
                    className="bg-vault-bg-4 hover:bg-vault-bg-3 text-vault-text font-sans text-[13px] px-4 py-2 rounded-[4px] border border-vault-border transition-colors disabled:opacity-50"
                  >
                    {savingName ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 max-w-sm">
                <label className="font-mono text-[10px] uppercase tracking-widest text-vault-text-3">Theme</label>
                <div className="flex items-center gap-3 bg-vault-bg border border-vault-border rounded-[4px] px-3 py-2 cursor-not-allowed opacity-70">
                  <div className="w-4 h-4 rounded-full bg-[#0D0D0F] border border-vault-border" />
                  <span className="font-sans text-[14px] text-vault-text">Industrial Dark (Locked)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'AI & Search' && (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2 max-w-sm">
                <label className="font-mono text-[10px] uppercase tracking-widest text-vault-text-3">Primary Reasoning Model</label>
                <select 
                  value={settings.primaryModel}
                  onChange={e => setSetting('primaryModel', e.target.value)}
                  className="w-full bg-vault-bg border border-vault-border rounded-[4px] px-3 py-2 font-sans text-[14px] text-vault-text focus:border-vault-accent focus:outline-none transition-colors appearance-none"
                >
                  <option>Claude Sonnet</option>
                  <option>Claude Haiku</option>
                </select>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between py-2 border-b border-vault-border border-dashed">
                  <div className="flex flex-col gap-1">
                    <span className="font-sans text-[14px] text-vault-text">Live Web Search</span>
                    <span className="font-sans text-[12px] text-vault-text-3">Allow AI to search the internet for missing context.</span>
                  </div>
                  <Toggle checked={settings.liveWebSearch} onChange={v => setSetting('liveWebSearch', v)} />
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-vault-border border-dashed">
                  <div className="flex flex-col gap-1">
                    <span className="font-sans text-[14px] text-vault-text">Show AI Friction Prompts</span>
                    <span className="font-sans text-[12px] text-vault-text-3">Show "what do you think?" prompts after AI responses.</span>
                  </div>
                  <Toggle checked={settings.showFrictionPrompts} onChange={v => setSetting('showFrictionPrompts', v)} />
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-vault-border border-dashed">
                  <div className="flex flex-col gap-1">
                    <span className="font-sans text-[14px] text-vault-text">Flag Unverified AI Summaries</span>
                    <span className="font-sans text-[12px] text-vault-text-3">Visually highlight AI abstracts that haven't been reviewed.</span>
                  </div>
                  <Toggle checked={settings.flagUnverifiedSummaries} onChange={v => setSetting('flagUnverifiedSummaries', v)} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-vault-border border-dashed">
                  <div className="flex flex-col gap-1">
                    <span className="font-sans text-[14px] text-vault-text">90-Day Stance Review Nudges</span>
                    <span className="font-sans text-[12px] text-vault-text-3">Remind you to revisit stances older than 3 months.</span>
                  </div>
                  <Toggle checked={settings.stanceReviewNudges} onChange={v => setSetting('stanceReviewNudges', v)} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-vault-border border-dashed">
                  <div className="flex flex-col gap-1">
                    <span className="font-sans text-[14px] text-vault-text">Daily Reflection Prompt</span>
                    <span className="font-sans text-[12px] text-vault-text-3">Show a philosophical question on your dashboard.</span>
                  </div>
                  <Toggle checked={settings.dailyReflectionPrompt} onChange={v => setSetting('dailyReflectionPrompt', v)} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Privacy' && (
            <div className="flex flex-col gap-8">
              <div className="bg-vault-accent-dim border border-vault-accent-border p-4 rounded-[6px]">
                <h3 className="font-sans font-medium text-[14px] text-vault-text mb-1">Vault is Private</h3>
                <p className="font-sans text-[13px] text-vault-text-2">
                  Your data is encrypted in transit and at rest. AI features only send context explicitly when you invoke them. No data is used to train foundational models.
                </p>
              </div>

              <div className="flex flex-col gap-2 max-w-sm">
                <label className="font-mono text-[10px] uppercase tracking-widest text-vault-text-3">Session Timeout</label>
                <select 
                  value={settings.sessionTimeout}
                  onChange={e => setSetting('sessionTimeout', e.target.value)}
                  className="w-full bg-vault-bg border border-vault-border rounded-[4px] px-3 py-2 font-sans text-[14px] text-vault-text focus:border-vault-accent focus:outline-none transition-colors appearance-none"
                >
                  <option>Never</option>
                  <option>1 hour</option>
                  <option>8 hours</option>
                  <option>24 hours</option>
                </select>
                <div className="font-sans text-[12px] text-vault-text-3 mt-1">
                  How long before you are automatically logged out.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Export & Backup' && (
            <div className="flex flex-col gap-6">
              
              <div className="flex items-center justify-between bg-vault-bg border border-vault-border p-4 rounded-[6px]">
                <div className="flex flex-col gap-1">
                  <span className="font-sans text-[14px] text-vault-text font-medium">Export as JSON</span>
                  <span className="font-sans text-[13px] text-vault-text-3">Raw database export containing all metadata and content blocks.</span>
                </div>
                <button 
                  onClick={exportAsJson}
                  disabled={exporting}
                  className="flex items-center gap-2 bg-vault-bg-3 border border-vault-border hover:border-vault-text-3 text-vault-text font-sans text-[13px] px-4 py-2 rounded-[4px] transition-colors disabled:opacity-50"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} JSON
                </button>
              </div>

              <div className="flex items-center justify-between bg-vault-bg border border-vault-border p-4 rounded-[6px]">
                <div className="flex flex-col gap-1">
                  <span className="font-sans text-[14px] text-vault-text font-medium">Export as Markdown</span>
                  <span className="font-sans text-[13px] text-vault-text-3">Bundles your stances and journal entries into a flat ZIP of .md files.</span>
                </div>
                <button 
                  onClick={exportAsMarkdown}
                  disabled={exporting}
                  className="flex items-center gap-2 bg-vault-bg-3 border border-vault-border hover:border-vault-text-3 text-vault-text font-sans text-[13px] px-4 py-2 rounded-[4px] transition-colors disabled:opacity-50"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} ZIP
                </button>
              </div>

              {lastExport && (
                <div className="font-mono text-[10px] uppercase tracking-widest text-vault-text-3 mt-2">
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
