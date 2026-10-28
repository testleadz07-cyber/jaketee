export async function uploadImage(
  file: File | Buffer,
  folder: string = 'luxestore',
  resourceType: 'image' | 'video' | 'auto' = 'image'
): Promise<{ url: string; publicId: string } | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret || cloudName === 'your_cloud_name') {
    console.log('Cloudinary not configured. Skipping upload.')
    return null
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    // Cloudinary signs alphabetically sorted non-file parameters plus the secret.
    // This is their SHA-1 protocol signature, not HMAC.
    const signed = new TextEncoder().encode(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    const digest = await crypto.subtle.digest('SHA-1', signed)
    const signature = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
    const body = new FormData()
    const blob = file instanceof File ? file : new Blob([new Uint8Array(file)])
    body.set('file', blob, file instanceof File ? file.name : 'upload.png')
    body.set('folder', folder)
    body.set('timestamp', timestamp)
    body.set('api_key', apiKey)
    body.set('signature', signature)
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`, {
      method: 'POST', body, signal: AbortSignal.timeout(60000),
    })
    if (!response.ok) { console.error('Cloudinary upload failed', response.status); return null }
    const result = await response.json() as { secure_url?: string; public_id?: string }
    return result.secure_url && result.public_id ? { url: result.secure_url, publicId: result.public_id } : null
  } catch { console.error('Cloudinary upload unavailable'); return null }
}
