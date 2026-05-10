'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ArrowLeft, Sparkles, Tag, Trash2, X, Heading1, Heading2, Heading3, Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, CheckSquare, Quote, Code, Link as LinkIcon, SidebarClose } from 'lucide-react'
import { SetTopbar } from '@/components/vault/SetTopbar'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import LinkExtension from '@tiptap/extension-link'

const EditorStyles = `
.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--vault-text-3);
  pointer-events: none;
  height: 0;
  font-family: 'Instrument Serif', serif;
  font-style: italic;
}
.tiptap :focus {
  outline: none;
}
.tiptap p { margin-bottom: 1rem; }
.tiptap p:last-child { margin-bottom: 0; }
.tiptap h1 { font-family: 'Instrument Serif', serif; font-size: 28px; color: var(--vault-text); margin-bottom: 1rem; margin-top: 2rem; }
.tiptap h2 { font-family: 'Geist', sans-serif; font-size: 20px; color: var(--vault-text); margin-bottom: 0.75rem; margin-top: 1.5rem; }
.tiptap h3 { font-family: 'Geist', sans-serif; font-size: 17px; font-weight: 500; color: var(--vault-text); margin-bottom: 0.5rem; margin-top: 1.5rem; }
.tiptap ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
.tiptap ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
.tiptap ul[data-type="taskList"] { list-style: none; padding-left: 0; }
.tiptap ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem; }
.tiptap ul[data-type="taskList"] input[type="checkbox"] { margin-top: 0.3rem; accent-color: var(--vault-accent); }
.tiptap blockquote { border-left: 2px solid var(--vault-accent); padding-left: 1rem; font-style: italic; color: var(--vault-text-3); margin: 1.5rem 0; }
.tiptap code { background: var(--vault-bg-3); padding: 0.2rem 0.4rem; border-radius: 3px; font-family: 'DM Mono', monospace; font-size: 14px; }
.tiptap pre { background: var(--vault-bg-4); padding: 1rem; border-radius: 6px; overflow-x: auto; font-family: 'DM Mono', monospace; font-size: 13px; margin: 1.5rem 0; }
.tiptap pre code { background: none; padding: 0; border-radius: 0; }
`

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null

  const Btn = ({ onClick, isActive, icon: Icon }: any) => (
    <button
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded-[3px] transition-colors ${isActive ? 'bg-vault-accent-dim text-vault-accent' : 'bg-transparent text-vault-text-3 hover:bg-vault-bg-3 hover:text-vault-text-2'}`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  )
  
  const Divider = () => <div className="w-[1px] h-4 bg-vault-border mx-1" />

  return (
    <div className="flex items-center gap-1 bg-vault-bg/95 backdrop-blur border border-vault-border rounded-[6px] p-1 sticky top-6 z-10 mb-8 transition-all">
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} />
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} />
      <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} icon={UnderlineIcon} />
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} icon={Strikethrough} />
      <Divider />
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} icon={Heading1} />
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} />
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} icon={Heading3} />
      <Divider />
      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} />
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} />
      <Btn onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} icon={CheckSquare} />
      <Divider />
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={Quote} />
      <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} icon={Code} />
      <Btn onClick={() => {
        const url = window.prompt('URL')
        if (url) editor.chain().focus().setLink({ href: url }).run()
      }} isActive={editor.isActive('link')} icon={LinkIcon} />
    </div>
  )
}

export default function JournalEditorClient({ initialEntry }: { initialEntry: any }) {
  const supabase = createClient()
  const router = useRouter()
  
  const [title, setTitle] = useState(initialEntry.title || '')
  const [tags, setTags] = useState<string[]>(initialEntry.tags || [])
  const [wordCount, setWordCount] = useState(initialEntry.word_count || 0)
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...' | 'Unsaved changes'>('Saved')
  
  const [showTags, setShowTags] = useState(tags.length > 0)
  const [tagInput, setTagInput] = useState('')
  const [showAI, setShowAI] = useState(true)
  
  const [aiSummary, setAiSummary] = useState('')
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false)
  const [aiExpand, setAiExpand] = useState('')
  const [aiExpandLoading, setAiExpandLoading] = useState(false)
  
  const saveTimer = useRef<NodeJS.Timeout | null>(null)
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Begin writing...' }),
      CharacterCount,
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      LinkExtension.configure({ openOnClick: false }),
    ],
    content: initialEntry.content || {},
    onUpdate: ({ editor }) => {
      setWordCount(editor.storage.characterCount.words())
      handleContentChange(editor.getJSON())
    }
  })

  const titleRef = useRef(title)
  const tagsRef = useRef(tags)
  const contentRef = useRef(initialEntry.content || {})
  
  useEffect(() => { titleRef.current = title }, [title])
  useEffect(() => { tagsRef.current = tags }, [tags])

  const handleContentChange = (jsonContent?: any) => {
    if (jsonContent) contentRef.current = jsonContent
    setSaveStatus('Unsaved changes')
    
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveToDb()
    }, 2000)
  }

  const saveToDb = async () => {
    setSaveStatus('Saving...')
    
    await supabase.from('journal_entries').update({
      title: titleRef.current,
      content: contentRef.current,
      word_count: editor?.storage.characterCount.words() || 0,
      tags: tagsRef.current,
      updated_at: new Date().toISOString()
    }).eq('id', initialEntry.id)
    
    setSaveStatus('Saved')
    router.refresh()
  }

  const deleteEntry = async () => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      await supabase.from('journal_entries').delete().eq('id', initialEntry.id)
      router.push('/journal')
      router.refresh()
    }
  }

  const handleAddTag = (e: any) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const newTags = [...tags, tagInput.trim()]
      setTags(newTags)
      setTagInput('')
      handleContentChange()
    }
  }
  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index)
    setTags(newTags)
    handleContentChange()
  }

  const summarizeEntry = async () => {
    if (!editor) return
    const text = editor.getText()
    if (!text.trim()) return alert("Write something first!")
    
    setAiSummaryLoading(true)
    setAiSummary('')
    setShowAI(true)
    
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

  const expandThought = async () => {
    if (!editor) return
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ')
    if (!selectedText) return alert("Select some text in the editor first to expand on.")
    
    setAiExpandLoading(true)
    setAiExpand('')
    setShowAI(true)
    
    try {
      const res = await fetch('/api/ai/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_text: selectedText, context: editor.getText() })
      })
      
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          setAiExpand(prev => prev + decoder.decode(value))
        }
      }
    } finally {
      setAiExpandLoading(false)
    }
  }

  const LeftNode = (
    <Link href="/journal" className="flex items-center gap-1.5 text-vault-text-3 hover:text-vault-text transition-colors font-mono text-[10px] uppercase tracking-wider pr-4 border-r border-vault-border mr-2">
      <ArrowLeft className="w-3.5 h-3.5" /> Journal
    </Link>
  )
  
  const EditableTitle = (
    <input 
      value={title} 
      onChange={e => {
        setTitle(e.target.value)
        handleContentChange()
      }}
      placeholder="Untitled"
      className="bg-transparent border-none focus:outline-none font-serif text-[16px] text-vault-text-2 min-w-[200px]"
    />
  )

  const RightNode = (
    <div className="flex items-center gap-4">
      <div className="font-mono text-[10px] text-vault-text-3 tracking-wider hidden sm:block">
        {wordCount} words · {Math.max(1, Math.ceil(wordCount / 200))} min read
      </div>
      <div className="w-[1px] h-4 bg-vault-border hidden sm:block" />
      <div className="font-mono text-[9px] uppercase text-vault-text-3 tracking-widest min-w-[70px] text-right">
        {saveStatus}
      </div>
      <div className="flex items-center gap-1 bg-vault-bg-4 rounded-[4px] p-0.5 ml-2">
        <button onClick={() => setShowTags(!showTags)} className={`p-1.5 rounded-[3px] transition-colors ${showTags ? 'bg-vault-bg-2 text-vault-text' : 'text-vault-text-3 hover:text-vault-text hover:bg-vault-bg-3'}`}>
          <Tag className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setShowAI(!showAI)} className={`p-1.5 rounded-[3px] transition-colors ${showAI ? 'bg-vault-accent/[0.15] text-vault-accent' : 'text-vault-text-3 hover:text-vault-text hover:bg-vault-bg-3'}`}>
          <Sparkles className="w-3.5 h-3.5" />
        </button>
        <button onClick={deleteEntry} className="p-1.5 rounded-[3px] text-vault-danger hover:bg-vault-danger/[0.15] transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex w-full h-[calc(100vh-52px)] -m-8 lg:-m-10 relative">
      <SetTopbar title={EditableTitle} leftNode={LeftNode} rightNode={RightNode} />
      <style>{EditorStyles}</style>

      {/* EDITOR PANEL */}
      <div className="flex-1 overflow-y-auto w-full relative">
        <div className="max-w-[720px] mx-auto py-12 px-8 lg:px-0 lg:py-16">
          
          <input 
            value={title}
            onChange={e => {
              setTitle(e.target.value)
              handleContentChange()
            }}
            placeholder="Title..."
            autoFocus={initialEntry.title === 'Untitled'}
            className="w-full bg-transparent border-none focus:outline-none font-serif text-[36px] text-vault-text leading-tight mb-2"
          />
          
          <div className="font-mono text-[10px] uppercase text-vault-text-3 tracking-widest mb-6">
            {format(new Date(initialEntry.created_at), 'EEEE, MMMM do yyyy')}
          </div>

          {showTags && (
            <div className="flex flex-wrap items-center gap-2 mb-8 bg-vault-bg-2 border border-vault-border rounded-[4px] p-2">
              <Tag className="w-3.5 h-3.5 text-vault-text-3 ml-1" />
              {tags.map((tag, i) => (
                <div key={i} className="flex items-center gap-1 bg-vault-bg-4 text-vault-text-2 font-mono text-[9px] uppercase tracking-wider px-2 py-1 rounded-[3px]">
                  {tag}
                  <button onClick={() => removeTag(i)} className="hover:text-vault-text ml-1"><X className="w-2.5 h-2.5" /></button>
                </div>
              ))}
              <input 
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tag..."
                className="bg-transparent border-none focus:outline-none font-mono text-[10px] text-vault-text placeholder-vault-text-3 min-w-[100px] px-1"
              />
            </div>
          )}

          <MenuBar editor={editor} />
          
          <div className="font-sans text-[17px] leading-[1.8] text-vault-text-2 min-h-[400px]">
            <EditorContent editor={editor} />
          </div>
          
        </div>
      </div>

      {/* AI SIDEBAR */}
      {showAI && (
        <div className="w-[280px] shrink-0 border-l border-vault-border bg-vault-bg-2 overflow-y-auto">
          <div className="sticky top-0 z-10 bg-vault-bg-2 border-b border-vault-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-vault-accent" />
              <div className="font-mono text-[10px] uppercase tracking-widest text-vault-text-3">AI Tools</div>
            </div>
            <button onClick={() => setShowAI(false)} className="text-vault-text-3 hover:text-vault-text transition-colors">
              <SidebarClose className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 flex flex-col gap-4">
            <button 
              onClick={summarizeEntry}
              disabled={aiSummaryLoading}
              className="flex items-center justify-between w-full bg-vault-bg-3 hover:bg-vault-bg-4 border border-vault-border hover:border-vault-accent-border p-3 rounded-[6px] transition-all duration-150 text-left group"
            >
              <span className="font-mono text-[11px] text-vault-text-2 group-hover:text-vault-accent transition-colors">
                {aiSummaryLoading ? 'Thinking...' : '✦ Summarise entry'}
              </span>
            </button>
            
            {aiSummary && (
              <div className="bg-vault-accent-dim border-l-[3px] border-vault-accent rounded-r-[6px] p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="bg-vault-accent/[0.15] text-vault-accent font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-[2px] tracking-widest">Summary</div>
                </div>
                <div className="font-sans text-[13px] text-vault-text leading-relaxed">
                  {aiSummary}
                </div>
              </div>
            )}

            <button 
              onClick={expandThought}
              disabled={aiExpandLoading}
              className="flex items-center justify-between w-full bg-vault-bg-3 hover:bg-vault-bg-4 border border-vault-border hover:border-vault-accent-border p-3 rounded-[6px] transition-all duration-150 text-left group"
            >
              <span className="font-mono text-[11px] text-vault-text-2 group-hover:text-vault-accent transition-colors">
                {aiExpandLoading ? 'Expanding...' : '✦ Expand thought'}
              </span>
            </button>
            
            {aiExpand && (
              <div className="bg-vault-accent-dim border-l-[3px] border-vault-accent rounded-r-[6px] p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="bg-vault-accent/[0.15] text-vault-accent font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-[2px] tracking-widest">Expansion</div>
                </div>
                <div className="font-sans text-[13px] text-vault-text leading-relaxed">
                  {aiExpand}
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button 
                    onClick={() => {
                      if (editor) {
                        editor.chain().focus().insertContent('\n\n' + aiExpand).run()
                        setAiExpand('')
                      }
                    }}
                    className="text-vault-accent hover:underline font-mono text-[9px] uppercase tracking-wider"
                  >
                    Insert
                  </button>
                  <button onClick={() => setAiExpand('')} className="text-vault-text-3 hover:text-vault-text font-mono text-[9px] uppercase tracking-wider transition-colors">Dismiss</button>
                </div>
              </div>
            )}

            <button 
              onClick={() => alert("Coming soon: AI Contradiction Check")}
              className="flex items-center justify-between w-full bg-vault-bg-3 hover:bg-vault-bg-4 border border-vault-border hover:border-vault-accent-border p-3 rounded-[6px] transition-all duration-150 text-left group"
            >
              <span className="font-mono text-[11px] text-vault-text-2 group-hover:text-vault-accent transition-colors">✦ Find contradictions</span>
            </button>

            <button 
              onClick={() => alert("Coming soon: AI Stance Link")}
              className="flex items-center justify-between w-full bg-vault-bg-3 hover:bg-vault-bg-4 border border-vault-border hover:border-vault-accent-border p-3 rounded-[6px] transition-all duration-150 text-left group"
            >
              <span className="font-mono text-[11px] text-vault-text-2 group-hover:text-vault-accent transition-colors">✦ Link to stance</span>
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
