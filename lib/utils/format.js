/**
 * Shared formatting utilities for DistributionFlow
 * Consolidates duplicated helper functions across the application
 */

/**
 * Format a number as Nigerian Naira currency
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted currency string (e.g. "₦1,234")
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)
}

/**
 * Format a date string to a readable local date
 * @param {string|Date} dateString - The date to format
 * @returns {string} Formatted date string (e.g. "12 Jun 2026")
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Return a human-readable time-ago string
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Human-readable time ago (e.g. "3 hours ago")
 */
export const getTimeAgo = (timestamp) => {
  if (!timestamp) return 'N/A'
  
  const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
  
  // For dates older than a week, show the actual date
  return formatDate(timestamp)
}

/**
 * Format a phone number for display
 * @param {string} phone - The phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return 'N/A'
  // Simple Nigerian phone formatting: +234 XXX XXX XXXX
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }
  if (cleaned.length === 13 && cleaned.startsWith('234')) {
    return `+234 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`
  }
  return phone
}

/**
 * Truncate text to a maximum length with ellipsis
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if needed
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}
