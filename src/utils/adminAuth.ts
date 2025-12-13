export const checkAdminAuth = (): boolean => {
  if (typeof window === 'undefined') return false
  
  const adminToken = localStorage.getItem('adminToken')
  if (!adminToken) {
    console.error('No admin token found - redirecting to login')
    window.location.href = '/auth/admin/login'
    return false
  }
  
  return true
}

export const handleAdminAuthError = (error: any): void => {
  if (error.response?.status === 403 || error.response?.status === 401) {
    console.error('Admin access denied - clearing token and redirecting')
    localStorage.removeItem('adminToken')
    localStorage.removeItem('user')
    window.location.href = '/auth/admin/login'
  }
}

export const getAdminToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('adminToken')
}