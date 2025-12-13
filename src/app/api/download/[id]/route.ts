import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get authorization header
    const headersList = await headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch resource details from your backend
    const resourceResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://client-sure-backend.vercel.app/api'}/auth/resources/${id}`, {
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json'
      }
    })

    if (!resourceResponse.ok) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    const resource = await resourceResponse.json()
    
    // Check if user has access and resource is PDF
    if (!resource.isAccessedByUser || resource.type !== 'pdf') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch PDF from Cloudinary
    const pdfResponse = await fetch(resource.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PDF-Downloader/1.0)'
      }
    })

    if (!pdfResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 500 })
    }

    // Get PDF buffer
    const pdfBuffer = await pdfResponse.arrayBuffer()
    
    // Clean filename for download
    const cleanFilename = resource.title
      .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 100) // Limit length
    
    // Create response with proper headers for download
    const response = new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${cleanFilename}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

    return response

  } catch (error) {
    console.error('PDF Download Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}