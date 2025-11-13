"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import Axios from "@/utils/Axios"

interface LeadDetail {
  id: string
  leadId: string
  name: string
  email: string
  phone?: string
  category?: string
  linkedin?: string
  city?: string
  country?: string
  facebookLink?: string
  websiteLink?: string
  googleMapLink?: string
  instagram?: string
  addressStreet?: string
  lastVerifiedAt?: string
  createdAt: string
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLead()
  }, [params.id])

  const loadLead = async () => {
    try {
      const response = await Axios.get(`/auth/leads/get-accessed/${params.id}`)
      setLead(response.data)
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to load lead')
      router.push('/user/leads')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading lead details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!lead) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{lead.name}</h1>
              <p className="text-sm text-gray-600 mt-1">{lead.leadId}</p>
            </div>
            {lead.category && (
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                {lead.category}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium text-blue-700">Email</span>
                <p className="text-sm text-blue-900 mt-1">{lead.email}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-blue-700">Phone</span>
                <p className="text-sm text-blue-900 mt-1">{lead.phone || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
            <h3 className="text-sm font-semibold text-green-900 mb-4">Location</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium text-green-700">City</span>
                <p className="text-sm text-green-900 mt-1">{lead.city || '-'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-green-700">Country</span>
                <p className="text-sm text-green-900 mt-1">{lead.country || '-'}</p>
              </div>
              {lead.addressStreet && (
                <div>
                  <span className="text-xs font-medium text-green-700">Address</span>
                  <p className="text-sm text-green-900 mt-1">{lead.addressStreet}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-purple-900 mb-4">Social Media & Web</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lead.linkedin && (
              <div>
                <span className="text-xs font-medium text-purple-700">LinkedIn</span>
                <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-900 hover:text-purple-700 mt-1 block truncate">
                  {lead.linkedin}
                </a>
              </div>
            )}
            {lead.websiteLink && (
              <div>
                <span className="text-xs font-medium text-purple-700">Website</span>
                <a href={lead.websiteLink} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-900 hover:text-purple-700 mt-1 block truncate">
                  {lead.websiteLink}
                </a>
              </div>
            )}
            {lead.facebookLink && (
              <div>
                <span className="text-xs font-medium text-purple-700">Facebook</span>
                <a href={lead.facebookLink} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-900 hover:text-purple-700 mt-1 block truncate">
                  {lead.facebookLink}
                </a>
              </div>
            )}
            {lead.instagram && (
              <div>
                <span className="text-xs font-medium text-purple-700">Instagram</span>
                <p className="text-sm text-purple-900 mt-1">{lead.instagram}</p>
              </div>
            )}
            {lead.googleMapLink && (
              <div>
                <span className="text-xs font-medium text-purple-700">Google Maps</span>
                <a href={lead.googleMapLink} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-900 hover:text-purple-700 mt-1 block truncate">
                  {lead.googleMapLink}
                </a>
              </div>
            )}
          </div>
        </div>

        {lead.lastVerifiedAt && (
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-700">Last Verified</span>
              <p className="text-sm text-amber-900">{new Date(lead.lastVerifiedAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
