"use client"

import { useState, useEffect } from "react"
import Axios from "@/utils/Axios"

interface CourseVideo {
  id: string
  title: string
  description: string
  url: string
  createdAt: string
  isActive: boolean
  thumbnailUrl?: string
}

export default function CourseVideosContent() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [videos, setVideos] = useState<CourseVideo[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file: null as File | null
  })
  const [editingVideo, setEditingVideo] = useState<CourseVideo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.file) return

    setIsLoading(true)
    const submitData = new FormData()
    submitData.append('title', formData.title)
    submitData.append('description', formData.description)
    submitData.append('type', 'video')
    submitData.append('file', formData.file)

    try {
      const response = await Axios.post('/admin/resources', submitData)
      if (response.data) {
        setFormData({ title: "", description: "", file: null })
        setShowAddForm(false)
        loadVideos()
      }
    } catch (error) {
      console.error('Error uploading video:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadVideos = async () => {
    try {
      const response = await Axios.get('/admin/resources')
      const videoFiles = response.data.filter((video: any) => video.type === 'video').map((video: any) => ({
        ...video,
        id: video._id || video.id
      }))
      setVideos(videoFiles)
    } catch (error) {
      console.error('Error loading videos:', error)
      setVideos([])
    }
  }

  const toggleStatus = async (id: string, isActive: boolean) => {
    try {
      await Axios.put(`/admin/resources/${id}`, { isActive: !isActive })
      loadVideos()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const editVideo = (video: CourseVideo) => {
    setEditingVideo(video)
    setFormData({
      title: video.title,
      description: video.description,
      file: null
    })
    setShowAddForm(true)
  }

  const updateVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVideo) return

    setIsLoading(true)
    try {
      if (formData.file) {
        const submitData = new FormData()
        submitData.append('title', formData.title)
        submitData.append('description', formData.description)
        submitData.append('file', formData.file)
        await Axios.put(`/admin/resources/${editingVideo.id}`, submitData)
      } else {
        await Axios.put(`/admin/resources/${editingVideo.id}`, {
          title: formData.title,
          description: formData.description
        })
      }
      setFormData({ title: "", description: "", file: null })
      setEditingVideo(null)
      setShowAddForm(false)
      loadVideos()
    } catch (error) {
      console.error('Error updating video:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const cancelEdit = () => {
    setEditingVideo(null)
    setFormData({ title: "", description: "", file: null })
    setShowAddForm(false)
  }

  const deleteVideo = async (id: string) => {
    console.log('Deleting resource with ID:', id)
    if (!confirm('Are you sure you want to delete this video?')) return
    
    try {
      await Axios.delete(`/admin/resources/${id}`)
      loadVideos()
    } catch (error) {
      console.error('Error deleting video:', error)
    }
  }

  useEffect(() => {
    loadVideos()
  }, [])

  return (
    <div className="p-8">
      <div className="bg-white border-l-4 border-purple-600 rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Course Videos</h2>
            <p className="text-gray-600">Manage course videos and tutorials</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Videos ({videos.length})</h3>
        <button
          onClick={() => editingVideo ? cancelEdit() : setShowAddForm(!showAddForm)}
          className="bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          {showAddForm ? 'Cancel' : '+ Add Video'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">{editingVideo ? 'Edit Course Video' : 'Upload Course Video'}</h4>
          <form onSubmit={editingVideo ? updateVideo : handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Video File</label>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded-lg text-black"
                required={!editingVideo}
              />
              {editingVideo && <p className="text-sm text-gray-500 mt-1">Leave empty to keep current file</p>}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
            >
              {isLoading ? (editingVideo ? 'Updating...' : 'Uploading...') : (editingVideo ? 'Update Video' : 'Upload Video')}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm">
        {videos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600">No course videos uploaded yet</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add Video" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {videos.map((video, index) => (
              <div key={video.id || index} className="border rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-200 relative">
                  {video.url ? (
                    <video 
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                    >
                      <source src={video.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{video.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{video.description}</p>
                  <div className="flex justify-end items-center mb-3">
                    <button
                      onClick={() => toggleStatus(video.id, video.isActive)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        video.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {video.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => editVideo(video)}
                      className="flex-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteVideo(video.id)}
                      className="flex-1 text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}