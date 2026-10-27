import type { JacketView } from '@/types/jacket-customization'

const filenames: Record<JacketView, string> = {
  front: 'front.png', back: 'back.png', leftSleeve: 'left-sleeve.png', rightSleeve: 'right-sleeve.png',
}

// PNGs are already compressed. Store them in one ZIP without another library or
// multiple automatic downloads, which mobile browsers commonly block.
export function downloadDesignImages(previews: Array<{ view: JacketView; imageBase64: string }>, productName: string) {
  const folder = productName.normalize('NFKC').replace(/[^a-z0-9 -]/gi, '').replace(/\s+/g, ' ').trim().slice(0, 100) || 'Custom Design'
  const files: BlobPart[] = []
  const directory: BlobPart[] = []
  let offset = 0
  let directorySize = 0
  for (const preview of previews) {
    if (!preview.imageBase64.startsWith('data:image/png;base64,')) throw new Error('Invalid design preview')
    const data = Uint8Array.from(atob(preview.imageBase64.split(',')[1]), character => character.charCodeAt(0))
    const name = new TextEncoder().encode(`${folder}/${filenames[preview.view]}`)
    let crc = 0xffffffff
    for (const byte of data) {
      crc ^= byte
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
    crc = (crc ^ 0xffffffff) >>> 0
    const header = new ArrayBuffer(30)
    const local = new DataView(header)
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true)
    local.setUint16(12, 33, true) // DOS date: 1980-01-01.
    local.setUint32(14, crc, true)
    local.setUint32(18, data.length, true)
    local.setUint32(22, data.length, true)
    local.setUint16(26, name.length, true)
    files.push(header, name.buffer, data.buffer)

    const entry = new ArrayBuffer(46)
    const central = new DataView(entry)
    central.setUint32(0, 0x02014b50, true)
    central.setUint16(4, 20, true)
    central.setUint16(6, 20, true)
    central.setUint16(14, 33, true)
    central.setUint32(16, crc, true)
    central.setUint32(20, data.length, true)
    central.setUint32(24, data.length, true)
    central.setUint16(28, name.length, true)
    central.setUint32(42, offset, true)
    directory.push(entry, name.buffer)
    directorySize += 46 + name.length
    offset += 30 + name.length + data.length
  }
  if (!previews.length) throw new Error('No design previews available')
  const end = new ArrayBuffer(22)
  const record = new DataView(end)
  record.setUint32(0, 0x06054b50, true)
  record.setUint16(8, previews.length, true)
  record.setUint16(10, previews.length, true)
  record.setUint32(12, directorySize, true)
  record.setUint32(16, offset, true)
  const url = URL.createObjectURL(new Blob([...files, ...directory, end], { type: 'application/zip' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${folder}.zip`
  document.body.appendChild(link)
  try { link.click() }
  finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60_000) }
}
