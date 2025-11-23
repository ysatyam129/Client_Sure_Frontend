"use client"

import { useState, useEffect } from "react"
import { Instagram, Facebook, Twitter, Linkedin, Youtube, Link as LinkIcon, Trash2, Plus, ExternalLink } from "lucide-react"
import Navbar from "../components/Navbar"
import { toast } from "sonner"
import Axios from "@/utils/Axios"

interface SocialAccount {
  _id?: string
  platform: string
  username: string
  url: string
}

export default function ToolsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAccount, setNewAccount] = useState({ platform: "instagram", username: "", url: "" })

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const response = await Axios.get('/user/social-accounts')
      setAccounts(response.data.accounts || [])
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }

  const handleAdd = async () => {
    if (!newAccount.username || !newAccount.url) {
      toast.error('Please fill all fields')
      return
    }
    try {
      await Axios.post('/user/social-accounts', newAccount)
      toast.success('Account linked successfully')
      setNewAccount({ platform: "instagram", username: "", url: "" })
      setShowAddForm(false)
      loadAccounts()
    } catch (error) {
      toast.error('Failed to link account')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await Axios.delete(`/user/social-accounts/${id}`)
      toast.success('Account removed')
      loadAccounts()
    } catch (error) {
      toast.error('Failed to remove account')
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram": return <Instagram className="w-5 h-5" />
      case "facebook": return <Facebook className="w-5 h-5" />
      case "twitter": return <Twitter className="w-5 h-5" />
      case "linkedin": return <Linkedin className="w-5 h-5" />
      case "youtube": return <Youtube className="w-5 h-5" />
      default: return <LinkIcon className="w-5 h-5" />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "instagram": return "from-pink-500 to-purple-600"
      case "facebook": return "from-blue-600 to-blue-700"
      case "twitter": return "from-sky-400 to-sky-600"
      case "linkedin": return "from-blue-700 to-blue-800"
      case "youtube": return "from-red-600 to-red-700"
      default: return "from-gray-600 to-gray-700"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Social Media Tools</h1>
          <p className="text-gray-600 mt-2">Link and manage your social media accounts</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Linked Accounts</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Account</span>
            </button>
          </div>

          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Add New Account</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                  <select
                    value={newAccount.platform}
                    onChange={(e) => setNewAccount({ ...newAccount, platform: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="twitter">Twitter</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="youtube">YouTube</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="text-black">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={newAccount.username}
                    onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                    placeholder="@username"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="text-black">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile URL</label>
                  <input
                    type="url"
                    value={newAccount.url}
                    onChange={(e) => setNewAccount({ ...newAccount, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleAdd}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Account
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {accounts.length === 0 ? (
              <div className="text-center py-12">
                <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No accounts linked yet</p>
                <p className="text-sm text-gray-400 mt-1">Click "Add Account" to get started</p>
              </div>
            ) : (
              accounts.map((account) => (
                <div
                  key={account._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${getPlatformColor(account.platform)} rounded-lg flex items-center justify-center text-white`}>
                      {getPlatformIcon(account.platform)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 capitalize">{account.platform}</h3>
                      <p className="text-sm text-gray-600">{account.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={account.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => handleDelete(account._id!)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
