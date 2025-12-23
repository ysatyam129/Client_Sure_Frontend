"use client"

import { useState, useEffect, Suspense } from "react"
import { Lock, FileText, Play, AlertTriangle, Database, Users, ExternalLink, MessageCircle, Bot, Zap, Plus, X } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import VideoViewer from "@/components/VideoViewer"
import Axios from "@/utils/Axios"

export const dynamic = 'force-dynamic'

interface UserStats {
  tokens: number
  tokensUsedTotal: number
  tokensUsedToday: number
  dailyTokens: number
  totalAvailable?: number
  prizeTokens?: number
  prizeTokenType?: string
  prizeTokenExpiresAt?: string
  dailyLimit?: number
  monthlyTokens: {
    total: number
    used: number
    remaining: number
  }
  subscription: {
    isActive: boolean
    planName?: string
    endDate?: string
    monthlyAllocation: number
  }
}

interface Resource {
  id: string
  title: string
  type: string
  description: string
  thumbnailUrl?: string
  url?: string
  isAccessedByUser: boolean
}

function DashboardContent() {
  const router = useRouter()
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showLowTokenAlert, setShowLowTokenAlert] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for new subscription
    const newSubscription = searchParams?.get('newSubscription')
    if (newSubscription === 'true') {
      setShowWelcome(true)
      toast.success('🎉 Welcome! Your subscription is now active. Enjoy your premium resources!')
      
      // Clear localStorage after successful login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pendingUserEmail')
        localStorage.removeItem('pendingUserName')
      }
    }
  }, [searchParams])

  const loadUserStats = async () => {
    try {
      const response = await Axios.get('/auth/profile')
      const newStats: UserStats = {
        tokens: response.data.tokens?.effectiveTokens || response.data.tokens?.daily || 0,
        dailyTokens: response.data.tokens?.dailyLimit || 100,
        totalAvailable: response.data.tokens?.daily || 0,
        prizeTokens: response.data.tokens?.prizeTokens || 0,
        prizeTokenType: response.data.tokens?.prizeTokenType,
        prizeTokenExpiresAt: response.data.tokens?.prizeTokenExpiresAt,
        tokensUsedTotal: response.data.tokens?.totalUsed || 0,
        tokensUsedToday: response.data.tokens?.dailyUsed || 0,
        dailyLimit: response.data.tokens?.dailyLimit || 100,
        monthlyTokens: {
          total: response.data.tokens?.monthlyTotal || 0,
          used: response.data.tokens?.monthlyUsed || 0,
          remaining: response.data.tokens?.monthlyRemaining || 0
        },
        subscription: {
          isActive: response.data.subscription?.isActive || false,
          planName: response.data.subscription?.plan?.name,
          endDate: response.data.subscription?.endDate,
          monthlyAllocation: response.data.tokens?.monthlyTotal || 0
        }
      }
      
      // Check for low tokens (0 or very low)
      if (newStats.tokens <= 0 && newStats.subscription.isActive) {
        setShowLowTokenAlert(true)
      }
      
      setUserStats(newStats)
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }

  const loadResources = async () => {
    try {
      const response = await Axios.get('/resources')
      const resourcesData = response.data?.resources || []
      setResources(resourcesData)
    } catch (error) {
      console.error('Error loading resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccessResource = async (resourceId: string) => {
    try {
      const response = await Axios.post(`/auth/access/${resourceId}`)
      await loadUserStats()
      
      if (response.data?.resource?.url) {
        window.open(response.data.resource.url, '_blank')
      }
      
      toast.success('Resource accessed successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to access resource'
      toast.error(errorMessage)
    }
  }

  useEffect(() => {
    loadUserStats()
    loadResources()
  }, [])

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      
      {/* Low Token Alert Popup */}
      {showLowTokenAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowLowTokenAlert(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tokens Exhausted!</h3>
              <p className="text-gray-600 mb-6">
                You've used all your daily tokens. Purchase more tokens to continue accessing leads and resources.
              </p>
              
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-orange-700">
                  <Zap className="w-5 h-5" />
                  <span className="font-semibold">Current Balance: {userStats?.tokens || 0} tokens</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowLowTokenAlert(false)
                    handleNavigation('/user/profile/tokens')
                  }}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Buy More Tokens
                </button>
                
                <button
                  onClick={() => setShowLowTokenAlert(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Maybe Later
                </button>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                💡 Tokens reset daily at 1:00 AM
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Welcome Message for New Subscribers */}
        {showWelcome && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center">
              <div className="text-green-600 text-3xl mr-4">🎉</div>
              <div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Welcome to ClientSure Premium!</h3>
                <p className="text-green-700 mb-3">
                  Your subscription is now active! You can now access all premium resources and start growing your business.
                </p>
                <div className="flex gap-2">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    ✓ Premium Resources Unlocked
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    ✓ Monthly Tokens Allocated
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className={`bg-white rounded-xl shadow-lg p-6 text-center relative ${
            (userStats?.tokens || 0) <= 5 ? 'ring-2 ring-orange-500 ring-opacity-50' : ''
          }`}>
            {(userStats?.tokens || 0) <= 5 && (
              <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                !
              </div>
            )}
            <div className={`text-3xl font-bold mb-2 ${
              (userStats?.dailyTokens || 0) <= 0 ? 'text-red-600' : 
              (userStats?.dailyTokens || 0) <= 5 ? 'text-orange-600' : 'text-blue-600'
            }`}>{userStats?.dailyTokens || 0}</div>
            <div className="text-gray-600">Daily Tokens</div>
            <div className="text-xs text-gray-500 mt-1">
              {userStats?.totalAvailable || 0} total available
              {(userStats?.prizeTokens || 0) > 0 && (
                <span className="text-yellow-600 font-semibold"> + {userStats?.prizeTokens} prize</span>
              )}
            </div>
            {(userStats?.prizeTokens || 0) > 0 && (
              <div className="mt-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-2">
                <div className="text-xs font-bold text-yellow-700">
                  🎉 {userStats?.prizeTokenType} Bonus!
                </div>
                <div className="text-xs text-yellow-600">
                  Expires: {userStats?.prizeTokenExpiresAt ? new Date(userStats.prizeTokenExpiresAt).toLocaleDateString() : 'Soon'}
                </div>
              </div>
            )}
            {(userStats?.dailyTokens || 0) <= 5 && (
              <button
                onClick={() => handleNavigation('/user/profile/tokens')}
                className="mt-2 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-full font-medium transition-colors"
              >
                Buy More
              </button>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{userStats?.monthlyTokens.remaining || 0}</div>
            <div className="text-gray-600">Total Tokens</div>
            <div className="text-xs text-gray-500 mt-1">of {userStats?.monthlyTokens.total || 0}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{userStats?.tokensUsedTotal || 0}</div>
            <div className="text-gray-600">Total Used</div>
            <div className="text-xs text-gray-500 mt-1">{userStats?.tokensUsedToday || 0} today</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className={`text-3xl font-bold mb-2 ${
              userStats?.subscription.isActive ? 'text-green-600' : 'text-red-600'
            }`}>
              {userStats?.subscription.isActive ? '✓' : '✗'}
            </div>
            <div className="text-gray-600">Subscription</div>
            <div className="text-xs text-gray-500 mt-1">
              {userStats?.subscription.planName || 'No Plan'}
            </div>
          </div>
        </div>

        {/* Hero Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Lead Information Section */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-600 p-3 rounded-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Lead Information</h2>
            </div>
            <p className="text-gray-700 mb-4">Access verified business leads with complete contact details and social profiles.</p>
            <button onClick={() => handleNavigation('/user/leads/information')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors w-full">
              Browse Leads
            </button>
          </div>

          {/* Accessed Leads Section */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-600 p-3 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Accessed Leads</h2>
            </div>
            <p className="text-gray-700 mb-4">View and manage all your unlocked leads with full contact information.</p>
            <button onClick={() => handleNavigation('/user/leads/accessed')} className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors w-full">
              View Accessed
            </button>
          </div>

          {/* External Tools Section */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-600 p-3 rounded-lg">
                <ExternalLink className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">External Tools</h2>
            </div>
            <p className="text-gray-700 mb-4">Explore powerful tools and integrations to boost your business growth.</p>
            <button onClick={() => handleNavigation('/user/tools')} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors w-full">
              Explore Tools
            </button>
          </div>

          {/* Community Section */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg p-6 border border-orange-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-600 p-3 rounded-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Community</h2>
            </div>
            <p className="text-gray-700 mb-4">Connect with other members, share insights, and grow together.</p>
            <button onClick={() => handleNavigation('/user/community')} className="bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors w-full">
              Join Community
            </button>
          </div>

          {/* Chatbot Tools Section */}
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl shadow-lg p-6 border border-cyan-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-cyan-600 p-3 rounded-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Chatbot Tools</h2>
            </div>
            <p className="text-gray-700 mb-4">Access AI-powered chatbot tools to automate customer interactions and support.</p>
            <button onClick={() => handleNavigation('/user/dashboard/chatbot')} className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors w-full">
              Launch Chatbot
            </button>
          </div>
        </div>

        {/* Resources Section */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 font-medium">Loading resources...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* PDF Documents Section */}
            {resources.filter(r => r.type === 'pdf').length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-3 rounded-xl">
                      <FileText className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">PDF Documents</h2>
                      <p className="text-sm text-gray-500">Downloadable guides and resources</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold">
                      {resources.filter(r => r.type === 'pdf').length} PDFs
                    </span>
                    <button onClick={() => handleNavigation('/user/resources?type=pdf')} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                      View Accessed
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resources.filter(r => r.type === 'pdf').map((resource) => (
                    <div key={resource.id} onClick={() => handleNavigation(`/user/resource/${resource.id}`)} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer">
                      <div className="relative h-48 bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
                        {resource.isAccessedByUser && resource.thumbnailUrl ? (
                          // Show PDF thumbnail preview for accessed resources
                          <div className="w-full h-full p-4">
                            <img 
                              src={resource.thumbnailUrl} 
                              alt={`${resource.title} preview`}
                              className="w-full h-full object-contain rounded-lg shadow-sm"
                              onError={(e) => {
                                // Fallback to PDF icon if thumbnail fails
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) {
                                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                                }
                              }}
                            />
                            <div className="w-full h-full items-center justify-center" style={{display: 'none'}}>
                              <div className="bg-white rounded-2xl p-5 shadow-md mx-auto w-fit">
                                <FileText className="w-16 h-16 text-red-500" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Show PDF icon for locked or no-thumbnail resources
                          <div className="text-center">
                            <div className="bg-white rounded-2xl p-5 shadow-md mx-auto w-fit">
                              <FileText className="w-16 h-16 text-red-500" />
                            </div>
                            {resource.isAccessedByUser && (
                              <p className="text-red-600 text-sm font-medium mt-2">PDF Ready</p>
                            )}
                          </div>
                        )}
                        {!resource.isAccessedByUser && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="text-center text-white">
                              <Lock className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-sm font-semibold">Unlock to Access</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{resource.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{resource.description}</p>
                        <div className="flex justify-end">
                          <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${resource.isAccessedByUser ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                            {resource.isAccessedByUser ? '✓ Accessed' : '🔓 Click to Unlock'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video Courses Section */}
            {resources.filter(r => r.type === 'video').length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <Play className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Video Courses</h2>
                      <p className="text-sm text-gray-500">Master courses and tutorials</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                      {resources.filter(r => r.type === 'video').length} Videos
                    </span>
                    <button onClick={() => handleNavigation('/user/resources?type=video')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                      View Accessed
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resources.filter(r => r.type === 'video').map((resource) => (
                    <div key={resource.id} onClick={() => handleNavigation(`/user/resource/${resource.id}`)} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer">
                      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
                        {resource.isAccessedByUser && resource.url ? (
                          // Show video preview for accessed resources
                          <div className="w-full h-full">
                            <VideoViewer 
                              url={resource.url} 
                              title={resource.title}
                              showControls={false}
                              autoPlay={false}
                              className="h-full border-0 rounded-none shadow-none"
                            />
                          </div>
                        ) : (
                          // Show placeholder for locked resources
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Play className="w-8 h-8 text-blue-600" />
                              </div>
                              <p className="text-gray-600 text-sm font-medium">Premium Video</p>
                            </div>
                          </div>
                        )}
                        {!resource.isAccessedByUser && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="text-center text-white">
                              <Lock className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-sm font-semibold">Unlock to Watch</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{resource.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{resource.description}</p>
                        <div className="flex justify-end">
                          <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${resource.isAccessedByUser ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>
                            {resource.isAccessedByUser ? '✓ Accessed' : '🔓 Click to Unlock'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {resources.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Resources Available</h3>
                <p className="text-gray-500">Check back later for new content</p>
              </div>
            )}
          </div>
        )}

        {/* Subscription Status */}
        {userStats && !userStats.subscription.isActive && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <div className="flex items-center">
              <div className="text-yellow-600 mr-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">Subscription Required</h3>
                <p className="text-yellow-700">Subscribe to a plan to access premium resources and get monthly token allocations.</p>
              </div>
            </div>
          </div>
        )}


      </div>

      <Footer />
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}