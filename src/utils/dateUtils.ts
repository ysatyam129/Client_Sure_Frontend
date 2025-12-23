/**
 * Date utility functions for consistent formatting across the application
 */

/**
 * Format date to DD/MM/YYYY format
 * @param dateString - Date string or Date object
 * @returns Formatted date string in DD/MM/YYYY format
 */
export const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return '-';
  }
};

/**
 * Format date to DD/MM/YYYY HH:MM format
 * @param dateString - Date string or Date object
 * @returns Formatted date string with time
 */
export const formatDateTime = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    return '-';
  }
};

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param dateString - Date string or Date object
 * @returns Formatted date string for input fields
 */
export const formatDateForInput = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    return '';
  }
};

/**
 * Get today's date in YYYY-MM-DD format for input fields
 * @returns Today's date string
 */
export const getTodayForInput = (): string => {
  return formatDateForInput(new Date());
};