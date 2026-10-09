export type Range = [number, number]
export type Unit = 'in' | 'cm'

interface BodyRow {
  size: string
  chest: Range
  waist: Range
  sleeve: Range
  back: number
}

interface JacketRow {
  size: string
  chestFlat: number
  sleeve: number
  shoulder: number
  halfShoulder: number
  back: number
}

export const bodyRows: BodyRow[] = [
  { size: 'XXS', chest: [28, 30], waist: [20, 22], sleeve: [28, 29], back: 23 },
  { size: 'XS', chest: [30, 32], waist: [24, 26], sleeve: [30, 31], back: 24 },
  { size: 'S', chest: [34, 36], waist: [28, 30], sleeve: [31, 32], back: 25 },
  { size: 'M', chest: [38, 38], waist: [32, 32], sleeve: [32, 32], back: 26.5 },
  { size: 'M/Tall', chest: [38, 38], waist: [32, 32], sleeve: [33, 34], back: 28 },
  { size: 'L', chest: [40, 42], waist: [34, 36], sleeve: [33, 34], back: 27.5 },
  { size: 'L/Tall', chest: [40, 42], waist: [34, 36], sleeve: [35, 36], back: 29 },
  { size: 'XL', chest: [44, 46], waist: [38, 40], sleeve: [34, 35], back: 28.5 },
  { size: 'XL/Tall', chest: [44, 46], waist: [38, 40], sleeve: [36, 36], back: 30 },
  { size: '2XL', chest: [48, 50], waist: [42, 44], sleeve: [35, 36], back: 29.5 },
  { size: '2XL/Tall', chest: [48, 50], waist: [42, 44], sleeve: [37, 37], back: 31 },
  { size: '3XL', chest: [52, 54], waist: [46, 48], sleeve: [36, 37], back: 30.5 },
  { size: '4XL', chest: [56, 58], waist: [50, 52], sleeve: [37, 38], back: 31.5 },
  { size: '5XL', chest: [60, 62], waist: [54, 56], sleeve: [38, 39], back: 32.5 },
  { size: '6XL', chest: [64, 66], waist: [58, 60], sleeve: [39, 40], back: 33.5 },
]
export const jacketRows: JacketRow[] = [
  { size: 'XXS', chestFlat: 18, sleeve: 24, shoulder: 16, halfShoulder: 6, back: 23 },
  { size: 'XS', chestFlat: 20, sleeve: 24.5, shoulder: 17, halfShoulder: 6.25, back: 24 },
  { size: 'S', chestFlat: 22, sleeve: 25, shoulder: 18, halfShoulder: 6.5, back: 25 },
  { size: 'M', chestFlat: 24, sleeve: 25.5, shoulder: 19, halfShoulder: 6.75, back: 26.5 },
  { size: 'M/Tall', chestFlat: 24, sleeve: 27, shoulder: 19, halfShoulder: 6.75, back: 28 },
  { size: 'L', chestFlat: 26, sleeve: 26, shoulder: 20, halfShoulder: 7, back: 27.5 },
  { size: 'L/Tall', chestFlat: 26, sleeve: 27.5, shoulder: 20, halfShoulder: 7, back: 29 },
  { size: 'XL', chestFlat: 28, sleeve: 26.5, shoulder: 21, halfShoulder: 7.25, back: 28.5 },
  { size: 'XL/Tall', chestFlat: 28, sleeve: 28, shoulder: 21, halfShoulder: 7.25, back: 30 },
  { size: '2XL', chestFlat: 30, sleeve: 27, shoulder: 22, halfShoulder: 7.5, back: 29.5 },
  { size: '2XL/Tall', chestFlat: 30, sleeve: 28.5, shoulder: 22, halfShoulder: 7.5, back: 31 },
  { size: '3XL', chestFlat: 32, sleeve: 27.5, shoulder: 23, halfShoulder: 7.75, back: 30.5 },
  { size: '4XL', chestFlat: 34, sleeve: 28, shoulder: 24, halfShoulder: 8, back: 31.5 },
  { size: '5XL', chestFlat: 36, sleeve: 28.5, shoulder: 25, halfShoulder: 8.25, back: 32.5 },
  { size: '6XL', chestFlat: 38, sleeve: 29, shoulder: 26, halfShoulder: 8.5, back: 33.5 },
]

export function format(value: number, unit: Unit) {
  const converted = unit === 'cm' ? value * 2.54 : value
  return String(Number(converted.toFixed(2)))
}

export function formatRange([min, max]: Range, unit: Unit) {
  return min === max ? format(min, unit) : `${format(min, unit)}-${format(max, unit)}`
}

export function convertEntry(value: string, from: Unit, to: Unit) {
  if (!value || from === to) return value
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return value
  const converted = from === 'in' ? numeric * 2.54 : numeric / 2.54
  // Keep measurement precision so switching units cannot move a chart boundary.
  return String(Number(converted.toPrecision(15)))
}

export function estimateSize(chestIn: number, waistIn: number) {
  // Allow only floating-point conversion noise at the chart boundaries.
  const tolerance = 1e-10
  if (!Number.isFinite(chestIn) || !Number.isFinite(waistIn)
    || chestIn < bodyRows[0].chest[0] - tolerance
    || waistIn < bodyRows[0].waist[0] - tolerance) return null

  return bodyRows.find((row) => !row.size.includes('Tall')
    && chestIn <= row.chest[1] + tolerance
    && waistIn <= row.waist[1] + tolerance) ?? null
}

export const measurementGuides = [
  {
    id: 'measure-chest', title: 'Body chest', image: 'body-chest',
    alt: 'A level measuring tape wrapped around the fullest part of the chest, just below the armpits.',
    steps: ['Stand naturally in a light, close-fitting top.', 'Wrap a soft tape around the fullest part of your chest, just below your armpits.', 'Keep the tape level and snug without squeezing. Breathe normally and record the measurement.'],
  },
  {
    id: 'measure-waist', title: 'Natural waist', image: 'body-waist',
    alt: 'A measuring tape wrapped around the natural waist above the trouser waistband.',
    steps: ['Find your natural waist between your lower ribs and the top of your hips.', 'Wrap the tape around this point, keeping it level. Your trouser waistband may sit lower.', 'Relax your stomach and record the measurement without pulling the tape tight.'],
  },
  {
    id: 'measure-sleeve', title: 'Jacket sleeve', image: 'jacket-sleeve',
    alt: 'A jacket laid flat with a measuring tape from the shoulder seam to the end of the cuff.',
    steps: ['Lay a jacket that fits you well on a flat surface and smooth the sleeve.', 'Measure from the shoulder seam to the very end of the cuff, including the ribbing.', 'Compare with the finished jacket chart. Confirm the separate body-chart sleeve measuring points with our team.'],
  },
  {
    id: 'measure-shoulders', title: 'Across shoulder', image: 'jacket-shoulders',
    alt: 'The back of a flat jacket with a tape across the upper back between the shoulder seams.',
    steps: ['Lay your jacket flat with its back facing up.', 'Measure straight across the upper back from one shoulder seam to the other.', 'Keep the jacket relaxed and compare with the across-shoulder column in the jacket chart.'],
  },
  {
    id: 'measure-back', title: 'Back length', image: 'jacket-back',
    alt: 'The back of a flat jacket with a vertical tape from the base of the collar to the bottom of the waistband.',
    steps: ['Lay your jacket flat with its back facing up.', 'Measure down the center back from the base of the collar to the bottom of the waistband.', 'Include the waistband, exclude the collar, and compare with the finished jacket chart.'],
  },
]
