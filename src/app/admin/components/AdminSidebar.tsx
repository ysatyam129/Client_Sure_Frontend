"use client"

import { useRouter, usePathname } from "next/navigation"
import { 
  Home, 
  Users, 
  BarChart3, 
  FolderOpen, 
  FileText, 
  Play, 
  Trophy, 
  User, 
  LogOut, 
  Search 
} from "lucide-react"

export default function AdminSidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const sidebarItems = [
    { name: 'Dashboard', icon: Home, path: '/admin/dashboard' },
    { name: 'Users', icon: Users, path: '/admin/users' },
    { name: 'Leads', icon: BarChart3, path: '/admin/leads' },
    { name: 'Resources', icon: FolderOpen, path: '/admin/resources' }
  ]

  const handleLogout = () => {
    router.push('/auth/admin')
  }

  return (
    <div className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white min-h-screen shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">ClientSure</h1>
        <p className="text-slate-400 text-sm mt-1">Admin Dashboard</p>
        <div className="mt-4 relative">
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-slate-800 text-white placeholder-slate-400 px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-slate-700"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4">
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <div key={item.name}>
              <button
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  pathname === item.path
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white hover:transform hover:scale-105'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="mt-8 pt-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-gradient-to-r hover:from-red-600 hover:to-red-500 hover:text-white transition-all duration-200 hover:transform hover:scale-105 hover:shadow-lg"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}