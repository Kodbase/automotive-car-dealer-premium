export async function apiRequest(url, options = {}) {
  const { method = 'GET', body } = options

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(url, config)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Bir hata oluştu')
  }

  return data
}