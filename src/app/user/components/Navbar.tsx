"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { LayoutDashboard, FileText, Users, User, LogOut, ChevronDown, Menu, X, Coins, MessageCircle, Bell } from "lucide-react"
import Axios from "@/utils/Axios"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [tokens, setTokens] = useState({ daily: 0, dailyLimit: 100 })
  const [userName, setUserName] = useState('')
  const [notificationCount, setNotificationCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
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
          dailyLimit: response.data.tokens.dailyLimit
        })
        setUserName(response.data.name || '')
      } catch (error) {
        console.error('Error loading tokens:', error)
      }
    }
    loadTokens()
    loadNotifications()
    
    // Auto-refresh notifications every 30 seconds
    const notificationInterval = setInterval(loadNotifications, 30000)
    return () => clearInterval(notificationInterval)
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

  const getTimeAgo = (dateString) => {
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
    toast.success('Logged out successfully!')
    router.push('/auth/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/user/dashboard" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">CS</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">Client<span className="text-blue-600">Sure</span></span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/user/dashboard" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link href="/user/resources" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <FileText className="w-4 h-4" />
              <span className="font-medium">Resources</span>
            </Link>
            <Link href="/user/leads" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <Users className="w-4 h-4" />
              <span className="font-medium">Leads</span>
            </Link>
            <Link href="/user/community" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium">Community</span>
            </Link>
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Token Display */}
            <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 px-4 py-2 rounded-lg">
              <Coins className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">{tokens.daily}</span>
              <span className="text-sm text-gray-500">/</span>
              <span className="text-sm text-gray-600">{tokens.dailyLimit}</span>
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
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            router.push('/user/community')
                            setShowNotifications(false)
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {notification.fromUser?.name?.charAt(0).toUpperCase() || 'N'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {getTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="px-4 py-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        router.push('/user/community')
                        setShowNotifications(false)
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View all in Community
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
                    className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">View Profile</span>
                  </button>
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
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
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
            <Link href="/user/leads" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <Users className="w-5 h-5" />
              <span className="font-medium">Leads</span>
            </Link>
            <Link href="/user/community" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Community</span>
            </Link>
            
            <div className="pt-3 mt-3 border-t border-gray-200 space-y-2">
              <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-gray-700">Daily Tokens</span>
                <div className="flex items-center space-x-1">
                  <Coins className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">{tokens.daily}/{tokens.dailyLimit}</span>
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