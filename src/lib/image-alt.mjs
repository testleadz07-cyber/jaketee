export function productImageAlt(productName, url, index) {
  let filename = String(url).split('/').pop()?.split('?')[0] || ''
  try { filename = decodeURIComponent(filename) } catch { /* Keep malformed URLs usable. */ }
  filename = filename.toLowerCase()
  const token = filename.replace(/[_ .]/g, '-')
  const detail = token.match(/(?:^|-)detail-?(\d+)(?:-|$)/)?.[1]
  const view = detail ? `detail view ${detail}`
    : /(?:^|-)side(?:-|$)/.test(token) ? 'side view'
    : /(?:^|-)back(?:-|$)/.test(token) ? 'back view'
    : /(?:^|-)(?:right-sleeve|sleeve-right)(?:-|$)/.test(token) ? 'right sleeve view'
    : /(?:^|-)(?:left-sleeve|sleeve-left)(?:-|$)/.test(token) ? 'left sleeve view'
    : /(?:^|-)(?:front|main)(?:-|$)/.test(token) ? 'front view'
    : (['front view', 'back view', 'right sleeve view', 'left sleeve view'][index] || 'detail view')
  return `${productName}, ${view}`
}

export function cleanProductName(name) {
  return name.replace(/(?:For\s+)?Mens And Women/gi, 'Men\u2019s and Women\u2019s')
    .replace(/For Mens/gi, 'Men\u2019s')
    .replace(/Women Girls Mens/gi, 'Unisex')
}
