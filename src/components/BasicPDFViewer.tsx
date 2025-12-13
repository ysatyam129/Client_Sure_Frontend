"use client"

import { useState, useEffect } from 'react'
import { Download, ExternalLink, FileText, Eye, ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react'

interface BasicPDFViewerProps {
  url: string
  title: string
  resourceId?: string
  showDownload?: boolean
  showExternal?: boolean
  className?: string
}

export default function BasicPDFViewer({ 
  url, 
  title, 
  resourceId,
  showDownload = true, 
  showExternal = true,
  className = "" 
}: BasicPDFViewerProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [previewError, setPreviewError] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  
  // Check if URL is valid
  const isValidUrl = url && url !== 'null' && url.trim() !== ''

  const downloadPDF = async () => {
    try {
      if (resourceId) {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:5000/api/resources/${resourceId}/download`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error(`Download failed: ${response.status}`)
        }
        
        const blob = await response.blob()
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${title}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(link.href)
      } else {
        // Direct download from URL
        window.open(url, '_blank')
      }
    } catch (error) {
      console.error('Download failed:', error)
      window.open(url, '_blank')
    }
  }

  const openExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const togglePreview = () => {
    setShowPreview(!showPreview)
    setPreviewError(false)
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const openFullscreen = () => {
    if (resourceId) {
      window.open(`/user/resource/${resourceId}/fullscreen`, '_blank')
    } else {
      window.open(url, '_blank')
    }
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-red-600" />
          <div>
            <span className="text-sm font-medium text-gray-700">PDF Document</span>
            <div className="text-xs text-gray-500">{title}</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={togglePreview}
            className={`p-2 rounded-lg border transition-colors ${
              showPreview ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
            title="Toggle preview"
          >
            <Eye className="w-4 h-4" />
          </button>

          {showPreview && (
            <>
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-2 rounded-lg bg-white border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              
              <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-white border rounded">
                {zoom}%
              </span>
              
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="p-2 rounded-lg bg-white border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                onClick={handleRotate}
                className="p-2 rounded-lg bg-white border hover:bg-gray-50"
                title="Rotate"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={openFullscreen}
            className="p-2 rounded-lg bg-white border hover:bg-gray-50"
            title="Open fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

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
              className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* PDF Content */}
      <div className="p-4 bg-gray-100 min-h-[600px] flex items-center justify-center">
        {showPreview && !previewError && isValidUrl ? (
          <div className="w-full h-full overflow-auto bg-white rounded-lg shadow-inner">
            <div 
              className="transition-transform duration-200 origin-center"
              style={{ 
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                minHeight: '600px'
              }}
            >
              <embed
                src={url}
                type="application/pdf"
                className="w-full h-[600px] border-0 rounded"
                onError={() => {
                  console.log('Embed failed, trying iframe')
                  setPreviewError(true)
                }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {!isValidUrl ? 'PDF Not Available' : previewError ? 'Preview Not Available' : 'PDF Document'}
            </h3>
            <p className="text-gray-600 mb-6">
              {!isValidUrl 
                ? 'PDF URL is not available. Please contact support.' 
                : previewError 
                ? 'Browser cannot display this PDF. Try downloading or opening in a new tab.' 
                : 'Click preview to view or use the buttons below.'
              }
            </p>
            {previewError && isValidUrl && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm text-yellow-800">
                  <strong>Common Issues:</strong><br/>
                  • PDF may be password protected<br/>
                  • File might be corrupted or invalid<br/>
                  • Browser security blocking content<br/>
                  • Cloudinary URL access restrictions<br/>
                  <strong>Solution:</strong> Try downloading the file
                </p>
              </div>
            )}
            <div className="space-y-3">
              {!showPreview && isValidUrl && (
                <button
                  onClick={togglePreview}
                  className="block w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Show Preview
                </button>
              )}
              {showExternal && isValidUrl && (
                <button
                  onClick={openExternal}
                  className="block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Open PDF in New Tab
                </button>
              )}
              {showDownload && isValidUrl && (
                <button
                  onClick={downloadPDF}
                  className="block w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Download PDF
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}