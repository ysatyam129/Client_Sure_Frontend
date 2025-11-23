"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Axios from '../../../utils/Axios'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Heart, MessageCircle, Send, Trash2, Image as ImageIcon, X, TrendingUp, RefreshCw, Search, Filter, Award, Users, MessageSquare, ThumbsUp, Calendar, Sparkles, Edit3 } from 'lucide-react'

interface User {
  _id: string
  name: string
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
  image?: string
  likes: { user_id: string }[]
  comments: Comment[]
  createdAt: string
}

interface LeaderboardUser {
  _id: string
  name: string
  avatar?: string
  points: number
  communityActivity: {
    postsCreated: number
    commentsMade: number
    likesGiven: number
    likesReceived: number
  }
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState({ title: '', description: '' })
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [commentTexts, setCommentTexts] = useState<{ [key: string]: string }>({})
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showTrending, setShowTrending] = useState(false)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [searchFilters, setSearchFilters] = useState({
    author: '',
    hasImage: false,
    dateFrom: '',
    dateTo: '',
    sortBy: 'latest',
    minLikes: 0
  })
  const [communityStats, setCommunityStats] = useState<any>({})
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchData()
    getCurrentUser()
    
    // Auto-refresh every 60 seconds (silent)
    const refreshInterval = setInterval(() => {
      fetchData(true) // Silent refresh
    }, 60000)
    
    // Refresh when window gets focus (silent)
    const handleWindowFocus = () => {
      fetchData(true) // Silent refresh
    }
    
    window.addEventListener('focus', handleWindowFocus)
    
    return () => {
      clearInterval(refreshInterval)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [])

  const getCurrentUser = async () => {
    try {
      const response = await Axios.get('/auth/profile')
      setCurrentUserId(response.data.user._id)
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      
      let endpoint = showTrending ? '/community/trending' : '/community/posts'
      
      // Build query parameters
      const queryParams = new URLSearchParams()
      
      if (searchQuery) queryParams.append('search', searchQuery)
      if (searchFilters.author) queryParams.append('author', searchFilters.author)
      if (searchFilters.hasImage) queryParams.append('hasImage', 'true')
      if (searchFilters.dateFrom) queryParams.append('dateFrom', searchFilters.dateFrom)
      if (searchFilters.dateTo) queryParams.append('dateTo', searchFilters.dateTo)
      if (searchFilters.sortBy) queryParams.append('sortBy', searchFilters.sortBy)
      if (searchFilters.minLikes > 0) queryParams.append('minLikes', searchFilters.minLikes.toString())
      
      const params = queryParams.toString() ? `?${queryParams.toString()}` : ''
      
      const [postsRes, leaderboardRes, statsRes] = await Promise.all([
        Axios.get(`${endpoint}${params}`),
        Axios.get('/community/leaderboard'),
        Axios.get('/community/stats')
      ])
      setPosts(postsRes.data.posts)
      setLeaderboard(leaderboardRes.data.leaderboard)
      setCommunityStats(statsRes.data)
      setLastUpdated(new Date())
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Subscription expired. Please renew to access community.')
        router.push('/user/dashboard')
      } else {
        if (!silent) toast.error('Error loading community data')
      }
    } finally {
      setLoading(false)
    }
  }

  const resetFilters = () => {
    setSearchFilters({
      author: '',
      hasImage: false,
      dateFrom: '',
      dateTo: '',
      sortBy: 'latest',
      minLikes: 0
    })
    setSearchQuery('')
    fetchData(false)
  }

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('post_title', newPost.title)
      formData.append('description', newPost.description)
      if (selectedImage) {
        formData.append('image', selectedImage)
      }

      const response = await Axios.post('/community/post', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (response.data.success) {
        toast.success('Post created successfully! (+5 points) ✨')
      } else {
        toast.success('Post created successfully! (+5 points)')
      }
      
      setNewPost({ title: '', description: '' })
      setSelectedImage(null)
      setImagePreview(null)
      setShowCreatePost(false)
      fetchData(false)
    } catch (error: any) {
      console.error('Create post error:', error)
      const errorMessage = error.response?.data?.message || 'Error creating post'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const deletePost = async (postId: string) => {
    try {
      await Axios.delete(`/community/post/${postId}`)
      toast.success('Post deleted (-5 points)')
      fetchData(false)
    } catch (error) {
      toast.error('Error deleting post')
    }
  }

  const likePost = async (postId: string) => {
    try {
      const post = posts.find(p => p._id === postId)
      if (!post || isLikedByUser(post)) {
        toast.error('Post already liked')
        return
      }
      
      // Optimistic update - immediately update UI
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p._id === postId 
            ? { ...p, likes: [...p.likes, { user_id: currentUserId }] }
            : p
        )
      )
      
      await Axios.post(`/community/like/${postId}`)
      toast.success('Post liked! (+1 point to author)')
      fetchData(true) // Sync with backend
    } catch (error: any) {
      // Revert optimistic update on error
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p._id === postId 
            ? { ...p, likes: p.likes.filter(like => 
                typeof like.user_id === 'string' 
                  ? like.user_id !== currentUserId 
                  : like.user_id.toString() !== currentUserId
              ) }
            : p
        )
      )
      toast.error(error.response?.data?.message || 'Error liking post')
    }
  }

  const unlikePost = async (postId: string) => {
    try {
      const post = posts.find(p => p._id === postId)
      if (!post || !isLikedByUser(post)) {
        toast.error('You have not liked this post yet')
        return
      }
      
      // Optimistic update - immediately update UI
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p._id === postId 
            ? { ...p, likes: p.likes.filter(like => 
                typeof like.user_id === 'string' 
                  ? like.user_id !== currentUserId 
                  : like.user_id.toString() !== currentUserId
              ) }
            : p
        )
      )
      
      await Axios.post(`/community/unlike/${postId}`)
      toast.success('Post unliked (-1 point from author)')
      fetchData(true) // Sync with backend
    } catch (error: any) {
      // Revert optimistic update on error
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p._id === postId 
            ? { ...p, likes: [...p.likes, { user_id: currentUserId }] }
            : p
        )
      )
      const errorMessage = error.response?.data?.message || 'Error unliking post'
      toast.error(errorMessage)
    }
  }

  const addComment = async (postId: string) => {
    const text = commentTexts[postId]
    if (!text?.trim()) return

    try {
      await Axios.post(`/community/comment/${postId}`, { text })
      toast.success('Comment added! (+2 points)')
      setCommentTexts({ ...commentTexts, [postId]: '' })
      fetchData(false)
    } catch (error) {
      toast.error('Error adding comment')
    }
  }

  const deleteComment = async (commentId: string) => {
    try {
      await Axios.delete(`/community/comment/${commentId}`)
      toast.success('Comment deleted (-2 points)')
      fetchData(false)
    } catch (error) {
      toast.error('Error deleting comment')
    }
  }

  const isLikedByUser = (post: Post) => {
    if (!currentUserId) return false
    
    return post.likes.some(like => {
      const likeUserId = typeof like.user_id === 'string' 
        ? like.user_id 
        : like.user_id.toString()
      return likeUserId === currentUserId
    })
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <div className="text-xl text-gray-700 font-medium">Loading community...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 max-w-4xl">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                      <Users className="w-8 h-8" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold mb-1">Community Hub</h1>
                      <p className="text-white/90 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        {communityStats.totalPosts || 0} posts • 
                        <Users className="w-4 h-4 ml-1" />
                        {communityStats.activeMembers || 0} members
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search discussions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && fetchData(false)}
                        className="pl-10 pr-4 py-2.5 rounded-xl text-gray-900 w-64 bg-white/90 backdrop-blur-sm border-0 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    </div>
                    <button
                      onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                      className={`px-4 py-2.5 rounded-xl font-medium transition-all shadow-lg flex items-center gap-2 ${
                        showAdvancedSearch 
                          ? 'bg-white text-indigo-600 hover:bg-gray-50' 
                          : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
                      }`}
                    >
                      <Filter className="w-4 h-4" /> Filters
                    </button>
                    <button
                      onClick={() => { setShowTrending(!showTrending); fetchData(false); }}
                      className={`px-4 py-2.5 rounded-xl font-medium transition-all shadow-lg flex items-center gap-2 ${
                        showTrending 
                          ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300' 
                          : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
                      }`}
                    >
                      {showTrending ? <><TrendingUp className="w-4 h-4" /> Trending</> : <><Calendar className="w-4 h-4" /> Latest</>}
                    </button>
                    <button
                      onClick={() => {
                        fetchData(false)
                        toast.success('Community refreshed!')
                      }}
                      className="p-2.5 rounded-xl transition-all shadow-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                      title="Refresh community posts"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Search Filters */}
            {showAdvancedSearch && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Filter className="w-5 h-5 text-indigo-600" /> Advanced Filters
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                      <select
                        value={searchFilters.sortBy}
                        onChange={(e) => setSearchFilters({...searchFilters, sortBy: e.target.value})}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="latest">Latest</option>
                        <option value="popular">Most Liked</option>
                        <option value="trending">Trending</option>
                        <option value="oldest">Oldest</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                      <input
                        type="date"
                        value={searchFilters.dateFrom}
                        onChange={(e) => setSearchFilters({...searchFilters, dateFrom: e.target.value})}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                      <input
                        type="date"
                        value={searchFilters.dateTo}
                        onChange={(e) => setSearchFilters({...searchFilters, dateTo: e.target.value})}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Likes</label>
                      <input
                        type="number"
                        min="0"
                        value={searchFilters.minLikes}
                        onChange={(e) => setSearchFilters({...searchFilters, minLikes: parseInt(e.target.value) || 0})}
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={searchFilters.hasImage}
                          onChange={(e) => setSearchFilters({...searchFilters, hasImage: e.target.checked})}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Posts with images only</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-6">
                    <button
                      onClick={() => fetchData(false)}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg"
                    >
                      Apply Filters
                    </button>
                    <button
                      onClick={resetFilters}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Create Post */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
              {showCreatePost ? (
                <form onSubmit={createPost} className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                      <Edit3 className="w-6 h-6" />
                    </div>
                    <div className="text-lg font-semibold text-gray-800">Share your thoughts</div>
                  </div>
                  
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="What's on your mind?"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl text-gray-900 focus:border-indigo-500 focus:outline-none transition-colors bg-gray-50 focus:bg-white"
                      required
                    />
                    <textarea
                      placeholder="Share your thoughts with the community..."
                      value={newPost.description}
                      onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl text-gray-900 h-32 resize-none focus:border-indigo-500 focus:outline-none transition-colors bg-gray-50 focus:bg-white"
                      required
                    />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors">
                          <ImageIcon className="w-5 h-5 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">Add Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null
                              setSelectedImage(file)
                              if (file) {
                                const reader = new FileReader()
                                reader.onload = (e) => setImagePreview(e.target?.result as string)
                                reader.readAsDataURL(file)
                              } else {
                                setImagePreview(null)
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        {selectedImage && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full flex items-center gap-1">
                              <ImageIcon className="w-4 h-4" /> {selectedImage.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedImage(null)
                                setImagePreview(null)
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowCreatePost(false)}
                          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={isSubmitting}
                          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <><RefreshCw className="w-4 h-4 animate-spin" /> Posting...</>
                          ) : (
                            <><Sparkles className="w-4 h-4" /> Post (+5 points)</>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
                        <div className="relative inline-block">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="max-w-xs max-h-48 rounded-lg shadow-md object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImage(null)
                              setImagePreview(null)
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              ) : (
                <div className="p-6">
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-purple-50 rounded-xl transition-all border-2 border-dashed border-gray-300 hover:border-indigo-300"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <Edit3 className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-800">Start a discussion</div>
                      <div className="text-sm text-gray-600">Share your thoughts with the community</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Posts */}
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">No discussions yet</h3>
                  <p className="text-gray-600">Be the first to start a conversation!</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post._id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="p-6">
                      {/* Post Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg text-lg">
                            {post.user_id.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-lg">{post.user_id.name}</div>
                            <div className="text-sm text-gray-500">
                              {getTimeAgo(post.createdAt)}
                            </div>
                          </div>
                        </div>
                        {post.user_id._id === currentUserId && (
                          <button
                            onClick={() => deletePost(post._id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      
                      {/* Post Content */}
                      <div className="mb-6">
                        <h3 className="font-bold text-gray-900 text-xl mb-3">{post.post_title}</h3>
                        <p className="text-gray-700 leading-relaxed text-lg">{post.description}</p>
                        
                        {post.image && (
                          <div className="mt-4">
                            <img 
                              src={post.image} 
                              alt="Post image" 
                              className="rounded-xl max-w-full h-auto max-h-96 object-cover shadow-lg"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Post Actions */}
                      <div className="flex items-center gap-6 mb-6 pb-4 border-b border-gray-100">
                        <button
                          onClick={() => {
                            if (isLikedByUser(post)) {
                              unlikePost(post._id)
                            } else {
                              likePost(post._id)
                            }
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium ${
                            isLikedByUser(post) 
                              ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${isLikedByUser(post) ? 'fill-current' : ''}`} />
                          <span>{post.likes.length}</span>
                        </button>
                        <div className="flex items-center gap-2 text-gray-500 font-medium">
                          <MessageCircle className="w-5 h-5" />
                          <span>{post.comments.length}</span>
                        </div>
                      </div>

                      {/* Comments Section */}
                      {post.comments.length > 0 && (
                        <div className="space-y-4 mb-6">
                          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-indigo-600" />
                            Comments ({post.comments.length})
                          </h4>
                          {post.comments
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((comment) => (
                            <div key={comment._id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                      {comment.user_id.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-semibold text-gray-900">{comment.user_id.name}</span>
                                    <span className="text-xs text-gray-500">
                                      {getTimeAgo(comment.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 ml-11">{comment.text}</p>
                                </div>
                                {comment.user_id._id === currentUserId && (
                                  <button
                                    onClick={() => deleteComment(comment._id)}
                                    className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment */}
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                          <MessageCircle className="w-5 h-5" />
                        </div>
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentTexts[post._id] || ''}
                          onChange={(e) => setCommentTexts({ ...commentTexts, [post._id]: e.target.value })}
                          className="flex-1 p-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:outline-none transition-colors"
                          onKeyPress={(e) => e.key === 'Enter' && addComment(post._id)}
                        />
                        <button
                          onClick={() => addComment(post._id)}
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-medium transition-all shadow-lg flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Leaderboard Sidebar */}
          <div className="w-80 bg-white rounded-2xl shadow-lg border border-gray-200 h-fit sticky top-6">
            <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Award className="w-6 h-6" /> Leaderboard
              </h2>
              <p className="text-white/90 text-sm mt-1">Top community members</p>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/20 rounded-lg p-2 text-center backdrop-blur-sm">
                  <div className="font-bold flex items-center justify-center gap-1">
                    <MessageCircle className="w-4 h-4" /> {communityStats.totalComments || 0}
                  </div>
                  <div className="text-xs opacity-90">Comments</div>
                </div>
                <div className="bg-white/20 rounded-lg p-2 text-center backdrop-blur-sm">
                  <div className="font-bold flex items-center justify-center gap-1">
                    <Heart className="w-4 h-4" /> {communityStats.totalLikes || 0}
                  </div>
                  <div className="text-xs opacity-90">Likes</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No rankings yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((user, index) => (
                    <div key={user._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                      <div className={`text-sm font-bold w-10 h-10 rounded-xl flex items-center justify-center ${
                        index === 0 ? 'bg-yellow-100 text-yellow-600' :
                        index === 1 ? 'bg-gray-100 text-gray-600' :
                        index === 2 ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        #{index + 1}
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> {user.points} pts
                        </div>
                      </div>
                      {index < 3 && (
                        <Award className={`w-6 h-6 ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          'text-orange-500'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}