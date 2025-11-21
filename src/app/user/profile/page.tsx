"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Camera, User, Target, FileText, BarChart3, Bell, Gift, BookOpen, Settings, LogOut, Edit, Info, Calendar, Award } from "lucide-react"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import Axios from "@/utils/Axios"

interface UserProfile {
  name: string
  email: string
  phone?: string
  avatar?: string
  tokens: {
    monthlyTotal: number
    monthlyUsed: number
    monthlyRemaining: number
    totalUsed: number
    daily: number
    dailyLimit: number
    dailyUsed: number
  }
  subscription: {
    plan: {
      id: string
      name: string
      price: number
    } | null
    startDate: string
    endDate: string
    isActive: boolean
  }
  referralCode?: string
  referralStats?: {
    totalReferrals: number
    activeReferrals: number
    totalEarnings: number
  }
}

interface ReferralData {
  referralCode: string
  stats: {
    totalReferrals: number
    activeReferrals: number
    totalEarnings: number
  }
  referrals: Array<{
    user: {
      name: string
      email: string
      createdAt: string
    }
    joinedAt: string
    isActive: boolean
    subscriptionStatus: string
  }>
}

interface Notification {
  _id: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  fromUser?: {
    name: string
    avatar?: string
  }
  postId?: {
    post_title: string
  }
}

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState('Account Details')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationCount, setNotificationCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [referralLoading, setReferralLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const loadUserProfile = async () => {
    try {
      const response = await Axios.get('/auth/profile')
      console.log('Profile API response:', response.data)
      
      // Backend returns nested structure: { user: {...}, tokens: {...}, subscription: {...} }
      const profileData = {
        name: response.data.user.name,
        email: response.data.user.email,
        phone: response.data.user.phone,
        avatar: response.data.user.avatar,
        tokens: response.data.tokens,
        subscription: response.data.subscription
      }
      
      setUserProfile(profileData)
      setEditName(response.data.user.name || '')
      setEditPhone(response.data.user.phone || '')
      setAvatarPreview(response.data.user.avatar || '')
    } catch (error) {
      console.error('Error loading user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      toast.error('Name is required')
      return
    }

    setUpdating(true)
    try {
      const formData = new FormData()
      formData.append('name', editName.trim())
      formData.append('phone', editPhone.trim())
      
      if (fileInputRef.current?.files?.[0]) {
        formData.append('avatar', fileInputRef.current.files[0])
      }

      const response = await Axios.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      toast.success('Profile updated successfully!')
      await loadUserProfile()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile')
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    loadUserProfile()
    if (activeSection === 'Notifications') {
      loadNotifications()
    }
    if (activeSection === 'Referral Code') {
      loadReferralData()
    }
  }, [activeSection])

  const loadNotifications = async () => {
    setNotificationsLoading(true)
    try {
      const [countRes, notificationsRes] = await Promise.all([
        Axios.get('/notifications/count'),
        Axios.get('/notifications?limit=20')
      ])
      setNotificationCount(countRes.data.count || 0)
      setNotifications(notificationsRes.data.notifications || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
      setNotificationCount(0)
      setNotifications([])
    } finally {
      setNotificationsLoading(false)
    }
  }

  const markAllAsRead = async () => {
    try {
      await Axios.put('/notifications/mark-all-read')
      setNotificationCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking notifications as read:', error)
      toast.error('Error marking notifications as read')
    }
  }

  const loadReferralData = async () => {
    setReferralLoading(true)
    try {
      const response = await Axios.get('/referrals/my-referrals')
      setReferralData(response.data)
    } catch (error) {
      console.error('Error loading referral data:', error)
      toast.error('Failed to load referral data')
    } finally {
      setReferralLoading(false)
    }
  }

  const copyReferralCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode)
      toast.success('Referral code copied to clipboard!')
    }
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

  const sidebarItems = [
    { name: 'Account Details', icon: User },
    { name: 'Token Usage', icon: Target },
    { name: 'Subscription Plan', icon: FileText },
    { name: 'Usage Statistics', icon: BarChart3 },
    { name: 'Notifications', icon: Bell },
    { name: 'Referral Code', icon: Gift },
    { name: 'Accessed Resources', icon: BookOpen },
  ]

  const handleLogout = () => {
    toast.success('Logged out successfully!')
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r shadow-lg p-6">
          <div className="text-center mb-8">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />
            ) : (
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">
                  {userProfile?.name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-900">{userProfile?.name || 'Loading...'}</h1>
            <p className="text-gray-600 text-sm">{userProfile?.email || ''}</p>
          </div>
          
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    if (item.name === 'Accessed Resources') {
                      router.push('/user/resources')
                    } else {
                      setActiveSection(item.name)
                    }
                  }}
                  className={`w-full text-left py-3 px-4 rounded-lg transition-colors flex items-center ${
                    activeSection === item.name 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <Icon className="mr-3 w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              )
            })}
            
            <div className="border-t border-gray-200 my-6"></div>
            
            <button
              onClick={handleLogout}
              className="w-full text-left py-3 px-4 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center"
            >
              <LogOut className="mr-3 w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 bg-gray-50">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-gray-500">Loading profile...</div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">{activeSection}</h2>
            
              {activeSection === 'Account Details' && userProfile && (
                <div>
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white mb-8 shadow-lg">
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        {avatarPreview ? (
                          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white border-opacity-30">
                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-blue-500 border-4 border-white border-opacity-30 flex items-center justify-center">
                            <span className="text-3xl font-bold text-white">
                              {userProfile.name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 bg-white text-blue-600 p-2 rounded-full hover:bg-gray-100 shadow-lg"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </div>
                      <div className="flex-1 ">
                        <h3 className="text-3xl font-bold mb-1">{userProfile.name}</h3>
                        <p className="text-blue-100 text-lg mb-3">{userProfile.email}</p>
                        <div className="flex items-center gap-3">
                          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold shadow-md ${
                            userProfile.subscription.isActive 
                              ? 'bg-green-500 text-white' 
                              : 'bg-red-500 text-white'
                          }`}>
                            {userProfile.subscription.isActive ? '✓ Active Subscriber' : '✗ Inactive'}
                          </span>
                          {userProfile.subscription.plan && (
                            <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-white bg-opacity-20  shadow-md text-black">
                              {userProfile.subscription.plan.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="mr-2">✏️</span> Edit Personal Information
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Full Name *</label>
                          <input
                            type="text"
                            value={editName || ''}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                          <input
                            type="email"
                            value={userProfile.email}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="mr-2">📊</span> Account Information
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Account Status</label>
                          <div className={`p-3 rounded-lg font-semibold ${
                            userProfile.subscription.isActive 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {userProfile.subscription.isActive ? '✓ Active' : '✗ Inactive'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Member Since</label>
                          <div className="bg-gray-50 p-3 rounded-lg text-gray-900 font-medium">
                            {new Date(userProfile.subscription.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={updating}
                      className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      {updating ? 'Updating...' : 'Update Profile'}
                    </button>
                    <button
                      onClick={() => {
                        setEditName(userProfile.name)
                        setEditPhone(userProfile.phone || '')
                        setAvatarPreview(userProfile.avatar || '')
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 font-semibold shadow-md"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            
              {activeSection === 'Token Usage' && userProfile && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4">Daily Tokens</h3>
                      <div className="text-3xl font-bold text-blue-600 mb-2">{userProfile.tokens.daily}</div>
                      <div className="text-sm text-blue-700">of {userProfile.tokens.dailyLimit} available</div>
                      <div className="bg-blue-200 rounded-full h-2 mt-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{width: `${(userProfile.tokens.daily / userProfile.tokens.dailyLimit) * 100}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-green-900 mb-4">Monthly Tokens</h3>
                      <div className="text-3xl font-bold text-green-600 mb-2">{userProfile.tokens.monthlyRemaining}</div>
                      <div className="text-sm text-green-700">of {userProfile.tokens.monthlyTotal} remaining</div>
                      <div className="bg-green-200 rounded-full h-2 mt-3">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{width: `${(userProfile.tokens.monthlyRemaining / userProfile.tokens.monthlyTotal) * 100}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Summary</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{userProfile.tokens.totalUsed}</div>
                        <div className="text-sm text-gray-600">Total Used</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{userProfile.tokens.dailyUsed}</div>
                        <div className="text-sm text-gray-600">Used Today</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{userProfile.tokens.monthlyUsed}</div>
                        <div className="text-sm text-gray-600">Used This Month</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            
              {activeSection === 'Subscription Plan' && userProfile && (
                <div>
                  {userProfile.subscription.plan ? (
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-white mb-8 shadow-lg">
                      <div className="text-center">
                        <div className="inline-block bg-white bg-opacity-20 rounded-full px-4 py-1 mb-3">
                          <span className="text-sm font-semibold text-black">CURRENT PLAN</span>
                        </div>
                        <h3 className="text-4xl font-bold mb-2">{userProfile.subscription.plan.name}</h3>
                        <p className="text-purple-100 text-lg mb-4">Your active subscription plan</p>
                        <div className="text-5xl font-bold">${userProfile.subscription.plan.price}<span className="text-2xl">/month</span></div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-8 text-center mb-8 border border-gray-300">
                      <div className="text-6xl mb-4">📋</div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">No Active Plan</h3>
                      <p className="text-gray-600 mb-4">Subscribe to a plan to access premium features</p>
                      <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold">
                        View Plans
                      </button>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-4 text-lg flex items-center">
                        <span className="mr-2">📅</span> Subscription Details
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Status</span>
                          <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                            userProfile.subscription.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {userProfile.subscription.isActive ? '✓ Active' : '✗ Inactive'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Start Date</span>
                          <span className="font-semibold text-gray-900">
                            {new Date(userProfile.subscription.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 font-medium">End Date</span>
                          <span className="font-semibold text-gray-900">
                            {new Date(userProfile.subscription.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-4 text-lg flex items-center">
                        <span className="mr-2">🎯</span> Token Allocation
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Monthly Tokens</span>
                          <span className="font-semibold text-blue-600">{userProfile.tokens.monthlyTotal}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-600 font-medium">Daily Limit</span>
                          <span className="font-semibold text-purple-600">{userProfile.tokens.dailyLimit}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600 font-medium">Remaining</span>
                          <span className="font-semibold text-green-600">{userProfile.tokens.monthlyRemaining}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            
              {activeSection === 'Usage Statistics' && userProfile && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-50 p-6 rounded-lg text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{userProfile.tokens.totalUsed}</div>
                      <div className="text-blue-700 font-medium">Total Tokens Used</div>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">{userProfile.tokens.monthlyUsed}</div>
                      <div className="text-green-700 font-medium">Used This Month</div>
                    </div>
                    <div className="bg-purple-50 p-6 rounded-lg text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">{userProfile.tokens.dailyUsed}</div>
                      <div className="text-purple-700 font-medium">Used Today</div>
                    </div>
                  </div>
                  
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-6">Usage Efficiency</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Monthly Usage</span>
                          <span className="font-medium">
                            {((userProfile.tokens.monthlyUsed / userProfile.tokens.monthlyTotal) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{width: `${(userProfile.tokens.monthlyUsed / userProfile.tokens.monthlyTotal) * 100}%`}}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Daily Usage</span>
                          <span className="font-medium">
                            {((userProfile.tokens.dailyUsed / userProfile.tokens.dailyLimit) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{width: `${(userProfile.tokens.dailyUsed / userProfile.tokens.dailyLimit) * 100}%`}}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            
              {activeSection === 'Notifications' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Your Notifications</h3>
                      <p className="text-sm text-gray-600">Stay updated with community activities and system updates</p>
                    </div>
                    {notificationCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
                      >
                        Mark All Read ({notificationCount})
                      </button>
                    )}
                  </div>

                  {notificationsLoading ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading notifications...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
                      <p className="text-gray-600">When you receive notifications, they'll appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`border rounded-lg p-4 transition-all hover:shadow-md cursor-pointer ${
                            !notification.isRead 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-white border-gray-200'
                          }`}
                          onClick={() => {
                            router.push('/user/community')
                          }}
                        >
                          <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                              {notification.fromUser?.name?.charAt(0).toUpperCase() || 'N'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 mb-1">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {getTimeAgo(notification.createdAt)}
                                    </span>
                                    {notification.type && (
                                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                                        {notification.type.replace('_', ' ')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => router.push('/user/community')}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                    >
                      View Community for More Activity →
                    </button>
                  </div>
                </div>
              )}
            
              {activeSection === 'Referral Code' && (
                <div>
                  {referralLoading ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading referral data...</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-8 text-white mb-6 shadow-lg">
                        <div className="text-center">
                          <h3 className="text-3xl font-bold mb-2">Refer & Earn</h3>
                          <p className="text-green-100 mb-6">Share your referral code and earn rewards</p>
                          <div className="bg-white bg-opacity-20 rounded-lg p-4 inline-block">
                            <div className="text-sm text-green-800 mb-1">Your Referral Code</div>
                            <div className="flex items-center gap-3">
                              <div className="text-3xl font-bold tracking-wider text-green-800">
                                {referralData?.referralCode || 'Loading...'}
                              </div>
                              {referralData?.referralCode && (
                                <button
                                  onClick={copyReferralCode}
                                  className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
                                  title="Copy referral code"
                                >
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
                          <div className="text-4xl font-bold text-blue-600 mb-2">
                            {referralData?.stats.totalReferrals || 0}
                          </div>
                          <div className="text-gray-600 font-medium">Total Referrals</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
                          <div className="text-4xl font-bold text-green-600 mb-2">
                            {referralData?.stats.activeReferrals || 0}
                          </div>
                          <div className="text-gray-600 font-medium">Active Referrals</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
                          <div className="text-4xl font-bold text-purple-600 mb-2">
                            ₹{referralData?.stats.totalEarnings || 0}
                          </div>
                          <div className="text-gray-600 font-medium">Earnings</div>
                        </div>
                      </div>

                      {referralData?.referrals && referralData.referrals.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Referrals</h4>
                          <div className="space-y-3">
                            {referralData.referrals.map((referral, index) => (
                              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                  <div className="font-medium text-gray-900">{referral.user.name}</div>
                                  <div className="text-sm text-gray-600">{referral.user.email}</div>
                                  <div className="text-xs text-gray-500">
                                    Joined: {new Date(referral.joinedAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    referral.isActive 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {referral.isActive ? 'Active' : 'Pending'}
                                  </span>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {referral.subscriptionStatus}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            
              {activeSection === 'Accessed Resources' && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Accessed Resources</h3>
                  <p className="text-gray-600 mb-6">View all the resources you've accessed</p>
                  <button 
                    onClick={() => router.push('/user/resources')}
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    View Accessed Resources
                  </button>
                </div>
              )}
            
              {/* {activeSection === 'Settings' && userProfile && (
                <div>
                  <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                      <span className="mr-2">✏️</span> Update Profile
                    </h3>
                    
                    <div className="flex items-center mb-8">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-4xl font-bold text-gray-600">
                              {editName?.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 shadow-lg"
                        >
                          <Camera className="w-5 h-5" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </div>
                      <div className="ml-6">
                        <h4 className="font-semibold text-gray-900 mb-1">Profile Picture</h4>
                        <p className="text-sm text-gray-600">Click the camera icon to upload a new avatar</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input
                          type="email"
                          value={userProfile.email}
                          disabled
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button
                          onClick={handleUpdateProfile}
                          disabled={updating}
                          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updating ? 'Updating...' : 'Update Profile'}
                        </button>
                        <button
                          onClick={() => {
                            setEditName(userProfile.name)
                            setEditPhone(userProfile.phone || '')
                            setAvatarPreview(userProfile.avatar || '')
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )} */}
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  )
}