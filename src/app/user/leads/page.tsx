"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, Unlock, Search, Download, Filter, Calendar, Linkedin, Instagram, Facebook, Globe, MapPin, Mail } from "lucide-react"
import { toast } from "sonner"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import Axios from "@/utils/Axios"
import EmailComposer, { EmailData } from "@/components/EmailComposer"

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
}

function LeadsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [leads, setLeads] = useState<Lead[]>([])
  const [accessedLeads, setAccessedLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<'all' | 'accessed'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [accessedPage, setAccessedPage] = useState(1)
  const [accessedTotalPages, setAccessedTotalPages] = useState(1)
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [bulkSelectCount, setBulkSelectCount] = useState<number>(0)
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [selectedEmailLeads, setSelectedEmailLeads] = useState<string[]>([])
  const [emailDefaultType, setEmailDefaultType] = useState<'bulk' | 'category' | 'city' | 'country' | 'selected'>('bulk')
  const [allCategories, setAllCategories] = useState<string[]>([])
  const [allCities, setAllCities] = useState<string[]>([])
  const [allCountries, setAllCountries] = useState<string[]>([])
  const [hoveredPhone, setHoveredPhone] = useState<string | null>(null)

  const loadLeads = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedCountry) params.append('country', selectedCountry);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await Axios.get(`/auth/leads?${params.toString()}`)
      console.log("leads", response.data)
      setLeads(response.data.leads)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAccessedLeads = async () => {
    try {
      const response = await Axios.get(`/auth/get-accesse-leads/accessed?page=${accessedPage}&limit=20`)
      setAccessedLeads(response.data.leads)
      setAccessedTotalPages(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Error loading accessed leads:', error)
    }
  }

  const handleAccessLead = async (id: string) => {
    try {
      const response = await Axios.post(`/auth/leads/${id}/access`)
      toast.success(response.data.message)
      loadLeads()
      loadAccessedLeads()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to access lead')
    }
  }

  const handleBulkAccess = async () => {
    if (selectedLeads.length === 0) return

    // Confirmation for large selections
    if (selectedLeads.length > 50) {
      const confirmed = window.confirm(
        `Are you sure you want to unlock ${selectedLeads.length} leads?\n\nThis will cost ${selectedLeads.length} tokens and may take a few moments to process.`
      )
      if (!confirmed) return
    }

    setBulkProcessing(true)
    try {
      const response = await Axios.post('/auth/leads/bulk-access',
        { leadIds: selectedLeads },
        { timeout: 120000 } // 2 minute timeout for large requests
      )
      toast.success(response.data.message)
      setSelectedLeads([])
      setBulkSelectCount(0)
      loadLeads()
      loadAccessedLeads()
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to access leads')
    } finally {
      setBulkProcessing(false)
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
    const accessedLeadIds = filteredLeads
      .filter(lead => activeTab === 'accessed' || lead.isAccessedByUser)
      .map(lead => lead.id)

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

  const handleSelectLead = (id: string, isAccessedByUser: boolean) => {
    if (isAccessedByUser) return
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(leadId => leadId !== id))
    } else {
      if (selectedLeads.length < 100) {
        setSelectedLeads([...selectedLeads, id])
      } else {
        toast.error('Maximum 100 leads can be selected')
      }
    }
  }

  const handleBulkSelectByCount = () => {
    if (bulkSelectCount <= 0) {
      toast.error('Please enter a valid number (1-100)')
      return
    }
    if (bulkSelectCount > 100) {
      toast.error('Maximum 100 leads can be selected at once')
      return
    }
    if (bulkSelectCount > lockedLeads.length) {
      toast.warning(`Only ${lockedLeads.length} unlocked leads available. Selecting all available leads.`)
    }

    const availableLeads = lockedLeads.slice(0, bulkSelectCount)
    setSelectedLeads(availableLeads.map(lead => lead.id))

    if (availableLeads.length >= 50) {
      toast.success(`Selected ${availableLeads.length} leads • Large selection will require confirmation`)
    } else {
      toast.success(`Selected ${availableLeads.length} leads for bulk unlock`)
    }
  }

  const handleSelectAll = () => {
    const maxSelect = Math.min(lockedLeads.length, 100)
    setSelectedLeads(lockedLeads.slice(0, maxSelect).map(lead => lead.id))
    toast.success(`Selected ${maxSelect} leads for bulk unlock`)
  }

  const handleClearSelection = () => {
    setSelectedLeads([])
    setBulkSelectCount(0)
  }

  const handleSendEmail = async (data: EmailData) => {
    if (data.type === 'category' && !data.category) {
      toast.error('Please select a category')
      throw new Error('Category required')
    }
    if (data.type === 'city' && !data.city) {
      toast.error('Please select a city')
      throw new Error('City required')
    }
    if (data.type === 'country' && !data.country) {
      toast.error('Please select a country')
      throw new Error('Country required')
    }
    if (data.type === 'selected' && (!data.leadIds || data.leadIds.length === 0)) {
      toast.error('Please select at least one lead')
      throw new Error('Leads required')
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
  }

  const handleSelectEmailLead = (id: string) => {
    setSelectedEmailLeads(prev => 
      prev.includes(id) ? prev.filter(leadId => leadId !== id) : [...prev, id]
    )
  }

  // Handle URL parameters on page load
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'accessed') {
      setActiveTab('accessed')
    }
    loadLeads()
    loadAccessedLeads()
  }, [searchParams])

  useEffect(() => {
    if (activeTab === 'all') {
      setPage(1)
      loadLeads()
    }
  }, [selectedCategory, selectedCountry, startDate, endDate])

  useEffect(() => {
    if (activeTab === 'all') {
      loadLeads()
    }
  }, [page])

  useEffect(() => {
    if (activeTab === 'accessed') {
      loadAccessedLeads()
    }
  }, [accessedPage])

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await Axios.get('/auth/leads/filter-options')
        setAllCategories(response.data.categories || [])
        setAllCities(response.data.cities || [])
        setAllCountries(response.data.countries || [])
      } catch (error) {
        console.error('Error fetching filter options:', error)
      }
    }
    if (activeTab === 'all') {
      fetchFilterOptions()
    }
  }, [activeTab])

  const cities = useMemo(() => {
    if (activeTab === 'all') return allCities
    return Array.from(new Set(accessedLeads.map(l => l.city).filter(Boolean))).sort()
  }, [activeTab, allCities, accessedLeads])

  const countries = useMemo(() => {
    if (activeTab === 'all') return allCountries
    return Array.from(new Set(accessedLeads.map(l => l.country).filter(Boolean))).sort()
  }, [activeTab, allCountries, accessedLeads])

  const categories = useMemo(() => {
    if (activeTab === 'all') return allCategories
    return Array.from(new Set(accessedLeads.map(l => l.category).filter(Boolean))).sort()
  }, [activeTab, allCategories, accessedLeads])

  const filteredLeads = (activeTab === 'all' ? leads : accessedLeads).filter(lead => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm ||
      lead.name?.toLowerCase().includes(searchLower) ||
      lead.leadId?.toLowerCase().includes(searchLower) ||
      lead.email?.toLowerCase().includes(searchLower) ||
      lead.phone?.toLowerCase().includes(searchLower) ||
      lead.city?.toLowerCase().includes(searchLower) ||
      lead.country?.toLowerCase().includes(searchLower) ||
      lead.category?.toLowerCase().includes(searchLower)
    
    if (activeTab === 'all') {
      return matchesSearch
    }
    
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

  const lockedLeads = useMemo(() => {
    return activeTab === 'all' ? filteredLeads : []
  }, [filteredLeads, activeTab])

  return (
    <div className="w-full px-2 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
            <p className="text-sm text-gray-600 mt-1">Browse and access leads</p>
          </div>
          <div className="flex gap-2">
            {activeTab === 'all' && selectedLeads.length > 0 && (
              <button
                onClick={handleBulkAccess}
                disabled={bulkProcessing}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    Unlock {selectedLeads.length} Lead{selectedLeads.length > 1 ? 's' : ''} ({selectedLeads.length} Token{selectedLeads.length > 1 ? 's' : ''})
                  </>
                )}
              </button>
            )}
            {(activeTab === 'accessed' || filteredLeads.some(lead => lead.isAccessedByUser)) && (
              <>
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
                  Export All Accessed
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => {
                  setActiveTab('all')
                  router.push('/user/leads')
                }}
                className={`px-6 py-3 text-sm font-medium ${activeTab === 'all' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500'}`}
              >
                All Leads ({leads.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('accessed')
                  router.push('/user/leads?tab=accessed')
                }}
                className={`px-6 py-3 text-sm font-medium ${activeTab === 'accessed' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500'}`}
              >
                Accessed ({accessedLeads.length})
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Bulk Selection Controls */}
            {activeTab === 'all' && lockedLeads.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-blue-900">Bulk Lead Selection</h3>
                  <span className="text-xs text-blue-700">{lockedLeads.length} unlocked leads available</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-blue-800">Select:</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={bulkSelectCount || ''}
                      onChange={(e) => setBulkSelectCount(parseInt(e.target.value) || 0)}
                      placeholder="Enter number (1-100)"
                      className="w-32 px-2 py-1 border border-blue-300 rounded text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={handleBulkSelectByCount}
                      disabled={!bulkSelectCount || bulkSelectCount <= 0}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Select {bulkSelectCount || 0}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-medium hover:bg-blue-200"
                    >
                      Select All ({Math.min(lockedLeads.length, 100)})
                    </button>
                    {selectedLeads.length > 0 && (
                      <button
                        onClick={handleClearSelection}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm font-medium hover:bg-gray-200"
                      >
                        Clear ({selectedLeads.length})
                      </button>
                    )}
                  </div>
                </div>
                {selectedLeads.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-sm text-blue-700">
                      ✓ {selectedLeads.length} leads selected • Cost: {selectedLeads.length} token{selectedLeads.length > 1 ? 's' : ''}
                    </div>
                    {selectedLeads.length > 50 && (
                      <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                        ⚡ Large selection detected • Estimated processing time: ~{Math.ceil(selectedLeads.length / 10)} seconds
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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

              {activeTab === 'accessed' && (
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
              )}

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

              {(selectedCountry || selectedCategory || startDate || endDate || (activeTab === 'accessed' && selectedCity)) && (
                <button
                  onClick={() => {
                    setSelectedCity("")
                    setSelectedCountry("")
                    setSelectedCategory("")
                    setStartDate("")
                    setEndDate("")
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
            <p className="text-sm text-gray-500">Loading leads...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="w-full">
                <table className="w-full table-auto">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {activeTab === 'accessed' && (
                        <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">SELECT</th>
                      )}
                      {activeTab === 'all' && lockedLeads.length > 0 && (
                        <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">SELECT</th>
                      )}
                      <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">LEAD ID</th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">NAME</th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">CATEGORY</th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">COUNTRY</th>
                      <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">DATE</th>
                      {activeTab === 'accessed' && (
                        <>
                          <th className="px-2 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">CITY</th>
                          <th className="px-2 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">EMAIL</th>
                          <th className="px-2 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">PHONE</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide min-w-[160px]">SOCIAL LINKS</th>
                        </>
                      )}
                      <th className="px-3 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={activeTab === 'accessed' ? 11 : 7} className="px-2 py-8 text-center text-sm text-gray-500">No leads found</td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          {activeTab === 'accessed' && (
                            <td className="px-2 py-2">
                              <input
                                type="checkbox"
                                checked={selectedEmailLeads.includes(lead.id)}
                                onChange={() => handleSelectEmailLead(lead.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </td>
                          )}
                          {activeTab === 'all' && lockedLeads.length > 0 && (
                            <td className="px-2 py-2">
                              {!lead.isAccessedByUser && (
                                <input
                                  type="checkbox"
                                  checked={selectedLeads.includes(lead.id)}
                                  onChange={() => handleSelectLead(lead.id, lead.isAccessedByUser)}
                                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                                />
                              )}
                            </td>
                          )}
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
                          <td className="px-3 py-3 text-sm text-gray-700 font-medium whitespace-nowrap">{new Date(lead.createdAt).toLocaleDateString('en-IN', {day: '2-digit', month: '2-digit', year: '2-digit'})}</td>

                          {activeTab === 'accessed' && (
                            <>
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
                            </>
                          )}

                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center">
                              {activeTab === 'accessed' ? (
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
                              ) : (
                                <button onClick={() => handleAccessLead(lead.id)} className="text-gray-900 hover:text-gray-700 text-xs font-medium flex items-center gap-1 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50">
                                  <Lock className="w-3 h-3" />
                                  <span>Unlock</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {activeTab === 'all' && totalPages > 1 && (
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
            {activeTab === 'accessed' && accessedTotalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setAccessedPage(1)}
                  disabled={accessedPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  First
                </button>
                <button
                  onClick={() => setAccessedPage(p => Math.max(1, p - 1))}
                  disabled={accessedPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">Page {accessedPage} of {accessedTotalPages}</span>
                <button
                  onClick={() => setAccessedPage(p => Math.min(accessedTotalPages, p + 1))}
                  disabled={accessedPage === accessedTotalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
                <button
                  onClick={() => setAccessedPage(accessedTotalPages)}
                  disabled={accessedPage === accessedTotalPages}
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

export default function LeadsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading leads...</p>
          </div>
        </div>
      }>
        <LeadsContent />
      </Suspense>
      <Footer />
    </div>
  )
}
