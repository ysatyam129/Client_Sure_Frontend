"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Search, Download, Filter, Calendar, ArrowLeft, Mail, Linkedin, Instagram, Facebook, Globe, MapPin } from "lucide-react"
import { toast } from "sonner"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import EmailComposer, { EmailData } from "@/components/EmailComposer"
import Axios from "@/utils/Axios"
import { formatDate, formatDateTime } from "@/utils/dateUtils"

interface Lead {
  id: string
  leadId: string
  name: string
  email: string
  phone?: string
  linkedin?: string
  city?: string
  country?: string
  category?: string
  facebookLink?: string
  websiteLink?: string
  googleMapLink?: string
  instagram?: string
  addressStreet?: string
  lastVerifiedAt?: string
  isAccessedByUser: boolean
  createdAt: string
  updatedAt?: string
  accessedAt?: string
}

function AccessedLeadsContent() {
  const router = useRouter()
  const [accessedLeads, setAccessedLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedEmailLeads, setSelectedEmailLeads] = useState<string[]>([])
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailDefaultType, setEmailDefaultType] = useState<'bulk' | 'category' | 'city' | 'country' | 'selected'>('bulk')
  const [hoveredPhone, setHoveredPhone] = useState<string | null>(null)
  const [selectedAccessDate, setSelectedAccessDate] = useState("")

  const loadAccessedLeads = async () => {
    setLoading(true)
    try {
      let url = `/leads/accessed?page=${page}&limit=20`
      if (selectedAccessDate) {
        url += `&date=${selectedAccessDate}`
      }
      const response = await Axios.get(url)
      setAccessedLeads(response.data.leads)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error: any) {
      console.error('Error loading accessed leads:', error)
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        toast.error('Backend server is not running. Please start the server.')
      } else {
        toast.error('Failed to load leads')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleExportLead = async (leadId: string) => {
    try {
      const response = await Axios.post('/auth/leads/export', { leadId }, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `lead_${leadId}_${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Lead data exported successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to export lead data')
    }
  }

  const handleBulkExport = async () => {
    const accessedLeadIds = filteredLeads.map(lead => lead.id)

    if (accessedLeadIds.length === 0) {
      toast.error('No accessed leads to export')
      return
    }

    try {
      const response = await Axios.post('/auth/leads/bulk-export', { leadIds: accessedLeadIds }, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `leads_export_${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success(`${accessedLeadIds.length} leads exported successfully!`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to export leads data')
    }
  }

  const handleSendEmail = async (data: EmailData) => {
    try {
      if (data.type === 'category' && !data.category) {
        toast.error('Please select a category')
        return
      }
      if (data.type === 'city' && !data.city) {
        toast.error('Please select a city')
        return
      }
      if (data.type === 'country' && !data.country) {
        toast.error('Please select a country')
        return
      }
      if (data.type === 'selected' && (!data.leadIds || data.leadIds.length === 0)) {
        toast.error('Please select at least one lead')
        return
      }

      const payload: any = { subject: data.subject, message: data.message, type: data.type }
      
      if (data.category) payload.category = data.category
      if (data.city) payload.city = data.city
      if (data.country) payload.country = data.country
      if (data.leadIds) payload.leadIds = data.leadIds
      if (data.cc) payload.cc = data.cc
      if (data.bcc) payload.bcc = data.bcc

      const response = await Axios.post('/leads/send-email', payload)
      toast.success(response.data.message || 'Emails sent successfully')
      setSelectedEmailLeads([])
    } catch (error: any) {
      console.error('Email sending error:', error)
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        toast.error('Backend server is not running. Please start the server.')
      } else {
        toast.error(error.response?.data?.error || error.message || 'Failed to send emails')
      }
    }
  }

  const handleSelectEmailLead = (id: string) => {
    setSelectedEmailLeads(prev => 
      prev.includes(id) ? prev.filter(leadId => leadId !== id) : [...prev, id]
    )
  }

  useEffect(() => {
    loadAccessedLeads()
  }, [page, selectedAccessDate])

  const cities = Array.from(new Set(accessedLeads.map(l => l.city).filter(Boolean))) as string[]
  const countries = Array.from(new Set(accessedLeads.map(l => l.country).filter(Boolean))) as string[]
  const categories = Array.from(new Set(accessedLeads.map(l => l.category).filter(Boolean))) as string[]

  const filteredLeads = accessedLeads.filter(lead => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm ||
      lead.name?.toLowerCase().includes(searchLower) ||
      lead.leadId?.toLowerCase().includes(searchLower) ||
      lead.email?.toLowerCase().includes(searchLower) ||
      lead.phone?.toLowerCase().includes(searchLower) ||
      lead.city?.toLowerCase().includes(searchLower) ||
      lead.country?.toLowerCase().includes(searchLower) ||
      lead.category?.toLowerCase().includes(searchLower)
    
    const matchesCity = !selectedCity || lead.city === selectedCity
    const matchesCountry = !selectedCountry || lead.country === selectedCountry
    const matchesCategory = !selectedCategory || lead.category === selectedCategory

    let matchesDate = true
    if (startDate || endDate) {
      const leadDate = new Date(lead.createdAt)
      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        matchesDate = matchesDate && leadDate >= start
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        matchesDate = matchesDate && leadDate <= end
      }
    }

    return matchesSearch && matchesCity && matchesCountry && matchesCategory && matchesDate
  }).sort((a, b) => a.leadId.localeCompare(b.leadId))

  return (
    <div className="w-full px-2 py-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Accessed Leads</h1>
            <p className="text-sm text-gray-600 mt-1">View and manage all your unlocked leads</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setEmailDefaultType('bulk'); setShowEmailModal(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Send Email
          </button>
          <button
            onClick={handleBulkExport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export All
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search accessed leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
            >
              <option value="">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={selectedAccessDate}
                onChange={(e) => setSelectedAccessDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                placeholder="Access Date"
                title="Filter by access date (DD/MM/YYYY)"
              />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                placeholder="Start Date"
              />
              <span className="text-gray-500 text-sm">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                placeholder="End Date"
              />
            </div>

            {(selectedCountry || selectedCategory || selectedCity || startDate || endDate || selectedAccessDate) && (
              <button
                onClick={() => {
                  setSelectedCity("")
                  setSelectedCountry("")
                  setSelectedCategory("")
                  setStartDate("")
                  setEndDate("")
                  setSelectedAccessDate("")
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading accessed leads...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="w-full">
              <table className="w-full table-auto">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">SELECT</th>
                    <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">LEAD ID</th>
                    <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">NAME</th>
                    <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">CATEGORY</th>
                    <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">COUNTRY</th>
                    <th className="px-2 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">CITY</th>
                    <th className="px-2 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">EMAIL</th>
                    <th className="px-2 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">PHONE</th>
                    <th className="px-2 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">ACCESS DATE</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide min-w-[160px]">SOCIAL LINKS</th>
                    <th className="px-3 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-2 py-8 text-center text-sm text-gray-500">
                        {selectedAccessDate ? `No leads accessed on ${formatDate(selectedAccessDate)}` : 'No accessed leads found'}
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={selectedEmailLeads.includes(lead.id)}
                            onChange={() => handleSelectEmailLead(lead.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-900 font-semibold">{lead.leadId}</td>
                        <td className="px-3 py-3 text-sm font-semibold text-gray-900" title={lead.name}>
                          <div className="max-w-[120px] truncate">{lead.name}</div>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700 font-medium">
                          <div className="max-w-[100px] truncate">{lead.category || '-'}</div>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700 font-medium">
                          <div className="max-w-[80px] truncate">{lead.country || '-'}</div>
                        </td>
                        <td className="px-2 py-3 text-sm text-gray-700 font-medium">
                          <div className="max-w-[80px] truncate">{lead.city || '-'}</div>
                        </td>
                        <td className="px-2 py-3 text-sm text-gray-700 font-medium" title={lead.email}>
                          <div className="max-w-[150px] truncate">{lead.email}</div>
                        </td>
                        <td className="px-2 py-3 text-sm text-gray-700 font-medium relative">
                          <div 
                            className="max-w-[100px] truncate cursor-pointer"
                            onMouseEnter={() => setHoveredPhone(lead.id)}
                            onMouseLeave={() => setHoveredPhone(null)}
                          >
                            {lead.phone || '-'}
                          </div>
                          {hoveredPhone === lead.id && lead.phone && (
                            <div className="absolute z-50 bg-white text-black px-3 py-2 rounded shadow-lg border border-gray-300 whitespace-nowrap left-0 top-full mt-1">
                              <div className="font-bold text-sm">{lead.phone}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-3 text-sm text-gray-700 font-medium">
                          <div className="max-w-[120px] truncate" title={lead.accessedAt ? formatDateTime(lead.accessedAt) : '-'}>
                            {formatDate(lead.accessedAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {lead.websiteLink && (
                              <a href={lead.websiteLink} target="_blank" rel="noopener noreferrer" title="Website">
                                <Globe className="w-5 h-5 text-blue-600 hover:text-blue-800 cursor-pointer" />
                              </a>
                            )}
                            {lead.linkedin && (
                              <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn">
                                <Linkedin className="w-5 h-5 text-blue-700 hover:text-blue-900 cursor-pointer" />
                              </a>
                            )}
                            {lead.facebookLink && (
                              <a href={lead.facebookLink} target="_blank" rel="noopener noreferrer" title="Facebook">
                                <Facebook className="w-5 h-5 text-blue-600 hover:text-blue-800 cursor-pointer" />
                              </a>
                            )}
                            {lead.instagram && (
                              <a href={lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" title="Instagram">
                                <Instagram className="w-5 h-5 text-pink-600 hover:text-pink-800 cursor-pointer" />
                              </a>
                            )}
                            {lead.googleMapLink && (
                              <a href={lead.googleMapLink} target="_blank" rel="noopener noreferrer" title="Google Maps">
                                <MapPin className="w-5 h-5 text-green-600 hover:text-green-800 cursor-pointer" />
                              </a>
                            )}
                            {!lead.websiteLink && !lead.linkedin && !lead.facebookLink && !lead.instagram && !lead.googleMapLink && (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center">
                            <div className="flex flex-col gap-1">
                              <button onClick={() => handleExportLead(lead.id)} className="text-green-600 hover:text-green-800 text-sm font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors">
                                <Download className="w-4 h-4" />
                                <span>Export</span>
                              </button>
                              <button onClick={() => { setSelectedEmailLeads([lead.id]); setEmailDefaultType('selected'); setShowEmailModal(true); }} className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors">
                                <Mail className="w-4 h-4" />
                                <span>Email</span>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                First
              </button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Last
              </button>
            </div>
          )}
        </>
      )}

      {/* Email Composer */}
      {showEmailModal && (
        <EmailComposer
          onClose={() => { setShowEmailModal(false); setSelectedEmailLeads([]); }}
          onSend={handleSendEmail}
          categories={categories}
          cities={cities}
          countries={countries}
          selectedLeads={selectedEmailLeads}
          defaultType={emailDefaultType}
        />
      )}
    </div>
  )
}

export default function AccessedLeadsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading accessed leads...</p>
          </div>
        </div>
      }>
        <AccessedLeadsContent />
      </Suspense>
      <Footer />
    </div>
  )
}