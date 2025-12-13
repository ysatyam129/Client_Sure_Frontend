"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Gift, Copy, Users, DollarSign } from "lucide-react"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import ProfileSidebar from "../components/ProfileSidebar"
import Axios from "@/utils/Axios"

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

interface MilestoneData {
  activeReferrals: number
  totalCycles: number
  totalTokensEarned: number
  milestones: Array<{
    type: string
    target: number
    reward: number
    current: number
    progress: number
    cyclesCompleted: number
    tokensEarnedFromThis: number
    lastReset: string | null
    isEligible: boolean
    nextCycleNumber: number
  }>
}

export default function ReferralsPage() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [milestoneData, setMilestoneData] = useState<MilestoneData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadReferralData = async () => {
    try {
      const [referralResponse, milestoneResponse] = await Promise.all([
        Axios.get('/referrals/my-referrals'),
        Axios.get('/referrals/milestones')
      ])
      setReferralData(referralResponse.data)
      setMilestoneData(milestoneResponse.data)
    } catch (error) {
      console.error('Error loading referral data:', error)
      toast.error('Failed to load referral data')
    } finally {
      setLoading(false)
    }
  }

  const copyReferralCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode)
      toast.success('Referral code copied to clipboard!')
    }
  }

  useEffect(() => {
    loadReferralData()
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
            <Gift className="w-6 h-6 text-blue-600" />
            <span>Referral Program</span>
          </h1>

          <div className="space-y-8">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-8 text-white shadow-lg">
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
                      <Copy className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
              <div className="flex items-center justify-center mb-3">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {referralData?.stats.totalReferrals || 0}
              </div>
              <div className="text-gray-600 font-medium">Total Referrals</div>
              <div className="text-xs text-gray-500 mt-1">People you've referred</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
              <div className="flex items-center justify-center mb-3">
                <Gift className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                {referralData?.stats.activeReferrals || 0}
              </div>
              <div className="text-gray-600 font-medium">Active Referrals</div>
              <div className="text-xs text-gray-500 mt-1">Currently subscribed</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
              <div className="flex items-center justify-center mb-3">
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                ₹{referralData?.stats.totalEarnings || 0}
              </div>
              <div className="text-gray-600 font-medium">Total Earnings</div>
              <div className="text-xs text-gray-500 mt-1">Rewards earned</div>
            </div>
          </div>

          {referralData?.referrals && referralData.referrals.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Referrals</h4>
              <div className="space-y-3">
                {referralData.referrals.map((referral, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {referral.user?.name ? referral.user.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{referral.user?.name || 'Unknown User'}</div>
                        <div className="text-sm text-gray-600">{referral.user?.email || 'No email'}</div>
                        <div className="text-xs text-gray-500">
                          Joined: {new Date(referral.joinedAt).toLocaleDateString()}
                        </div>
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
                      <div className="text-xs text-gray-500 mt-1 capitalize">
                        {referral.subscriptionStatus}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Referrals Yet</h3>
              <p className="text-gray-600 mb-4">Start sharing your referral code to earn rewards!</p>
              <button
                onClick={copyReferralCode}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Copy Referral Code
              </button>
            </div>
          )}

          {milestoneData && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Gift className="w-5 h-5 text-purple-600" />
                  <span>Milestone Rewards (Cycle System)</span>
                </h4>
                <div className="text-right text-sm">
                  <div className="font-medium text-purple-600">Total Cycles: {milestoneData.totalCycles}</div>
                  <div className="text-gray-600">Total Earned: {milestoneData.totalTokensEarned} tokens</div>
                </div>
              </div>
              
              <div className="space-y-4">
                {milestoneData.milestones.map((milestone, index) => (
                  <div key={milestone.type} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          milestone.isEligible
                            ? 'bg-yellow-500 text-white' 
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {milestone.target}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {milestone.target} Referrals → {milestone.reward} Tokens
                          </div>
                          <div className="text-sm text-gray-600">
                            Cycle #{milestone.nextCycleNumber} • Completed: {milestone.cyclesCompleted} times
                          </div>
                          <div className="text-xs text-green-600">
                            Earned from this milestone: {milestone.tokensEarnedFromThis} tokens
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {milestone.isEligible ? (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            Ready to Claim!
                          </span>
                        ) : (
                          <div>
                            <span className="text-sm text-gray-500 block">
                              {milestone.current}/{milestone.target}
                            </span>
                            <span className="text-xs text-gray-400">
                              {milestone.target - milestone.current} more needed
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          milestone.progress >= 100
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, milestone.progress)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progress: {milestone.progress.toFixed(1)}%</span>
                      {milestone.lastReset && (
                        <span>Last reset: {new Date(milestone.lastReset).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>How Cycles Work:</strong> When you reach a milestone, you get tokens and your progress resets to 0. 
                  You can achieve the same milestone multiple times to earn more rewards!
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-3">How It Works</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">1</div>
                <div className="font-medium text-blue-900">Share Your Code</div>
                <div className="text-blue-700">Send your referral code to friends</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">2</div>
                <div className="font-medium text-blue-900">They Subscribe</div>
                <div className="text-blue-700">Your friends join using your code</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">3</div>
                <div className="font-medium text-blue-900">Earn Rewards</div>
                <div className="text-blue-700">Get rewards for each referral</div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}