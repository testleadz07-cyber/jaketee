import type { JacketTextLayout } from '@/types/jacket-customization'

export const TEXT_LAYOUT_CHOICES: { value: JacketTextLayout; label: string; example: string }[] = [
  { value: 'straight', label: 'Straight', example: 'Horizontal text in a straight line.' },
  { value: 'curve-up', label: 'Curve upward', example: 'An arch with the middle raised.' },
  { value: 'curve-down', label: 'Curve downward', example: 'A curve with the middle lowered.' },
  { value: 'vertical', label: 'Vertical', example: 'Upright letters stacked from top to bottom.' },
]

/** Draw around the chosen center; fit long layouts without changing saved font size. */
export function drawJacketTextLayout(context: CanvasRenderingContext2D, value: string, layout: JacketTextLayout = 'straight', fontSize: number, x: number, y: number) {
  const characters = Array.from(value)
  const draw = (text: string, dx: number, dy: number) => { context.strokeText(text, dx, dy); context.fillText(text, dx, dy) }
  context.save()
  context.translate(x, y)
  if (layout === 'straight' || characters.length < 2) {
    const scale = Math.min(1, 420 / Math.max(1, context.measureText(value).width))
    context.scale(scale, scale)
    draw(value, 0, 0)
  } else if (layout === 'vertical') {
    const step = fontSize * 1.15
    const height = Math.max(fontSize, (characters.length - 1) * step + fontSize)
    const width = Math.max(1, ...characters.map(char => context.measureText(char).width))
    const scale = Math.min(1, 350 / height, 420 / width)
    context.scale(scale, scale)
    characters.forEach((char, index) => draw(char, 0, (index - (characters.length - 1) / 2) * step))
  } else {
    const widths = characters.map(char => context.measureText(char).width)
    const width = widths.reduce((sum, w) => sum + w, 0)
    const rise = Math.min(80, width * .2)
    const direction = layout === 'curve-up' ? 1 : -1
    const scale = Math.min(1, 420 / Math.max(1, width + fontSize))
    context.scale(scale, scale)
    let left = -width / 2
    characters.forEach((char, index) => {
      const cx = left + widths[index] / 2
      const u = width ? cx / width : 0
      const cy = direction * rise * (4 * u * u - .5)
      context.save()
      context.translate(cx, cy)
      context.rotate(Math.atan(width ? direction * 8 * rise * u / width : 0))
      draw(char, 0, 0)
      context.restore()
      left += widths[index]
    })
  }
  context.restore()
}
