import type { JacketView } from '@/types/jacket-customization'

// Original vector construction shared by previews and exports; coordinates are always 720 × 720.
export function renderVarsitySvg(o: Record<string, string>, view: JacketView) {
  const back = view === 'back'
  const sleeveView = view === 'leftSleeve' || view === 'rightSleeve'
  // Broader full-jacket silhouette, centered in the existing preview without changing artwork coordinates.
  const widthScale = sleeveView ? 1 : 1.18
  const widthOffset = 360 * (1 - widthScale)
  const raglan = o['Sleeve style'] === 'Raglan'
  const stripeCount = o['Knit style'] === 'Plain' ? 0 : o['Knit style'] === 'Single stripe' ? 1 : 2
  const stripe = o['Stripe color']
  const ribbedCuff = o['Cuff style'] !== 'Plain fabric'
  const seam = (d: string, opacity = .25, width = 1.5) => `<path d="${d}" fill="none" stroke="#111827" stroke-opacity="${opacity}" stroke-width="${width}" stroke-linecap="round"/>`
  const part = (id: string, d: string, color: string, material?: string, rib = false) => {
    const texture = rib ? 'rib' : material === 'Wool' ? 'wool' : material === 'Cotton fleece' ? 'fleece' : ''
    return `<g id="${id}"><path d="${d}" fill="${color}" stroke="#111827" stroke-opacity=".55" stroke-width="1.6" stroke-linejoin="round"/><path d="${d}" fill="url(#${material === 'Leather' ? 'leather-light' : material === 'Satin' ? 'satin-light' : 'fabric-light'})"/>${texture ? `<path d="${d}" fill="url(#${texture})"/>` : ''}</g>`
  }
  const knitLines = (paths: string[]) => stripeCount ? `<g id="knit-stripes" stroke="${stripe}" stroke-width="5" stroke-opacity=".95" fill="none">${paths.slice(0, stripeCount).map(d => `<path d="${d}"/>`).join('')}</g>` : ''
  const sleeveStripe = (id: string, d: string, borders: string, clip: string) => {
    if (o['Sleeve stripe'] !== 'Add stripe') return ''
    return `<defs><clipPath id="${id}-clip"><path d="${clip}"/></clipPath></defs><g id="${id}" clip-path="url(#${id}-clip)"><path d="${d}" fill="${o['Sleeve stripe color']}"/>${o['Sleeve stripe piping'] === 'Add piping' ? `<path d="${borders}" fill="none" stroke="${o['Sleeve piping color']}" stroke-width="3"/>` : ''}</g>`
  }
  let shapes = ''
  if (sleeveView) {
    const id = view === 'leftSleeve' ? 'left-sleeve' : 'right-sleeve'
    const color = o[view === 'leftSleeve' ? 'Left sleeve color' : 'Right sleeve color']
    const sleevePath = raglan
      ? 'M330 94 Q382 79 414 122 L435 161 C442 215 416 312 409 399 C406 454 393 514 399 558 Q351 574 307 556 C310 524 298 493 296 465 C291 416 281 351 270 254 Q264 186 282 157 Z'
      : 'M278 143 C286 108 319 92 357 96 C401 98 429 121 435 161 C442 215 416 312 409 399 C406 454 393 514 399 558 Q351 574 307 556 C310 524 298 493 296 465 C291 416 281 351 270 254 Q264 186 278 143 Z'
    shapes += part(id, sleevePath, color, o['Sleeve material'])
    shapes += seam(raglan ? 'M286 160 Q321 164 418 125 M290 165 Q330 167 421 130' : 'M285 145 Q350 111 426 151 M289 153 Q350 120 422 158', .18)
    shapes += seam('M284 218 C289 346 310 445 320 550', .2)
    shapes += '<path d="M280 268 Q311 292 308 326 M404 369 Q379 386 390 412 M302 487 Q338 475 344 489" fill="none" stroke="#000" stroke-opacity=".08" stroke-width="6" stroke-linecap="round"/>'
    shapes += sleeveStripe('sleeve-stripe', 'M271 238 Q356 266 430 249 L428 271 Q355 288 273 260 Z', 'M271 238 Q356 266 430 249 M273 260 Q355 288 428 271', sleevePath)
    shapes += part('sleeve-cuff', 'M307 556 Q354 570 399 558 L397 606 Q351 621 310 605 Z', o['Cuffs color'], ribbedCuff ? undefined : o['Sleeve material'], ribbedCuff)
    if (ribbedCuff) shapes += knitLines(['M309 573 Q352 587 398 575', 'M310 592 Q352 606 397 594'])
  } else {
    const screenLeft = back ? 'left' : 'right'
    const screenRight = back ? 'right' : 'left'
    const leftSleevePath = raglan
      ? 'M314 137 C269 140 224 150 205 180 C192 202 178 237 170 266 C161 304 121 448 105 539 Q143 559 186 561 C193 518 210 458 223 415 C233 377 236 338 242 316 Q248 308 252 299 L325 185 Z'
      : 'M205 180 C193 198 182 226 173 254 C157 297 120 449 105 539 Q143 559 186 561 C194 514 210 459 223 415 C233 375 235 339 240 312 Q253 295 259 279 L260 183 Z'
    const rightSleevePath = raglan
      ? 'M406 137 C451 140 496 150 515 180 C528 202 542 237 550 266 C559 304 599 448 615 539 Q577 559 534 561 C527 518 510 458 497 415 C487 377 484 338 478 316 Q472 308 468 299 L395 185 Z'
      : 'M515 180 C527 198 538 226 547 254 C563 297 600 449 615 539 Q577 559 534 561 C526 514 510 459 497 415 C487 375 485 339 480 312 Q467 295 461 279 L460 183 Z'
    // Draw sleeve caps after the body for raglan so the contrasting fabric reaches the neckline.
    const sleeves = part(`${screenLeft}-sleeve`, leftSleevePath, o[`${screenLeft === 'left' ? 'Left' : 'Right'} sleeve color`], o['Sleeve material'])
      + part(`${screenRight}-sleeve`, rightSleevePath, o[`${screenRight === 'left' ? 'Left' : 'Right'} sleeve color`], o['Sleeve material'])
    // Rounded shoulders and a small underarm opening separate the sleeves from the torso.
    // Cuff and waistband endpoints stay fixed so trims remain joined.
    const body = part('body', 'M312 135 Q360 157 408 135 C451 140 496 150 515 180 Q495 225 484 276 C489 296 476 318 479 350 Q480 370 483 389 Q484 419 488 450 C493 496 501 527 494 559 Q482 583 461 587 L259 587 Q238 583 226 559 C219 527 227 496 232 450 Q236 419 237 389 Q240 370 241 350 C244 318 231 296 236 276 Q225 225 205 180 C224 150 269 140 312 135 Z', o['Body color'], o['Body material'])
    const sleeveStripes = sleeveStripe(`${screenLeft}-sleeve-stripe`, 'M165 242 Q196 259 240 260 L234 282 Q191 281 160 264 Z', 'M165 242 Q196 259 240 260 M160 264 Q191 281 234 282', leftSleevePath)
      + sleeveStripe(`${screenRight}-sleeve-stripe`, 'M480 260 Q524 259 555 242 L560 264 Q529 281 486 282 Z', 'M480 260 Q524 259 555 242 M486 282 Q529 281 560 264', rightSleevePath)
    shapes += raglan ? body + sleeves + sleeveStripes : sleeves + sleeveStripes + body
    shapes += seam(raglan ? 'M312 144 Q281 204 244 286 M408 144 Q439 204 476 286' : 'M210 185 Q231 231 236 276 M510 185 Q489 231 484 276', .35)
    shapes += seam(raglan ? 'M307 143 Q274 204 239 285 M413 143 Q446 204 481 285' : 'M215 185 Q236 231 241 276 M505 185 Q484 231 479 276', .14)
    shapes += seam('M240 490 Q252 501 266 497 M480 490 Q468 501 454 497 M238 536 Q258 528 273 540 M482 536 Q462 528 447 540 M143 392 Q157 406 172 401 M577 392 Q563 406 548 401', .12, 1.5)
    shapes += '<g fill="none" stroke-linecap="round"><path d="M188 255 Q207 267 201 285 M531 255 Q512 267 519 285 M148 433 Q174 447 183 434 M572 433 Q546 447 537 434" stroke="#000" stroke-opacity=".07" stroke-width="8"/><path d="M254 321 Q243 435 252 546 M466 321 Q477 435 468 546" stroke="#000" stroke-opacity=".05" stroke-width="12"/></g>'
    shapes += part(`${screenLeft}-cuff`, 'M105 539 Q143 559 186 561 L180 601 Q139 603 97 579 Z', o['Cuffs color'], ribbedCuff ? undefined : o['Sleeve material'], ribbedCuff)
      + part(`${screenRight}-cuff`, 'M534 561 Q577 559 615 539 L623 579 Q581 603 540 601 Z', o['Cuffs color'], ribbedCuff ? undefined : o['Sleeve material'], ribbedCuff)
    if (ribbedCuff) shapes += knitLines(['M102 553 Q142 575 184 576 M536 576 Q578 575 618 553', 'M99 568 Q141 591 182 591 M538 591 Q579 591 621 568'])
    shapes += part('waistband', 'M230 558 Q360 580 490 558 L488 606 Q360 628 232 606 Z', o['Waistband color'], undefined, true)
    shapes += knitLines(['M231 575 Q360 597 489 575', 'M232 593 Q360 615 488 593'])
    if (!back) {
      // A small exposed neck lining communicates the chosen interior fabric.
      shapes += part('lining', 'M312 134 Q360 115 408 134 Q400 165 370 182 L350 182 Q320 165 312 134 Z', o['Lining color'])
      if (o.Lining === 'Quilted') shapes += '<path d="M314 139 L380 191 M335 130 L398 179 M367 128 L407 156 M406 138 L340 191 M385 130 L322 179 M353 128 L313 156" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1"/>'
      shapes += '<rect x="345" y="137" width="30" height="13" rx="2" fill="#e7e5e4" opacity=".85"/>'
    }
    const stand = o['Collar style'] === 'Stand collar'
    const collarPath = back
      ? stand ? 'M305 113 C305 91 415 91 415 113 L421 149 Q360 165 299 149 Z' : 'M307 123 C307 101 413 101 413 123 L420 153 Q360 168 300 153 Z'
      : stand ? 'M300 145 L305 113 C305 91 415 91 415 113 L420 145 Q410 171 360 185 Q310 171 300 145 Z M314 115 C314 124 346 145 360 178 C374 145 406 124 406 115 C405 102 315 102 314 115 Z'
        : 'M299 151 L307 123 C307 101 413 101 413 123 L421 151 Q411 175 360 188 Q309 175 299 151 Z M316 125 C316 134 346 150 360 181 C374 150 404 134 404 125 C404 112 316 112 316 125 Z'
    // Opposite winding leaves a rounded neck opening and a V at the center front.
    shapes += part('collar', collarPath, o['Collar color'], undefined, true)
    const collarStripePaths = back
      ? stand ? ['M304 128 Q360 111 416 128', 'M302 141 Q360 126 418 141'] : ['M306 137 Q360 120 414 137', 'M303 149 Q360 135 417 149']
      : stand ? ['M307 126 C323 143 344 151 355 180 M413 126 C397 143 376 151 365 180', 'M303 138 C321 154 340 163 351 182 M417 138 C399 154 380 163 369 182']
        : ['M307 136 C323 150 344 158 355 183 M413 136 C397 150 376 158 365 183', 'M303 148 C321 163 340 170 351 185 M417 148 C399 163 380 170 369 185']
    if (stripeCount) shapes += `<defs><clipPath id="collar-trim-clip"><path d="${collarPath}"/></clipPath></defs><g id="collar-stripes" clip-path="url(#collar-trim-clip)" fill="none" stroke="${stripe}" stroke-width="3.5">${collarStripePaths.slice(0, stripeCount).map(d => `<path d="${d}"/>`).join('')}</g>`
    if (!back) {
      const start = stand ? 185 : 188
      shapes += part('closure', `M353 ${start} L367 ${start} L367 607 L353 607 Z`, o['Body color'])
      shapes += seam(`M353 ${start} L353 608 M367 ${start} L367 608`, .2)
      if (o.Closure === 'Buttons') {
        shapes += `<g id="buttons">${[242, 300, 358, 416, 474, 532, 590].map(y => `<circle cx="360" cy="${y}" r="5.5" fill="${o['Closure color']}" stroke="#111827" stroke-opacity=".5"/><circle cx="359" cy="${y - 1}" r="3" fill="url(#metal-light)"/>`).join('')}</g>`
      } else {
        shapes += `<g id="zipper"><path d="M360 ${start} L360 608" stroke="${o['Closure color']}" stroke-width="7"/><path d="M360 ${start} L360 608" stroke="#111827" stroke-opacity=".6" stroke-width="3" stroke-dasharray="1 3"/><rect x="355" y="${start + 8}" width="10" height="19" rx="2" fill="${o['Closure color']}" stroke="#111827" stroke-opacity=".5"/></g>`
      }
      if (o['Pocket style'] !== 'No pockets') {
        const slanted = o['Pocket style'] === 'Slanted'
        shapes += part('right-pocket', slanted ? 'M267 419 L279 414 L306 494 L294 499 Z' : 'M252 450 L314 450 L314 463 L252 463 Z', o['Pockets color'])
          + part('left-pocket', slanted ? 'M441 414 L453 419 L426 499 L414 494 Z' : 'M406 450 L468 450 L468 463 L406 463 Z', o['Pockets color'])
        shapes += seam(slanted ? 'M280 419 L302 490 M440 419 L418 490' : 'M255 459 L311 459 M409 459 L465 459', .5, 2)
      }
    } else {
      shapes += seam('M247 198 Q360 212 473 198', .11)
    }
    if (o.Hood === 'Hooded') {
      shapes += part('hood', back
        ? 'M302 139 C288 98 305 67 360 64 C415 67 432 98 418 139 Q413 198 360 222 Q307 198 302 139 Z'
        : 'M303 154 C281 103 302 65 360 64 C418 65 439 103 417 154 L399 186 Q401 99 360 96 Q319 99 321 186 Z', o['Hood color'], o['Body material'])
      if (!back) shapes += part('hood-lining', 'M321 174 Q315 99 360 96 Q405 99 399 174 L388 157 Q388 112 360 111 Q332 112 332 157 Z', o['Hood lining color'])
      shapes += seam(back ? 'M360 70 Q348 125 360 212' : 'M309 147 Q302 86 360 76 Q418 86 411 147', .25)
      if (!back) shapes += `<path d="M321 177 L319 245 M399 177 L401 245" stroke="${stripe}" stroke-width="3"/><path d="M319 239 L319 249 M401 239 L401 249" stroke="#71717a" stroke-width="4"/>`
    }
  }
  if (!sleeveView) {
    // Increase torso/shoulder fullness while retaining the neck opening and space around the cuffs.
    // Apply the same geometry to fabric panels, seams, trims, and clip paths so everything stays joined.
    const broadenX = (x: number) => {
      const distance = Math.abs(x - 360)
      const expanded = distance <= 65 ? distance : distance <= 145
        ? 65 + (distance - 65) * 1.45 : 181 + (distance - 145) * .8
      return Math.round((360 + Math.sign(x - 360) * expanded) * 1000) / 1000
    }
    shapes = shapes.replace(/\bd="([^"]+)"/g, (_attribute, path: string) => {
      const expanded = path.replace(/([MLCQZ])([^MLCQZ]*)/g, (_segment, command: string, coordinates: string) => {
        let coordinateIndex = 0
        return command + coordinates.replace(/-?\d*\.?\d+/g, value => String(coordinateIndex++ % 2 === 0 ? broadenX(Number(value)) : Number(value)))
      })
      return `d="${expanded}"`
    })
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720" width="720" height="720" role="img" aria-label="Varsity jacket ${view}"><defs>
    <linearGradient id="fabric-light" x1="0" x2="1"><stop stop-color="#000" stop-opacity=".19"/><stop offset=".16" stop-color="#fff" stop-opacity=".08"/><stop offset=".48" stop-color="#fff" stop-opacity=".03"/><stop offset=".84" stop-color="#000" stop-opacity=".03"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
    <linearGradient id="leather-light" x1="0" x2="1"><stop stop-color="#000" stop-opacity=".2"/><stop offset=".25" stop-color="#fff" stop-opacity=".24"/><stop offset=".4" stop-color="#fff" stop-opacity=".07"/><stop offset=".76" stop-color="#000" stop-opacity=".04"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
    <linearGradient id="satin-light" x1="0" x2="1"><stop stop-color="#000" stop-opacity=".23"/><stop offset=".3" stop-color="#fff" stop-opacity=".3"/><stop offset=".48" stop-color="#fff" stop-opacity=".06"/><stop offset=".72" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>
    <linearGradient id="metal-light" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#000" stop-opacity=".15"/></linearGradient>
    <pattern id="rib" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M1 0 L1 4" stroke="#000" stroke-opacity=".1" stroke-width="1"/><path d="M2 0 L2 4" stroke="#fff" stroke-opacity=".07" stroke-width="1"/></pattern>
    <pattern id="wool" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 1 L2 2 M3 4 L5 3" stroke="#fff" stroke-opacity=".035" stroke-width=".6"/><path d="M1 4 L3 3" stroke="#000" stroke-opacity=".035" stroke-width=".6"/></pattern>
    <pattern id="fleece" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 2 L5 2" stroke="#fff" stroke-opacity=".025" stroke-width="1"/></pattern>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#0f172a" flood-opacity=".12"/></filter>
    </defs><ellipse cx="360" cy="635" rx="${sleeveView ? 72 : 178 * widthScale}" ry="10" fill="#0f172a" opacity=".045"/><g filter="url(#shadow)" transform="matrix(${widthScale} 0 0 1 ${widthOffset} 0)" data-jacket-scale-x="${widthScale}" data-jacket-offset-x="${widthOffset}">${shapes}</g></svg>`
}

export const VARSITY_PART_COLORS: Record<string, string> = {
  'sleeve-stripe': 'Sleeve stripe color', 'left-sleeve-stripe': 'Sleeve stripe color', 'right-sleeve-stripe': 'Sleeve stripe color',
  body: 'Body color', 'left-sleeve': 'Left sleeve color', 'right-sleeve': 'Right sleeve color',
  collar: 'Collar color', 'left-cuff': 'Cuffs color', 'right-cuff': 'Cuffs color', 'sleeve-cuff': 'Cuffs color',
  'collar-stripes': 'Stripe color',
  waistband: 'Waistband color', 'left-pocket': 'Pockets color', 'right-pocket': 'Pockets color',
  closure: 'Closure color', buttons: 'Closure color', zipper: 'Closure color',
  hood: 'Hood color', 'hood-lining': 'Hood lining color', lining: 'Lining color', 'knit-stripes': 'Stripe color',
}
