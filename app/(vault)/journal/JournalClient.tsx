'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns'
import { Plus, Search, Calendar as CalendarIcon, List, ArrowRight, ChevronLeft, ChevronRight, BookOpen, ChevronLeft as BackIcon } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { SetTopbar } from '@/components/vault/SetTopbar'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useTopbar } from '@/components/vault/TopbarContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
    <div className="[&_p]:mb-4 [&_p:last-child]:mb-0 [&_h1]: [&_h1]:text-[28px] [&_h1]:text-vault-text [&_h1]:mb-4 [&_h2]: [&_h2]:text-[20px] [&_h2]:text-vault-text [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_blockquote]:border-l-2 [&_blockquote]:border-vault-accent [&_blockquote]:pl-4 [&_blockquote]: [&_blockquote]:text-vault-text-3">
      <EditorContent editor={editor} />
    </div>
  )
}

export default function JournalClient({ initialEntries }: { initialEntries: Entry[] }) {
  const router = useRouter()
  const { setFab } = useTopbar()
  const [entries] = useState<Entry[]>(initialEntries)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')
  const [search, setSearch] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Setup FAB
  useEffect(() => {
    setFab({
      label: 'New Entry',
      icon: Plus,
      onClick: () => router.push('/journal/new')
    })
    return () => setFab(null)
  }, [setFab, router])

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setMobileView('detail')
  }

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
    <div className="flex h-screen md:h-[calc(100vh-52px)] -m-4 md:-m-8 lg:-m-10 overflow-hidden bg-vault-bg">
      <SetTopbar title="Journal" />

      {/* LEFT PANEL (List) */}
      <div className={`w-full md:w-[320px] lg:w-[380px] flex-shrink-0 flex flex-col border-r border-vault-border bg-vault-bg-2 transition-transform duration-300 md:translate-x-0 ${
        mobileView === 'detail' ? 'hidden md:flex' : 'flex'
      }`}>
        
        {/* Header */}
        <div className="flex flex-col gap-3 p-4 border-b border-vault-border">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-normal text-vault-text-3 font-bold">
              JOURNAL <span className="text-vault-text-4 ml-1">({entries.length})</span>
            </div>
            <div className="flex items-center gap-1 bg-vault-bg-4 rounded-[4px] p-0.5">
              <button 
                onClick={() => setView('list')}
                className={`p-1.5 rounded-[3px] transition-colors ${view === 'list' ? 'bg-vault-bg-2 text-vault-text shadow-sm' : 'text-vault-text-3 hover:text-vault-text-2'}`}
              >
                <List className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </button>
              <button 
                onClick={() => setView('calendar')}
                className={`p-1.5 rounded-[3px] transition-colors ${view === 'calendar' ? 'bg-vault-bg-2 text-vault-text shadow-sm' : 'text-vault-text-3 hover:text-vault-text-2'}`}
              >
                <CalendarIcon className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 md:w-3.5 md:h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-vault-text-3" />
            <input 
              type="text"
              placeholder="Search journal..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-vault-bg-4 border border-vault-border rounded-[4px] pl-9 pr-3 py-2.5 md:py-1.5 text-[16px] md:text-[13px] text-vault-text placeholder-vault-text-3 focus:outline-none focus:border-vault-accent transition-colors duration-150"
            />
          </div>
        </div>

        {/* List View */}
        {view === 'list' && (
          <div className="flex-1 overflow-y-auto flex flex-col p-2 gap-1 no-scrollbar">
            {filteredEntries.length === 0 ? (
              <EmptyState 
                icon={BookOpen}
                title="No entries yet."
                subtitle="Begin with a thought."
              />
            ) : (
              filteredEntries.map(entry => {
                const isActive = selectedId === entry.id
                const preview = extractTextFromJSON(entry.content)
                const truncatedPreview = preview.length > 80 ? preview.substring(0, 80) + '...' : preview

                return (
                  <button
                    key={entry.id}
                    onClick={() => handleSelect(entry.id)}
                    className={`flex flex-col items-start gap-2 p-5 md:p-3 rounded-[6px] border-l-2 transition-all duration-150 text-left min-h-[90px] md:min-h-0 ${
                      isActive 
                        ? 'bg-vault-accent-dim border-vault-accent' 
                        : 'border-transparent hover:bg-vault-bg-3'
                    }`}
                  >
                    <div className="text-[10px] md:text-[9px] uppercase text-vault-text-3 tracking-normal font-bold">
                      {format(new Date(entry.created_at), 'dd MMM yyyy')}
                    </div>
                    <div className={`text-[16px] md:text-[14px] ${isActive ? 'text-vault-accent' : 'text-vault-text'} line-clamp-1 font-bold`}>
                      {entry.title || 'Untitled'}
                    </div>
                    <div className="text-[13px] md:text-[12px] text-vault-text-3 line-clamp-2 leading-relaxed">
                      {truncatedPreview || 'No content...'}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )}

        {/* Calendar View */}
        {view === 'calendar' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-4 flex flex-col gap-6 no-scrollbar">
            <div className="flex items-center justify-between px-1">
              <div className="text-[14px] md:text-[11px] text-vault-text uppercase tracking-normal font-bold">
                {format(currentMonth, 'MMMM yyyy')}
              </div>
              <div className="flex items-center gap-4 md:gap-2">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 md:p-1 text-vault-text-3 hover:text-vault-text transition-colors">
                  <ChevronLeft className="w-6 h-6 md:w-4 md:h-4" />
                </button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 md:p-1 text-vault-text-3 hover:text-vault-text transition-colors">
                  <ChevronRight className="w-6 h-6 md:w-4 md:h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2 md:gap-1.5">
              {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(day => (
                <div key={day} className="text-[10px] md:text-[9px] uppercase text-vault-text-3 text-center mb-2 tracking-normal font-bold">
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
                      if (hasEntry) handleSelect(dayEntries[0].id)
                    }}
                    disabled={!hasEntry}
                    className={`aspect-square flex flex-col items-center justify-center rounded-[6px] relative transition-all duration-150 ${
                      hasEntry 
                        ? 'bg-vault-bg-3 hover:bg-vault-bg-4 cursor-pointer text-vault-text border border-vault-accent/30 shadow-sm' 
                        : 'bg-vault-bg-2 border border-vault-border text-vault-text-4 cursor-default'
                    } ${today ? 'border-vault-accent ring-1 ring-vault-accent/50 text-vault-accent' : ''} ${
                      selectedId && hasEntry && dayEntries[0].id === selectedId ? 'bg-vault-accent text-[#0D0D0F]' : ''
                    }`}
                  >
                    <span className="text-[14px] md:text-[10px] font-bold">{format(date, 'd')}</span>
                    {hasEntry && ! (selectedId && dayEntries[0].id === selectedId) && (
                      <div className="w-1.5 h-1.5 bg-vault-accent rounded-full absolute bottom-1.5 md:bottom-1" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer - Desktop only */}
        <div className="hidden md:block p-4 border-t border-vault-border">
          <Link 
            href="/journal/new"
            className="flex items-center justify-center gap-2 w-full bg-vault-bg-3 hover:bg-vault-bg-4 border border-vault-border text-vault-text-2 text-[11px] uppercase tracking-widest py-2.5 rounded-[4px] transition-colors font-bold"
          >
            <Plus className="w-3.5 h-3.5" /> New Entry
          </Link>
        </div>
      </div>

      {/* RIGHT PANEL (Detail) */}
      <div className={`flex-1 bg-vault-bg flex flex-col overflow-hidden relative ${
        mobileView === 'list' ? 'hidden md:flex' : 'flex'
      }`}>
        {!selectedEntry ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-500">
            <EmptyState 
              icon={BookOpen}
              title={entries.length === 0 ? "No entries yet." : "Select an entry."}
              subtitle={entries.length === 0 ? "Begin with a thought." : "Select a thought from the list to expand."}
              action={
                <Link 
                  href="/journal/new"
                  className="bg-vault-accent text-[#0D0D0F] text-[11px] uppercase tracking-widest py-3 px-10 rounded-[6px] hover:bg-vault-accent-2 transition-colors duration-150 inline-block mt-6 font-bold shadow-lg"
                >
                  {entries.length === 0 ? "Write First Entry" : "New Entry"}
                </Link>
              }
            />
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden animate-in slide-in-from-right-4 duration-300">
            {/* Mobile Header with Back Button */}
            <div className="flex items-center gap-3 p-4 border-b border-vault-border md:hidden bg-vault-bg-2 shadow-sm">
              <button 
                onClick={() => setMobileView('list')}
                className="p-2 -ml-2 text-vault-text-2 hover:text-vault-text transition-colors"
              >
                <BackIcon className="w-6 h-6" />
              </button>
              <div className="text-[14px] text-vault-text font-bold truncate">
                {selectedEntry.title || 'Untitled'}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-16 flex flex-col gap-6 w-full mx-auto max-w-4xl no-scrollbar">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-[10px] md:text-[11px] uppercase text-vault-text-3 tracking-widest font-bold">
                  {format(new Date(selectedEntry.created_at), 'EEEE, MMMM do yyyy')}
                </div>
                <Link 
                  href={`/journal/${selectedEntry.id}`}
                  className="flex items-center gap-1.5 text-[11px] uppercase text-vault-accent hover:text-vault-accent-2 tracking-widest transition-colors font-bold w-fit"
                >
                  Edit Entry <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              <h1 className="text-[32px] md:text-[44px] text-vault-text leading-tight mt-2 font-bold tracking-tight">
                {selectedEntry.title}
              </h1>
              
              {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedEntry.tags.map((tag, i) => (
                    <div key={i} className="text-[10px] bg-vault-bg-3 text-vault-text-2 px-2.5 py-1 rounded-[4px] border border-vault-border font-bold">
                      {tag}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-8 text-[17px] md:text-[18px] leading-[1.8] text-vault-text-2 max-w-none w-full pb-32">
                <ReadOnlyEditor content={selectedEntry.content} key={selectedEntry.id} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
