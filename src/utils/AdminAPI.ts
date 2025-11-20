// Admin API utility functions
const API_BASE = 'http://localhost:5000/api/admin'

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken')
  const headers: any = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text()
    console.error(`HTTP ${response.status}:`, errorText)
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    console.error('Invalid JSON response:', text)
    throw new Error('Invalid JSON response')
  }
}

export const AdminAPI = {
  // Resources
  createResource: async (formData: FormData) => {
    try {
      const response = await fetch(`${API_BASE}/resources`, {
        method: 'POST',
        body: formData
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('API not available:', error)
      return { error: 'API not available' }
    }
  },

  getResources: async () => {
    try {
      const response = await fetch(`${API_BASE}/resources`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('API not available:', error)
      return []
    }
  },

  getResource: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/resources/${id}`)
      return await handleResponse(response)
    } catch (error) {
      console.error('API not available:', error)
      return { error: 'API not available' }
    }
  },

  updateResource: async (id: string, data: any) => {
    try {
      const response = await fetch(`${API_BASE}/resources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('API not available:', error)
      return { error: 'API not available' }
    }
  },

  updateResourceWithFile: async (id: string, formData: FormData) => {
    try {
      const response = await fetch(`${API_BASE}/resources/${id}`, {
        method: 'PUT',
        body: formData
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('API not available:', error)
      return { error: 'API not available' }
    }
  },

  deleteResource: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/resources/${id}`, {
        method: 'DELETE'
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('API not available:', error)
      return { error: 'API not available' }
    }
  },

  // Community endpoints
  get: async (endpoint: string) => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Admin API GET error:', error)
      return { error: 'API not available', posts: [] }
    }
  },

  delete: async (endpoint: string) => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Admin API DELETE error:', error)
      return { error: 'API not available' }
    }
  }
}