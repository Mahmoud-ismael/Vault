import { NextResponse } from 'next/server'
import Tesseract from 'tesseract.js'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided', code: 'NO_FILE' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng')
    
    return NextResponse.json({ text })
  } catch (error: any) {
    console.error('OCR Error:', error)
    return NextResponse.json({ error: error.message, code: 'OCR_ERROR' }, { status: 500 })
  }
}