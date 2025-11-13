"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { LayoutDashboard, FileText, Users, User, LogOut, ChevronDown, Menu, X, Coins } from "lucide-react"
import Axios from "@/utils/Axios"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [tokens, setTokens] = useState({ daily: 0, dailyLimit: 100 })
  const [userName, setUserName] = useState('')
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
  }, [])

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
            
            <div className="pt-3 mt-3 border-t border-gray-200 space-y-2">
              <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-gray-700">Daily Tokens</span>
                <div className="flex items-center space-x-1">
                  <Coins className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">{tokens.daily}/{tokens.dailyLimit}</span>
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