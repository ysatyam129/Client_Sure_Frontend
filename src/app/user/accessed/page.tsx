"use client"

import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import Axios from "@/utils/Axios"

interface AccessedResource {
  _id: string
  title: string
  description: string
  type: string
  url: string
  thumbnailUrl?: string
  createdAt: string
}

export default function AccessedResourcesPage() {
  const [accessedResources, setAccessedResources] = useState<AccessedResource[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  const loadAccessedResources = async () => {
    try {
      const response = await Axios.get('/auth/accessed-resources')
      setAccessedResources(response.data)
    } catch (error) {
      console.error('Error loading accessed resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const accessResource = async (resourceId: string) => {
    window.location.href = `/user/resource/${resourceId}`
  }

  useEffect(() => {
    loadAccessedResources()
  }, [])

  const filteredResources = accessedResources.filter(resource => 
    filter === 'all' || resource.type === filter
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            My 
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Accessed Resources</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            View and re-access all the resources you've previously unlocked
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{accessedResources.length}</div>
              <div className="text-gray-600">Total Accessed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {accessedResources.filter(r => r.type === 'pdf').length}
              </div>
              <div className="text-gray-600">PDF Documents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {accessedResources.filter(r => r.type === 'video').length}
              </div>
              <div className="text-gray-600">Videos</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg">
            {['all', 'pdf', 'video'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  filter === type
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {type === 'all' ? 'All Resources' : type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading your accessed resources...</div>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Resources Found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't accessed any resources yet. Visit the resources page to start exploring!"
                : `No ${filter.toUpperCase()} resources found in your accessed list.`
              }
            </p>
            <a 
              href="/user/resources" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Resources
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredResources.map((resource) => (
              <div key={resource._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex justify-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      resource.type === 'pdf' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {resource.type.toUpperCase()}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{resource.title}</h3>
                  <p className="text-gray-600 mb-4">{resource.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">
                      Accessed: {new Date(resource.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => accessResource(resource._id)}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {!loading && accessedResources.length > 0 && (
          <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <a 
                href="/user/resources"
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-center"
              >
                <div className="text-2xl mb-2">🔍</div>
                <div className="font-semibold">Browse More Resources</div>
                <div className="text-sm opacity-90">Discover new content</div>
              </a>
              <a 
                href="/user/profile"
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 text-center"
              >
                <div className="text-2xl mb-2">👤</div>
                <div className="font-semibold">View Profile</div>
                <div className="text-sm opacity-90">Check your token balance</div>
              </a>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}