import { useState, useRef, useEffect } from 'react'
import { X, Check } from 'lucide-react'

export type CameraMode = 'photo' | 'scan'

interface CameraModalProps {
  mode: CameraMode
  onComplete: (files: File[]) => void
  onClose: () => void
}

export function CameraModal({ mode, onComplete, onClose }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [capturedImages, setCapturedImages] = useState<File[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [lastFile, setLastFile] = useState<File | null>(null)
  
  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
        })
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (err: any) {
        setError('Camera permission denied. Please grant camera access in your browser settings to use this feature.')
      }
    }
    startCamera()
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])
  
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
      }
    }
  }, [stream])

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    if (mode === 'scan') {
      const guideWidth = video.videoWidth * 0.8
      const guideHeight = video.videoHeight * 0.8
      const startX = (video.videoWidth - guideWidth) / 2
      const startY = (video.videoHeight - guideHeight) / 2
      
      canvas.width = guideWidth
      canvas.height = guideHeight
      ctx.drawImage(video, startX, startY, guideWidth, guideHeight, 0, 0, guideWidth, guideHeight)
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    }
    
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
      setLastFile(file)
      setPreviewUrl(URL.createObjectURL(blob))
    }, 'image/jpeg', 0.9)
  }

  const handleConfirm = () => {
    if (!lastFile) return
    if (mode === 'photo') {
      onComplete([lastFile])
    } else {
      setCapturedImages(prev => [...prev, lastFile])
      setPreviewUrl(null)
      setLastFile(null)
    }
  }

  const handleRetake = () => {
    setPreviewUrl(null)
    setLastFile(null)
  }
  
  const handleFinishScan = () => {
    if (capturedImages.length > 0) {
      onComplete(capturedImages)
    }
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0D0D0F]/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
        <p className="text-vault-danger font-sans text-lg max-w-md">{error}</p>
        <button onClick={onClose} className="mt-6 px-6 py-2 bg-vault-bg-3 rounded-[4px] font-mono text-[11px] uppercase text-vault-text hover:bg-vault-bg-4 transition-colors">
          Close
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0D0F]/90 backdrop-blur-sm sm:p-6">
      <div className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-[600px] sm:min-w-[400px] bg-vault-bg flex flex-col relative overflow-hidden sm:rounded-[8px] sm:border border-vault-border shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-vault-bg-2 border-b border-vault-border z-10">
          <div className="font-serif text-[18px] text-vault-text">
            {mode === 'scan' ? 'Scan Document' : 'Take Photo'}
          </div>
          <button onClick={onClose} className="text-vault-text-3 hover:text-vault-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden min-h-[400px]">
          
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              
              {mode === 'scan' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8">
                  <div className="w-full h-full max-w-sm max-h-[70vh] border border-vault-accent/50 relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-vault-accent"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-vault-accent"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-vault-accent"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-vault-accent"></div>
                    <div className="absolute inset-0 bg-vault-accent/5"></div>
                  </div>
                </div>
              )}
            </>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="p-6 bg-vault-bg-2 border-t border-vault-border flex flex-col gap-4 z-10">
          {previewUrl ? (
            <div className="flex items-center justify-center gap-4 w-full">
              <button onClick={handleRetake} className="flex-1 py-3 px-4 bg-vault-bg-3 hover:bg-vault-bg-4 text-vault-text rounded-[4px] font-mono text-[11px] uppercase tracking-wider transition-colors">
                Retake
              </button>
              <button onClick={handleConfirm} className="flex-1 py-3 px-4 bg-vault-accent hover:bg-vault-accent-2 text-[#0D0D0F] rounded-[4px] font-mono text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> {mode === 'scan' ? 'Add Page' : 'Confirm'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full relative">
              <button onClick={capture} className="w-16 h-16 rounded-full border-4 border-vault-border flex items-center justify-center hover:border-vault-accent transition-colors">
                <div className="w-12 h-12 bg-vault-text rounded-full hover:bg-vault-accent transition-colors" />
              </button>
              
              {mode === 'scan' && capturedImages.length > 0 && (
                <div className="absolute right-0 flex flex-col items-center">
                  <button onClick={handleFinishScan} className="bg-vault-accent text-[#0D0D0F] px-4 py-2 rounded-[4px] font-mono text-[11px] uppercase tracking-wider transition-colors shadow-lg">
                    Finish ({capturedImages.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
