"use client"

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import AdminSidebar from '../components/AdminSidebar'
import { AdminAPI } from '../../../utils/AdminAPI'

interface User {
  _id: string
  name: string
  email: string
  avatar?: string
}

interface Comment {
  _id: string
  user_id: User
  text: string
  createdAt: string
}

interface Post {
  _id: string
  user_id: User
  post_title: string
  description: string
  likes: { user_id: string }[]
  comments: Comment[]
  createdAt: string
}

export default function AdminCommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
    
    // Auto-refresh every 30 seconds for admin
    const refreshInterval = setInterval(() => {
      fetchPosts()
    }, 30000)
    
    // Refresh when window gets focus
    const handleWindowFocus = () => {
      fetchPosts()
    }
    
    window.addEventListener('focus', handleWindowFocus)
    
    return () => {
      clearInterval(refreshInterval)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [])

  const fetchPosts = async () => {
    try {
      console.log('Fetching admin community posts...')
      const response = await AdminAPI.get('/community/all')
      console.log('Community API Response:', response)
      
      // Handle different response formats
      if (response && response.success && response.posts && Array.isArray(response.posts)) {
        setPosts(response.posts)
        console.log(`Loaded ${response.posts.length} posts successfully`)
        if (response.posts.length === 0) {
          toast.info('No community posts found')
        }
      } else if (response && response.posts && Array.isArray(response.posts)) {
        setPosts(response.posts)
        console.log(`Loaded ${response.posts.length} posts`)
      } else if (response && response.data && response.data.posts && Array.isArray(response.data.posts)) {
        setPosts(response.data.posts)
        console.log(`Loaded ${response.data.posts.length} posts`)
      } else if (response && response.error) {
        console.error('API Error:', response.error)
        toast.error('Failed to load community posts. Please login as admin first.')
        setPosts([])
      } else {
        console.error('Unexpected response format:', response)
        toast.error('Please login as admin to access community moderation')
        setPosts([])
      }
    } catch (error) {
      console.error('Error loading community posts:', error)
      toast.error('Error loading community posts. Please check your connection.')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This will deduct 5 points from the user.')) {
      return
    }

    try {
      const response = await AdminAPI.delete(`/community/post/${postId}`)
      if (response.success) {
        toast.success(response.message || 'Post deleted successfully')
      } else {
        toast.success('Post deleted successfully (5 points deducted from user)')
      }
      fetchPosts()
    } catch (error) {
      console.error('Delete post error:', error)
      toast.error('Error deleting post')
    }
  }

  const deleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment? This will deduct 2 points from the user.')) {
      return
    }

    try {
      const response = await AdminAPI.delete(`/community/comment/${commentId}`)
      if (response.success) {
        toast.success(response.message || 'Comment deleted successfully')
      } else {
        toast.success('Comment deleted successfully (2 points deducted from user)')
      }
      fetchPosts()
    } catch (error) {
      console.error('Delete comment error:', error)
      toast.error('Error deleting comment')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-xl">Loading community posts...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Community Moderation</h1>
            <p className="text-gray-600 mt-2">Manage community posts and comments</p>
          </div>

          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">All Community Posts</h2>
                  <p className="text-sm text-gray-500 mt-1">Total posts: {posts.length} • Auto-refreshes every 30s</p>
                </div>
                <button
                  onClick={() => {
                    fetchPosts()
                    toast.success('Posts refreshed!')
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {posts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No community posts found
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post._id} className="p-6">
                    {/* Post Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {post.user_id.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{post.user_id.name}</h3>
                          <p className="text-sm text-gray-500">{post.user_id.email}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(post.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deletePost(post._id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm"
                      >
                        Delete Post (-5 pts)
                      </button>
                    </div>

                    {/* Post Content */}
                    <div className="mb-4">
                      <h2 className="text-lg font-bold mb-2 text-gray-900">{post.post_title}</h2>
                      <p className="text-gray-700 mb-3">{post.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>❤️ {post.likes.length} likes</span>
                        <span>💬 {post.comments.length} comments</span>
                      </div>
                    </div>

                    {/* Comments */}
                    {post.comments.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Comments:</h4>
                        <div className="space-y-3">
                          {post.comments.map((comment) => (
                            <div key={comment._id} className="bg-white p-3 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm text-gray-900">
                                      {comment.user_id.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      ({comment.user_id.email})
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {new Date(comment.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-gray-700">{comment.text}</p>
                                </div>
                                <button
                                  onClick={() => deleteComment(comment._id)}
                                  className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 ml-3"
                                >
                                  Delete (-2 pts)
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}