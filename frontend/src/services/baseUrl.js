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

export const API_BASE_URL = normalizeBaseUrl(
  readRuntimeBaseUrl() || readBuildTimeBaseUrl() || '/api'
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
