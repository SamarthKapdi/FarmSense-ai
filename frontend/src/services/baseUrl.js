const PROD_BACKEND_URL = 'https://farmsense-ai-backend.onrender.com/api'

const normalizeBaseUrl = (value) => {
  if (!value) return ''
  return value.trim().replace(/\/+$/, '')
}

const readRuntimeBaseUrl = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  const runtimeConfig =
    window.__APP_CONFIG__?.API_BASE_URL ||
    window.__ENV__?.API_BASE_URL ||
    window.__VITE_API_BASE_URL__

  return normalizeBaseUrl(runtimeConfig)
}

const readBuildTimeBaseUrl = () => {
  if (typeof process === 'undefined' || !process.env) {
    return ''
  }

  return normalizeBaseUrl(
    process.env.REACT_APP_API_BASE_URL || process.env.VITE_API_BASE_URL
  )
}

const detectProductionBackend = () => {
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname
    if (host.includes('vercel.app') || host.includes('farmsense')) {
      return PROD_BACKEND_URL
    }
  }
  return ''
}

export const API_BASE_URL = normalizeBaseUrl(
  readRuntimeBaseUrl() || readBuildTimeBaseUrl() || detectProductionBackend() || '/api'
)




export const apiUrl = (path = '') => {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${suffix}`
}

export const safeJson = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (e) {
    return { message: 'Invalid response from server' };
  }
}
