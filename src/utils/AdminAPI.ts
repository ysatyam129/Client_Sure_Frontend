// Admin API utility functions
const API_BASE =  "https://client-sure-backend.vercel.app/api/admin";
// const API_BASE =  "http://localhost:5000/api/admin";

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken')
  const headers: any = {
    'Content-Type': 'application/json'
  }
  if (token) {
    
    headers['authorization'] = `Bearer ${token}` 
  }
  return headers
}


const handleResponse = async (response: Response) => {
  const text = await response.text()
  
  if (!response.ok) {
    console.error(`HTTP ${response.status}:`, text)
    
    // Try to parse error as JSON to get detailed error info
    try {
      const errorData = JSON.parse(text)
      if (errorData.error) {
        throw new Error(errorData.error)
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    } catch (parseError) {
      // If JSON parsing fails, check if it's the specific error we're looking for
      if (text.includes('User already has active prize tokens')) {
        throw new Error('User already has active prize tokens')
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  }
  
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
  },

  // Prize Token Management
  awardPrizeTokens: async (userId: string, tokenAmount: number, prizeType: string) => {
    try {
      const response = await fetch(`${API_BASE}/award-prize-tokens`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          userId,
          tokenAmount,
          prizeType
        })
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Award prize tokens error:', error)
      return { success: false, error: 'API not available' }
    }
  },

  getUserTokenStatus: async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/user/${userId}/token-status`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Get user token status error:', error)
      return { success: false, error: 'API not available' }
    }
  },

  // Email Management
  getEmails: async (params?: any) => {
    try {
      const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
      const response = await fetch(`${API_BASE}/emails${queryString}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Get emails error:', error)
      return { emailFeedbacks: [], pagination: {} }
    }
  },

  getEmailById: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/emails/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Get email by id error:', error)
      return { error: 'API not available' }
    }
  },

  getEmailStats: async () => {
    try {
      const response = await fetch(`${API_BASE}/emails/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Get email stats error:', error)
      return null
    }
  },

  post: async (endpoint: string, data: any) => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data)
      })
      return await handleResponse(response)
    } catch (error) {
      console.error('Admin API POST error:', error)
      return { error: 'API not available' }
    }
  }
}