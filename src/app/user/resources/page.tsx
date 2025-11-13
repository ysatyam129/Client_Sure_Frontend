"use client"

import { useState, useEffect } from "react"
import { Play, FileText, Download, ExternalLink, FolderOpen, Search, ArrowRight } from "lucide-react"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import Axios from "@/utils/Axios"

interface Resource {
  id: string
  title: string
  type: string
  description: string
  thumbnailUrl?: string
  isAccessedByUser: boolean
  url?: string
}

interface UserStats {
  tokens: number
  monthlyTokens: {
    remaining: number
  }
  subscription: {
    isActive: boolean
  }
}

export default function ResourcesPage() {
  const [accessedResources, setAccessedResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')



  const loadAccessedResources = async () => {
    try {
      const response = await Axios.get('/auth/accessed-resources')
      setAccessedResources(response.data || [])
    } catch (error) {
      console.error('Error loading accessed resources:', error)
    } finally {
      setLoading(false)
    }
  }



  const openResource = async (resourceId: string) => {
    window.location.href = `/user/resource/${resourceId}`
  }

  useEffect(() => {
    loadAccessedResources()
  }, [])

  const filteredResources = accessedResources.filter(resource => 
    filter === 'all' || resource.type === filter
  )

  const setLoadingComplete = () => {
    setLoading(false)
  }

  useEffect(() => {
    if (accessedResources.length >= 0) {
      setLoadingComplete()
    }
  }, [accessedResources])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Resources</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your accessed content</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              {[
                { key: 'all', label: 'All', icon: null, count: accessedResources.length },
                { key: 'pdf', label: 'PDFs', icon: FileText, count: accessedResources.filter(r => r.type === 'pdf').length },
                { key: 'video', label: 'Videos', icon: Play, count: accessedResources.filter(r => r.type === 'video').length }
              ].map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.key}
                    onClick={() => setFilter(type.key)}
                    className={`relative pb-3 pt-2 px-1 text-sm font-medium transition-colors flex items-center gap-2 ${
                      filter === type.key
                        ? 'text-gray-900 border-b-2 border-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{type.label}</span>
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      filter === type.key
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {type.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3"></div>
            <div className="text-sm text-gray-500">Loading resources...</div>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {filter === 'all' ? (
                <FolderOpen className="w-8 h-8 text-gray-400" />
              ) : filter === 'pdf' ? (
                <FileText className="w-8 h-8 text-gray-400" />
              ) : (
                <Play className="w-8 h-8 text-gray-400" />
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No resources yet' : 
               filter === 'pdf' ? 'No PDF documents' : 
               'No videos found'}
            </h3>
            
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              {filter === 'all' 
                ? 'Access resources from the dashboard to see them here.'
                : `No ${filter === 'pdf' ? 'PDF documents' : 'videos'} accessed yet.`
              }
            </p>
            
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => window.location.href = '/user/dashboard'}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Browse Resources
              </button>
              
              {filter !== 'all' && (
                <button 
                  onClick={() => setFilter('all')}
                  className="text-gray-700 hover:text-gray-900 px-4 py-2 text-sm font-medium transition-colors"
                >
                  View All
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Preview Section */}
                <div className="relative h-48 bg-gray-100">
                  {resource.type === 'video' && resource.url ? (
                    <div className="relative w-full h-full">
                      <video 
                        className="w-full h-full object-cover"
                        preload="metadata"
                      >
                        <source src={resource.url} type="video/mp4" />
                      </video>
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                        <div className="bg-white/90 rounded-full p-2">
                          <Play className="w-5 h-5 text-gray-900" />
                        </div>
                      </div>
                    </div>
                  ) : resource.type === 'pdf' ? (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-600 font-medium">PDF Document</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-xs">Resource</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Type Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      resource.type === 'pdf' 
                        ? 'bg-red-50 text-red-700 border border-red-200' 
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {resource.type.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {/* Content Section */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-2 flex-1">{resource.title}</h3>
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-medium border border-green-200 ml-2 shrink-0">
                      Accessed
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{resource.description}</p>
                  
                  <button
                    onClick={() => openResource(resource.id)}
                    className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}