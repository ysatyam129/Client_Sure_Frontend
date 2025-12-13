"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { User, Target, FileText, BarChart3, Bell, Gift, BookOpen, LogOut } from "lucide-react"
import { toast } from "sonner"
import Axios from "@/utils/Axios"

interface UserProfile {
  name: string
  email: string
  avatar?: string
}

export default function ProfileSidebar() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const sidebarItems = [
    { name: 'Account Details', icon: User, path: '/user/profile/account' },
    { name: 'Token Usage', icon: Target, path: '/user/profile/tokens' },
    { name: 'Subscription Plan', icon: FileText, path: '/user/profile/subscription' },
    { name: 'Usage Statistics', icon: BarChart3, path: '/user/profile/statistics' },
    { name: 'Notifications', icon: Bell, path: '/user/notifications' },
    { name: 'Referral Code', icon: Gift, path: '/user/profile/referrals' },
    { name: 'Accessed Resources', icon: BookOpen, path: '/user/resources' },
  ]

  const loadUserProfile = async () => {
    try {
      const response = await Axios.get('/auth/profile')
      setUserProfile({
        name: response.data.user.name,
        email: response.data.user.email,
        avatar: response.data.user.avatar
      })
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const handleLogout = () => {
    // Clear all stored tokens and user data
    localStorage.removeItem('userToken')
    localStorage.removeItem('adminToken')
    localStorage.removeItem('user')
    toast.success('Logged out successfully!')
    router.push('/auth/login')
  }

  useEffect(() => {
    loadUserProfile()
  }, [])

  return (
    <div className="w-80 bg-white border-r shadow-lg p-6">
      <div className="text-center mb-8">
        {userProfile?.avatar ? (
          <img src={userProfile.avatar} alt="Avatar" className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />
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
          const isActive = pathname === item.path
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.path)}
              className={`w-full text-left py-3 px-4 rounded-lg transition-colors flex items-center ${
                isActive 
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
  )
}