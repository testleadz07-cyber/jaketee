import type { JacketView } from '@/types/jacket-customization'

// Original fleece hoodie panels, shared by the live canvas and exported previews.
export function renderHoodieSvg(o: Record<string, string>, view: JacketView) {
  const back = view === 'back', sleeveView = view === 'leftSleeve' || view === 'rightSleeve'
  const zip = o.Closure === 'Full-zip', raglan = o['Sleeve style'] === 'Raglan'
  const relaxed = o.Fit === 'Relaxed'
  const seam = (d: string, opacity = .22) => `<path d="${d}" fill="none" stroke="#111827" stroke-opacity="${opacity}" stroke-width="1.4" stroke-linecap="round"/>`
  const part = (id: string, d: string, color: string, rib = false) => `<g id="${id}"><path d="${d}" fill="${color}" stroke="#111827" stroke-opacity=".5" stroke-width="1.6" stroke-linejoin="round"/><path d="${d}" fill="url(#fleece-light)"/><path d="${d}" fill="url(#${rib ? 'hoodie-rib' : 'fleece-grain'})"/></g>`
  let s = ''
  if (sleeveView) {
    const id = view === 'leftSleeve' ? 'left-sleeve' : 'right-sleeve'
    s += part(id, relaxed ? 'M278 145 C284 104 417 91 438 148 C447 252 420 412 405 557 Q356 574 303 556 C292 428 268 261 278 145 Z' : 'M285 147 C293 110 410 97 429 150 C439 252 414 418 399 557 Q355 571 311 556 C299 428 276 260 285 147 Z', o['Sleeves color'])
    s += seam(raglan ? 'M285 172 Q351 162 420 130' : 'M292 158 Q354 126 422 160')
    s += seam('M293 294 Q315 311 317 337 M304 458 Q325 450 333 461', .12)
    s += part(view === 'leftSleeve' ? 'left-cuff' : 'right-cuff', relaxed ? 'M303 556 Q356 574 405 557 L402 609 Q355 624 307 607 Z' : 'M311 556 Q355 571 399 557 L396 609 Q355 621 314 607 Z', o['Cuffs color'], true)
  } else {
    const leftId = back ? 'left-sleeve' : 'right-sleeve', rightId = back ? 'right-sleeve' : 'left-sleeve'
    const left = raglan ? 'M311 148 Q230 150 174 190 C148 233 122 332 101 418 L68 548 Q107 574 151 568 L207 361 Q225 303 247 275 L323 190 Z' : 'M182 181 C154 204 127 316 105 405 L68 548 Q107 574 151 568 L207 361 Q224 302 246 249 L247 193 Z'
    const right = raglan ? 'M409 148 Q490 150 546 190 C572 233 598 332 619 418 L652 548 Q613 574 569 568 L513 361 Q495 303 473 275 L397 190 Z' : 'M538 181 C566 204 593 316 615 405 L652 548 Q613 574 569 568 L513 361 Q496 302 474 249 L473 193 Z'
    const body = relaxed ? 'M310 147 Q360 171 410 147 C468 148 518 158 546 186 L505 287 Q502 400 515 558 Q512 580 493 585 L227 585 Q208 580 205 558 Q218 400 215 287 L174 186 C202 158 252 148 310 147 Z' : 'M310 147 Q360 171 410 147 C467 150 515 159 538 181 L493 280 Q483 399 499 555 Q497 577 479 583 L241 583 Q223 577 221 555 Q237 399 227 280 L182 181 C205 159 253 150 310 147 Z'
    const sleeves = part(leftId, left, o['Sleeves color']) + part(rightId, right, o['Sleeves color'])
    s += raglan ? part('body', body, o['Body color']) + sleeves : sleeves + part('body', body, o['Body color'])
    s += seam(raglan ? 'M310 153 Q282 213 244 279 M410 153 Q438 213 476 279' : 'M185 186 Q209 232 230 282 M535 186 Q511 232 490 282')
    s += seam('M124 399 Q143 414 157 407 M596 399 Q577 414 563 407 M237 531 Q256 519 274 531 M483 531 Q464 519 446 531', .12)
    s += part('left-cuff', 'M68 548 Q107 574 151 568 L141 610 Q99 610 59 585 Z', o['Cuffs color'], true)
    s += part('right-cuff', 'M569 568 Q613 574 652 548 L661 585 Q621 610 579 610 Z', o['Cuffs color'], true)
    s += part('waistband', relaxed ? 'M211 561 Q360 581 509 561 L505 609 Q360 630 215 609 Z' : 'M226 560 Q360 580 494 560 L490 609 Q360 630 230 609 Z', o['Waistband color'], true)
    if (!back && o['Pocket style'] !== 'No pockets') {
      const pocket = zip ? 'M284 422 L348 422 L348 544 L254 544 Q250 495 256 470 Q278 454 284 422 Z M372 422 L436 422 Q442 454 464 470 Q470 495 466 544 L372 544 Z' : 'M284 422 Q360 416 436 422 Q442 454 464 470 L466 544 Q360 552 254 544 L256 470 Q278 454 284 422 Z'
      s += part('pockets', pocket, o['Pockets color'])
      s += seam('M283 427 Q281 456 261 472 M437 427 Q439 456 459 472 M260 537 Q360 544 460 537')
    }
    if (!back && zip) {
      s += part('closure', 'M355 195 L365 195 L365 615 L355 615 Z', o['Closure color'])
      s += `<path d="M360 195 L360 615" stroke="#111827" stroke-opacity=".6" stroke-width="2" stroke-dasharray="1 3"/><rect x="355" y="206" width="10" height="18" rx="2" fill="${o['Closure color']}" stroke="#111827"/>`
    }
    s += part('hood', back ? 'M301 150 C281 98 303 57 360 55 C417 57 439 98 419 150 Q416 219 360 246 Q304 219 301 150 Z' : 'M303 163 C278 105 301 56 360 55 C419 56 442 105 417 163 Q405 197 370 212 L360 202 L350 212 Q315 197 303 163 Z', o['Hood color'])
    if (back) s += seam('M360 62 Q345 141 360 236 M311 177 Q360 199 409 177', .2)
    else {
      s += part('hood-lining', 'M318 156 C303 110 321 77 360 76 C399 77 417 110 402 156 Q390 185 360 202 Q330 185 318 156 Z', o['Hood lining color'])
      if (o['Hood lining'] === 'Matching fleece') s += seam('M326 150 Q360 178 394 150', .1)
      s += seam('M307 159 C289 104 310 64 360 63 C410 64 431 104 413 159')
      if (o.Drawstrings === 'With drawstrings') {
        s += `<g id="drawstrings"><path d="M324 181 Q319 222 327 268 M396 181 Q401 222 393 268" fill="none" stroke="${o['Drawstrings color']}" stroke-width="4" stroke-linecap="round"/><path d="M327 261 L327 273 M393 261 L393 273" stroke="#71717a" stroke-width="4"/></g>`
      }
    }
  }
  const weightOpacity = o['Fleece weight'] === 'Heavyweight' ? '.07' : o['Fleece weight'] === 'Lightweight' ? '.025' : '.045'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720" width="720" height="720" role="img" aria-label="Fleece hoodie ${view}"><defs><linearGradient id="fleece-light"><stop stop-color="#000" stop-opacity=".17"/><stop offset=".3" stop-color="#fff" stop-opacity=".08"/><stop offset=".7" stop-color="#fff" stop-opacity=".03"/><stop offset="1" stop-color="#000" stop-opacity=".17"/></linearGradient><pattern id="fleece-grain" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 2 L5 2" stroke="#fff" stroke-opacity="${weightOpacity}"/></pattern><pattern id="hoodie-rib" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M1 0 L1 4" stroke="#000" stroke-opacity=".14"/><path d="M2 0 L2 4" stroke="#fff" stroke-opacity=".08"/></pattern></defs><ellipse cx="360" cy="646" rx="${sleeveView ? 75 : 200}" ry="9" fill="#111827" opacity=".05"/><g data-jacket-scale-x="1" data-jacket-offset-x="0">${s}</g></svg>`
}
