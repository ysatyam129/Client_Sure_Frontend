"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { FileText, Play, Lock, ArrowLeft, ExternalLink, Download } from "lucide-react"
import { toast } from "sonner"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import VideoViewer from "@/components/VideoViewer"
import Axios from "@/utils/Axios"
import BasicPDFViewer from "@/components/BasicPDFViewer"

interface ResourceDetail {
  id: string
  title: string
  type: string
  description: string
  thumbnailUrl?: string
  url?: string
  content?: string
  isAccessedByUser: boolean
}

export default function ResourceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [resource, setResource] = useState<ResourceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [accessLoading, setAccessLoading] = useState(false)

  useEffect(() => {
    loadResource()
  }, [params.id])

  const loadResource = async () => {
    try {
      const response = await Axios.get(`/auth/resources/${params.id}`)
      console.log(response.data)
      setResource(response.data)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load resource')
      router.push('/user/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleAccess = async () => {
    setAccessLoading(true)
    try {
      await Axios.post(`/auth/access/${params.id}`)
      toast.success('Access granted successfully!')
      setShowPreview(true)
      setTimeout(() => {
        loadResource()
      }, 1000)
    } catch (error: any) {
      console.error(error)
      toast.error(error.response?.data?.error || 'Failed to grant access')
    } finally {
      setAccessLoading(false)
    }
  }

  // Helper functions for video URL processing
  const getEmbedUrl = (url: string) => {
    if (!url) return ""
    
    // YouTube URL conversion
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const youtubeMatch = url.match(youtubeRegex)
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&rel=0&showinfo=0&controls=1&modestbranding=1&iv_load_policy=3&cc_load_policy=0&fs=1&disablekb=0&end_screen=0`
    }
    
    // Vimeo URL conversion
    const vimeoRegex = /(?:vimeo\.com\/)([0-9]+)/
    const vimeoMatch = url.match(vimeoRegex)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&title=0&byline=0&portrait=0&color=ffffff&suggested=0&related=0`
    }
    
    return url
  }

  const isEmbeddableUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')
  }

  const openResource = () => {
    router.push(`/user/resource/${params.id}/fullscreen`)
  }

  const handleDownload = async () => {
    if (!resource?.url) return
    
    try {
      const response = await fetch(resource.url)
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${resource.title}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
      toast.success('PDF downloaded successfully!')
    } catch (error: any) {
      toast.error('Download failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 font-medium">Loading resource...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!resource) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preview Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {resource.isAccessedByUser || showPreview ? (
                // Show actual content when accessed
                resource.type === 'video' && resource.url ? (
                  <div className="relative bg-black">
                    {showPreview && !resource.isAccessedByUser ? (
                      <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                          <p className="text-lg font-semibold">Unlocking Premium Content...</p>
                          <p className="text-sm opacity-80">Please wait while we prepare your video</p>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video">
                        <VideoViewer 
                          url={resource.url} 
                          title={resource.title}
                          showControls={true}
                          autoPlay={true}
                          className="h-full border-0 rounded-none shadow-none"
                        />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-black/50 text-white backdrop-blur-sm">
                        {resource.isAccessedByUser ? 'PREMIUM VIDEO' : 'UNLOCKING...'}
                      </span>
                    </div>
                  </div>
                ) : resource.type === 'pdf' && resource.url ? (
                  <div className="relative">
                    <BasicPDFViewer 
                      url={resource.url}
                      title={resource.title}
                      resourceId={resource.id}
                      showDownload={true}
                      showExternal={true}
                      className="min-h-[600px]"
                    />
                    <div className="absolute top-4 right-4 z-10">
                      <span className="px-3 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        PDF
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-80 bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 text-sm font-medium">Content Available</p>
                    </div>
                  </div>
                )
              ) : (
                // Show locked preview when not accessed
                <div className="relative aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                  {resource.type === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                          <Play className="w-12 h-12 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Premium Video Content</h3>
                        <p className="text-gray-300 mb-4">Exclusive high-quality video tutorial</p>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                          <Lock className="w-4 h-4" />
                          <span>Unlock to watch</span>
                        </div>
                      </div>
                    </div>
                  ) : resource.type === 'pdf' ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                          <FileText className="w-12 h-12 text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Premium PDF Document</h3>
                        <p className="text-gray-300 mb-4">Exclusive downloadable content</p>
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                          <Lock className="w-4 h-4" />
                          <span>Unlock to access</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                      resource.type === 'pdf' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {resource.type.toUpperCase()} • PREMIUM
                    </span>
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
                </div>
              )}
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">About</h2>
              <p className="text-sm text-gray-700 leading-relaxed">{resource.description}</p>
            </div>

            {/* Content Card */}
            {resource.content && resource.isAccessedByUser && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Content Details</h2>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{resource.content}</p>
              </div>
            )}
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Resource Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h1 className="text-xl font-semibold text-gray-900 mb-4">{resource.title}</h1>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-500">Type</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{resource.type}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-500">Status</span>
                  {resource.isAccessedByUser ? (
                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-medium border border-green-200">
                      Accessed
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                      Locked
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {resource.isAccessedByUser ? (
                  <>
                    {resource.url && (
                      <button onClick={openResource} className="w-full bg-gray-900 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                        <Play className="w-4 h-4" />
                        Open Fullscreen
                      </button>
                    )}
                    {resource.type === 'pdf' && resource.url && (
                      <button onClick={handleDownload} className="w-full bg-white text-gray-900 py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 border border-gray-300">
                        <Download className="w-4 h-4" />
                        Download PDF
                      </button>
                    )}
                  </>
                ) : (
                  <button 
                    onClick={handleAccess} 
                    disabled={accessLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {accessLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Unlocking...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Unlock Premium Content
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Quick Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 p-6">
              <h3 className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-3">Resource ID</h3>
              <p className="text-xs text-blue-700 font-mono break-all">{resource.id}</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
