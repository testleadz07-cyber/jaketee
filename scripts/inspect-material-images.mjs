import { readFile, writeFile } from 'node:fs/promises'
const manifestPath = 'output/imagegen/materials-colors/existing.json'
const images = JSON.parse(await readFile(manifestPath, 'utf8'))
for (const image of images) {
  try {
    const response = await fetch(image.url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const extension = response.headers.get('content-type')?.includes('png') ? 'png' : 'jpg'
    image.file = `output/imagegen/materials-colors/existing/${image.key}.${extension}`
    await writeFile(image.file, Buffer.from(await response.arrayBuffer()))
    delete image.error
  } catch (error) { image.error = error.message; delete image.file }
}
await writeFile(manifestPath, JSON.stringify(images, null, 2) + '\n')
console.log(JSON.stringify({ downloaded: images.filter(image => image.file).length, failed: images.filter(image => image.error).map(({ key, error }) => ({ key, error })) }))
