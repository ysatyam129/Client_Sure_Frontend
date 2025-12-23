"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, Search, Filter, Calendar, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import Axios from "@/utils/Axios"
import { formatDate } from "@/utils/dateUtils"

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

function LeadInformationContent() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [bulkSelectCount, setBulkSelectCount] = useState<number>(0)
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [allCategories, setAllCategories] = useState<string[]>([])
  const [allCountries, setAllCountries] = useState<string[]>([])

  const loadLeads = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' });
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedCountry) params.append('country', selectedCountry);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await Axios.get(`/auth/leads?${params.toString()}`)
      setLeads(response.data.leads)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccessLead = async (id: string) => {
    try {
      const response = await Axios.post(`/auth/leads/${id}/access`)
      toast.success(response.data.message)
      loadLeads()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to access lead')
    }
  }

  const handleBulkAccess = async () => {
    if (selectedLeads.length === 0) return

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
        { timeout: 120000 }
      )
      toast.success(response.data.message)
      setSelectedLeads([])
      setBulkSelectCount(0)
      loadLeads()
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to access leads')
    } finally {
      setBulkProcessing(false)
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
    
    const lockedLeads = filteredLeads.filter(lead => !lead.isAccessedByUser)
    if (bulkSelectCount > lockedLeads.length) {
      toast.warning(`Only ${lockedLeads.length} unlocked leads available. Selecting all available leads.`)
    }

    const availableLeads = lockedLeads.slice(0, bulkSelectCount)
    setSelectedLeads(availableLeads.map(lead => lead.id))
    toast.success(`Selected ${availableLeads.length} leads for bulk unlock`)
  }

  const handleSelectAll = () => {
    const lockedLeads = filteredLeads.filter(lead => !lead.isAccessedByUser)
    const maxSelect = Math.min(lockedLeads.length, 100)
    setSelectedLeads(lockedLeads.slice(0, maxSelect).map(lead => lead.id))
    toast.success(`Selected ${maxSelect} leads for bulk unlock`)
  }

  const handleClearSelection = () => {
    setSelectedLeads([])
    setBulkSelectCount(0)
  }

  useEffect(() => {
    loadLeads()
  }, [page, selectedCategory, selectedCountry, startDate, endDate])

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await Axios.get('/auth/leads/filter-options')
        setAllCategories(response.data.categories || [])
        setAllCountries(response.data.countries || [])
      } catch (error) {
        console.error('Error fetching filter options:', error)
      }
    }
    fetchFilterOptions()
  }, [])

  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase()
    return !searchTerm ||
      lead.name?.toLowerCase().includes(searchLower) ||
      lead.leadId?.toLowerCase().includes(searchLower) ||
      lead.email?.toLowerCase().includes(searchLower) ||
      lead.phone?.toLowerCase().includes(searchLower) ||
      lead.city?.toLowerCase().includes(searchLower) ||
      lead.country?.toLowerCase().includes(searchLower) ||
      lead.category?.toLowerCase().includes(searchLower)
  }).sort((a, b) => a.leadId.localeCompare(b.leadId))

  const lockedLeads = filteredLeads.filter(lead => !lead.isAccessedByUser)

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
            <h1 className="text-2xl font-semibold text-gray-900">Lead Information</h1>
            <p className="text-sm text-gray-600 mt-1">Browse and unlock leads to access their details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedLeads.length > 0 && (
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
                  <Lock className="w-4 h-4" />
                  Unlock {selectedLeads.length} Lead{selectedLeads.length > 1 ? 's' : ''} ({selectedLeads.length} Token{selectedLeads.length > 1 ? 's' : ''})
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 mb-6">
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
          {lockedLeads.length > 0 && (
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
              {allCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
            >
              <option value="">All Countries</option>
              {allCountries.map(country => (
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

            {(selectedCountry || selectedCategory || startDate || endDate) && (
              <button
                onClick={() => {
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
                    {lockedLeads.length > 0 && (
                      <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">SELECT</th>
                    )}
                    <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">LEAD ID</th>
                    <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">NAME</th>
                    <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">CATEGORY</th>
                    <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">COUNTRY</th>
                    <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">DATE</th>
                    <th className="px-3 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-2 py-8 text-center text-sm text-gray-500">No leads found</td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        {lockedLeads.length > 0 && (
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
                        <td className="px-3 py-3 text-sm text-gray-700 font-medium whitespace-nowrap">
                          {formatDate(lead.createdAt)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center">
                            {lead.isAccessedByUser ? (
                              <span className="text-green-600 text-xs font-medium px-2 py-1 bg-green-50 border border-green-200 rounded">
                                ✓ Unlocked
                              </span>
                            ) : (
                              <button 
                                onClick={() => handleAccessLead(lead.id)} 
                                className="text-gray-900 hover:text-gray-700 text-xs font-medium flex items-center gap-1 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                              >
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
    </div>
  )
}

export default function LeadInformationPage() {
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
        <LeadInformationContent />
      </Suspense>
      <Footer />
    </div>
  )
}