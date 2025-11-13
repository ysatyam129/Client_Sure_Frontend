"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import Axios from "@/utils/Axios"

function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for payment success
    const payment = searchParams.get('payment')
    const email = searchParams.get('email')
    
    if (payment === 'success') {
      setPaymentSuccess(true)
      toast.success('Payment successful! Please login to access your dashboard.')
      
      if (email) {
        setFormData(prev => ({ ...prev, email: decodeURIComponent(email) }))
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      const response = await Axios.post('/auth/login', {
        email: formData.email,
        password: formData.password
      })
      
      // Redirect to dashboard with newSubscription param if payment was successful
      const redirectUrl = paymentSuccess ? '/user/dashboard?newSubscription=true' : '/user/dashboard'
      toast.success('Login successful! Welcome back.')
      router.push(redirectUrl)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Login</h1>
        
        {paymentSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            🎉 Payment successful! Please login to access your new subscription.
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-black font-semibold mb-3 text-lg">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-5 py-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-black bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-black font-semibold mb-3 text-lg">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-5 py-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-black bg-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Forgot your password?{' '}
            <a href="/auth/forgot-password" className="text-blue-600 hover:underline">
              Reset it here
            </a>
          </p>
        </div>
      </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Suspense fallback={<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}