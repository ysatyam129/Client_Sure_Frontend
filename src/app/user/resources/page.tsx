"use client"

import { useState, useEffect } from "react"
import { Search, Filter, FileText, Play, Download, Eye } from "lucide-react"
import { toast } from "sonner"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import PDFViewer from "@/components/PDFViewer"
import Axios from "@/utils/Axios"

interface Resource {
  _id: string
  title: string
  description: string
  type: 'pdf' | 'video'
  url: string
  thumbnailUrl?: string
  isActive: boolean
  createdAt: string
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'video'>('all')
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)

  const loadResources = async () => {
    try {
      const response = await Axios.get('/resources')
      const activeResources = response.data.filter((resource: Resource) => resource.isActive)
      setResources(activeResources)
    } catch (error: any) {
      console.error('Error loading resources:', error)
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        toast.error('Backend server is not running. Please start the server.')
      } else {
        toast.error('Failed to load resources')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResources()
  }, [])

  const filteredResources = resources.filter(resource => {
    const matchesSearch = !searchTerm || 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || resource.type === filterType
    
    return matchesSearch && matchesType
  })

  const handleDownload = (resource: Resource) => {
    const link = document.createElement('a')
    link.href = resource.url
    link.download = `${resource.title}.${resource.type === 'pdf' ? 'pdf' : 'mp4'}`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Downloading ${resource.title}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading resources...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white border-l-4 border-blue-600 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Learning Resources</h1>
              <p className="text-gray-600">Access study materials, PDFs, and video content</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
              >
                <option value="all">All Types</option>
                <option value="pdf">PDFs</option>
                <option value="video">Videos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="bg-white rounded-lg border shadow-sm">
          {filteredResources.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No resources found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter' 
                  : 'Resources will appear here when available'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredResources.map((resource) => (
                <div key={resource._id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-gray-100">
                    {resource.thumbnailUrl ? (
                      <img 
                        src={resource.thumbnailUrl} 
                        alt={resource.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          if (e.currentTarget.nextElementSibling) {
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'
                          }
                        }}
                      />
                    ) : null}
                    
                    <div 
                      className="absolute inset-0 bg-gray-50 flex items-center justify-center"
                      style={{ display: resource.thumbnailUrl ? 'none' : 'flex' }}
                    >
                      <div className="text-center">
                        {resource.type === 'pdf' ? (
                          <FileText className="w-12 h-12 text-red-600 mx-auto mb-2" />
                        ) : (
                          <Play className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                        )}
                        <p className="text-sm text-gray-600 mb-2">
                          {resource.type === 'pdf' ? 'PDF Document' : 'Video Content'}
                        </p>
                        <p className="text-xs text-gray-500">Click to view</p>
                      </div>
                    </div>

                    {/* Type Badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        resource.type === 'pdf' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {resource.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{resource.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{resource.description}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500">
                        {new Date(resource.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedResource(resource)}
                        className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button 
                        onClick={() => handleDownload(resource)}
                        className="flex-1 text-gray-600 hover:text-gray-800 text-sm font-medium py-2 px-3 border border-gray-200 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resource Viewer Modal */}
      {selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-5/6 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedResource.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedResource.type.toUpperCase()} Resource</p>
              </div>
              <button
                onClick={() => setSelectedResource(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 relative">
              {selectedResource.type === 'pdf' ? (
                <PDFViewer 
                  url={selectedResource.url}
                  title={selectedResource.title}
                  showDownload={true}
                  showExternal={true}
                  className="h-full"
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <video 
                    controls 
                    className="max-w-full max-h-full"
                    src={selectedResource.url}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{selectedResource.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Added on {new Date(selectedResource.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-3 ml-4">
                  <button 
                    onClick={() => handleDownload(selectedResource)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}