"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Axios from "../../utils/Axios"

interface PurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  plan: {
    id: string
    name: string
    price: string
    duration: string
    tokensPerDay: string
  }
}

export default function PurchaseModal({ isOpen, onClose, plan }: PurchaseModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    referralCode: ""
  })
  const [referralValidation, setReferralValidation] = useState<{
    isValid: boolean | null
    referrerName: string | null
    isChecking: boolean
  }>({ isValid: null, referrerName: null, isChecking: false })
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Store user data in localStorage for payment flow
      localStorage.setItem('pendingUserEmail', formData.email)
      localStorage.setItem('pendingUserName', formData.fullName)
      
      const response = await Axios.post('/payments/create-order', {
        planId: plan.id,
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        planPrice: plan.price,
        planName: plan.name,
        referralCode: formData.referralCode || null
      })
      
      // Redirect to payment gateway instead of login
      if (response.data.paymentPayload?.checkoutUrl) {
        window.location.href = response.data.paymentPayload.checkoutUrl
      } else {
        toast.error('Payment gateway not available')
      }
    } catch (error) {
      console.error('Order creation failed:', error)
      toast.error('Failed to create order. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 bg-white bg-opacity-20 backdrop-blur-md flex items-center justify-center z-[9999] p-4" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Complete Your Purchase</h2>

        {/* Plan Details */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">{plan.name}</h3>
          <div className="flex gap-3">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium">
              ₹{plan.price}
            </div>
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium">
              {plan.duration}
            </div>
            <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg font-medium">
              {plan.tokensPerDay}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-black font-semibold mb-3 text-lg">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className="w-full px-5 py-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-black bg-white"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-black font-semibold mb-3 text-lg">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-5 py-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-black bg-white"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-black font-semibold mb-3 text-lg">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-5 py-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-black bg-white"
              required
            />
          </div>

          {/* Referral Code */}
          <div>
            <label className="block text-black font-semibold mb-3 text-lg">
              Referral Code <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="Enter referral code if you have one"
              value={formData.referralCode}
              onChange={async (e) => {
                const code = e.target.value.toUpperCase()
                setFormData({...formData, referralCode: code})
                
                if (code.length >= 6) {
                  setReferralValidation({ isValid: null, referrerName: null, isChecking: true })
                  try {
                    const response = await Axios.get(`/referrals/validate/${code}`)
                    if (response.data.valid) {
                      setReferralValidation({ 
                        isValid: true, 
                        referrerName: response.data.referrer.name,
                        isChecking: false 
                      })
                    } else {
                      setReferralValidation({ isValid: false, referrerName: null, isChecking: false })
                    }
                  } catch (error) {
                    setReferralValidation({ isValid: false, referrerName: null, isChecking: false })
                  }
                } else {
                  setReferralValidation({ isValid: null, referrerName: null, isChecking: false })
                }
              }}
              className={`w-full px-5 py-4 border rounded-lg focus:outline-none focus:ring-2 text-lg text-black bg-white ${
                referralValidation.isValid === true ? 'border-green-500 focus:ring-green-500' :
                referralValidation.isValid === false ? 'border-red-500 focus:ring-red-500' :
                'border-gray-200 focus:ring-blue-500'
              }`}
            />
            {referralValidation.isChecking && (
              <p className="text-blue-600 text-sm mt-2">Validating referral code...</p>
            )}
            {referralValidation.isValid === true && (
              <p className="text-green-600 text-sm mt-2">
                ✓ Valid referral code from {referralValidation.referrerName}
              </p>
            )}
            {referralValidation.isValid === false && formData.referralCode && (
              <p className="text-red-600 text-sm mt-2">
                ✗ Invalid referral code
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : `Pay ₹${plan.price}`}
            </button>
          </div>
        </form>

        {/* Security Note */}
        <div className="flex items-center justify-center gap-2 mt-6 text-base text-gray-600">
          <span>🔒</span>
          <span>Your information is secure and encrypted</span>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}