"use client"

import { useState, useEffect } from "react"
import { Download, ExternalLink, ZoomIn, ZoomOut, RotateCw } from "lucide-react"

interface PDFViewerProps {
  url: string
  title: string
  showDownload?: boolean
  showExternal?: boolean
  className?: string
}

export default function PDFViewer({ 
  url, 
  title, 
  showDownload = true, 
  showExternal = true,
  className = ""
}: PDFViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    setLoading(true)
    setError(false)
  }, [url])

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = url
    link.download = `${title}.pdf`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const zoomIn = () => setZoom(prev => Math.min(prev + 25, 200))
  const zoomOut = () => setZoom(prev => Math.max(prev - 25, 50))

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h3 className="font-medium text-gray-900 truncate">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {zoom}%
            </span>
            <button
              onClick={zoomIn}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {showDownload && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          )}
          {showExternal && (
            <button
              onClick={handleExternal}
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              title="Open in New Tab"
            >
              <ExternalLink className="w-4 h-4" />
              Open
            </button>
          )}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading PDF...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">Failed to load PDF</p>
              <button
                onClick={handleExternal}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Try opening in new tab
              </button>
            </div>
          </div>
        )}

        <iframe
          src={`${url}#zoom=${zoom}`}
          className="w-full h-full border-0"
          title={title}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false)
            setError(true)
          }}
          style={{ display: loading || error ? 'none' : 'block' }}
        />
      </div>
    </div>
  )
}