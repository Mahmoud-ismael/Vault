'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Archive, Plus, Loader2, Camera, Scan } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CameraModal, CameraMode } from '@/components/vault/CameraModal'
import { SetTopbar } from '@/components/vault/SetTopbar'
import { DocumentCard } from '@/components/vault/DocumentCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { toast } from 'sonner'

type UploadStatus = {
  filename: string
  status: 'uploading' | 'extracting' | 'summarising' | 'complete' | 'error'
  error?: string
}

export default function DocumentsClient({ initialDocuments, user }: { initialDocuments: any[], user: any }) {
  const [documents, setDocuments] = useState(initialDocuments)
  const [filter, setFilter] = useState('All')
  const [uploads, setUploads] = useState<UploadStatus[]>([])
  const [showUploader, setShowUploader] = useState(initialDocuments.length === 0)
  const [cameraMode, setCameraMode] = useState<CameraMode | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  const filteredDocs = useMemo(() => {
    if (filter === 'All') return documents
    return documents.filter(d => d.file_type.toLowerCase() === filter.toLowerCase())
  }, [documents, filter])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newUploads = acceptedFiles.map(f => ({ filename: f.name, status: 'uploading' as const }))
    setUploads(prev => [...prev, ...newUploads])
    
    for (const file of acceptedFiles) {
      await processFile(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const updateUploadStatus = (filename: string, status: UploadStatus['status'], error?: string) => {
    setUploads(prev => prev.map(u => u.filename === filename ? { ...u, status, error } : u))
  }

  const processFile = async (file: File) => {
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      const isPdf = ext === 'pdf'
      const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(ext)
      const fileType = isPdf ? 'PDF' : isImage ? 'IMAGE' : 'TXT'

      // 1. Upload to Supabase Storage
      updateUploadStatus(file.name, 'uploading')
      const uuid = crypto.randomUUID()
      const filePath = `${user.id}/${uuid}/${file.name}`
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)
        
      if (uploadError) throw new Error(uploadError.message)

      // 2. Extract Text
      updateUploadStatus(file.name, 'extracting')
      let extractedText = ''
      
      const formData = new FormData()
      formData.append('file', file)

      if (isPdf) {
        const res = await fetch('/api/documents/extract-text', { method: 'POST', body: formData })
        if (!res.ok) throw new Error('Failed to extract PDF text')
        const data = await res.json()
        extractedText = data.text
      } else if (isImage) {
        const res = await fetch('/api/documents/ocr', { method: 'POST', body: formData })
        if (!res.ok) throw new Error('Failed to OCR image')
        const data = await res.json()
        extractedText = data.text
      } else {
        extractedText = await file.text()
      }

      if (!extractedText.trim()) throw new Error('No text extracted')

      // 3. Insert temp DB record
      const { data: docRecord, error: dbError } = await supabase.from('documents').insert({
        user_id: user.id,
        title: file.name,
        file_path: filePath,
        file_type: fileType,
        extracted_text: extractedText,
      }).select().single()
      
      if (dbError) throw new Error(dbError.message)

      // Update UI optimistically
      setDocuments(prev => [docRecord, ...prev])

      // 4. Summarise
      updateUploadStatus(file.name, 'summarising')
      const sumRes = await fetch('/api/ai/summarise-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractedText, title: file.name })
      })
      
      const reader = sumRes.body?.getReader()
      const decoder = new TextDecoder()
      let summary = ''
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          summary += decoder.decode(value)
          
          setDocuments(prev => prev.map(d => d.id === docRecord.id ? { ...d, summary } : d))
        }
      }

      // Save summary
      await supabase.from('documents').update({ summary }).eq('id', docRecord.id)
      updateUploadStatus(file.name, 'complete')
      toast.success('Document processed')

    } catch (err: any) {
      updateUploadStatus(file.name, 'error', err.message)
      toast.error(`Error: ${err.message}`)
    }
  }

  const processScanBatch = async (files: File[]) => {
    if (files.length === 0) return
    if (files.length === 1) return processFile(files[0])
    
    const batchName = `Scanned_Doc_${new Date().getTime()}`
    const newUpload = { filename: batchName, status: 'uploading' as const }
    setUploads(prev => [...prev, newUpload])
    
    try {
      let combinedText = ''
      const uuid = crypto.randomUUID()
      const firstFilePath = `${user.id}/${uuid}/${files[0].name}`
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const filePath = `${user.id}/${uuid}/${file.name}`
        const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file)
        if (uploadError) throw new Error(uploadError.message)
        
        updateUploadStatus(batchName, 'extracting')
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/documents/ocr', { method: 'POST', body: formData })
        if (res.ok) {
          const data = await res.json()
          combinedText += `\n\n--- Page ${i + 1} ---\n\n` + data.text
        }
      }
      
      if (!combinedText.trim()) throw new Error('No text extracted')

      const { data: docRecord, error: dbError } = await supabase.from('documents').insert({
        user_id: user.id,
        title: `Scanned Document (${files.length} pages)`,
        file_path: firstFilePath,
        file_type: 'IMAGE',
        extracted_text: combinedText,
      }).select().single()
      
      if (dbError) throw new Error(dbError.message)
      setDocuments(prev => [docRecord, ...prev])

      updateUploadStatus(batchName, 'summarising')
      const sumRes = await fetch('/api/ai/summarise-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: combinedText, title: `Scanned Document (${files.length} pages)` })
      })
      
      const reader = sumRes.body?.getReader()
      const decoder = new TextDecoder()
      let summary = ''
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          summary += decoder.decode(value)
          setDocuments(prev => prev.map(d => d.id === docRecord.id ? { ...d, summary } : d))
        }
      }

      await supabase.from('documents').update({ summary }).eq('id', docRecord.id)
      updateUploadStatus(batchName, 'complete')
      toast.success('Document scan processed')

    } catch (err: any) {
      updateUploadStatus(batchName, 'error', err.message)
      toast.error(`Error: ${err.message}`)
    }
  }

  const handleCameraComplete = async (files: File[]) => {
    setCameraMode(null)
    if (files.length === 0) return
    
    if (files.length === 1) {
      const newUploads = [{ filename: files[0].name, status: 'uploading' as const }]
      setUploads(prev => [...prev, ...newUploads])
      await processFile(files[0])
    } else {
      await processScanBatch(files)
    }
  }

  const LeftNode = (
    <div className="text-[28px] text-vault-text leading-none">Documents</div>
  )

  const RightNode = (
    <div className="flex items-center gap-4">
      <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-normal text-vault-text-3">
        {documents.length} · PDFs, images, scans, articles
      </div>
      <div className="w-[1px] h-4 bg-vault-border hidden sm:block" />
      <div className="flex bg-vault-bg-4 rounded-[4px] p-0.5 border border-vault-border">
        {['All', 'PDF', 'Image', 'Article'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-[10px]  uppercase tracking-normal rounded-[3px] transition-colors ${
              filter === f ? 'bg-vault-bg-2 text-vault-text shadow-sm' : 'text-vault-text-3 hover:text-vault-text-2 hover:bg-vault-bg-3'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <button 
        onClick={() => setShowUploader(!showUploader)}
        className="flex items-center gap-2 bg-vault-accent text-[#0D0D0F] text-[11px] uppercase tracking-[0.1em] py-1.5 px-4 rounded-[4px] hover:bg-vault-accent-2 transition-colors duration-150"
      >
        <Plus className="w-3.5 h-3.5" /> Upload
      </button>
    </div>
  )

  return (
    <div className="w-full flex flex-col gap-8 pb-16 relative">
      <SetTopbar title="" leftNode={LeftNode} rightNode={RightNode} />

      {/* UPLOADER */}
      {showUploader && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              {...getRootProps()} 
              className={`md:col-span-1 border-[2px] border-dashed rounded-[8px] p-8 flex flex-col items-center justify-center cursor-pointer transition-colors duration-150 ${
                isDragActive ? 'border-vault-accent bg-vault-accent/[0.05]' : 'border-vault-border-2 bg-vault-bg-2 hover:border-vault-accent-border hover:bg-vault-bg-3'
              }`}
            >
              <input {...getInputProps()} />
              <Archive className="w-8 h-8 text-vault-text-3 mb-4" />
              <h2 className="text-[18px] text-vault-text mb-2 text-center">Drop files or click</h2>
              <div className="text-[9px] text-vault-text-3 uppercase tracking-normal text-center">
                PDF, DOCX, TXT, PNG, JPG, WEBP
              </div>
            </div>

            <button 
              onClick={() => setCameraMode('photo')}
              className="md:col-span-1 border border-vault-border-2 bg-vault-bg-2 hover:border-vault-accent-border hover:bg-vault-bg-3 rounded-[8px] p-8 flex flex-col items-center justify-center transition-colors duration-150"
            >
              <Camera className="w-8 h-8 text-vault-text-3 mb-4" />
              <h2 className="text-[18px] text-vault-text mb-2">Take Photo</h2>
              <div className="text-[9px] text-vault-text-3 uppercase tracking-normal text-center">
                Capture image instantly
              </div>
            </button>

            <button 
              onClick={() => setCameraMode('scan')}
              className="md:col-span-1 border border-vault-border-2 bg-vault-bg-2 hover:border-vault-accent-border hover:bg-vault-bg-3 rounded-[8px] p-8 flex flex-col items-center justify-center transition-colors duration-150"
            >
              <Scan className="w-8 h-8 text-vault-text-3 mb-4" />
              <h2 className="text-[18px] text-vault-text mb-2">Scan Document</h2>
              <div className="text-[9px] text-vault-text-3 uppercase tracking-normal text-center">
                Multi-page auto-crop
              </div>
            </button>
          </div>

          {/* Upload Progress Queue */}
          {uploads.length > 0 && (
            <div className="flex flex-col gap-2">
              {uploads.map((u, i) => (
                <div key={i} className="flex items-center justify-between bg-vault-bg-2 border border-vault-border rounded-[4px] p-3 px-4">
                  <div className="text-[13px] text-vault-text line-clamp-1">{u.filename}</div>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-normal">
                    {u.status === 'uploading' && <><Loader2 className="w-3 h-3 animate-spin text-vault-accent" /> <span className="text-vault-text-3">Uploading...</span></>}
                    {u.status === 'extracting' && <><Loader2 className="w-3 h-3 animate-spin text-vault-accent" /> <span className="text-vault-text-3">Extracting text...</span></>}
                    {u.status === 'summarising' && <><Loader2 className="w-3 h-3 animate-spin text-vault-accent" /> <span className="text-vault-accent">Generating summary...</span></>}
                    {u.status === 'complete' && <span className="text-vault-settled">Complete</span>}
                    {u.status === 'error' && <span className="text-vault-danger">Error: {u.error}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {filteredDocs.map(doc => (
          <DocumentCard key={doc.id} doc={doc} />
        ))}
      </div>
      
      {filteredDocs.length === 0 && !showUploader && (
        <EmptyState 
          icon={Archive}
          title="No documents uploaded."
          subtitle="Add sources to chat with and extract arguments."
          action={
            <button 
              onClick={() => setShowUploader(true)}
              className="bg-vault-accent text-[#0D0D0F] text-[11px] uppercase tracking-[0.1em] py-2 px-6 rounded-[4px] hover:bg-vault-accent-2 transition-colors duration-150 inline-block mt-2"
            >
              Upload Document
            </button>
          }
        />
      )}

      {cameraMode && (
        <CameraModal 
          mode={cameraMode} 
          onClose={() => setCameraMode(null)} 
          onComplete={handleCameraComplete} 
        />
      )}
    </div>
  )
}
