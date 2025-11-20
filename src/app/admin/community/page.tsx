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

export default function AdminCommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [communityStats, setCommunityStats] = useState<any>({})
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
      console.log('Fetching admin community data...')
      
      // Fetch posts, leaderboard, and stats in parallel
      const [postsResponse, leaderboardResponse, statsResponse] = await Promise.all([
        AdminAPI.get('/community/all'),
        AdminAPI.get('/community/leaderboard').catch(() => ({ data: { leaderboard: [] } })),
        AdminAPI.get('/community/stats').catch(() => ({ data: {} }))
      ])
      
      console.log('Community API Response:', postsResponse)
      
      // Handle posts response
      if (postsResponse && postsResponse.success && postsResponse.posts && Array.isArray(postsResponse.posts)) {
        setPosts(postsResponse.posts)
        console.log(`Loaded ${postsResponse.posts.length} posts successfully`)
        if (postsResponse.posts.length === 0) {
          toast.info('No community posts found')
        }
      } else if (postsResponse && postsResponse.posts && Array.isArray(postsResponse.posts)) {
        setPosts(postsResponse.posts)
        console.log(`Loaded ${postsResponse.posts.length} posts`)
      } else if (postsResponse && postsResponse.data && postsResponse.data.posts && Array.isArray(postsResponse.data.posts)) {
        setPosts(postsResponse.data.posts)
        console.log(`Loaded ${postsResponse.data.posts.length} posts`)
      } else if (postsResponse && postsResponse.error) {
        console.error('API Error:', postsResponse.error)
        toast.error('Failed to load community posts. Please login as admin first.')
        setPosts([])
      } else {
        console.error('Unexpected response format:', postsResponse)
        toast.error('Please login as admin to access community moderation')
        setPosts([])
      }
      
      // Handle leaderboard response
      if (leaderboardResponse && leaderboardResponse.success && leaderboardResponse.leaderboard) {
        setLeaderboard(leaderboardResponse.leaderboard)
        console.log(`Loaded ${leaderboardResponse.leaderboard.length} leaderboard entries`)
      } else if (leaderboardResponse && leaderboardResponse.data && leaderboardResponse.data.leaderboard) {
        setLeaderboard(leaderboardResponse.data.leaderboard)
        console.log(`Loaded ${leaderboardResponse.data.leaderboard.length} leaderboard entries`)
      }
      
      // Handle stats response
      if (statsResponse && statsResponse.success) {
        setCommunityStats({
          totalPosts: statsResponse.totalPosts,
          totalComments: statsResponse.totalComments,
          totalLikes: statsResponse.totalLikes,
          activeMembers: statsResponse.activeMembers
        })
        console.log('Loaded community stats')
      } else if (statsResponse && statsResponse.data) {
        setCommunityStats(statsResponse.data)
        console.log('Loaded community stats')
      }
      
    } catch (error) {
      console.error('Error loading community data:', error)
      toast.error('Error loading community data. Please check your connection.')
      setPosts([])
      setLeaderboard([])
      setCommunityStats({})
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
                  <p className="text-sm text-gray-500 mt-1">
                    Total posts: {posts.length} • Active members: {communityStats.activeMembers || 0} • Auto-refreshes every 30s
                  </p>
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
          
          {/* Leaderboard Section */}
          <div className="bg-white rounded-lg shadow-md mt-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                🏆 Community Leaderboard
              </h2>
              <p className="text-sm text-gray-500 mt-1">Top community members by points</p>
            </div>
            
            <div className="p-6">
              {leaderboard.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🏆</div>
                  <p>No leaderboard data available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leaderboard.slice(0, 12).map((user, index) => (
                    <div key={user._id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className={`text-lg font-bold w-10 h-10 rounded-lg flex items-center justify-center ${
                        index === 0 ? 'bg-yellow-100 text-yellow-600' :
                        index === 1 ? 'bg-gray-100 text-gray-600' :
                        index === 2 ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        #{index + 1}
                      </div>
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{user.name}</div>
                        <div className="text-sm text-gray-500">
                          {user.points} points • {user.communityActivity.postsCreated} posts
                        </div>
                      </div>
                      {index < 3 && (
                        <div className="text-xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </div>
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