"use client"

import { useState, useEffect, useMemo } from "react"
import AdminSidebar from "../components/AdminSidebar"
import Axios from "@/utils/Axios"
import { Upload, Search, Trash2, Edit, Eye, X, Filter, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface Lead {
  _id: string
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
  updatedAt?: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLeads, setTotalLeads] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [limit] = useState(100)
  const [viewLead, setViewLead] = useState<Lead | null>(null)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [editForm, setEditForm] = useState<Partial<Lead>>({})
  const [filterCity, setFilterCity] = useState("")
  const [filterCountry, setFilterCountry] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [showDuplicates, setShowDuplicates] = useState(false)

  const loadLeads = async () => {
    setLoading(true)
    try {
      const response = await Axios.get(`/admin/leads?page=${page}&limit=${limit}`)
      setLeads(response.data.leads)
      setTotalPages(response.data.pagination.totalPages)
      setTotalLeads(response.data.pagination.totalItems)
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const cities = useMemo(() => [...new Set(leads.map(l => l.city).filter(Boolean))].sort(), [leads])
  const countries = useMemo(() => [...new Set(leads.map(l => l.country).filter(Boolean))].sort(), [leads])
  const categories = useMemo(() => [...new Set(leads.map(l => l.category).filter(Boolean))].sort(), [leads])

  const duplicates = useMemo(() => {
    const emailMap = new Map<string, Lead[]>()
    leads.forEach(lead => {
      if (lead.email) {
        if (!emailMap.has(lead.email)) emailMap.set(lead.email, [])
        emailMap.get(lead.email)!.push(lead)
      }
    })
    return Array.from(emailMap.values()).filter(group => group.length > 1).flat().map(l => l._id)
  }, [leads])

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchSearch = !searchTerm || 
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchCity = !filterCity || lead.city === filterCity
      const matchCountry = !filterCountry || lead.country === filterCountry
      const matchCategory = !filterCategory || lead.category === filterCategory
      const matchDuplicate = !showDuplicates || duplicates.includes(lead._id)
      return matchSearch && matchCity && matchCountry && matchCategory && matchDuplicate
    })
  }, [leads, searchTerm, filterCity, filterCountry, filterCategory, showDuplicates, duplicates])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file')
      e.target.value = ''
      return
    }
    const formData = new FormData()
    formData.append('file', file)
    setUploading(true)
    try {
      const response = await Axios.post('/admin/leads/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success(response.data.message)
      e.target.value = ''
      setPage(1)
      loadLeads()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Upload failed')
      e.target.value = ''
    } finally {
      setUploading(false)
    }
  }

  const handleViewLead = async (id: string) => {
    try {
      const response = await Axios.get(`/admin/get-lead/${id}`)
      console.log("view lead",response.data)
      setViewLead(response.data)
    } catch (error: any) {
      toast.error('Failed to load lead')
    }
  }

  const handleEditLead = (lead: Lead) => {
    setEditLead(lead)
    setEditForm(lead)
  }

  const handleUpdateLead = async () => {
    if (!editLead) return
    try {
      await Axios.put(`/admin/update-leads/${editLead._id}`, editForm)
      toast.success('Lead updated')
      setEditLead(null)
      loadLeads()
    } catch (error: any) {
      toast.error('Update failed')
    }
  }

  const deleteLead = async (id: string) => {
    if (!confirm('Delete this lead?')) return
    try {
      await Axios.delete(`/admin/leads/${id}`)
      toast.success('Lead deleted')
      loadLeads()
    } catch (error: any) {
      toast.error('Delete failed')
    }
  }

  useEffect(() => {
    loadLeads()
  }, [page])

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      
      {uploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-lg font-semibold text-gray-900">Uploading leads...</p>
          </div>
        </div>
      )}
      
      <div className="flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Leads Management</h2>
            <p className="text-sm text-gray-600 mt-1">Total: {totalLeads.toLocaleString()} | Showing: {filteredLeads.length}</p>
          </div>
          <label className="bg-gray-900 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-800 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Excel
            <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" disabled={uploading} />
          </label>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400" />
            </div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900">
              <option value="">All Categories</option>
              {categories.map(category => <option key={category} value={category}>{category}</option>)}
            </select>
            <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900">
              <option value="">All Cities</option>
              {cities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
            <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900">
              <option value="">All Countries</option>
              {countries.map(country => <option key={country} value={country}>{country}</option>)}
            </select>
            <button onClick={() => setShowDuplicates(!showDuplicates)} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${showDuplicates ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-gray-100 text-gray-700 border border-gray-300'}`}>
              <AlertTriangle className="w-4 h-4" />
              Duplicates ({duplicates.length})
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {totalPages > 1 && (
            <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50">
              <div className="flex gap-2">
                <button onClick={() => setPage(1)} disabled={page === 1} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border rounded hover:bg-gray-50 disabled:opacity-50">First</button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border rounded hover:bg-gray-50 disabled:opacity-50">Prev</button>
              </div>
              <span className="text-sm text-gray-700">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border rounded hover:bg-gray-50 disabled:opacity-50">Next</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border rounded hover:bg-gray-50 disabled:opacity-50">Last</button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center"><div className="flex flex-col items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div><p className="text-sm text-gray-500">Loading...</p></div></td></tr>
                ) : filteredLeads.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">No leads found</td></tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead._id} className={`hover:bg-gray-50 ${duplicates.includes(lead._id) ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-3 text-sm text-gray-900">{lead.leadId}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 flex items-center gap-2">
                        {lead.name}
                        {duplicates.includes(lead._id) && <AlertTriangle className="w-4 h-4 text-red-600" />}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lead.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lead.phone || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lead.city ? `${lead.city}, ${lead.country}` : '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleViewLead(lead._id)} className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleEditLead(lead)} className="text-gray-600 hover:text-gray-800"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => deleteLead(lead._id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {viewLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between">
              <h3 className="text-lg font-semibold">Lead Details</h3>
              <button onClick={() => setViewLead(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div><span className="text-sm font-medium text-gray-500">Lead ID</span><p className="text-sm text-gray-900 mt-1">{viewLead.leadId}</p></div>
              <div><span className="text-sm font-medium text-gray-500">Name</span><p className="text-sm text-gray-900 mt-1">{viewLead.name}</p></div>
              <div><span className="text-sm font-medium text-gray-500">Email</span><p className="text-sm text-gray-900 mt-1">{viewLead.email}</p></div>
              <div><span className="text-sm font-medium text-gray-500">Phone</span><p className="text-sm text-gray-900 mt-1">{viewLead.phone || '-'}</p></div>
              {viewLead.category && <div><span className="text-sm font-medium text-gray-500">Category</span><p className="text-sm text-gray-900 mt-1">{viewLead.category}</p></div>}
              <div><span className="text-sm font-medium text-gray-500">City</span><p className="text-sm text-gray-900 mt-1">{viewLead.city || '-'}</p></div>
              <div><span className="text-sm font-medium text-gray-500">Country</span><p className="text-sm text-gray-900 mt-1">{viewLead.country || '-'}</p></div>
              <div className="col-span-2"><span className="text-sm font-medium text-gray-500">Address</span><p className="text-sm text-gray-900 mt-1">{viewLead.addressStreet || '-'}</p></div>
              <div className="col-span-2"><span className="text-sm font-medium text-gray-500">LinkedIn</span><p className="text-sm text-gray-900 mt-1 break-all">{viewLead.linkedin || '-'}</p></div>
              <div className="col-span-2"><span className="text-sm font-medium text-gray-500">Website</span><p className="text-sm text-gray-900 mt-1 break-all">{viewLead.websiteLink || '-'}</p></div>
              <div className="col-span-2"><span className="text-sm font-medium text-gray-500">Facebook</span><p className="text-sm text-gray-900 mt-1 break-all">{viewLead.facebookLink || '-'}</p></div>
              <div><span className="text-sm font-medium text-gray-500">Instagram</span><p className="text-sm text-gray-900 mt-1">{viewLead.instagram || '-'}</p></div>
              <div><span className="text-sm font-medium text-gray-500">Google Maps</span><p className="text-sm text-gray-900 mt-1 break-all">{viewLead.googleMapLink || '-'}</p></div>
              {viewLead.lastVerifiedAt && <div><span className="text-sm font-medium text-gray-500">Last Verified</span><p className="text-sm text-gray-900 mt-1">{new Date(viewLead.lastVerifiedAt).toLocaleDateString()}</p></div>}
              {viewLead.updatedAt && <div><span className="text-sm font-medium text-gray-500">Updated At</span><p className="text-sm text-gray-900 mt-1">{new Date(viewLead.updatedAt).toLocaleString()}</p></div>}
            </div>
          </div>
        </div>
      )}

      {editLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between">
              <h3 className="text-lg font-semibold">Edit Lead</h3>
              <button onClick={() => setEditLead(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-gray-700">Name</label><input type="text" value={editForm.name || ''} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm text-gray-900" /></div>
              <div><label className="text-sm font-medium text-gray-700">Email</label><input type="email" value={editForm.email || ''} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm text-gray-900" /></div>
              <div><label className="text-sm font-medium text-gray-700">Phone</label><input type="text" value={editForm.phone || ''} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm text-gray-900" /></div>
              <div><label className="text-sm font-medium text-gray-700">Category</label><input type="text" value={editForm.category || ''} onChange={(e) => setEditForm({...editForm, category: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm text-gray-900" /></div>
              <div><label className="text-sm font-medium text-gray-700">City</label><input type="text" value={editForm.city || ''} onChange={(e) => setEditForm({...editForm, city: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm text-gray-900" /></div>
              <div><label className="text-sm font-medium text-gray-700">Country</label><input type="text" value={editForm.country || ''} onChange={(e) => setEditForm({...editForm, country: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm text-gray-900" /></div>
              <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Address</label><input type="text" value={editForm.addressStreet || ''} onChange={(e) => setEditForm({...editForm, addressStreet: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm text-gray-900" /></div>
              <div className="col-span-2"><label className="text-sm font-medium text-gray-700">LinkedIn</label><input type="text" value={editForm.linkedin || ''} onChange={(e) => setEditForm({...editForm, linkedin: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm text-gray-900" /></div>
              <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Website</label><input type="text" value={editForm.websiteLink || ''} onChange={(e) => setEditForm({...editForm, websiteLink: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm text-gray-900" /></div>
              <div className="col-span-2"><label className="text-sm font-medium text-gray-700">Facebook</label><input type="text" value={editForm.facebookLink || ''} onChange={(e) => setEditForm({...editForm, facebookLink: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm text-gray-900" /></div>
              <div><label className="text-sm font-medium text-gray-700">Instagram</label><input type="text" value={editForm.instagram || ''} onChange={(e) => setEditForm({...editForm, instagram: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm text-gray-900" /></div>
              <div><label className="text-sm font-medium text-gray-700">Google Maps</label><input type="text" value={editForm.googleMapLink || ''} onChange={(e) => setEditForm({...editForm, googleMapLink: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded-lg text-sm text-gray-900" /></div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setEditLead(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpdateLead} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
