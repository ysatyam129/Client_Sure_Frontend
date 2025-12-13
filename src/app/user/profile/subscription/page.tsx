"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileText, Calendar, Award } from "lucide-react"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import ProfileSidebar from "../components/ProfileSidebar"
import Axios from "@/utils/Axios"

interface SubscriptionData {
  plan: {
    id: string
    name: string
    price: number
  } | null
  startDate: string
  endDate: string
  isActive: boolean
}

interface TokenData {
  monthlyTotal: number
  dailyLimit: number
  monthlyRemaining: number
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [tokens, setTokens] = useState<TokenData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadData = async () => {
    try {
      const response = await Axios.get('/auth/profile')
      setSubscription(response.data.subscription)
      setTokens(response.data.tokens)
    } catch (error) {
      console.error('Error loading subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex max-w-7xl mx-auto">
        <ProfileSidebar />
        
        <div className="flex-1 p-8 bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>Subscription Plan</span>
          </h1>

          <div className="space-y-8">
          {subscription?.plan ? (
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-white shadow-lg">
              <div className="text-center">
                <div className="inline-block bg-white bg-opacity-20 rounded-full px-4 py-1 mb-3">
                  <span className="text-sm font-semibold text-black">CURRENT PLAN</span>
                </div>
                <h3 className="text-4xl font-bold mb-2">{subscription.plan.name}</h3>
                <p className="text-purple-100 text-lg mb-4">Your active subscription plan</p>
                <div className="text-5xl font-bold">${subscription.plan.price}<span className="text-2xl">/month</span></div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-8 text-center border border-gray-300">
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
                <Calendar className="w-5 h-5 mr-2" />
                Subscription Details
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Status</span>
                  <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                    subscription?.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {subscription?.isActive ? '✓ Active' : '✗ Inactive'}
                  </span>
                </div>
                {subscription && (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Start Date</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(subscription.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">End Date</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(subscription.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-4 text-lg flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Token Allocation
              </h4>
              {tokens && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Total Tokens</span>
                    <span className="font-semibold text-blue-600">{tokens.monthlyTotal}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Daily Limit</span>
                    <span className="font-semibold text-purple-600">{tokens.dailyLimit}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Remaining</span>
                    <span className="font-semibold text-green-600">{tokens.monthlyRemaining}</span>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}