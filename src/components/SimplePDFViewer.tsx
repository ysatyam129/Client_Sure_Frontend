"use client"

import { useState } from 'react'
import { Download, ExternalLink, FileText } from 'lucide-react'

interface SimplePDFViewerProps {
  url: string
  title: string
  showDownload?: boolean
  showExternal?: boolean
  className?: string
}

export default function SimplePDFViewer({ 
  url, 
  title, 
  showDownload = true, 
  showExternal = true,
  className = "" 
}: SimplePDFViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const downloadPDF = async () => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${title}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const openExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-red-600" />
          <span className="text-sm font-medium text-gray-700">PDF Document</span>
        </div>

        <div className="flex items-center gap-2">
          {showExternal && (
            <button
              onClick={openExternal}
              className="p-2 rounded-lg bg-white border hover:bg-gray-50"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}

          {showDownload && (
            <button
              onClick={downloadPDF}
              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* PDF Content */}
      <div className="relative p-4 bg-gray-100 min-h-[600px] flex items-center justify-center">
        <div className="w-full h-full relative">
          {/* Try direct PDF first */}
          <iframe
            src={url}
            className="w-full h-[600px] border-0 rounded"
            title={title}
            onLoad={() => {
              setLoading(false)
              setError(false)
            }}
            onError={() => {
              // Fallback to Google Docs viewer
              const iframe = document.querySelector('iframe')
              if (iframe && !iframe.src.includes('docs.google.com')) {
                iframe.src = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
              } else {
                setError(true)
                setLoading(false)
              }
            }}
            style={{ display: error ? 'none' : 'block' }}
          />
          
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-sm text-gray-600">Loading PDF...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center p-8">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">PDF Document Ready</h3>
                <p className="text-gray-600 mb-6">Preview not available. Click below to open or download.</p>
                <div className="space-y-3">
                  {showExternal && (
                    <button
                      onClick={openExternal}
                      className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Open PDF in New Tab
                    </button>
                  )}
                  {showDownload && (
                    <button
                      onClick={downloadPDF}
                      className="block w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      Download PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}