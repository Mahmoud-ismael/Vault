'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Search as SearchIcon, Loader2, Sparkles, Target, BookOpen, FileText, Archive, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FrictionPrompt } from '@/components/vault/FrictionPrompt'
import { EmptyState } from '@/components/shared/EmptyState'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'

type SearchMode = 'Vault' | 'Web + AI' | 'Deep Reason' | 'Academic'

export default function SearchClient() {
  const [query, setQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [mode, setMode] = useState<SearchMode>('Vault')
  const [recent, setRecent] = useState<string[]>([])
  
  const [vaultResults, setVaultResults] = useState<any>({ stances: [], journal: [], notes: [], docs: [] })
  const [aiResponse, setAiResponse] = useState('')
  const [aiSources, setAiSources] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem('vault_recent_searches')
    if (saved) setRecent(JSON.parse(saved))
  }, [])

  const saveRecent = (q: string) => {
    const updated = [q, ...recent.filter(item => item !== q)].slice(0, 5)
    setRecent(updated)
    localStorage.setItem('vault_recent_searches', JSON.stringify(updated))
  }

  const handleSearch = async (e?: React.FormEvent, forceQuery?: string) => {
    if (e) e.preventDefault()
    const q = forceQuery || query
    if (!q.trim()) return

    setActiveQuery(q)
    setQuery(q)
    saveRecent(q)
    setLoading(true)
    
    // Reset states
    setVaultResults({ stances: [], journal: [], notes: [], docs: [] })
    setAiResponse('')
    setAiSources([])

    if (mode === 'Vault') {
      const [stancesReq, journalReq, notesReq, docsReq] = await Promise.all([
        supabase.from('stances').select('*').or(`topic.ilike.%${q}%,my_stance.ilike.%${q}%`),
        supabase.from('journal_entries').select('*').ilike('title', `%${q}%`),
        supabase.from('notes').select('*').ilike('title', `%${q}%`),
        supabase.from('documents').select('*').or(`title.ilike.%${q}%,extracted_text.ilike.%${q}%`),
      ])
      
      setVaultResults({
        stances: stancesReq.data || [],
        journal: journalReq.data || [],
        notes: notesReq.data || [],
        docs: docsReq.data || []
      })
      setLoading(false)
    } else {
      // AI Modes
      const endpoint = mode === 'Deep Reason' ? '/api/ai/reason' : '/api/ai/websearch'
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, mode: mode.toUpperCase() })
        })
        
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let fullText = ''
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value)
            fullText += chunk
            
            // Extract sources if present
            if (fullText.includes('___SOURCES___')) {
              const [textPart, sourcesPart] = fullText.split('___SOURCES___')
              setAiResponse(textPart)
              try {
                setAiSources(JSON.parse(sourcesPart))
              } catch (e) {}
            } else {
              setAiResponse(fullText)
            }
          }
        }
      } finally {
        setLoading(false)
        // trigger background vault search for "Related in your vault"
        if (mode === 'Web + AI' || mode === 'Academic') {
          const [stancesReq, notesReq] = await Promise.all([
            supabase.from('stances').select('*').or(`topic.ilike.%${q}%,my_stance.ilike.%${q}%`).limit(3),
            supabase.from('notes').select('*').ilike('title', `%${q}%`).limit(3),
          ])
          setVaultResults({
            stances: stancesReq.data || [],
            notes: notesReq.data || [],
            journal: [], docs: []
          })
        }
      }
    }
  }

  // Trigger search when mode changes if query exists
  useEffect(() => {
    if (activeQuery) {
      handleSearch(undefined, activeQuery)
    }
  }, [mode])

  return (
    <div className="w-full min-h-screen bg-vault-bg py-10 md:py-20 px-4 md:px-8">
      <div className="max-w-[780px] mx-auto flex flex-col gap-6 md:gap-8">
        
        {/* HERO */}
        {!activeQuery && (
          <div className="flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6 md:mt-10 text-center">
            <h1 className="text-[32px] md:text-[44px] text-vault-text mb-1 font-bold">Ask Anything</h1>
            <p className="text-[10px] md:text-[11px] uppercase tracking-widest text-vault-text-3 mb-8">
              Search your vault · Research the web · Think out loud
            </p>
          </div>
        )}

        {/* SEARCH BAR & TABS */}
        <div className={`flex flex-col gap-4 transition-all duration-500 ${activeQuery ? '' : 'transform translate-y-4'}`}>
          <form onSubmit={handleSearch} className="relative group">
            <SearchIcon className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-vault-text-3 transition-colors group-focus-within:text-vault-accent" />
            <input 
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="What do you want to understand?"
              className="w-full bg-vault-bg-2 border border-vault-border-2 rounded-[8px] py-4 md:py-4 pl-12 md:pl-[52px] pr-12 md:pr-[52px] text-[16px] md:text-[18px] text-vault-text placeholder:text-vault-text-3 focus:outline-none focus:border-vault-accent focus:ring-[3px] focus:ring-vault-accent-dim transition-all shadow-sm h-14 md:h-auto"
            />
            <button 
              type="submit"
              disabled={!query.trim()}
              className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-10 h-10 md:w-9 md:h-9 rounded-full bg-vault-accent text-[#0D0D0F] flex items-center justify-center hover:bg-vault-accent-2 disabled:opacity-50 transition-colors"
            >
              <ArrowRight className="w-5 h-5 md:w-4 md:h-4" />
            </button>
          </form>

          <div className="flex border border-vault-border rounded-[6px] overflow-x-auto no-scrollbar w-full sm:w-fit mx-auto shadow-sm bg-vault-bg-2">
            {(['Vault', 'Web + AI', 'Deep Reason', 'Academic'] as SearchMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 sm:flex-none px-4 py-2.5 md:py-2 text-[10px] uppercase tracking-normal transition-colors whitespace-nowrap font-bold ${
                  mode === m 
                    ? 'bg-vault-accent text-[#0D0D0F]' 
                    : 'text-vault-text-3 hover:text-vault-text hover:bg-vault-bg-3'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {!activeQuery && recent.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2 md:mt-4">
              {recent.map((r, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSearch(undefined, r)}
                  className="px-4 py-2 rounded-full border border-vault-border-2 bg-vault-bg-2 text-vault-text-3 text-[13px] hover:text-vault-text hover:border-vault-accent-border transition-colors font-medium"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LOADING */}
        {loading && !aiResponse && (
          <div className="flex flex-col items-center justify-center py-16 md:py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-vault-accent" />
            <div className="text-[10px] uppercase tracking-normal text-vault-text-3 font-bold">
              {mode === 'Vault' ? 'Searching Vault...' : 'AI Thinking...'}
            </div>
          </div>
        )}

        {/* RESULTS: VAULT */}
        {activeQuery && !loading && mode === 'Vault' && (
          <div className="flex flex-col gap-8 md:gap-10 mt-4 md:mt-8">
            {vaultResults.stances.length === 0 && vaultResults.journal.length === 0 && vaultResults.notes.length === 0 && vaultResults.docs.length === 0 && (
              <EmptyState 
                icon={SearchIcon}
                title="No results found."
                subtitle="Try a different term or use Web + AI."
              />
            )}

            {/* Render Stances */}
            {vaultResults.stances.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-normal text-vault-text-3 border-b border-vault-border pb-2 font-bold">
                  <Target className="w-3.5 h-3.5" /> Stances ({vaultResults.stances.length})
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {vaultResults.stances.map((s: any) => (
                    <Link href={`/stances/${s.id}`} key={s.id} className="block group bg-vault-bg-2 border border-vault-border rounded-[6px] p-5 hover:border-vault-accent-border hover:bg-vault-bg-3 transition-colors">
                      <h3 className="text-[20px] text-vault-text mb-2 font-bold">{s.topic}</h3>
                      <p className="text-[14px] text-vault-text-2 line-clamp-2 leading-relaxed">{s.my_stance || 'No stance recorded.'}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Render Notes */}
            {vaultResults.notes.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-normal text-vault-text-3 border-b border-vault-border pb-2 font-bold">
                  <FileText className="w-3.5 h-3.5" /> Notes ({vaultResults.notes.length})
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {vaultResults.notes.map((n: any) => (
                    <Link href={`/notes/${n.id}`} key={n.id} className="block group bg-vault-bg-2 border border-vault-border rounded-[6px] p-4 hover:border-vault-accent-border hover:bg-vault-bg-3 transition-colors">
                      <h3 className="font-bold text-[16px] text-vault-text">{n.title}</h3>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Render Docs */}
            {vaultResults.docs.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-normal text-vault-text-3 border-b border-vault-border pb-2 font-bold">
                  <Archive className="w-3.5 h-3.5" /> Documents ({vaultResults.docs.length})
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {vaultResults.docs.map((d: any) => (
                    <Link href={`/documents/${d.id}`} key={d.id} className="block group bg-vault-bg-2 border border-vault-border rounded-[6px] p-5 hover:border-vault-accent-border hover:bg-vault-bg-3 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] uppercase tracking-normal px-1.5 py-0.5 rounded-[3px] bg-vault-bg-4 text-vault-text-3 font-bold">{d.file_type}</span>
                        <h3 className="font-bold text-[16px] text-vault-text">{d.title}</h3>
                      </div>
                      <p className="text-[13px] text-vault-text-2 line-clamp-2 leading-relaxed">{d.summary || 'Processing...'}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Render Journal */}
            {vaultResults.journal.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-normal text-vault-text-3 border-b border-vault-border pb-2 font-bold">
                  <BookOpen className="w-3.5 h-3.5" /> Journal ({vaultResults.journal.length})
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {vaultResults.journal.map((j: any) => (
                    <Link href={`/journal/${j.id}`} key={j.id} className="block group bg-vault-bg-2 border border-vault-border rounded-[6px] p-4 hover:border-vault-accent-border hover:bg-vault-bg-3 transition-colors">
                      <h3 className="font-bold text-[16px] text-vault-text">{j.title}</h3>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESULTS: AI MODES */}
        {activeQuery && (mode !== 'Vault') && (aiResponse || loading) && (
          <div className="flex flex-col gap-6 md:gap-8 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* AI Response Card */}
            <div className="bg-vault-bg-2 border-2 border-vault-accent-dim rounded-[12px] p-6 md:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-vault-accent to-vault-accent/20" />
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-4 h-4 text-vault-accent" />
                <span className="text-[11px] uppercase tracking-normal text-vault-text-2 font-bold">
                  {mode === 'Deep Reason' ? 'Llama 3.1 405B Analysis' : 'Llama + Tavily Synthesis'}
                </span>
              </div>
              <div className="text-[16px] md:text-[17px] leading-[1.8] text-vault-text prose prose-invert max-w-none [&_h1]:text-[22px] md:[&_h1]:text-[24px] [&_h1]:mt-6 [&_h1]:mb-4 [&_h1]:font-bold [&_h2]:text-[18px] md:[&_h2]:text-[20px] [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_p]:mb-4">
                <ReactMarkdown>{aiResponse}</ReactMarkdown>
              </div>

              {/* Sources array (Web + AI / Academic) */}
              {aiSources.length > 0 && (
                <div className="mt-8 pt-6 border-t border-vault-border-2 flex flex-col gap-3">
                  <div className="text-[10px] uppercase tracking-normal text-vault-text-3 font-bold">Grounding Sources</div>
                  <div className="flex flex-wrap gap-2">
                    {aiSources.map((src, i) => (
                      <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-vault-bg-3 border border-vault-border rounded-[4px] hover:border-vault-accent-border transition-colors group">
                        <ExternalLink className="w-3.5 h-3.5 text-vault-text-3 group-hover:text-vault-accent transition-colors" />
                        <span className="text-[12px] text-vault-text-2 group-hover:text-vault-text truncate max-w-[150px] md:max-w-[200px] font-medium">{src.title || src.url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Friction Prompt (Only Web/Academic) */}
            {(mode === 'Web + AI' || mode === 'Academic') && !loading && (
              <FrictionPrompt query={activeQuery} />
            )}

            {/* Related Vault Items */}
            {(mode === 'Web + AI' || mode === 'Academic') && !loading && (vaultResults.stances.length > 0 || vaultResults.notes.length > 0) && (
              <div className="flex flex-col gap-4 mt-2">
                <div className="text-[10px] uppercase tracking-normal text-vault-text-3 border-b border-vault-border pb-2 font-bold">
                  Related in your vault
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vaultResults.stances.slice(0, 2).map((s: any) => (
                    <Link href={`/stances/${s.id}`} key={s.id} className="bg-vault-bg-2 border border-vault-border rounded-[6px] p-5 hover:border-vault-accent-border transition-colors">
                      <div className="flex items-center gap-2 mb-2 text-[9px] uppercase text-vault-text-3 font-bold"><Target className="w-3 h-3" /> Stance</div>
                      <h3 className="text-[18px] text-vault-text font-bold">{s.topic}</h3>
                    </Link>
                  ))}
                  {vaultResults.notes.slice(0, 2).map((n: any) => (
                    <Link href={`/notes/${n.id}`} key={n.id} className="bg-vault-bg-2 border border-vault-border rounded-[6px] p-5 hover:border-vault-accent-border transition-colors">
                      <div className="flex items-center gap-2 mb-2 text-[9px] uppercase text-vault-text-3 font-bold"><FileText className="w-3 h-3" /> Note</div>
                      <h3 className="font-bold text-[15px] text-vault-text">{n.title}</h3>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
