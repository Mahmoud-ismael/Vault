'use client'

import { Plus, Search, MoreVertical, Pin, Copy, Trash2, ArrowRight, FileText, ChevronLeft as BackIcon } from 'lucide-react'
import { SetTopbar } from '@/components/vault/SetTopbar'
import { EmptyState } from '@/components/shared/EmptyState'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useTopbar } from '@/components/vault/TopbarContext'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { createClient } from '@/lib/supabase/client'

const EditorStyles = `
.tiptap h1 { font-family: 'Satoshi', sans-serif; font-size: 28px; color: var(--vault-text); margin-bottom: 1rem; }
.tiptap h2 { font-family: 'Satoshi', sans-serif; font-size: 20px; color: var(--vault-text); margin-bottom: 0.75rem; margin-top: 1.5rem; }
.tiptap h3 { font-family: 'Satoshi', sans-serif; font-size: 17px; font-weight: 500; color: var(--vault-text); margin-bottom: 0.5rem; margin-top: 1.5rem; }
.tiptap ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
.tiptap ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
.tiptap blockquote { border-left: 2px solid var(--vault-accent); padding-left: 1rem; font-style: ; color: var(--vault-text-3); background: var(--vault-accent-dim); padding-top: 0.5rem; padding-bottom: 0.5rem; border-radius: 0 4px 4px 0; margin-bottom: 1rem; }
.tiptap .callout-block { background: var(--vault-bg-4); border-left: 3px solid var(--vault-accent); padding: 1rem 1rem 1rem 2.5rem; border-radius: 4px; position: relative; margin: 1.5rem 0; font-family: 'Satoshi', sans-serif; }
.tiptap .callout-block::before { content: '💡'; position: absolute; left: 0.75rem; top: 1rem; }
.tiptap table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 0; overflow: hidden; border-radius: 4px; }
.tiptap td, .tiptap th { border: 1px solid var(--vault-border); padding: 8px; vertical-align: top; box-sizing: border-box; position: relative; }
.tiptap th { background-color: var(--vault-bg-3); text-align: left; font-weight: 500; }
`

function ReadOnlyEditor({ content }: { content: any }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content || {},
    editable: false,
  })

  return (
    <div className="[&_p]:mb-4 [&_p:last-child]:mb-0 max-w-none prose prose-invert">
      <style>{EditorStyles}</style>
      <EditorContent editor={editor} />
    </div>
  )
}

