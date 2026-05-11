import { NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided', code: 'NO_FILE' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const data = await pdfParse(buffer)
    
    return NextResponse.json({
      text: data.text,
      pageCount: data.numpages
    })
  } catch (error: any) {
    console.error('PDF Extraction Error:', error)
    return NextResponse.json({ error: error.message, code: 'EXTRACTION_ERROR' }, { status: 500 })
  }
}
