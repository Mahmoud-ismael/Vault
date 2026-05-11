'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Sparkles, Pin, Trash2, X, FileText, ChevronDown, SidebarClose } from 'lucide-react'
import { SetTopbar } from '@/components/vault/SetTopbar'
import { toast } from 'sonner'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import LinkExtension from '@tiptap/extension-link'
import { Node, mergeAttributes } from '@tiptap/core'

const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  parseHTML() { return [{ tag: 'div[data-type="callout"]' }] },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout', class: 'callout-block' }), 0]
  },
  addCommands() {
    return {
      setCallout: () => ({ commands }: any) => {
        return commands.setNode('callout')
      },
    } as any
  },
})

const EditorStyles = `
.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--vault-text-3);
  pointer-events: none;
  height: 0;
  font-family: 'Satoshi', sans-serif;
  font-style: ;
}
.tiptap :focus { outline: none; }
.tiptap p { margin-bottom: 1rem; }
.tiptap p:last-child { margin-bottom: 0; }
.tiptap h1 { font-family: 'Satoshi', sans-serif; font-size: 28px; color: var(--vault-text); margin-bottom: 1rem; margin-top: 2rem; }
.tiptap h2 { font-family: 'Satoshi', sans-serif; font-size: 20px; color: var(--vault-text); margin-bottom: 0.75rem; margin-top: 1.5rem; }
.tiptap h3 { font-family: 'Satoshi', sans-serif; font-size: 17px; font-weight: 500; color: var(--vault-text); margin-bottom: 0.5rem; margin-top: 1.5rem; }
.tiptap ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
.tiptap ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
.tiptap ul[data-type="taskList"] { list-style: none; padding-left: 0; }
.tiptap ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem; }
.tiptap ul[data-type="taskList"] input[type="checkbox"] { margin-top: 0.3rem; accent-color: var(--vault-accent); }
.tiptap blockquote { border-left: 2px solid var(--vault-accent); padding-left: 1rem; font-style: ; color: var(--vault-text-3); background: var(--vault-accent-dim); padding-top: 0.5rem; padding-bottom: 0.5rem; border-radius: 0 4px 4px 0; margin-bottom: 1rem; }
.tiptap code { background: var(--vault-bg-3); padding: 0.2rem 0.4rem; border-radius: 3px; font-family: 'Satoshi', sans-serif; font-size: 14px; }
.tiptap pre { background: var(--vault-bg-4); padding: 1rem; border-radius: 6px; overflow-x: auto; font-family: 'Satoshi', sans-serif; font-size: 13px; margin: 1.5rem 0; }
.tiptap pre code { background: none; padding: 0; border-radius: 0; }
.tiptap .callout-block { background: var(--vault-bg-4); border-left: 3px solid var(--vault-accent); padding: 1rem 1rem 1rem 2.5rem; border-radius: 4px; position: relative; margin: 1.5rem 0; font-family: 'Satoshi', sans-serif; }
.tiptap .callout-block::before { content: '💡'; position: absolute; left: 0.75rem; top: 1rem; }
.tiptap table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 0; overflow: hidden; border-radius: 4px; }
.tiptap td, .tiptap th { border: 1px solid var(--vault-border); padding: 8px; vertical-align: top; box-sizing: border-box; position: relative; }
.tiptap th { background-color: var(--vault-bg-3); text-align: left; font-weight: 500; }
.tiptap a { color: #38bdf8; text-decoration: none; border-bottom: 1px dashed #38bdf8; cursor: pointer; transition: opacity 0.15s; }
.tiptap a:hover { opacity: 0.8; }
`