export default function NotesClient({ initialNotes }: { initialNotes: any[] }) {
  const router = useRouter()
  const { setFab } = useTopbar()
  const [notes, setNotes] = useState(initialNotes)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')
  const [search, setSearch] = useState('')
  const [contextMenuId, setContextMenuId] = useState<string | null>(null)
  const supabase = createClient()

  // Setup FAB
  useEffect(() => {
    setFab({
      label: 'New Note',
      icon: Plus,
      onClick: () => router.push('/notes/new')
    })
    return () => setFab(null)
  }, [setFab, router])

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setMobileView('detail')
  }
  

  const selectedNote = useMemo(() => notes.find(n => n.id === selectedId), [notes, selectedId])

  const filteredNotes = useMemo(() => {
    if (!search) return notes
    const s = search.toLowerCase()
    return notes.filter(n => n.title.toLowerCase().includes(s))
  }, [notes, search])

  const pinnedNotes = filteredNotes.filter(n => n.pinned)
  const unpinnedNotes = filteredNotes.filter(n => !n.pinned)

  const togglePin = async (e: any, id: string, pinned: boolean) => {
    e.stopPropagation()
    setContextMenuId(null)
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !pinned } : n))
    await supabase.from('notes').update({ pinned: !pinned }).eq('id', id)
  }

  const deleteNote = async (e: any, id: string) => {
    e.stopPropagation()
    setContextMenuId(null)
    if (window.confirm('Delete note?')) {
      if (selectedId === id) setSelectedId(null)
      setNotes(prev => prev.filter(n => n.id !== id))
      await supabase.from('notes').delete().eq('id', id)
    }
  }

  const duplicateNote = async (e: any, note: any) => {
    e.stopPropagation()
    setContextMenuId(null)
    const { data } = await supabase.from('notes').insert({
      user_id: note.user_id,
      title: note.title + ' (Copy)',
      content: note.content,
      pinned: note.pinned,
    }).select().single()
    
    if (data) setNotes(prev => [data, ...prev])
  }

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleExpand = (e: any, id: string) => {
    e.stopPropagation()
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const addSubNote = async (e: any, parentId: string) => {
    e.stopPropagation()
    const { data } = await supabase.from('notes').insert({
      user_id: notes[0]?.user_id || (await supabase.auth.getUser()).data.user?.id,
      title: 'New Sub-note',
      content: {},
      parent_id: parentId
    }).select().single()
    
    if (data) {
      setNotes(prev => [data, ...prev])
      setExpanded(prev => ({ ...prev, [parentId]: true }))
      setSelectedId(data.id)
    }
  }

  const NoteRow = ({ n, depth = 0 }: { n: any, depth?: number }) => {
    const isActive = selectedId === n.id
    const hasChildren = notes.some(child => child.parent_id === n.id)
    
    return (
      <div
        onClick={() => handleSelect(n.id)}
        className={`group flex items-center justify-between p-4 md:p-2 rounded-[4px] border-l-[3px] transition-all duration-150 text-left cursor-pointer relative min-h-[64px] md:min-h-0 ${
          isActive 
            ? 'bg-vault-accent-dim border-vault-accent' 
            : 'border-transparent hover:bg-vault-bg-3'
        }`}
        style={{ paddingLeft: `${isActive ? 12 : 8 + depth * 16}px` }}
      >
        <div className="flex items-center gap-2 pr-12 overflow-hidden flex-1">
          {hasChildren ? (
            <button 
              onClick={(e) => toggleExpand(e, n.id)} 
              className="w-4 h-4 flex items-center justify-center text-vault-text-3 hover:text-vault-text shrink-0"
            >
              <div className={`transition-transform duration-150 text-[10px] ${expanded[n.id] ? 'rotate-90' : ''}`}>▶</div>
            </button>
          ) : (
            <div className="w-4 h-4 shrink-0" />
          )}
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <div className={`text-[13px] ${isActive ? 'text-vault-accent' : 'text-vault-text'} line-clamp-1`}>
              {n.title || 'Untitled'}
            </div>
            <div className="text-[9px] uppercase text-vault-text-3 tracking-normal">
              {format(new Date(n.updated_at), 'MMM d, yyyy')}
            </div>
          </div>
        </div>

        <div className={`absolute right-2 flex items-center gap-1 transition-opacity ${isActive || contextMenuId === n.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {depth < 2 && (
            <button
              onClick={(e) => addSubNote(e, n.id)}
              title="New sub-note"
              className="p-1 rounded hover:bg-vault-bg-4 text-vault-text-3 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation()
              setContextMenuId(contextMenuId === n.id ? null : n.id)
            }}
            className="p-1 rounded hover:bg-vault-bg-4 text-vault-text-3 transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {contextMenuId === n.id && (
          <>
            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setContextMenuId(null) }} />
            <div className="absolute right-8 top-6 z-50 w-36 bg-vault-bg-2 border border-vault-border rounded-[4px] shadow-lg flex flex-col py-1">
              <button onClick={(e) => togglePin(e, n.id, n.pinned)} className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-vault-text-2 hover:bg-vault-bg-3 hover:text-vault-text transition-colors text-left">
                <Pin className="w-3 h-3" /> {n.pinned ? 'Unpin' : 'Pin to top'}
              </button>
              <button onClick={(e) => duplicateNote(e, n)} className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-vault-text-2 hover:bg-vault-bg-3 hover:text-vault-text transition-colors text-left">
                <Copy className="w-3 h-3" /> Duplicate
              </button>
              <div className="h-[1px] bg-vault-border my-1" />
              <button onClick={(e) => deleteNote(e, n.id)} className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-vault-danger hover:bg-vault-danger/[0.1] transition-colors text-left">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  const NoteTree = ({ parentId = null, depth = 0, isPinnedOnly = false }: { parentId?: string | null, depth?: number, isPinnedOnly?: boolean }) => {
    let sourceNotes = isPinnedOnly ? pinnedNotes : unpinnedNotes
    if (search) sourceNotes = filteredNotes // Flatten tree when searching
    
    // When searching, we don't show the tree, we just show matching notes as a flat list
    if (search) {
      if (depth > 0) return null // Only render at top level during search
      return (
        <div className="flex flex-col gap-[2px]">
          {sourceNotes.map(n => <NoteRow key={n.id} n={n} depth={0} />)}
        </div>
      )
    }

    const children = sourceNotes.filter(n => (n.parent_id || null) === parentId)
    if (children.length === 0) return null

    return (
      <div className="flex flex-col gap-[2px]">
        {children.map(n => (
          <div key={n.id} className="flex flex-col">
            <NoteRow n={n} depth={depth} />
            {expanded[n.id] && <NoteTree parentId={n.id} depth={depth + 1} isPinnedOnly={isPinnedOnly} />}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex w-full h-screen md:h-[calc(100vh-52px)] -m-4 md:-m-8 lg:-m-10 overflow-hidden">
      <SetTopbar title="Notes" />

      {/* LEFT PANEL */}
      <div className={`w-full md:w-[320px] lg:w-[380px] flex-shrink-0 flex flex-col border-r border-vault-border bg-vault-bg-2 transition-transform duration-300 md:translate-x-0 ${
        mobileView === 'detail' ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="flex flex-col gap-3 p-4 border-b border-vault-border">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-normal text-vault-text-3">
              NOTES <span className="text-vault-text-4 ml-1">({notes.length})</span>
            </div>
            <button 
              onClick={() => router.push('/notes/new')}
              className="md:hidden p-2 text-vault-text-2 hover:text-vault-text"
            >
              <Plus className="w-6 h-6" />
            </button>
            <Link href="/notes/new" className="hidden md:block p-1 rounded-[3px] bg-vault-bg-4 text-vault-text-3 hover:text-vault-text transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 md:w-3.5 md:h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-vault-text-3" />
            <input 
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-vault-bg-4 border border-vault-border rounded-[4px] pl-9 pr-3 py-2.5 md:py-1.5 text-[16px] md:text-[13px] text-vault-text placeholder-vault-text-3 focus:outline-none focus:border-vault-accent transition-colors duration-150"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col p-2 gap-4">
          {filteredNotes.length === 0 ? (
            <EmptyState 
              icon={FileText}
              title="Nothing here yet."
              subtitle="Create your first note."
            />
          ) : (
            <>
              {pinnedNotes.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] md:text-[9px] uppercase tracking-normal text-vault-text-3 px-2 mb-1 flex items-center gap-1.5 font-bold">
                    <Pin className="w-3 h-3 md:w-2.5 md:h-2.5" /> Pinned
                  </div>
                  <NoteTree isPinnedOnly={true} />
                </div>
              )}
              
              <div className="flex flex-col gap-1">
                {pinnedNotes.length > 0 && unpinnedNotes.length > 0 && (
                  <div className="text-[10px] md:text-[9px] uppercase tracking-normal text-vault-text-3 px-2 mb-1 font-bold">
                    All Notes
                  </div>
                )}
                <NoteTree isPinnedOnly={false} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={`flex-1 bg-vault-bg flex flex-col overflow-hidden relative ${
        mobileView === 'list' ? 'hidden md:flex' : 'flex'
      }`}>
        {!selectedNote ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
            <EmptyState 
              icon={FileText}
              title={notes.length === 0 ? "Nothing here yet." : "Select a note."}
              subtitle={notes.length === 0 ? "Create your first note." : "Select a note from the sidebar to start writing."}
              action={
                <Link 
                  href="/notes/new"
                  className="bg-vault-accent text-[#0D0D0F] text-[11px] uppercase tracking-widest py-2.5 px-8 rounded-[4px] hover:bg-vault-accent-2 transition-colors duration-150 inline-block mt-4 font-bold"
                >
                  {notes.length === 0 ? "Create First Note" : "New Note"}
                </Link>
              }
            />
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Mobile Header with Back Button */}
            <div className="flex items-center gap-3 p-4 border-b border-vault-border md:hidden">
              <button 
                onClick={() => setMobileView('list')}
                className="p-2 -ml-2 text-vault-text-2 hover:text-vault-text"
              >
                <BackIcon className="w-6 h-6" />
              </button>
              <div className="text-[14px] text-vault-text-2 font-medium truncate">
                {selectedNote.title || 'Untitled'}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-16 flex flex-col gap-6 w-full mx-auto max-w-4xl">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase text-vault-text-3 tracking-normal">
                  Last updated {format(new Date(selectedNote.updated_at), 'MMM d, yyyy')}
                </div>
                <Link 
                  href={`/notes/${selectedNote.id}`}
                  className="flex items-center gap-1 text-[11px] uppercase text-vault-accent hover:text-vault-accent-2 tracking-widest transition-colors font-bold"
                >
                  Full Editor <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              
              <h1 className="text-[28px] md:text-[36px] text-vault-text leading-tight mt-2 font-bold">
                {selectedNote.title}
              </h1>
              
              <div className="mt-8 text-[17px] md:text-[16px] leading-[1.8] text-vault-text-2 max-w-none w-full pb-20">
                <ReadOnlyEditor content={selectedNote.content} key={selectedNote.id} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
