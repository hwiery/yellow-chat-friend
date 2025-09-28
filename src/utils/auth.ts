/**
 * Authentication utilities for handling OAuth callbacks and error states
 */

export interface AuthError {
  error: string
  error_code: string
  error_description: string
}

/**
 * Parse URL parameters for authentication errors
 */
export const parseAuthError = (): AuthError | null => {
  if (typeof window === 'undefined') return null

  const urlParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))

  const error = urlParams.get('error') || hashParams.get('error')
  const errorCode = urlParams.get('error_code') || hashParams.get('error_code')
  const errorDescription = urlParams.get('error_description') || hashParams.get('error_description')

  if (error && errorCode && errorDescription) {
    return {
      error,
      error_code: errorCode,
      error_description: decodeURIComponent(errorDescription)
    }
  }

  return null
}

/**
 * Clear authentication error parameters from URL
 */
export const clearAuthErrorFromUrl = () => {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)

  // Remove error parameters from search
  url.searchParams.delete('error')
  url.searchParams.delete('error_code')
  url.searchParams.delete('error_description')

  // Remove error parameters from hash
  const hashParams = new URLSearchParams(url.hash.replace('#', ''))
  hashParams.delete('error')
  hashParams.delete('error_code')
  hashParams.delete('error_description')

  // Update URL without page reload
  const newHash = hashParams.toString()
  url.hash = newHash ? `#${newHash}` : ''

  window.history.replaceState({}, document.title, url.toString())
}

/**
 * Check if current URL has authentication error parameters
 */
export const hasAuthError = (): boolean => {
  return parseAuthError() !== null
}

/**
 * Get user-friendly error message for authentication errors
 */
export const getAuthErrorMessage = (authError: AuthError): string => {
  switch (authError.error_code) {
    case 'unexpected_failure':
      if (authError.error_description.includes('Database error saving new user')) {
        return '계정 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      }
      return '예상치 못한 오류가 발생했습니다. 다시 시도해주세요.'
    case 'access_denied':
      return '인증이 거부되었습니다. Google 계정 접근을 허용해주세요.'
    case 'server_error':
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    default:
      return `인증 오류: ${authError.error_description}`
  }
}