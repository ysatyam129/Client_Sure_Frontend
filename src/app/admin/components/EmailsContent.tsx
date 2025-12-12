"use client"

import { useState, useEffect } from "react"
import { Mail, Eye, MousePointerClick, Send, XCircle, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { AdminAPI } from "@/utils/AdminAPI"

interface EmailFeedback {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
  }
  subject: string
  emailType: string
  totalRecipients: number
  successCount: number
  failedCount: number
  openedCount: number
  clickedCount: number
  sentAt: string
  openRate: string
  clickRate: string
}

interface Recipient {
  leadId: {
    name: string
    email: string
    category?: string
    city?: string
    country?: string
  }
  status: string
  opened: boolean
  clicked: boolean
  openedAt?: string
  clickedAt?: string
  openCount?: number
  clickCount?: number
  engagementStatus: string
}

interface EmailDetail {
  _id: string
  userId: {
    name: string
    email: string
  }
  subject: string
  emailType: string
  message: string
  totalRecipients: number
  successCount: number
  failedCount: number
  openedCount: number
  clickedCount: number
  sentAt: string
  recipients: Recipient[]
}

interface Stats {
  totalEmailCampaigns: number
  totalEmailsSent: number
  totalEmailsFailed: number
  totalEmailsOpened: number
  totalEmailsClicked: number
  openRate: string
  clickRate: string
}

export default function EmailsContent() {
  const [emails, setEmails] = useState<EmailFeedback[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    emailType: "",
    userName: "",
    startDate: "",
    endDate: ""
  })

  const loadStats = async () => {
    try {
      const data = await AdminAPI.getEmailStats()
      if (data) setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadEmails = async () => {
    try {
      setLoading(true)
      const { userName, ...backendFilters } = filters
      const params = {
        page: currentPage.toString(),
        limit: "20",
        ...Object.fromEntries(Object.entries(backendFilters).filter(([_, v]) => v))
      }

      const data = await AdminAPI.getEmails(params)
      let filteredEmails = data.emailFeedbacks || []
      
      if (userName) {
        filteredEmails = filteredEmails.filter(email => 
          email.userId.name.toLowerCase().includes(userName.toLowerCase())
        )
      }
      
      setEmails(filteredEmails)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error loading emails:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEmailDetail = async (id: string) => {
    try {
      const data = await AdminAPI.getEmailById(id)
      if (!data.error) setSelectedEmail(data)
    } catch (error) {
      console.error('Error loading email detail:', error)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    loadEmails()
  }, [currentPage, filters])

  if (selectedEmail) {
    return (
      <div className="p-8">
        <button
          onClick={() => setSelectedEmail(null)}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Emails
        </button>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6 text-black">
          <h2 className="text-2xl font-bold mb-4">{selectedEmail.subject}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Sent By</p>
              <p className="font-medium">{selectedEmail.userId.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium capitalize">{selectedEmail.emailType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sent At</p>
              <p className="font-medium">{new Date(selectedEmail.sentAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Recipients</p>
              <p className="font-medium">{selectedEmail.totalRecipients}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-black">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Sent</p>
              <p className="text-2xl font-bold text-green-600">{selectedEmail.successCount}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Opened</p>
              <p className="text-2xl font-bold text-blue-600">{selectedEmail.openedCount}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Clicked</p>
              <p className="text-2xl font-bold text-purple-600">{selectedEmail.clickedCount}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{selectedEmail.failedCount}</p>
            </div>
          </div>

          <div className="mb-6 text-black">
            <h3 className="font-semibold mb-2">Message</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="whitespace-pre-wrap">{selectedEmail.message}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden text-black">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold">Recipients ({selectedEmail.recipients.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opens</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedEmail.recipients.map((recipient, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{recipient.leadId.name}</p>
                        <p className="text-sm text-gray-600">{recipient.leadId.email}</p>
                        {recipient.leadId.city && (
                          <p className="text-xs text-gray-500">{recipient.leadId.city}, {recipient.leadId.country}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        recipient.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {recipient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        recipient.engagementStatus === 'clicked' ? 'bg-purple-100 text-purple-700' :
                        recipient.engagementStatus === 'opened' ? 'bg-blue-100 text-blue-700' :
                        recipient.engagementStatus === 'sent' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {recipient.engagementStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{recipient.openCount || 0}</span>
                      {recipient.openedAt && (
                        <p className="text-xs text-gray-500">{new Date(recipient.openedAt).toLocaleString()}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{recipient.clickCount || 0}</span>
                      {recipient.clickedAt && (
                        <p className="text-xs text-gray-500">{new Date(recipient.clickedAt).toLocaleString()}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 text-black">
      <div className="bg-white border-l-4 border-blue-600 rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Email Management</h2>
            <p className="text-gray-600">Track emails sent to leads</p>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 text-black">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalEmailCampaigns}</h3>
                <p className="text-gray-600 text-sm">Campaigns</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <Send className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalEmailsSent}</h3>
                <p className="text-gray-600 text-sm">Sent</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <Eye className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalEmailsOpened}</h3>
                <p className="text-gray-600 text-sm">Opened ({stats.openRate}%)</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <MousePointerClick className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalEmailsClicked}</h3>
                <p className="text-gray-600 text-sm">Clicked ({stats.clickRate}%)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden text-black">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Campaigns</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search by User Name"
              value={filters.userName}
              onChange={(e) => setFilters({...filters, userName: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filters.emailType}
              onChange={(e) => setFilters({...filters, emailType: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="bulk">Bulk</option>
              <option value="individual">Individual</option>
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opened</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicked</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    Loading emails...
                  </td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No emails found
                  </td>
                </tr>
              ) : (
                emails.map((email) => (
                  <tr key={email._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{email.userId.name}</p>
                        <p className="text-sm text-gray-600">{email.userId.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{email.subject}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                        {email.emailType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{email.totalRecipients}</td>
                    <td className="px-6 py-4">
                      <span className="text-green-600 font-medium">{email.successCount}</span>
                      {email.failedCount > 0 && (
                        <span className="text-red-600 text-sm ml-1">({email.failedCount} failed)</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{email.openedCount}</span>
                      <span className="text-xs text-gray-500 ml-1">({email.openRate}%)</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{email.clickedCount}</span>
                      <span className="text-xs text-gray-500 ml-1">({email.clickRate}%)</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(email.sentAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => loadEmailDetail(email._id)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-6 border-t flex items-center justify-between text-black">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
