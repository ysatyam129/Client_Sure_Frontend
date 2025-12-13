// PDF Download Helper with proper blob handling

export const downloadPDF = async (url: string, filename: string): Promise<void> => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const blob = await response.blob()
    
    // Create download link
    const link = document.createElement('a')
    const objectUrl = URL.createObjectURL(blob)
    
    link.href = objectUrl
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
    
    // Append to body, click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up object URL
    URL.revokeObjectURL(objectUrl)
  } catch (error) {
    console.error('Download failed:', error)
    throw new Error('Failed to download PDF')
  }
}

export const downloadPDFWithFallback = async (
  resourceId: string, 
  filename: string, 
  fallbackUrl?: string
): Promise<void> => {
  try {
    // Try primary download method
    if (fallbackUrl) {
      await downloadPDF(fallbackUrl, filename)
    } else {
      throw new Error('No URL provided')
    }
  } catch (error) {
    // Fallback: open in new tab
    if (fallbackUrl) {
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
    } else {
      throw error
    }
  }
}

export const openPDFInNewTab = (url: string): void => {
  window.open(url, '_blank', 'noopener,noreferrer')
}