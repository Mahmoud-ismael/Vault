'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns'
import { Plus, Search, Calendar as CalendarIcon, List, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { SetTopbar } from '@/components/vault/SetTopbar'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

type Entry = {
  id: string
  title: string
  content: any
  tags: string[]
  created_at: string
}

function extractTextFromJSON(node: any): string {
  if (!node) return ''
  if (node.type === 'text') return node.text || ''
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractTextFromJSON).join(' ')
  }
  return ''
}

function ReadOnlyEditor({ content }: { content: any }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || {},
    editable: false,
  })

  return (
    <div className="[&_p]:mb-4 [&_p:last-child]:mb-0 [&_h1]:font-serif [&_h1]:text-[28px] [&_h1]:text-vault-text [&_h1]:mb-4 [&_h2]:font-sans [&_h2]:text-[20px] [&_h2]:text-vault-text [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_blockquote]:border-l-2 [&_blockquote]:border-vault-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-vault-text-3">
      <EditorContent editor={editor} />
    </div>
  )
}

export default function JournalClient({ initialEntries }: { initialEntries: Entry[] }) {
  const [entries] = useState<Entry[]>(initialEntries)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [search, setSearch] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const selectedEntry = useMemo(() => entries.find(e => e.id === selectedId), [entries, selectedId])

  const filteredEntries = useMemo(() => {
    if (!search) return entries
    const s = search.toLowerCase()
    return entries.filter(e => 
      e.title.toLowerCase().includes(s) || 
      extractTextFromJSON(e.content).toLowerCase().includes(s)
    )
  }, [entries, search])

  // Calendar logic
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  const startDay = monthStart.getDay() // 0 is Sunday
  const paddingDays = Array.from({ length: startDay }).map((_, i) => i)

  return (
    <div className="flex h-[calc(100vh-52px)] -m-8 lg:-m-10">
      <SetTopbar title="Journal" />

      {/* LEFT PANEL */}
      <div className="w-[260px] flex-shrink-0 flex flex-col border-r border-vault-border bg-vault-bg-2">
        
        {/* Header */}
        <div className="flex flex-col gap-3 p-4 border-b border-vault-border">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-widest text-vault-text-3">
              JOURNAL <span className="text-vault-text-4 ml-1">({entries.length})</span>
            </div>
            <div className="flex items-center gap-1 bg-vault-bg-4 rounded-[4px] p-0.5">
              <button 
                onClick={() => setView('list')}
                className={`p-1 rounded-[3px] transition-colors ${view === 'list' ? 'bg-vault-bg-2 text-vault-text shadow-sm' : 'text-vault-text-3 hover:text-vault-text-2'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setView('calendar')}
                className={`p-1 rounded-[3px] transition-colors ${view === 'calendar' ? 'bg-vault-bg-2 text-vault-text shadow-sm' : 'text-vault-text-3 hover:text-vault-text-2'}`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-vault-text-3" />
            <input 
              type="text"
              placeholder="Search journal..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-vault-bg-4 border border-vault-border rounded-[4px] pl-8 pr-3 py-1.5 font-sans text-[13px] text-vault-text placeholder-vault-text-3 focus:outline-none focus:border-vault-accent transition-colors duration-150"
            />
          </div>
        </div>

        {/* List View */}
        {view === 'list' && (
          <div className="flex-1 overflow-y-auto flex flex-col p-2 gap-1">
            {filteredEntries.map(entry => {
              const isActive = selectedId === entry.id
              const preview = extractTextFromJSON(entry.content)
              const truncatedPreview = preview.length > 80 ? preview.substring(0, 80) + '...' : preview

              return (
                <button
                  key={entry.id}
                  onClick={() => setSelectedId(entry.id)}
                  className={`flex flex-col items-start gap-1.5 p-3 rounded-[4px] border-l-2 transition-all duration-150 text-left ${
                    isActive 
                      ? 'bg-vault-accent-dim border-vault-accent' 
                      : 'border-transparent hover:bg-vault-bg-3'
                  }`}
                >
                  <div className="font-mono text-[9px] uppercase text-vault-text-3 tracking-wider">
                    {format(new Date(entry.created_at), 'dd MMM yyyy')}
                  </div>
                  <div className={`font-sans text-[14px] ${isActive ? 'text-vault-accent' : 'text-vault-text'} line-clamp-1`}>
                    {entry.title || 'Untitled'}
                  </div>
                  <div className="font-sans text-[12px] text-vault-text-3 line-clamp-2 leading-snug">
                    {truncatedPreview || 'No content...'}
                  </div>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {entry.tags.map((tag, i) => (
                        <div key={i} className="font-mono text-[9px] bg-vault-bg-4 text-vault-text-3 px-1.5 py-0.5 rounded-[2px]">
                          {tag}
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Calendar View */}
        {view === 'calendar' && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
            <div className="flex items-center justify-between px-1">
              <div className="font-mono text-[11px] text-vault-text uppercase tracking-widest">
                {format(currentMonth, 'MMMM yyyy')}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-vault-text-3 hover:text-vault-text transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-vault-text-3 hover:text-vault-text transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1.5">
              {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(day => (
                <div key={day} className="font-mono text-[9px] uppercase text-vault-text-3 text-center mb-2 tracking-widest">
                  {day}
                </div>
              ))}
              
              {paddingDays.map(i => (
                <div key={`pad-${i}`} className="aspect-square" />
              ))}
              
              {daysInMonth.map(date => {
                const dayEntries = entries.filter(e => isSameDay(new Date(e.created_at), date))
                const hasEntry = dayEntries.length > 0
                const today = isToday(date)
                
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => {
                      if (hasEntry) setSelectedId(dayEntries[0].id)
                    }}
                    disabled={!hasEntry}
                    className={`aspect-square flex flex-col items-center justify-center rounded-[4px] relative transition-colors ${
                      hasEntry ? 'bg-vault-bg-3 hover:bg-vault-bg-4 cursor-pointer text-vault-text' : 'bg-vault-bg-2 border border-vault-border text-vault-text-3 cursor-default'
                    } ${today ? 'border-vault-accent text-vault-accent border' : ''} ${
                      selectedId && hasEntry && dayEntries[0].id === selectedId ? 'ring-1 ring-vault-accent' : ''
                    }`}
                  >
                    <span className="font-mono text-[10px]">{format(date, 'd')}</span>
                    {hasEntry && (
                      <div className="w-1 h-1 bg-vault-accent rounded-full absolute bottom-1" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-vault-border">
          <Link 
            href="/journal/new"
            className="flex items-center justify-center gap-2 w-full bg-vault-bg-3 hover:bg-vault-bg-4 border border-vault-border text-vault-text-2 font-mono text-[11px] uppercase tracking-[0.1em] py-2 rounded-[4px] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Entry
          </Link>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 bg-vault-bg flex flex-col overflow-hidden relative">
        {!selectedEntry ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="font-serif italic text-[24px] text-vault-text-3">
              Select an entry or write something new.
            </div>
            <Link 
              href="/journal/new"
              className="bg-vault-accent text-[#0D0D0F] font-mono text-[11px] uppercase tracking-[0.1em] py-2 px-6 rounded-[4px] hover:bg-vault-accent-2 transition-colors duration-150"
            >
              New Entry
            </Link>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-10 lg:p-16 flex flex-col gap-6 w-full mx-auto max-w-4xl">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase text-vault-text-3 tracking-widest">
                {format(new Date(selectedEntry.created_at), 'EEEE, MMMM do yyyy')}
              </div>
              <Link 
                href={`/journal/${selectedEntry.id}`}
                className="flex items-center gap-1 font-mono text-[10px] uppercase text-vault-accent hover:text-vault-accent-2 tracking-wider transition-colors"
              >
                Open full editor <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            
            <h1 className="font-serif text-[36px] text-vault-text leading-tight mt-2">
              {selectedEntry.title}
            </h1>
            
            {selectedEntry.tags && selectedEntry.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedEntry.tags.map((tag, i) => (
                  <div key={i} className="font-mono text-[10px] bg-vault-bg-4 text-vault-text-3 px-2 py-0.5 rounded-[3px]">
                    {tag}
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-8 font-sans text-[16px] leading-[1.8] text-vault-text-2 max-w-none w-full">
              <ReadOnlyEditor content={selectedEntry.content} key={selectedEntry.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
