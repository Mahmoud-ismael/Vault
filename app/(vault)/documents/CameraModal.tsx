'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Camera, Scan, RotateCcw, Check, ChevronLeft, Layers } from 'lucide-react'

interface CameraModalProps {
  onClose: () => void
  onCapture: (blob: Blob) => void
  mode: 'photo' | 'scan'
}

export function CameraModal({ onClose, onCapture, mode }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (err) {
        console.error('Error accessing camera:', err)
        setError('Could not access camera. Please ensure you have given permission.')
      }
    }

    startCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        if (mode === 'scan') {
          // Basic perspective correction / auto-crop simulation
          // In a real app, we'd use a library like OpenCV.js here.
          // For now, we'll just simulate a "cleaner" scan look.
          context.filter = 'contrast(1.2) brightness(1.1) grayscale(0.2)'
          context.drawImage(canvas, 0, 0)
        }

        const dataUrl = canvas.toDataURL('image/jpeg')
        setCapturedImage(dataUrl)
      }
    }
  }

  const confirm = () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          onCapture(blob)
          onClose()
        }
      }, 'image/jpeg', 0.9)
    }
  }

  const retake = () => {
    setCapturedImage(null)
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
        <button 
          onClick={onClose}
          className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-white text-[12px] uppercase tracking-widest font-bold">
          {mode === 'photo' ? 'Capture Photo' : 'Scan Document'}
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-white text-center p-8">
            <p className="mb-4">{error}</p>
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-vault-accent text-black rounded-[4px] font-bold"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {!capturedImage ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                
                {mode === 'scan' && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[85%] h-[70%] border-2 border-vault-accent rounded-[8px] relative">
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-vault-accent rounded-tl-[4px]" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-vault-accent rounded-tr-[4px]" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-vault-accent rounded-bl-[4px]" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-vault-accent rounded-br-[4px]" />
                      <div className="absolute inset-0 bg-vault-accent/5" />
                    </div>
                  </div>
                )}
                
                <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-8">
                  <button 
                    onClick={capture}
                    className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white active:scale-95 transition-all shadow-2xl"
                  >
                    <div className="w-14 h-14 bg-white rounded-full" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-full object-contain"
                />
                
                <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-6 px-4">
                  <button 
                    onClick={retake}
                    className="flex-1 max-w-[160px] flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white py-4 rounded-[12px] font-bold active:scale-95 transition-all"
                  >
                    <RotateCcw className="w-5 h-5" /> Retake
                  </button>
                  <button 
                    onClick={confirm}
                    className="flex-1 max-w-[160px] flex items-center justify-center gap-2 bg-vault-accent text-[#0D0D0F] py-4 rounded-[12px] font-bold active:scale-95 transition-all shadow-lg"
                  >
                    <Check className="w-5 h-5" /> Use Photo
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