const SLASH_COMMANDS = [
  { id: 'text', label: 'Text', desc: 'Plain paragraph', run: (ed: any) => ed.chain().focus().setParagraph().run() },
  { id: 'h1', label: 'Heading 1', desc: 'Large heading', run: (ed: any) => ed.chain().focus().toggleHeading({ level: 1 }).run() },
  { id: 'h2', label: 'Heading 2', desc: 'Medium heading', run: (ed: any) => ed.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: 'h3', label: 'Heading 3', desc: 'Small heading', run: (ed: any) => ed.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: 'bullet', label: 'Bullet List', desc: 'Simple bullet list', run: (ed: any) => ed.chain().focus().toggleBulletList().run() },
  { id: 'numbered', label: 'Numbered List', desc: 'Ordered list', run: (ed: any) => ed.chain().focus().toggleOrderedList().run() },
  { id: 'todo', label: 'Checklist', desc: 'Task list with checkboxes', run: (ed: any) => ed.chain().focus().toggleTaskList().run() },
  { id: 'quote', label: 'Quote', desc: 'Blockquote', run: (ed: any) => ed.chain().focus().toggleBlockquote().run() },
  { id: 'code', label: 'Code Block', desc: 'Monospaced block', run: (ed: any) => ed.chain().focus().toggleCodeBlock().run() },
  { id: 'callout', label: 'Callout', desc: 'Styled info box', run: (ed: any) => ed.chain().focus().setCallout().run() },
  { id: 'divider', label: 'Divider', desc: 'Horizontal rule', run: (ed: any) => ed.chain().focus().setHorizontalRule().run() },
  { id: 'table', label: 'Table', desc: 'Basic 3x3 table', run: (ed: any) => ed.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
]

export default function NoteEditorClient({ initialNote }: { initialNote: any }) {
  const supabase = createClient()
  const router = useRouter()
  
  const [title, setTitle] = useState(initialNote.title || '')
  const [pinned, setPinned] = useState(initialNote.pinned || false)
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...' | 'Unsaved changes'>('Saved')
  
  const [showAI, setShowAI] = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)
  
  const [slashPos, setSlashPos] = useState<{ top: number, left: number } | null>(null)
  const [slashQuery, setSlashQuery] = useState('')
  const [slashIndex, setSlashIndex] = useState(0)
  
  const [linkPos, setLinkPos] = useState<{ top: number, left: number } | null>(null)
  const [linkQuery, setLinkQuery] = useState('')
  const [linkIndex, setLinkIndex] = useState(0)

  const [allNotes, setAllNotes] = useState<any[]>([])
  const [referencedBy, setReferencedBy] = useState<any[]>([])
  
  const [aiOutlineTopic, setAiOutlineTopic] = useState('')
  const [aiOutlineLoading, setAiOutlineLoading] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false)
  
  const saveTimer = useRef<NodeJS.Timeout | null>(null)
  
  const filteredCommands = SLASH_COMMANDS.filter(c => c.id.includes(slashQuery.toLowerCase()) || c.label.toLowerCase().includes(slashQuery.toLowerCase()))
  const filteredNotes = allNotes.filter(n => n.id !== initialNote.id && n.title.toLowerCase().includes(linkQuery.toLowerCase()))

  useEffect(() => {
    const fetchNotes = async () => {
      const { data } = await supabase.from('notes').select('id, title, content')
      if (data) {
        setAllNotes(data)
        const refs = data.filter(n => n.id !== initialNote.id && JSON.stringify(n.content).includes(initialNote.id))
        setReferencedBy(refs)
      }
    }
    fetchNotes()
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Type '/' for commands" }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Callout,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'note-link',
        },
      }),
    ],
    content: initialNote.content || {},
    onUpdate: ({ editor }) => {
      handleContentChange(editor.getJSON())
      
      const { from } = editor.state.selection
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 15), from, '\n')
      
      const slashMatch = textBefore.match(/\/([a-zA-Z0-9]*)$/)
      if (slashMatch) {
        const coords = editor.view.coordsAtPos(from)
        setSlashPos({ top: coords.top + window.scrollY + 20, left: coords.left + window.scrollX })
        setSlashQuery(slashMatch[1])
        setSlashIndex(0)
        setLinkPos(null)
      } else {
        setSlashPos(null)
      }

      const linkMatch = textBefore.match(/\[\[([a-zA-Z0-9 ]*)$/)
      if (linkMatch && !slashMatch) {
        const coords = editor.view.coordsAtPos(from)
        setLinkPos({ top: coords.top + window.scrollY + 20, left: coords.left + window.scrollX })
        setLinkQuery(linkMatch[1])
        setLinkIndex(0)
      } else {
        setLinkPos(null)
      }
    }
  })

  const titleRef = useRef(title)
  const pinnedRef = useRef(pinned)
  const contentRef = useRef(initialNote.content || {})
  
  useEffect(() => { titleRef.current = title }, [title])
  useEffect(() => { pinnedRef.current = pinned }, [pinned])

  const handleContentChange = (jsonContent?: any) => {
    if (jsonContent) contentRef.current = jsonContent
    setSaveStatus('Unsaved changes')
    
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveToDb()
    }, 2000)
  }

  useEffect(() => {
    const handleManualSave = () => saveToDb()
    window.addEventListener('vault-manual-save', handleManualSave)
    return () => window.removeEventListener('vault-manual-save', handleManualSave)
  }, [])

  const saveToDb = async () => {
    setSaveStatus('Saving...')
    await supabase.from('notes').update({
      title: titleRef.current,
      content: contentRef.current,
      pinned: pinnedRef.current,
      updated_at: new Date().toISOString()
    }).eq('id', initialNote.id)
    setSaveStatus('Saved')
    toast.success('Note saved')
    router.refresh()
  }

  const deleteNote = async () => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      await supabase.from('notes').delete().eq('id', initialNote.id)
      router.push('/notes')
      router.refresh()
    }
  }

  const executeCommand = (cmd: any) => {
    if (!editor) return
    const { from } = editor.state.selection
    editor.chain().focus().deleteRange({ from: from - slashQuery.length - 1, to: from }).run()
    cmd.run(editor)
    setSlashPos(null)
  }

  const insertNoteLink = (note: any) => {
    if (!editor) return
    const { from } = editor.state.selection
    editor.chain().focus()
      .deleteRange({ from: from - linkQuery.length - 2, to: from })
      .setLink({ href: `/notes/${note.id}` })
      .insertContent(note.title)
      .unsetLink()
      .insertContent(' ')
      .run()
    setLinkPos(null)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (slashPos && filteredCommands.length > 0) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIndex(i => (i + 1) % filteredCommands.length) }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length) }
        else if (e.key === 'Enter') { e.preventDefault(); executeCommand(filteredCommands[slashIndex]) }
        else if (e.key === 'Escape') { setSlashPos(null) }
      } else if (linkPos && filteredNotes.length > 0) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setLinkIndex(i => (i + 1) % filteredNotes.length) }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setLinkIndex(i => (i - 1 + filteredNotes.length) % filteredNotes.length) }
        else if (e.key === 'Enter') { e.preventDefault(); insertNoteLink(filteredNotes[linkIndex]) }
        else if (e.key === 'Escape') { setLinkPos(null) }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [slashPos, slashIndex, filteredCommands, linkPos, linkIndex, filteredNotes])

  const applyTemplate = (templateHtml: string) => {
    if (editor) {
      editor.commands.setContent(templateHtml)
      setShowTemplates(false)
      handleContentChange()
    }
  }

  const TEMPLATES = [
    { name: 'Research Summary', html: '<h2>Overview</h2><p></p><h2>Key Arguments</h2><p></p><h2>My Assessment</h2><p></p><h2>Sources</h2><p></p>' },
    { name: 'Argument Map', html: '<h2>Claim</h2><p></p><h2>Evidence For</h2><p></p><h2>Evidence Against</h2><p></p><h2>My Verdict</h2><p></p>' },
    { name: 'Book Notes', html: '<h2>Book</h2><p></p><h2>Author</h2><p></p><h2>Core Thesis</h2><p></p><h2>Key Ideas</h2><p></p><h2>Quotes</h2><p></p><h2>My Takeaways</h2><p></p>' },
    { name: 'Meeting Notes', html: '<h2>Date</h2><p></p><h2>Attendees</h2><p></p><h2>Agenda</h2><p></p><h2>Decisions</h2><p></p><h2>Actions</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p></p></div></li></ul>' },
  ]

  const generateOutline = async () => {
    if (!aiOutlineTopic.trim() || !editor) return
    setAiOutlineLoading(true)
    try {
      const res = await fetch('/api/ai/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiOutlineTopic })
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let outlineText = ''
      
      if (reader) {
        editor.commands.insertContent('<p><strong>AI Generating Outline...</strong></p>')
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          outlineText += decoder.decode(value)
        }
        
        // Very rough markdown-to-HTML parser for the outline
        const html = outlineText.split('\n').map(line => {
          if (line.startsWith('## ')) return `<h2>${line.replace('## ', '')}</h2>`
          if (line.startsWith('- ')) return `<ul><li><p>${line.replace('- ', '')}</p></li></ul>`
          return `<p>${line}</p>`
        }).join('')
        
        editor.commands.setContent(html)
        setAiOutlineTopic('')
      }
    } finally {
      setAiOutlineLoading(false)
    }
  }

  const summarizeNote = async () => {
    if (!editor) return
    const text = editor.getText()
    if (!text.trim()) return alert("Write something first!")
    setAiSummaryLoading(true)
    setAiSummary('')
    try {
      const res = await fetch('/api/ai/summarise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          setAiSummary(prev => prev + decoder.decode(value))
        }
      }
    } finally {
      setAiSummaryLoading(false)
    }
  }

  const LeftNode = (
    <Link href="/notes" className="flex items-center gap-1.5 text-vault-text-3 hover:text-vault-text transition-colors text-[10px] uppercase tracking-normal pr-4 border-r border-vault-border mr-2">
      <ArrowLeft className="w-3.5 h-3.5" /> Notes
    </Link>
  )
  
  const EditableTitle = (
    <input 
      value={title} 
      onChange={e => {
        setTitle(e.target.value)
        handleContentChange()
      }}
      placeholder="Untitled Note"
      className="bg-transparent border-none focus:outline-none text-[16px] text-vault-text-2 min-w-[200px]"
    />
  )

  const RightNode = (
    <div className="flex items-center gap-4">
      <div className="relative">
        <button onClick={() => setShowTemplates(!showTemplates)} className="flex items-center gap-2 text-vault-text-3 hover:text-vault-text transition-colors duration-150 text-[11px] uppercase tracking-normal px-3 py-1.5 rounded-[4px] hover:bg-vault-bg-3">
          <FileText className="w-3.5 h-3.5" /> Templates <ChevronDown className="w-3 h-3" />
        </button>
        {showTemplates && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowTemplates(false)} />
            <div className="absolute right-0 top-8 z-50 w-48 bg-vault-bg-2 border border-vault-border rounded-[4px] shadow-lg flex flex-col py-1">
              {TEMPLATES.map((t, i) => (
                <button key={i} onClick={() => applyTemplate(t.html)} className="text-left px-4 py-2 text-[13px] text-vault-text-2 hover:bg-vault-bg-3 hover:text-vault-text transition-colors">
                  {t.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="w-[1px] h-4 bg-vault-border hidden sm:block" />
      <div className="text-[9px] uppercase text-vault-text-3 tracking-normal min-w-[70px] text-right">
        {saveStatus}
      </div>
      <div className="flex items-center gap-1 bg-vault-bg-4 rounded-[4px] p-0.5 ml-2">
        <button onClick={() => {
          setPinned(!pinned)
          handleContentChange()
        }} className={`p-1.5 rounded-[3px] transition-colors ${pinned ? 'bg-vault-bg-2 text-vault-text' : 'text-vault-text-3 hover:text-vault-text hover:bg-vault-bg-3'}`}>
          <Pin className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setShowAI(!showAI)} className={`p-1.5 rounded-[3px] transition-colors ${showAI ? 'bg-vault-accent/[0.15] text-vault-accent' : 'text-vault-text-3 hover:text-vault-text hover:bg-vault-bg-3'}`}>
          <Sparkles className="w-3.5 h-3.5" />
        </button>
        <button onClick={deleteNote} className="p-1.5 rounded-[3px] text-vault-danger hover:bg-vault-danger/[0.15] transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex w-full h-[calc(100vh-52px)] -m-4 md:-m-8 lg:-m-10 relative overflow-hidden">
      <SetTopbar title={EditableTitle} leftNode={LeftNode} rightNode={RightNode} />
      <style>{EditorStyles}</style>

      {/* EDITOR PANEL */}
      <div className="flex-1 overflow-y-auto w-full relative">
        <div className="max-w-[720px] mx-auto py-8 md:py-12 px-4 md:px-8 lg:px-0 lg:py-16">
          
          <input 
            value={title}
            onChange={e => {
              setTitle(e.target.value)
              handleContentChange()
            }}
            placeholder="Untitled Note"
            autoFocus={initialNote.title === 'Untitled Note'}
            className="w-full bg-transparent border-none focus:outline-none text-[28px] md:text-[36px] text-vault-text leading-tight mb-6 md:mb-8 font-bold"
          />
          
          <div className="text-[16px] md:text-[17px] leading-[1.8] text-vault-text-2 min-h-[400px]">
            <EditorContent editor={editor} />
          </div>
          
          {referencedBy.length > 0 && (
            <div className="mt-16 md:mt-20 pt-8 border-t border-vault-border">
              <div className="text-[10px] uppercase tracking-normal text-vault-text-3 mb-4 font-bold">Referenced By</div>
              <div className="flex flex-col gap-2">
                {referencedBy.map(ref => (
                  <Link 
                    key={ref.id} 
                    href={`/notes/${ref.id}`}
                    className="group block bg-vault-bg-2 border border-vault-border rounded-[6px] p-4 hover:border-vault-accent transition-colors"
                  >
                    <div className="text-[14px] text-vault-text group-hover:text-vault-accent transition-colors font-bold">
                      {ref.title || 'Untitled Note'}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
        </div>
      </div>

      {/* SLASH COMMAND PALETTE */}
      {slashPos && filteredCommands.length > 0 && (
        <div 
          className="fixed z-[101] bg-vault-bg-2 border border-vault-border-2 rounded-[6px] shadow-lg w-64 overflow-hidden py-1"
          style={{ 
            top: Math.min(slashPos.top, typeof window !== 'undefined' ? window.innerHeight - 200 : 0), 
            left: Math.min(slashPos.left, typeof window !== 'undefined' ? window.innerWidth - 260 : 0) 
          }}
        >
          {filteredCommands.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={() => executeCommand(cmd)}
              onMouseEnter={() => setSlashIndex(i)}
              className={`w-full text-left px-3 py-2 flex flex-col gap-0.5 ${i === slashIndex ? 'bg-vault-bg-3' : 'hover:bg-vault-bg-4'}`}
            >
              <div className="text-[11px] uppercase tracking-normal text-vault-text font-bold">{cmd.label}</div>
              <div className="text-[12px] text-vault-text-3">{cmd.desc}</div>
            </button>
          ))}
        </div>
      )}

      {/* LINK COMMAND PALETTE */}
      {linkPos && filteredNotes.length > 0 && (
        <div 
          className="fixed z-[101] bg-vault-bg-2 border border-vault-border-2 rounded-[6px] shadow-lg w-64 overflow-hidden py-1 max-h-64 overflow-y-auto"
          style={{ 
            top: Math.min(linkPos.top, typeof window !== 'undefined' ? window.innerHeight - 200 : 0), 
            left: Math.min(linkPos.left, typeof window !== 'undefined' ? window.innerWidth - 260 : 0) 
          }}
        >
          {filteredNotes.map((note, i) => (
            <button
              key={note.id}
              onClick={() => insertNoteLink(note)}
              onMouseEnter={() => setLinkIndex(i)}
              className={`w-full text-left px-3 py-2 flex flex-col gap-0.5 ${i === linkIndex ? 'bg-vault-bg-3' : 'hover:bg-vault-bg-4'}`}
            >
              <div className="text-[13px] text-vault-text line-clamp-1 font-bold">{note.title || 'Untitled'}</div>
            </button>
          ))}
        </div>
      )}

      {/* AI SIDEBAR / DRAWER */}
      {showAI && (
        <>
          {/* Overlay for mobile */}
          <div 
            className="fixed inset-0 bg-black/50 z-[90] md:hidden"
            onClick={() => setShowAI(false)}
          />
          <div className="fixed md:relative right-0 top-0 bottom-0 z-[100] md:z-auto w-[280px] shrink-0 border-l border-vault-border bg-vault-bg-2 overflow-y-auto transition-transform duration-300 md:translate-x-0">
            <div className="sticky top-0 z-10 bg-vault-bg-2 border-b border-vault-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-vault-accent" />
                <div className="text-[10px] uppercase tracking-normal text-vault-text-3 font-bold">AI Tools</div>
              </div>
              <button onClick={() => setShowAI(false)} className="text-vault-text-3 hover:text-vault-text transition-colors p-1">
                <SidebarClose className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2 bg-vault-bg-3 border border-vault-border p-4 rounded-[8px]">
                <div className="text-[10px] uppercase tracking-normal text-vault-accent font-bold">✦ Generate outline</div>
                <input 
                  value={aiOutlineTopic}
                  onChange={e => setAiOutlineTopic(e.target.value)}
                  placeholder="Topic to research..."
                  className="w-full bg-vault-bg-4 border border-vault-border rounded-[4px] px-3 py-2 text-[14px] text-vault-text placeholder-vault-text-3 focus:outline-none focus:border-vault-accent transition-colors duration-150"
                />
                <button 
                  onClick={generateOutline}
                  disabled={aiOutlineLoading || !aiOutlineTopic.trim()}
                  className="w-full bg-vault-accent text-[#0D0D0F] text-[11px] uppercase tracking-normal py-2.5 rounded-[4px] hover:bg-vault-accent-2 disabled:opacity-50 transition-colors font-bold mt-1"
                >
                  {aiOutlineLoading ? 'Generating...' : 'Generate Blocks'}
                </button>
              </div>

              <button 
                onClick={summarizeNote}
                disabled={aiSummaryLoading}
                className="flex items-center justify-between w-full bg-vault-bg-3 hover:bg-vault-bg-4 border border-vault-border hover:border-vault-accent-border p-4 rounded-[8px] transition-all duration-150 text-left group"
              >
                <span className="text-[12px] text-vault-text-2 group-hover:text-vault-accent transition-colors font-medium">
                  {aiSummaryLoading ? 'Thinking...' : '✦ Summarise note'}
                </span>
              </button>

              {aiSummary && (
                <div className="bg-vault-accent-dim border-l-[3px] border-vault-accent rounded-r-[8px] p-4 flex flex-col gap-2 animate-in fade-in duration-300">
                  <div className="text-[13px] text-vault-text leading-relaxed">
                    {aiSummary}
                  </div>
                </div>
              )}

              <button 
                onClick={() => alert("Coming soon: AI Improve Note")}
                className="flex items-center justify-between w-full bg-vault-bg-3 hover:bg-vault-bg-4 border border-vault-border hover:border-vault-accent-border p-4 rounded-[8px] transition-all duration-150 text-left group"
              >
                <span className="text-[12px] text-vault-text-2 group-hover:text-vault-accent transition-colors font-medium">✦ Improve note</span>
              </button>

              <button 
                onClick={() => alert("Coming soon: AI Suggest Related")}
                className="flex items-center justify-between w-full bg-vault-bg-3 hover:bg-vault-bg-4 border border-vault-border hover:border-vault-accent-border p-4 rounded-[8px] transition-all duration-150 text-left group"
              >
                <span className="text-[12px] text-vault-text-2 group-hover:text-vault-accent transition-colors font-medium">✦ Suggest related</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
