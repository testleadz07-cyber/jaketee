import { ImageResponse } from 'next/og'

export const alt = 'Jacketee custom varsity and letterman jackets'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#111111',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          padding: '72px',
        }}
      >
        <div style={{ fontSize: 92, fontWeight: 800 }}>Jacketee</div>
        <div style={{ marginTop: 22, fontSize: 38, color: '#d4d4d8' }}>
          Custom varsity, letterman and team jackets
        </div>
        <div style={{ marginTop: 54, width: 180, height: 8, background: '#dc2626' }} />
      </div>
    ),
    size
  )
}
