'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Sparkles, Download, Trash2, X, Plus, Edit2, MessageSquare } from 'lucide-react'
import { SetTopbar } from '@/components/vault/SetTopbar'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'

type Annotation = {
  id: string
  selectedText: string
  note: string
  timestamp: string
}

export default function DocumentViewerClient({ document, publicUrl }: { document: any, publicUrl: string }) {
  const supabase = createClient()
  const router = useRouter()
  
  const [annotations, setAnnotations] = useState<Annotation[]>(document.annotations || [])
  const [selection, setSelection] = useState<{ text: string, top: number, left: number } | null>(null)
  
  const [askQuery, setAskQuery] = useState('')
  const [askAnswer, setAskAnswer] = useState('')
  const [askLoading, setAskLoading] = useState(false)
  
  const [extractArgs, setExtractArgs] = useState('')
  const [extractLoading, setExtractLoading] = useState(false)
  const [summary, setSummary] = useState(document.summary || '')
  
  const contentRef = useRef<HTMLDivElement>(null)

  const handleMouseUp = () => {
    const sel = window.getSelection()
    if (sel && sel.toString().trim().length > 0 && contentRef.current?.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      
      // Calculate coordinates relative to the viewport, but we'll show fixed over it
      setSelection({
        text: sel.toString().trim(),
        top: rect.top - 40,
        left: rect.left + (rect.width / 2)
      })
    } else {
      // Don't immediately dismiss if clicking inside the popover
      // we handled that via onMouseDown propagation in the popover
      setSelection(null)
    }
  }

  const addAnnotation = () => {
    if (!selection) return
    const note = window.prompt("Enter your note for this highlight:")
    if (note) {
      const newAnn: Annotation = {
        id: crypto.randomUUID(),
        selectedText: selection.text,
        note,
        timestamp: new Date().toISOString()
      }
      const updated = [...annotations, newAnn]
      setAnnotations(updated)
      setSelection(null)
      saveAnnotations(updated)
    }
  }

  const saveAnnotations = async (updated: Annotation[]) => {
    await supabase.from('documents').update({ annotations: updated }).eq('id', document.id)
  }

  const deleteAnnotation = async (id: string) => {
    const updated = annotations.filter(a => a.id !== id)
    setAnnotations(updated)
    await saveAnnotations(updated)
  }

  const deleteDocument = async () => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      await supabase.from('documents').delete().eq('id', document.id)
      await supabase.storage.from('documents').remove([document.file_path])
      router.push('/documents')
      router.refresh()
    }
  }

  const askDocument = async () => {
    if (!askQuery.trim()) return
    setAskLoading(true)
    setAskAnswer('')
    try {
      const res = await fetch('/api/ai/ask-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: askQuery, document_text: document.extracted_text })
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          setAskAnswer(prev => prev + decoder.decode(value))
        }
      }
    } finally {
      setAskLoading(false)
    }
  }

  const extractArguments = async () => {
    setExtractLoading(true)
    setExtractArgs('')
    try {
      const res = await fetch('/api/ai/extract-arguments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: document.extracted_text })
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          setExtractArgs(prev => prev + decoder.decode(value))
        }
      }
    } finally {
      setExtractLoading(false)
    }
  }

  const generateNote = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from('notes').insert({
      user_id: user.id,
      title: `Analysis: ${document.title}`,
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Overview' }] },
          { type: 'paragraph', content: [{ type: 'text', text: summary || '...' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Key Arguments' }] },
          { type: 'paragraph', content: [{ type: 'text', text: extractArgs || 'Extract arguments using AI first to populate this section.' }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'My Verdict' }] },
          { type: 'paragraph' }
        ]
      }
    }).select().single()

    if (data) router.push(`/notes/${data.id}`)
  }

  const downloadFile = async () => {
    const { data } = await supabase.storage.from('documents').createSignedUrl(document.file_path, 60)
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  const LeftNode = (
    <Link href="/documents" className="flex items-center gap-1.5 text-vault-text-3 hover:text-vault-text transition-colors font-mono text-[10px] uppercase tracking-wider pr-4 border-r border-vault-border mr-2">
      <ArrowLeft className="w-3.5 h-3.5" /> Documents
    </Link>
  )

  const RightNode = (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1 bg-vault-bg-4 rounded-[4px] p-0.5 ml-2">
        <button onClick={downloadFile} className="p-1.5 rounded-[3px] text-vault-text-3 hover:text-vault-text hover:bg-vault-bg-3 transition-colors">
          <Download className="w-3.5 h-3.5" />
        </button>
        <button onClick={deleteDocument} className="p-1.5 rounded-[3px] text-vault-danger hover:bg-vault-danger/[0.15] transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )

  // Markdown rendering components to intercept headings
  const components = {
    h1: ({node, ...props}: any) => <h1 className="font-serif text-[32px] text-vault-text mt-8 mb-4" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="font-serif text-[24px] text-vault-text mt-6 mb-3" {...props} />,
    h3: ({node, ...props}: any) => <h3 className="font-sans font-medium text-[18px] text-vault-text mt-4 mb-2" {...props} />,
    p: ({node, ...props}: any) => <p className="mb-4" {...props} />
  }

  return (
    <div className="flex w-full h-[calc(100vh-52px)] -m-8 lg:-m-10 relative bg-vault-bg overflow-hidden" onMouseUp={handleMouseUp}>
      <SetTopbar title={document.title} leftNode={LeftNode} rightNode={RightNode} />
      
      {/* SELECTION POPOVER */}
      {selection && (
        <div 
          className="fixed z-50 flex items-center gap-1 bg-vault-bg-2 border border-vault-border rounded-[6px] shadow-lg p-1 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: selection.top, left: selection.left, transform: 'translateX(-50%)' }}
          onMouseDown={e => e.stopPropagation()} // Prevent handleMouseUp firing and clearing selection
        >
          <button 
            onClick={() => addAnnotation()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] hover:bg-vault-bg-3 font-sans text-[12px] text-vault-text-2 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Add Note
          </button>
        </div>
      )}

      {/* DOCUMENT VIEW */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full min-h-full bg-vault-bg-2 py-16 px-10 border-r border-vault-border">
          {document.file_type === 'IMAGE' ? (
            <div className="max-w-4xl mx-auto flex flex-col gap-8">
              <img src={publicUrl} alt={document.title} className="w-full rounded-[6px] border border-vault-border shadow-sm" />
              <div className="font-sans text-[17px] leading-[1.8] text-vault-text-2" ref={contentRef}>
                <ReactMarkdown components={components}>{document.extracted_text || ''}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="max-w-[700px] mx-auto font-sans text-[17px] leading-[1.8] text-vault-text-2" ref={contentRef}>
              <ReactMarkdown components={components}>{document.extracted_text || ''}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {/* ANNOTATIONS SIDEBAR */}
      <div className="w-[320px] shrink-0 bg-vault-bg-2 flex flex-col border-l border-vault-border h-full">
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          
          {/* Annotations List */}
          <div className="flex flex-col gap-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-vault-text-3">
              Annotations ({annotations.length})
            </div>
            {annotations.length === 0 ? (
              <div className="font-sans text-[13px] italic text-vault-text-3">
                Select text in the document to add notes.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {annotations.map(ann => (
                  <div key={ann.id} className="group flex flex-col gap-2 p-3 bg-vault-bg border border-vault-border rounded-[6px] relative">
                    <button 
                      onClick={() => deleteAnnotation(ann.id)}
                      className="absolute top-2 right-2 p-1 rounded hover:bg-vault-bg-3 text-vault-text-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-vault-danger" />
                    </button>
                    <div className="pl-3 border-l-[3px] border-vault-accent font-serif italic text-[14px] text-vault-text-3 leading-snug">
                      "{ann.selectedText}"
                    </div>
                    <div className="font-sans text-[14px] text-vault-text">
                      {ann.note}
                    </div>
                    <div className="font-mono text-[9px] uppercase tracking-wider text-vault-text-4">
                      {format(new Date(ann.timestamp), 'MMM d, yyyy')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-full h-[1px] bg-vault-border" />

          {/* AI Tools */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-vault-accent" />
              <div className="font-mono text-[10px] uppercase tracking-widest text-vault-text-3">AI Intelligence</div>
            </div>

            {/* Summary */}
            <div className="bg-vault-accent-dim border border-vault-accent-border rounded-[6px] p-3 flex flex-col gap-2">
              <div className="font-mono text-[10px] tracking-wider text-vault-accent uppercase">AI Summary</div>
              <div className="font-sans text-[13px] text-vault-text leading-relaxed">
                {summary || 'No summary available.'}
              </div>
            </div>

            {/* Ask Document */}
            <div className="flex flex-col gap-2 bg-vault-bg-3 border border-vault-border p-3 rounded-[6px]">
              <div className="font-mono text-[10px] uppercase tracking-widest text-vault-accent">✦ Ask this document</div>
              <input 
                value={askQuery}
                onChange={e => setAskQuery(e.target.value)}
                placeholder="Ask a question..."
                className="w-full bg-vault-bg-4 border border-vault-border rounded-[4px] px-2 py-1.5 font-sans text-[13px] text-vault-text placeholder-vault-text-3 focus:outline-none focus:border-vault-accent transition-colors duration-150"
              />
              <button 
                onClick={askDocument}
                disabled={askLoading || !askQuery.trim()}
                className="w-full bg-vault-accent text-[#0D0D0F] font-mono text-[10px] uppercase tracking-widest py-1.5 rounded-[4px] hover:bg-vault-accent-2 disabled:opacity-50 transition-colors"
              >
                {askLoading ? 'Thinking...' : 'Ask AI'}
              </button>
              {askAnswer && (
                <div className="mt-2 font-sans text-[13px] text-vault-text bg-vault-bg-4 p-2 rounded-[4px] border border-vault-border-2 leading-relaxed">
                  {askAnswer}
                </div>
              )}
            </div>

            {/* Extract Arguments */}
            <div className="flex flex-col gap-2">
              <button 
                onClick={extractArguments}
                disabled={extractLoading}
                className="flex items-center justify-between w-full bg-vault-bg-3 hover:bg-vault-bg-4 border border-vault-border hover:border-vault-accent-border p-3 rounded-[6px] transition-all duration-150 text-left group"
              >
                <span className="font-mono text-[11px] text-vault-text-2 group-hover:text-vault-accent transition-colors">
                  {extractLoading ? 'Extracting...' : '✦ Extract key arguments'}
                </span>
              </button>
              
              {extractArgs && (
                <div className="bg-vault-bg-4 border border-vault-border rounded-[6px] p-3 font-sans text-[13px] text-vault-text leading-relaxed whitespace-pre-wrap">
                  {extractArgs}
                </div>
              )}
            </div>

            {/* Generate Note */}
            <button 
              onClick={generateNote}
              className="flex items-center justify-between w-full bg-vault-bg-3 hover:bg-vault-bg-4 border border-vault-border hover:border-vault-accent-border p-3 rounded-[6px] transition-all duration-150 text-left group"
            >
              <span className="font-mono text-[11px] text-vault-text-2 group-hover:text-vault-accent transition-colors">
                ✦ Generate note
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
