import { apiUrl } from './baseUrl'
const BASE_URL = apiUrl('/agronomist')

const getAuthHeaders = () => {
  const token = localStorage.getItem('farmsense_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const getDiseaseTrends = async () => {
  const response = await fetch(`${BASE_URL}/disease-trends`, {
    headers: getAuthHeaders(),
  })
  const data = await response.json()
  if (!response.ok)
    throw new Error(data.message || 'Failed to fetch disease trends')
  return data.data
}

export const getPendingVerifications = async () => {
  const response = await fetch(`${BASE_URL}/pending-verifications`, {
    headers: getAuthHeaders(),
  })
  const data = await response.json()
  if (!response.ok)
    throw new Error(data.message || 'Failed to fetch pending verifications')
  return data.data
}

export const verifyDiagnosis = async (reportId, correctDisease, notes) => {
  const response = await fetch(`${BASE_URL}/verify/${reportId}`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ correctDisease, notes }),
  })
  const data = await response.json()
  if (!response.ok)
    throw new Error(data.message || 'Failed to verify diagnosis')
  return data.data
}

export const publishAdvisory = async (advisory) => {
  const response = await fetch(`${BASE_URL}/advisory`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(advisory),
  })
  const data = await response.json()
  if (!response.ok)
    throw new Error(data.message || 'Failed to publish advisory')
  return data.data
}

export const getAdvisories = async () => {
  const response = await fetch(`${BASE_URL}/advisories`, {
    headers: getAuthHeaders(),
  })
  const data = await response.json()
  if (!response.ok)
    throw new Error(data.message || 'Failed to fetch advisories')
  return data.data
}
