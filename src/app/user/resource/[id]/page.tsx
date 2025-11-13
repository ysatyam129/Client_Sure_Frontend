"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { FileText, Play, Lock, ArrowLeft, ExternalLink, Download } from "lucide-react"
import { toast } from "sonner"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import Axios from "@/utils/Axios"

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
    try {
      await Axios.post(`/auth/access/${params.id}`)
      toast.success('Access granted successfully!')
      loadResource()
    } catch (error: any) {
      console.error(error)
      toast.error(error.response?.data?.error || 'Failed to grant access')
    }
  }

  const openResource = () => {
    if (resource?.url) {
      window.open(resource.url, '_blank')
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {resource.isAccessedByUser ? (
                // Show actual content when accessed
                resource.type === 'video' && resource.url ? (
                  <div className="relative">
                    <video className="w-full" controls controlsList="nodownload">
                      <source src={resource.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        VIDEO
                      </span>
                    </div>
                  </div>
                ) : resource.type === 'pdf' && resource.url ? (
                  <div className="relative">
                    <iframe 
                      src={resource.url} 
                      className="w-full h-[600px]" 
                      title="PDF Viewer"
                    />
                    <div className="absolute top-4 right-4">
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
                <div className="relative h-80 bg-gray-100">
                  {resource.type === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Play className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 text-sm font-medium">Video Content</p>
                      </div>
                    </div>
                  ) : resource.type === 'pdf' ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 text-sm font-medium">PDF Document</p>
                      </div>
                    </div>
                  ) : null}

                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-lg font-semibold text-gray-900 mb-1">Premium Content</p>
                      <p className="text-sm text-gray-600">Get access to view this resource</p>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-md text-xs font-medium ${
                      resource.type === 'pdf' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {resource.type.toUpperCase()}
                    </span>
                  </div>
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
                        <ExternalLink className="w-4 h-4" />
                        Open Resource
                      </button>
                    )}
                    {resource.type === 'pdf' && resource.url && (
                      <a href={resource.url} download className="w-full bg-white text-gray-900 py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 border border-gray-300">
                        <Download className="w-4 h-4" />
                        Download PDF
                      </a>
                    )}
                  </>
                ) : (
                  <button onClick={handleAccess} className="w-full bg-gray-900 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    Get Access
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
