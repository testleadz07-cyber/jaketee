import type { GarmentCategory } from '@/lib/garment-template'
import type { JacketView } from '@/types/jacket-customization'

export const GARMENT_PART_COLORS: Record<string, string> = {
  body: 'Body color', 'left-sleeve': 'Sleeves color', 'right-sleeve': 'Sleeves color',
  collar: 'Collar color', 'left-cuff': 'Cuffs color', 'right-cuff': 'Cuffs color',
  waistband: 'Waistband color', pockets: 'Pockets color', 'sleeve-pocket': 'Pockets color',
  closure: 'Closure color', hood: 'Hood color', lining: 'Lining color', 'knit-stripes': 'Stripe color', 'collar-stripes': 'Stripe color',
}

// Original 720px vectors use the same artwork coordinates as the varsity designer.
export function renderGarmentSvg(category: GarmentCategory, o: Record<string, string>, view: JacketView) {
  const puffer = category === 'puffer', coach = category === 'coach', back = view === 'back'
  const sleeve = view === 'leftSleeve' || view === 'rightSleeve'
  const part = (id: string, d: string, color: string, material = o['Body material']) => `<g id="${id}"><path d="${d}" fill="${color}" stroke="#111827" stroke-opacity=".5" stroke-width="1.5" stroke-linejoin="round"/><path d="${d}" fill="url(#${material === 'Satin' ? 'satin' : material === 'Nylon' ? 'nylon' : 'fabric'})"/>${category === 'bomber' && (id.includes('cuff') || id === 'waistband' || (id === 'collar' && o['Collar style'] === 'Ribbed collar')) ? `<path d="${d}" fill="url(#rib)"/>` : ''}</g>`
  const seam = (d: string) => `<path d="${d}" fill="none" stroke="#111827" stroke-opacity=".22" stroke-width="1.5" stroke-linecap="round"/>`
  const quilting = (clip: string, yStart: number, yEnd: number, xLeft: number, xRight: number) => {
    const spacing = o['Padding weight'] === 'Lightweight' ? 48 : o['Padding weight'] === 'Heavy' ? 80 : 64
    return `<clipPath id="${clip}-quilt"><path d="${paths[clip]}"/></clipPath><g clip-path="url(#${clip}-quilt)">${Array.from({ length: Math.floor((yEnd-yStart)/spacing)+1 }, (_, i) => {
      const y = yStart+i*spacing, center = (xLeft+xRight)/2
      const d = o['Quilting style'] === 'Chevron' ? `M${xLeft} ${y} Q${center-20} ${y+22} ${center} ${y+32} Q${center+20} ${y+22} ${xRight} ${y}` : `M${xLeft} ${y} Q${center} ${y+10} ${xRight} ${y}`
      return `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="8"/>${seam(d)}`
    }).join('')}</g>`
  }
  const paths: Record<string, string> = {}
  let s = ''
  if (sleeve) {
    const id = view === 'leftSleeve' ? 'left-sleeve' : 'right-sleeve'
    paths[id] = puffer ? 'M276 154 C280 101 419 81 440 154 C460 267 430 401 408 561 Q357 576 305 559 C291 420 262 278 276 154 Z' : 'M280 154 C290 100 413 85 430 154 C439 258 414 429 400 560 Q355 573 310 559 C292 427 273 264 280 154 Z'
    s += part(id, paths[id], o['Sleeves color'], o['Sleeve material'])
    if (puffer) s += quilting(id, 205, 540, 250, 460)
    else s += seam('M289 243 Q299 417 320 550 M294 371 Q313 389 320 383')
    if (category === 'bomber' && o['Sleeve pocket'] === 'Utility pocket' && view === 'leftSleeve') s += part('sleeve-pocket', 'M309 236 L379 231 L385 320 L316 325 Z', o['Pockets color']) + seam('M320 243 L326 310')
    s += part(view === 'leftSleeve' ? 'left-cuff' : 'right-cuff', puffer ? 'M305 559 Q357 576 408 561 L403 607 Q357 621 309 605 Z' : 'M310 559 Q355 575 400 560 L398 607 Q354 620 314 605 Z', o['Cuffs color'])
    if ((coach || puffer) && o['Cuff style'] === 'Elastic cuffs') s += seam('M311 578 Q356 593 402 578 M316 575 L318 589 M330 580 L332 594 M380 583 L380 596 M395 579 L394 592')
    if (category === 'bomber' && o['Knit style'] !== 'Plain') s += `<g id="knit-stripes"><path d="M312 578 Q356 590 399 578 L399 584 Q356 596 312 584 Z" fill="${o['Stripe color']}"/>${o['Knit style'] === 'Double stripe' ? `<path d="M313 595 Q356 607 398 595 L398 600 Q356 613 313 600 Z" fill="${o['Stripe color']}"/>` : ''}</g>`
  } else {
    paths['left-sleeve'] = 'M169 184 C153 205 137 249 125 297 L66 541 Q102 568 148 566 L210 342 Q228 283 245 217 Z'
    paths['right-sleeve'] = 'M551 184 C567 205 583 249 595 297 L654 541 Q618 568 572 566 L510 342 Q492 283 475 217 Z'
    if (puffer) {
      paths['left-sleeve'] = 'M169 184 C144 208 129 252 125 297 C109 340 108 358 105 390 C91 431 82 480 66 541 Q102 568 148 566 C170 496 185 422 210 342 Q228 283 245 217 Z'
      paths['right-sleeve'] = 'M551 184 C576 208 591 252 595 297 C611 340 612 358 615 390 C629 431 638 480 654 541 Q618 568 572 566 C550 496 535 422 510 342 Q492 283 475 217 Z'
    }
    paths.body = coach ? 'M307 135 Q360 157 413 135 C478 143 526 155 551 184 L495 301 Q498 454 511 602 Q360 624 209 602 Q222 454 225 301 L169 184 C194 155 242 143 307 135 Z' : puffer ? 'M306 133 Q360 154 414 133 C479 139 528 151 551 184 Q529 239 515 303 C525 371 512 447 514 569 Q509 600 490 605 L230 605 Q211 600 206 569 C208 447 195 371 205 303 Q191 239 169 184 C192 151 241 139 306 133 Z' : 'M307 135 Q360 156 413 135 C478 141 528 155 551 184 L494 290 Q486 366 503 486 Q518 552 495 566 Q360 589 225 566 Q202 552 217 486 Q234 366 226 290 L169 184 C192 155 242 141 307 135 Z'
    s += part('left-sleeve', paths['left-sleeve'], o['Sleeves color'], o['Sleeve material']) + part('right-sleeve', paths['right-sleeve'], o['Sleeves color'], o['Sleeve material'])
    if (puffer) s += quilting('left-sleeve', 260, 530, 60, 250) + quilting('right-sleeve', 260, 530, 470, 660)
    s += part('body', paths.body, o['Body color'])
    if (puffer) s += quilting('body', 238, 570, 180, 540)
    else s += seam('M242 493 Q263 509 281 501 M478 493 Q457 509 439 501')
    s += part('left-cuff', 'M66 541 Q102 568 148 566 L138 608 Q94 608 57 581 Z', o['Cuffs color']) + part('right-cuff', 'M572 566 Q618 568 654 541 L663 581 Q626 608 582 608 Z', o['Cuffs color'])
    if (coach || puffer) {
      if (o['Cuff style'] === 'Elastic cuffs') s += seam('M64 565 L143 587 M576 587 L657 565')
    } else {
      s += part('waistband', 'M225 562 Q360 585 495 562 L493 608 Q360 630 227 608 Z', o['Waistband color'])
      if (o['Knit style'] !== 'Plain') s += `<g id="knit-stripes"><path d="M226 580 Q360 602 494 580 M63 557 Q98 586 145 582 M575 582 Q622 586 657 557${o['Knit style'] === 'Double stripe' ? ' M227 598 Q360 620 493 598 M60 575 Q98 604 141 600 M579 600 Q622 604 660 575' : ''}" fill="none" stroke="${o['Stripe color']}" stroke-width="5"/></g>`
    }
    if (coach) {
      s += seam('M213 592 Q360 614 507 592')
      if (o.Hem === 'Drawcord hem') s += `<g>${seam('M245 607 L239 638 M475 607 L481 638')}<circle cx="239" cy="634" r="3" fill="${o['Closure color']}"/><circle cx="481" cy="634" r="3" fill="${o['Closure color']}"/></g>`
    }
    if (!back) s += part('lining', 'M307 133 Q360 114 413 133 L369 185 L351 185 Z', o['Lining color']) + (o.Lining === 'Quilted' ? seam('M318 136 L383 169 M342 128 L402 148 M402 136 L337 169 M378 128 L318 148') : '')
    const point = coach && o['Collar style'] === 'Point collar'
    const collar = back ? 'M306 114 Q360 93 414 114 L421 151 Q360 168 299 151 Z' : point ? 'M306 122 Q360 104 414 122 L426 177 L397 209 L360 162 L323 209 L294 177 Z M315 125 L360 161 L405 125 Q360 112 315 125 Z' : category === 'bomber' && o['Collar style'] === 'Ribbed collar' ? 'M304 132 Q360 111 416 132 L424 157 Q411 183 360 196 Q309 183 296 157 Z M316 134 Q319 150 360 184 Q401 150 404 134 Q360 122 316 134 Z' : 'M301 146 L306 109 Q360 88 414 109 L419 146 Q403 171 360 184 Q317 171 301 146 Z M315 113 Q317 135 360 174 Q403 135 405 113 Q360 101 315 113 Z'
    s += part('collar', collar, o['Collar color'])
    if (category === 'bomber' && o['Collar style'] === 'Ribbed collar' && o['Knit style'] !== 'Plain') {
      const lines = back ? ['M303 129 Q360 110 417 129', 'M301 143 Q360 127 419 143'] : ['M307 151 Q328 172 354 188 M413 151 Q392 172 366 188', 'M302 159 Q324 182 352 192 M418 159 Q396 182 368 192']
      s += `<clipPath id="collar-stripe-clip"><path d="${collar}"/></clipPath><g id="collar-stripes" clip-path="url(#collar-stripe-clip)">${lines.slice(0, o['Knit style'] === 'Double stripe' ? 2 : 1).map(d => `<path d="${d}" fill="none" stroke="${o['Stripe color']}" stroke-width="4"/>`).join('')}</g>`
    }
    if (!back) {
      const end = category === 'bomber' ? 612 : 606
      s += part('closure', `M355 184 L365 184 L365 ${end} L355 ${end} Z`, o.Closure === 'Buttons' ? o['Body color'] : o['Closure color'])
      if (o.Closure === 'Zipper') s += seam(`M360 185 L360 ${end}`) + `<path d="M360 185 L360 ${end}" stroke="#111827" stroke-width="2" stroke-dasharray="1 3"/><rect x="355" y="195" width="10" height="18" rx="2" fill="${o['Closure color']}" stroke="#111827"/>`
      else s += [230, 290, 350, 410, 470, 530, 590].map(y => `<circle cx="360" cy="${y}" r="5" fill="${o['Closure color']}" stroke="#111827"/>`).join('')
      if (o['Pocket style'] !== 'No pockets') s += part('pockets', 'M251 429 L263 424 L291 501 L279 506 Z M457 424 L469 429 L441 506 L429 501 Z', o['Pockets color'])
      if (category === 'bomber' && o['Sleeve pocket'] === 'Utility pocket') s += part('sleeve-pocket', 'M550 264 L580 272 L568 341 L537 333 Z', o['Pockets color']) + seam('M553 277 L544 325')
    }
    if (o.Hood === 'Hooded') {
      s += part('hood', back ? 'M299 140 C283 95 307 61 360 61 C413 61 437 95 421 140 Q412 199 360 222 Q308 199 299 140 Z' : 'M301 155 C279 98 308 60 360 61 C412 60 441 98 419 155 L398 181 Q402 101 360 96 Q318 101 322 181 Z', o['Hood color'])
      if (puffer) s += seam(back ? 'M307 119 Q360 138 413 119 M314 171 Q360 190 406 171' : 'M303 135 Q294 91 327 80 M417 135 Q426 91 393 80')
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720" width="720" height="720" role="img" aria-label="${category} jacket ${view}"><defs><pattern id="rib" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M1 0 L1 4" stroke="#000" stroke-opacity=".15"/><path d="M2 0 L2 4" stroke="#fff" stroke-opacity=".08"/></pattern><linearGradient id="nylon"><stop stop-color="#000" stop-opacity=".17"/><stop offset=".3" stop-color="#fff" stop-opacity=".16"/><stop offset=".7" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".17"/></linearGradient><linearGradient id="fabric"><stop stop-color="#000" stop-opacity=".18"/><stop offset=".3" stop-color="#fff" stop-opacity=".08"/><stop offset=".7" stop-color="#fff" stop-opacity=".03"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient><linearGradient id="satin"><stop stop-color="#000" stop-opacity=".22"/><stop offset=".35" stop-color="#fff" stop-opacity=".3"/><stop offset=".6" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient></defs><ellipse cx="360" cy="647" rx="${sleeve ? 75 : 200}" ry="9" fill="#111827" opacity=".05"/><g data-jacket-scale-x="1" data-jacket-offset-x="0">${s}</g></svg>`
}
