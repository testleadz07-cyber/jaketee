import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/', name: 'Jacketee', short_name: 'Jacketee', start_url: '/', scope: '/',
    display: 'standalone', background_color: '#ffffff', theme_color: '#111111',
    icons: [
      { src: '/push-icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/push-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
