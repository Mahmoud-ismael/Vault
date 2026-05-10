'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { format } from 'date-fns'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { SetTopbar } from '@/components/vault/SetTopbar'

const AutoTextArea = ({ value, onChange, placeholder, className }: any) => {
  const ref = useRef<HTMLTextAreaElement>(null)
  
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = ref.current.scrollHeight + 'px'
    }
  }, [value])
  
  return (
    <textarea
      ref={ref}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-transparent resize-none focus:outline-none placeholder-vault-text-3 ${className}`}
      rows={1}
    />
  )
}

const Section = ({ num, title, children }: { num: number, title: string, children: React.ReactNode }) => (
  <div className="bg-vault-bg-2 border border-vault-border rounded-[6px] mb-4 overflow-hidden flex flex-col transition-colors duration-150 hover:border-vault-border-2">
    <div className="flex items-center gap-3 px-5 py-[12px] border-b border-vault-border bg-vault-bg-2/30">
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-vault-bg-4 font-mono text-[10px] text-vault-text-3">
        {num}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-vault-text-3">
        {title}
      </div>
    </div>
    <div className="px-5 py-[18px]">
      {children}
    </div>
  </div>
)

export default function StanceClient({ initialStance, allSettledStances }: { initialStance: any, allSettledStances: any[] }) {
  const supabase = createClient()
  const router = useRouter()
  
  const [stance, setStance] = useState(initialStance)
  const [saving, setSaving] = useState(false)
  
  const [steelmanLoading, setSteelmanLoading] = useState(false)
  const [steelmanResponse, setSteelmanResponse] = useState('')
  
  const [sourcesLoading, setSourcesLoading] = useState(false)
  const [sourcesResponse, setSourcesResponse] = useState<any[]>([])
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const handleUpdate = (updates: Partial<typeof stance>) => {
    const updated = { ...stance, ...updates }
    setStance(updated)
    
    setSaving(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      await saveToDb(updated)
    }, 2000)
  }

  const saveToDb = async (dataToSave: any) => {
    let newStatus = dataToSave.status
    if (newStatus === 'empty' && (dataToSave.my_stance || dataToSave.why_i_hold_this)) {
      newStatus = 'evolving'
    }
    
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('stances')
      .update({
        my_stance: dataToSave.my_stance,
        why_i_hold_this: dataToSave.why_i_hold_this,
        strongest_counter: dataToSave.strongest_counter,
        my_rebuttal: dataToSave.my_rebuttal,
        uncertainties: dataToSave.uncertainties,
        life_impact: dataToSave.life_impact,
        sources: dataToSave.sources,
        status: newStatus,
        last_updated: now
      })
      .eq('id', dataToSave.id)

    if (!error) {
      setStance((prev: any) => ({ ...prev, status: newStatus, last_updated: now }))
      setSaving(false)
      router.refresh()
    }
  }

  // Parses uncertainties text / tags
  let parsedUncertainties = { text: '', tags: [] as string[] }
  try {
    parsedUncertainties = typeof stance.uncertainties === 'string' 
      ? JSON.parse(stance.uncertainties) 
      : { text: '', tags: [] }
    if (!parsedUncertainties.tags) parsedUncertainties = { text: stance.uncertainties || '', tags: [] }
  } catch(e) {
    parsedUncertainties = { text: stance.uncertainties || '', tags: [] }
  }

  const [tagInput, setTagInput] = useState('')
  const handleUncertaintiesText = (val: string) => {
    handleUpdate({ uncertainties: JSON.stringify({ ...parsedUncertainties, text: val }) })
  }
  
  const addTag = (e: any) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const newTags = [...parsedUncertainties.tags, tagInput.trim()]
      handleUpdate({ uncertainties: JSON.stringify({ ...parsedUncertainties, tags: newTags }) })
      setTagInput('')
    }
  }
  
  const removeTag = (index: number) => {
    const newTags = parsedUncertainties.tags.filter((_: any, i: number) => i !== index)
    handleUpdate({ uncertainties: JSON.stringify({ ...parsedUncertainties, tags: newTags }) })
  }

  // Parse Sources
  let parsedSources = []
  try {
    parsedSources = typeof stance.sources === 'string' ? JSON.parse(stance.sources) : (stance.sources || [])
  } catch(e) {
    parsedSources = []
  }

  const updateSource = (index: number, updates: any) => {
    const newSources = [...parsedSources]
    newSources[index] = { ...newSources[index], ...updates }
    handleUpdate({ sources: JSON.stringify(newSources) })
  }

  const generateSteelman = async () => {
    if (!stance.my_stance) return alert('Please write your stance first.')
    setSteelmanLoading(true)
    setSteelmanResponse('')
    
    try {
      const res = await fetch('/api/ai/steelman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: stance.topic, my_stance: stance.my_stance })
      })
      
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          setSteelmanResponse(prev => prev + decoder.decode(value))
        }
      }
    } finally {
      setSteelmanLoading(false)
    }
  }

  const suggestSources = async () => {
    setSourcesLoading(true)
    try {
      const res = await fetch('/api/ai/suggest-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: stance.topic })
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setSourcesResponse(data)
      }
    } finally {
      setSourcesLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-20">
      <SetTopbar title={saving ? "Saving..." : "Stance Editor"} />

      {/* HEADER */}
      <div className="flex flex-col gap-6">
        <Link href="/stances" className="text-vault-text-3 hover:text-vault-text transition-colors font-mono text-[10px] uppercase flex items-center gap-1 w-fit tracking-wider">
          <ArrowLeft className="w-3 h-3" /> Stances
        </Link>
        
        <div className="flex items-start justify-between gap-4 border-b border-vault-border pb-6">
          <div className="flex flex-col gap-4">
            <h1 className="font-serif text-[36px] text-vault-text leading-tight">{stance.topic}</h1>
            <div className="flex items-center gap-3">
              <StatusBadge status={stance.status} />
              <div className="font-mono text-[10px] bg-vault-bg-4 text-vault-text-3 px-2 py-0.5 rounded-[3px] uppercase tracking-wider">
                {stance.category}
              </div>
              <div className="font-mono text-[10px] text-vault-text-3 uppercase tracking-wider">
                Last updated {format(new Date(stance.last_updated), "MMM d, yyyy")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={stance.status}
              onChange={(e) => {
                handleUpdate({ status: e.target.value })
                saveToDb({ ...stance, status: e.target.value })
              }}
              className="bg-vault-bg-4 border border-vault-border text-vault-text-2 font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-[4px] focus:outline-none focus:border-vault-accent cursor-pointer outline-none"
            >
              <option value="empty">Not Started</option>
              <option value="undecided">Undecided</option>
              <option value="evolving">Evolving</option>
              <option value="settled">Settled</option>
            </select>

            <button 
              onClick={() => saveToDb(stance)}
              disabled={saving}
              className="bg-vault-accent text-[#0D0D0F] font-mono text-[11px] uppercase tracking-[0.1em] py-1.5 px-4 rounded-[4px] hover:bg-vault-accent-2 transition-colors duration-150 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-8 xl:gap-12 w-full">
        
        {/* MAIN EDITOR COLUMN */}
        <div className="flex flex-col gap-0">
          
          <Section num={1} title="My Stance">
            <AutoTextArea 
              value={stance.my_stance} 
              onChange={(val: string) => handleUpdate({ my_stance: val })} 
              placeholder="State your position clearly in one or two sentences..." 
              className="font-serif italic text-[19px] text-vault-text leading-snug"
            />
          </Section>

          <Section num={2} title="Why I Hold This">
            <AutoTextArea 
              value={stance.why_i_hold_this} 
              onChange={(val: string) => handleUpdate({ why_i_hold_this: val })} 
              placeholder="What reasoning, evidence, or experience convinced you?" 
              className="font-sans text-[16px] text-vault-text-2 leading-[1.7]"
            />
          </Section>

          <Section num={3} title="Strongest Argument Against Me">
            <AutoTextArea 
              value={stance.strongest_counter} 
              onChange={(val: string) => handleUpdate({ strongest_counter: val })} 
              placeholder="Write the best case the opposing side would make. No strawmanning." 
              className="font-sans text-[16px] text-vault-text-2 leading-[1.7]"
            />
            <div className="mt-4">
              <button 
                onClick={generateSteelman}
                disabled={steelmanLoading}
                className="flex items-center gap-1.5 text-vault-accent hover:text-vault-accent-2 transition-colors font-mono text-[10px] uppercase tracking-wider"
              >
                <Sparkles className="w-3 h-3" />
                {steelmanLoading ? 'Generating...' : '✦ Generate steelman'}
              </button>
              
              {steelmanResponse && (
                <div className="mt-4 border-l-2 border-vault-accent pl-4 py-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-vault-accent/[0.15] text-vault-accent font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-[2px] tracking-widest">AI Response</div>
                  </div>
                  <div className="font-sans text-[15px] text-vault-text-2 leading-relaxed mb-3">
                    {steelmanResponse}
                  </div>
                  <button 
                    onClick={() => {
                      handleUpdate({ strongest_counter: (stance.strongest_counter ? stance.strongest_counter + '\n\n' : '') + steelmanResponse })
                      setSteelmanResponse('')
                    }}
                    className="font-mono text-[10px] uppercase tracking-wider text-[#0D0D0F] bg-vault-accent px-3 py-1.5 rounded hover:bg-vault-accent-2 transition-colors"
                  >
                    Insert into section
                  </button>
                </div>
              )}
            </div>
          </Section>

          <Section num={4} title="My Rebuttal">
            <AutoTextArea 
              value={stance.my_rebuttal} 
              onChange={(val: string) => handleUpdate({ my_rebuttal: val })} 
              placeholder="Why does your stance hold despite the counter-argument above?" 
              className="font-sans text-[16px] text-vault-text-2 leading-[1.7]"
            />
          </Section>

          <Section num={5} title="Where I'm Uncertain">
            <AutoTextArea 
              value={parsedUncertainties.text} 
              onChange={(val: string) => handleUncertaintiesText(val)} 
              placeholder="What aspects of this topic are you still unsure about?" 
              className="font-sans text-[16px] text-vault-text-2 leading-[1.7] mb-4"
            />
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-vault-border">
              {parsedUncertainties.tags.map((tag: string, i: number) => (
                <div key={i} className="flex items-center gap-1.5 bg-vault-accent/[0.1] border border-vault-accent/20 text-vault-accent font-mono text-[10px] px-2 py-1 rounded-[4px]">
                  {tag}
                  <button onClick={() => removeTag(i)} className="hover:text-vault-text leading-none">&times;</button>
                </div>
              ))}
              <input 
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="+ Add tag (Enter)"
                className="bg-transparent border-none focus:outline-none font-mono text-[10px] text-vault-text placeholder-vault-text-3 min-w-[120px] ml-1"
              />
            </div>
          </Section>

          <Section num={6} title="How This Affects How I Live">
            <AutoTextArea 
              value={stance.life_impact} 
              onChange={(val: string) => handleUpdate({ life_impact: val })} 
              placeholder="Does this stance change your behaviour, relationships, or decisions?" 
              className="font-sans text-[16px] text-vault-text-2 leading-[1.7]"
            />
          </Section>

          <Section num={7} title="Sources & Influences">
            <div className="flex flex-col gap-3">
              {parsedSources.map((source: any, i: number) => (
                <div key={i} className="flex flex-col gap-2 p-3 bg-vault-bg-4 border border-vault-border rounded-[4px]">
                  <div className="flex flex-wrap items-center gap-3">
                    <select 
                      value={source.type}
                      onChange={e => updateSource(i, { type: e.target.value })}
                      className="bg-vault-bg-3 border border-vault-border-2 rounded text-vault-text-2 text-[12px] px-2 py-1 font-sans focus:outline-none focus:border-vault-accent outline-none"
                    >
                      <option>Book</option>
                      <option>Paper</option>
                      <option>Article</option>
                      <option>Experience</option>
                      <option>AI Summary</option>
                    </select>
                    <input 
                      value={source.title}
                      onChange={e => updateSource(i, { title: e.target.value })}
                      placeholder="Title"
                      className="flex-1 bg-transparent border-b border-transparent focus:border-vault-accent text-[14px] text-vault-text outline-none px-1"
                    />
                    <input 
                      value={source.author}
                      onChange={e => updateSource(i, { author: e.target.value })}
                      placeholder="Author"
                      className="w-1/4 min-w-[100px] bg-transparent border-b border-transparent focus:border-vault-accent text-[14px] text-vault-text-2 outline-none px-1"
                    />
                    <label className="flex items-center gap-2 text-[12px] text-vault-text-3 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={source.verified}
                        onChange={e => updateSource(i, { verified: e.target.checked })}
                        className="accent-vault-accent w-3 h-3"
                      />
                      Verified
                    </label>
                  </div>
                  {source.type === 'AI Summary' && !source.verified && (
                    <div className="flex items-center gap-2 mt-1 bg-vault-evolving/[0.1] border border-vault-evolving/20 text-vault-evolving font-mono text-[10px] px-2 py-1 rounded w-fit">
                      <span>⚠ Primary source not yet verified</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-4">
              <button 
                onClick={() => {
                  const newSources = [...parsedSources, { type: 'Book', title: '', author: '', verified: false }]
                  handleUpdate({ sources: JSON.stringify(newSources) })
                }}
                className="font-mono text-[10px] uppercase text-vault-text-3 hover:text-vault-text transition-colors tracking-wider border border-vault-border-2 px-3 py-1.5 rounded"
              >
                + Add Source
              </button>
              <button 
                onClick={suggestSources}
                disabled={sourcesLoading}
                className="flex items-center gap-1.5 text-vault-accent hover:text-vault-accent-2 transition-colors font-mono text-[10px] uppercase tracking-wider"
              >
                <Sparkles className="w-3 h-3" />
                {sourcesLoading ? 'Thinking...' : '✦ Suggest sources'}
              </button>
            </div>

            {sourcesResponse.length > 0 && (
              <div className="mt-4 border-l-2 border-vault-accent pl-4 py-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-vault-accent/[0.15] text-vault-accent font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-[2px] tracking-widest">AI Suggestions</div>
                </div>
                <div className="flex flex-col gap-4">
                  {sourcesResponse.map((src, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="font-sans text-[14px] text-vault-text font-medium">{src.title} <span className="text-vault-text-3 font-normal">by {src.author} ({src.type})</span></div>
                      <div className="font-sans text-[13px] text-vault-text-2">{src.why}</div>
                      <button 
                        onClick={() => {
                          const newSources = [...parsedSources, { type: src.type, title: src.title, author: src.author, verified: false }]
                          handleUpdate({ sources: JSON.stringify(newSources) })
                        }}
                        className="text-vault-accent text-[11px] font-sans hover:underline w-fit mt-1"
                      >
                        + Add to sources
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>

          <Section num={8} title="Last Updated">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[11px] text-vault-text-3">
                {format(new Date(stance.last_updated), "MMM d, yyyy 'at' HH:mm")}
              </div>
              <button
                onClick={() => {
                  const now = new Date().toISOString()
                  handleUpdate({ last_updated: now })
                  saveToDb({ ...stance, last_updated: now })
                }}
                className="border border-vault-border bg-vault-bg-3 hover:bg-vault-bg-4 text-vault-text-2 font-mono text-[10px] uppercase px-3 py-1.5 rounded transition-colors tracking-wider"
              >
                Mark as reviewed today
              </button>
            </div>
          </Section>
          
        </div>

        {/* RIGHT SIDEBAR: AI PANEL */}
        <div className="hidden xl:flex flex-col w-[280px] shrink-0 gap-4 mt-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-vault-accent" />
            <div className="font-mono text-[10px] uppercase tracking-widest text-vault-text-3">AI Assistant</div>
          </div>
          
          <button 
            onClick={() => alert("Coming soon: AI Challenge")}
            className="flex items-center justify-between w-full bg-vault-bg-2 border border-vault-border hover:border-vault-accent-border hover:bg-vault-accent/[0.02] p-3 rounded-[6px] transition-all duration-150 text-left group"
          >
            <span className="font-mono text-[11px] text-vault-text-2 group-hover:text-vault-accent transition-colors">✦ Challenge my stance</span>
          </button>

          <button 
            onClick={() => alert("Coming soon: AI Contradiction Check")}
            className="flex items-center justify-between w-full bg-vault-bg-2 border border-vault-border hover:border-vault-accent-border hover:bg-vault-accent/[0.02] p-3 rounded-[6px] transition-all duration-150 text-left group"
          >
            <span className="font-mono text-[11px] text-vault-text-2 group-hover:text-vault-accent transition-colors">✦ Find contradictions</span>
          </button>

          <button 
            onClick={() => alert("Coming soon: AI Clarity")}
            className="flex items-center justify-between w-full bg-vault-bg-2 border border-vault-border hover:border-vault-accent-border hover:bg-vault-accent/[0.02] p-3 rounded-[6px] transition-all duration-150 text-left group"
          >
            <span className="font-mono text-[11px] text-vault-text-2 group-hover:text-vault-accent transition-colors">✦ Improve clarity</span>
          </button>
          
          <div className="bg-vault-accent/[0.05] border border-vault-accent/20 rounded-[6px] p-4 flex flex-col gap-3 mt-4">
            <div className="font-sans text-[13px] text-vault-text leading-relaxed">
              You claim objective morality exists, but in your previous stance "Meaning & purpose of life" you stated that meaning is entirely self-constructed. How do you reconcile objective morals with subjective meaning?
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-vault-accent/10">
              <button className="text-vault-accent hover:underline font-mono text-[9px] uppercase tracking-wider">Reflect</button>
              <button className="text-vault-text-3 hover:text-vault-text font-mono text-[9px] uppercase tracking-wider transition-colors">Dismiss</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
