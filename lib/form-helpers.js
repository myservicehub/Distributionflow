/**
 * Form Helper Utilities for Duplicate Detection
 * Provides reusable functions for Parts 4-6 implementation
 */

/**
 * Handle API submission with duplicate detection
 * @param {string} url - API endpoint
 * @param {string} method - HTTP method
 * @param {object} data - Request body
 * @param {object} callbacks - Success and error callbacks
 * @returns {Promise<void>}
 */
export async function handleFormSubmit(url, method, data, callbacks = {}) {
  const {
    onSuccess,
    onError,
    onDuplicateError,
    setSubmitting,
    setFieldErrors,
  } = callbacks

  try {
    if (setSubmitting) setSubmitting(true)
    if (setFieldErrors) setFieldErrors({})

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()

      // Handle duplicate errors (409)
      if (response.status === 409 && error.field) {
        if (setFieldErrors) {
          setFieldErrors({ [error.field]: error.message || error.error })
        }

        if (onDuplicateError) {
          onDuplicateError(error)
        }

        // Auto-focus the problematic field
        setTimeout(() => {
          const errorField = document.getElementById(error.field)
          if (errorField) {
            errorField.focus()
            errorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)

        throw new Error(error.message || error.error)
      }

      throw new Error(error.error || error.message || 'Operation failed')
    }

    const result = await response.json()
    if (onSuccess) onSuccess(result)

    return result
  } catch (error) {
    if (onError) onError(error)
    throw error
  } finally {
    if (setSubmitting) setSubmitting(false)
  }
}

/**
 * Get input field class names with error styling
 * @param {string} fieldName - Field name
 * @param {object} fieldErrors - Object containing field errors
 * @param {string} baseClassName - Base CSS classes
 * @returns {string}
 */
export function getInputClassName(fieldName, fieldErrors = {}, baseClassName = '') {
  const hasError = fieldErrors[fieldName]
  const errorClass = hasError ? 'border-red-500 focus:ring-red-500 ring-red-200' : ''
  return `${baseClassName} ${errorClass}`.trim()
}

/**
 * Render field error message
 * @param {string} fieldName - Field name
 * @param {object} fieldErrors - Object containing field errors
 * @returns {JSX.Element|null}
 */
export function FieldError({ fieldName, fieldErrors = {} }) {
  const error = fieldErrors[fieldName]
  if (!error) return null

  return (
    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
      <span className="font-medium">⚠️</span>
      {error}
    </p>
  )
}

/**
 * Clear specific field error when user types
 * @param {string} fieldName - Field name
 * @param {object} fieldErrors - Current field errors
 * @param {Function} setFieldErrors - State setter
 */
export function clearFieldError(fieldName, fieldErrors, setFieldErrors) {
  if (fieldErrors[fieldName]) {
    const newErrors = { ...fieldErrors }
    delete newErrors[fieldName]
    setFieldErrors(newErrors)
  }
}

/**
 * Loading button content
 * @param {boolean} isLoading - Loading state
 * @param {string} loadingText - Text to show when loading
 * @param {string} normalText - Text to show normally
 * @returns {JSX.Element}
 */
export function LoadingButton({ isLoading, loadingText, normalText, className = '' }) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className={`${className} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
          {loadingText}
        </span>
      ) : (
        normalText
      )}
    </button>
  )
}

/**
 * Enhanced onChange handler that clears field errors
 * @param {Function} setFormData - Form data state setter
 * @param {object} formData - Current form data
 * @param {string} fieldName - Field to update
 * @param {any} value - New value
 * @param {object} fieldErrors - Current field errors
 * @param {Function} setFieldErrors - Field errors state setter
 */
export function handleFieldChange(
  setFormData,
  formData,
  fieldName,
  value,
  fieldErrors = {},
  setFieldErrors = null
) {
  setFormData({ ...formData, [fieldName]: value })
  
  if (setFieldErrors && fieldErrors[fieldName]) {
    clearFieldError(fieldName, fieldErrors, setFieldErrors)
  }
}
