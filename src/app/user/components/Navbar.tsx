"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { LayoutDashboard, FileText, Users, User, LogOut, ChevronDown, Menu, X, Coins, MessageCircle, Bell, Plus, Mail, Bot } from "lucide-react"
import Axios from "@/utils/Axios"

interface Notification {
  _id: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  fromUser?: {
    name: string
  }
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [tokens, setTokens] = useState({ daily: 0, dailyLimit: 100, prizeTokens: 0, effectiveTokens: 0 })
  const [userName, setUserName] = useState('')
  const [notificationCount, setNotificationCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const profileRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const loadTokens = async () => {
      try {
        const response = await Axios.get('/auth/profile')
        setTokens({
          daily: response.data.tokens.daily,
          dailyLimit: response.data.tokens.dailyLimit,
          prizeTokens: response.data.tokens.prizeTokens || 0,
          effectiveTokens: response.data.tokens.effectiveTokens || response.data.tokens.daily
        })
        setUserName(response.data.name || '')
      } catch (error) {
        console.error('Error loading tokens:', error)
      }
    }
    
    const loadData = () => {
      loadTokens()
      loadNotifications()
    }
    
    loadData()
    
    // Auto-refresh tokens and notifications every 15 seconds
    const refreshInterval = setInterval(loadData, 15000)
    return () => clearInterval(refreshInterval)
  }, [])

  const loadNotifications = async () => {
    try {
      const [countRes, notificationsRes] = await Promise.all([
        Axios.get('/notifications/count'),
        Axios.get('/notifications?limit=5')
      ])
      setNotificationCount(countRes.data.count || 0)
      setNotifications(notificationsRes.data.notifications || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
      // Set default values on error
      setNotificationCount(0)
      setNotifications([])
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



  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const handleProfileClick = () => {
    setIsProfileOpen(false)
    router.push('/user/profile')
  }

  const handleLogout = () => {
    setIsProfileOpen(false)
    // Clear all stored tokens and user data
    localStorage.removeItem('userToken')
    localStorage.removeItem('adminToken')
    localStorage.removeItem('user')
    toast.success('Logged out successfully!')
    router.push('/auth/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo - Properly positioned on far left */}
          <div className="flex items-center">
            <Link href="/user/dashboard" className="flex items-center space-x-3 mr-8">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <span className="text-white font-bold text-xl tracking-tight">CS</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 leading-tight">
                  Client<span className="text-blue-600">Sure</span>
                </span>
                <span className="text-xs text-gray-500 font-medium -mt-1">Lead Management</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 flex-1">
            <Link href="/user/dashboard" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link href="/user/resources" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <FileText className="w-4 h-4" />
              <span className="font-medium">Resources</span>
            </Link>
            <Link href="/user/leads/information" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <Users className="w-4 h-4" />
              <span className="font-medium">Leads</span>
            </Link>
          
            <Link href="/user/community" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium">Community</span>
            </Link>
            <Link href="/user/dashboard/chatbot" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <Bot className="w-4 h-4" />
              <span className="font-medium">AI Chatbot</span>
            </Link>
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center space-x-3 ml-auto">
            {/* Token Display with Buy Now */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 px-4 py-2 rounded-lg relative">
                <Coins className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-900">{tokens.effectiveTokens}</span>
                <span className="text-sm text-gray-500">/</span>
                <span className="text-sm text-gray-600">{tokens.dailyLimit}</span>
                {tokens.prizeTokens > 0 && (
                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                    +{tokens.prizeTokens}
                  </div>
                )}
              </div>
              <Link
                href="/user/profile/tokens"
                className="flex items-center space-x-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all shadow-sm"
              >
                <Plus className="w-3 h-3" />
                <span>Buy</span>
              </Link>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    {notificationCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-50 cursor-pointer ${
                            !notification.isRead 
                              ? notification.type === 'prize_tokens_awarded' 
                                ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-orange-400' 
                                : 'bg-blue-50'
                              : ''
                          }`}
                          onClick={() => {
                            if (notification.type !== 'prize_tokens_awarded') {
                              router.push('/user/community')
                            }
                            setShowNotifications(false)
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                              notification.type === 'prize_tokens_awarded' 
                                ? 'bg-gradient-to-br from-yellow-500 to-orange-600' 
                                : 'bg-gradient-to-br from-blue-500 to-purple-600'
                            }`}>
                              {notification.type === 'prize_tokens_awarded' ? '🎁' : (notification.fromUser?.name?.charAt(0).toUpperCase() || 'N')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm line-clamp-2 ${
                                notification.type === 'prize_tokens_awarded' 
                                  ? 'text-orange-900 font-bold' 
                                  : 'text-gray-900'
                              }`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {getTimeAgo(notification.createdAt)}
                              </p>
                              {notification.type === 'prize_tokens_awarded' && (
                                <div className="mt-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full inline-block font-medium">
                                  ✨ Prize Tokens Awarded
                                </div>
                              )}
                            </div>
                            {!notification.isRead && (
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                                notification.type === 'prize_tokens_awarded' ? 'bg-orange-500' : 'bg-blue-500'
                              }`}></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="px-4 py-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        router.push('/user/notifications')
                        setShowNotifications(false)
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {userName?.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">{userName?.split(' ')[0] || 'User'}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Manage your account</p>
                  </div>
                  <button
                    onClick={handleProfileClick}
                    className="w-full text-left px-4 py-2.5 text-gray-500 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">View Profile</span>
                  </button>
                    <Link href="/user/email-tracking" className="w-full text-left px-4 py-2.5 text-gray-500 hover:bg-gray-50 flex items-center space-x-3 transition-colors">
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">Email Tracking</span>
            </Link>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 flex items-center space-x-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors ml-auto"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            <Link href="/user/dashboard" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link href="/user/resources" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <FileText className="w-5 h-5" />
              <span className="font-medium">Resources</span>
            </Link>
            <Link href="/user/leads/information" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <Users className="w-5 h-5" />
              <span className="font-medium">Leads</span>
            </Link>
            <Link href="/user/email-tracking" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <Mail className="w-5 h-5" />
              <span className="font-medium">Email Tracking</span>
            </Link>
            <Link href="/user/community" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Community</span>
            </Link>
            <Link href="/user/dashboard/chatbot" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <Bot className="w-5 h-5" />
              <span className="font-medium">AI Chatbot</span>
            </Link>
            
            <div className="pt-3 mt-3 border-t border-gray-200 space-y-2">
              <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 relative">
                <span className="text-sm font-medium text-gray-700">Daily Tokens</span>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Coins className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-900">{tokens.effectiveTokens}/{tokens.dailyLimit}</span>
                  </div>
                  {tokens.prizeTokens > 0 && (
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                      +{tokens.prizeTokens}
                    </div>
                  )}
                  <Link
                    href="/user/profile/tokens"
                    className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Buy</span>
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <span className="text-sm font-medium text-gray-700">Notifications</span>
                <div className="flex items-center space-x-1">
                  <Bell className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-900">{notificationCount}</span>
                </div>
              </div>
              
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">View Profile</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-red-200"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}