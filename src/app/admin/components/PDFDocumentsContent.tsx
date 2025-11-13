"use client"

import { useState, useEffect } from "react"
import Axios from "@/utils/Axios"

interface PDFDocument {
  id: string
  title: string
  description: string
  url: string
  createdAt: string
  isActive: boolean
}

export default function PDFDocumentsContent() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [documents, setDocuments] = useState<PDFDocument[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    file: null as File | null
  })
  const [editingDoc, setEditingDoc] = useState<PDFDocument | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.file) return

    setIsLoading(true)
    const submitData = new FormData()
    submitData.append('title', formData.title)
    submitData.append('description', formData.description)
    submitData.append('type', 'pdf')
    submitData.append('file', formData.file)

    try {
      const response = await Axios.post('/admin/resources', submitData)
      if (response.data) {
        setFormData({ title: "", description: "", file: null })
        setShowAddForm(false)
        loadDocuments()
      }
    } catch (error) {
      console.error('Error uploading PDF:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDocuments = async () => {
    try {
      const response = await Axios.get('/admin/resources')
      const pdfDocs = response.data.filter((doc: any) => doc.type === 'pdf').map((doc: any) => ({
        ...doc,
        id: doc._id || doc.id
      }))
      setDocuments(pdfDocs)
    } catch (error) {
      console.error('Error loading documents:', error)
      setDocuments([])
    }
  }

  const toggleStatus = async (id: string, isActive: boolean) => {
    try {
      await Axios.put(`/admin/resources/${id}`, { isActive: !isActive })
      loadDocuments()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const editDocument = (doc: PDFDocument) => {
    setEditingDoc(doc)
    setFormData({
      title: doc.title,
      description: doc.description,
      file: null
    })
    setShowAddForm(true)
  }

  const updateDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDoc) return

    setIsLoading(true)
    try {
      if (formData.file) {
        const submitData = new FormData()
        submitData.append('title', formData.title)
        submitData.append('description', formData.description)
        submitData.append('file', formData.file)
        await Axios.put(`/admin/resources/${editingDoc.id}`, submitData)
      } else {
        await Axios.put(`/admin/resources/${editingDoc.id}`, {
          title: formData.title,
          description: formData.description
        })
      }
      setFormData({ title: "", description: "", file: null })
      setEditingDoc(null)
      setShowAddForm(false)
      loadDocuments()
    } catch (error) {
      console.error('Error updating document:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const cancelEdit = () => {
    setEditingDoc(null)
    setFormData({ title: "", description: "", file: null })
    setShowAddForm(false)
  }

  const deleteDocument = async (id: string) => {
    console.log('Deleting resource with ID:', id)
    if (!confirm('Are you sure you want to delete this document?')) return
    
    try {
      await Axios.delete(`/admin/resources/${id}`)
      loadDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  return (
    <div className="p-8">
      <div className="bg-white border-l-4 border-blue-600 rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">PDF Documents</h2>
            <p className="text-gray-600">Manage PDF documents and study materials</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Documents ({documents.length})</h3>
        <button
          onClick={() => editingDoc ? cancelEdit() : setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {showAddForm ? 'Cancel' : '+ Add PDF'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">{editingDoc ? 'Edit PDF Document' : 'Upload PDF Document'}</h4>
          <form onSubmit={editingDoc ? updateDocument : handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-2">PDF File</label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded-lg text-black"
                required={!editingDoc}
              />
              {editingDoc && <p className="text-sm text-gray-500 mt-1">Leave empty to keep current file</p>}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {isLoading ? (editingDoc ? 'Updating...' : 'Uploading...') : (editingDoc ? 'Update PDF' : 'Upload PDF')}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm">
        {documents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600">No PDF documents uploaded yet</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add PDF" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {documents.map((doc) => (
              <div key={doc.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {/* PDF Preview */}
                <div className="relative h-48 bg-gray-100">
                  {doc.url ? (
                    <iframe
                      src={`${doc.url}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-full border-0"
                      title={doc.title}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => toggleStatus(doc.id, doc.isActive)}
                      className={`px-2 py-1 rounded-full text-xs font-medium shadow-lg ${
                        doc.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}
                    >
                      {doc.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2 line-clamp-1">{doc.title}</h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.description}</p>
                  
                  <div className="flex items-center justify-end mb-3">
                    <span className="text-xs text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => editDocument(doc)}
                      className="flex-1 text-blue-600 hover:text-blue-800 text-sm font-medium py-2 px-3 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteDocument(doc.id)}
                      className="flex-1 text-red-600 hover:text-red-800 text-sm font-medium py-2 px-3 border border-red-200 rounded hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}