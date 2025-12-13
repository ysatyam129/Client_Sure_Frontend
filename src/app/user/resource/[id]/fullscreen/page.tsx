"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { X, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import VideoViewer from "@/components/VideoViewer"
import BasicPDFViewer from "@/components/BasicPDFViewer"
import Axios from "@/utils/Axios"

interface ResourceDetail {
  id: string
  title: string
  type: string
  description: string
  url?: string
  isAccessedByUser: boolean
}

export default function FullscreenResourcePage() {
  const params = useParams()
  const router = useRouter()
  const [resource, setResource] = useState<ResourceDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResource()
  }, [params.id])

  const loadResource = async () => {
    try {
      const response = await Axios.get(`/auth/resources/${params.id}`)
      setResource(response.data)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load resource')
      router.push('/user/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="font-medium">Loading resource...</p>
        </div>
      </div>
    )
  }

  if (!resource || !resource.isAccessedByUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl mb-4">Resource not accessible</p>
          <button 
            onClick={handleClose}
            className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="text-center text-white">
            <h1 className="text-lg font-semibold truncate max-w-md">{resource.title}</h1>
            <p className="text-sm text-gray-300 capitalize">{resource.type} Resource • Fullscreen Mode</p>
          </div>
          
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-screen flex items-center justify-center p-4 pt-20">
        {resource.type === 'video' && resource.url ? (
          <div className="w-full max-w-7xl">
            <VideoViewer 
              url={resource.url} 
              title={resource.title}
              showControls={true}
              autoPlay={true}
              className="w-full h-[80vh] bg-black border-0 rounded-lg shadow-2xl"
            />
          </div>
        ) : resource.type === 'pdf' && resource.url ? (
          <div className="w-full h-[85vh] bg-white rounded-lg shadow-2xl overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex-1 p-4">
                <iframe
                  src={`${resource.url}#toolbar=1&navpanes=1&scrollbar=1&zoom=FitH`}
                  className="w-full h-full border-0 rounded"
                  title={resource.title}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-white">
            <p className="text-xl mb-4">Content not available</p>
            <button 
              onClick={handleClose}
              className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}