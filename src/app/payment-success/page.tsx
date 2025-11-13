"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export const dynamic = 'force-dynamic'

function PaymentSuccessContent() {
  const [countdown, setCountdown] = useState(5)
  const [userEmail, setUserEmail] = useState("")
  const [userName, setUserName] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get user data from localStorage
    const email = localStorage.getItem('pendingUserEmail') || searchParams.get('email') || ''
    const name = localStorage.getItem('pendingUserName') || 'User'
    
    setUserEmail(email)
    setUserName(name)

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          redirectToLogin()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const redirectToLogin = () => {
    const email = userEmail || localStorage.getItem('pendingUserEmail') || ''
    router.push(`/auth/login`)
  }

  return (
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        {/* Success Icon */}
        <div className="text-green-600 text-6xl mb-6">✓</div>
        
        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        <p className="text-lg text-gray-600 mb-6">
          Thank you for your purchase, {userName}!
        </p>
        
        {/* User Details */}
        {userEmail && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>Email:</strong> {userEmail}
            </p>
            <p className="text-sm text-green-600 mt-1">
              Welcome email sent with login instructions
            </p>
          </div>
        )}
        
        {/* Auto Redirect Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 font-medium">
            Redirecting to login in {countdown} seconds...
          </p>
        </div>
        
        {/* Manual Continue Button */}
        <button
          onClick={redirectToLogin}
          className="w-full py-4 px-6 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold text-lg transition-colors"
        >
          Continue to Login
        </button>
        
        {/* Security Note */}
        <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500">
          <span>🔒</span>
          <span>Your payment was processed securely</span>
        </div>
      </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Suspense fallback={<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">Loading...</div>}>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  )
}