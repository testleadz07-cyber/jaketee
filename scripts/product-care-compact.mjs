export const CARE_CLOSING = 'For custom orders, follow any care label sewn inside your jacket.'

export function compactCare(row) {
  const ids = new Set(row.blockIds)
  const name = row.productName.toLowerCase()
  const wool = ids.has('melton-polyester') || ids.has('melton-wool')
  const leather = [...ids].some(id => ['cowhide-leather', 'sheep-lambskin', 'faux-pu-leather'].includes(id)) || /leather|sheepskin/.test(name)
  const decorated = ids.has('decoration')
  const insulated = /puffer|padded/.test(name)
  const patchesOnly = name === 'letterman patch packs'
  let profile, paragraph, avoid
  if (patchesOnly) {
    profile = 'patches'
    paragraph = 'Lift dust gently from chenille and embroidery with a soft, dry cloth. Blot marks without pulling loops or patch edges. Once attached, follow the care label of the complete garment.'
    avoid = 'Bleach, stiff brushes, soaking adhesive areas and direct ironing.'
  } else if (ids.has('suede')) {
    profile = 'suede'
    paragraph = 'Let suede dry before removing loose dirt with a suede brush and gentle strokes. Blot spills without rubbing. Take stains and thorough cleaning to a specialist familiar with suede and the attached lining.'
    avoid = 'Smooth-leather creams, oils, soaking, machine washing and bleach.'
  } else if (wool && leather) {
    profile = 'wool-leather'
    paragraph = 'Gently brush the wool-blend body and wipe leather sleeves with a soft, dry cloth. Blot spills without rubbing. For stains or thorough cleaning, use a specialist familiar with mixed wool and leather garments.'
    avoid = 'Machine washing, soaking, wringing, bleach and unapproved leather treatments.'
  } else if (/shearling/.test(name)) {
    profile = 'shearling'
    paragraph = 'Lift loose dust with a soft, dry cloth and blot spills without rubbing. Check the care label for the shell and shearling before applying any cleaner. Use a specialist familiar with the complete garment for stains or thorough cleaning.'
    avoid = 'Machine washing, soaking, bleach and unapproved cleaners or conditioners.'
  } else if (leather) {
    profile = insulated ? 'insulated-leather' : 'leather'
    paragraph = 'Wipe surface dust gently with a soft, dry cloth and blot spills without rubbing. Check the care label for the leather type and finish before applying a cleaner. Use a suitable leather-care specialist for stains or thorough cleaning.'
    avoid = 'Machine washing, soaking, bleach and unapproved oils or conditioners.'
  } else if (insulated) {
    profile = 'insulated'
    paragraph = 'Blot surface marks gently and check the sewn label before cleaning the complete jacket. Use only the cleaning and drying method specified for its shell and filling. Let all padded areas dry completely before storing without tight compression.'
    avoid = 'Bleach, soaking, wringing the padding and washing without label approval.'
  } else if (wool) {
    profile = 'wool'
    paragraph = 'Brush loose dust gently from the wool-blend fabric and blot spills without rubbing. Use a cleaner experienced with wool garments for persistent stains or thorough cleaning. Let damp fabric dry naturally with its shape supported.'
    avoid = 'Bleach, soaking, wringing and machine washing unless the label permits it.'
  } else if (ids.has('denim')) {
    profile = 'denim'
    paragraph = 'Spot clean small marks gently between washes. If the complete garment label permits washing, turn the jacket inside out and use cool water with mild detergent and similar colors. Reshape while damp and air dry in shade.'
    avoid = 'Bleach, hot washing, vigorous scrubbing and leaving wet fabric folded.'
  } else if (ids.has('cotton-polyester-fleece') || ids.has('cotton-fleece')) {
    profile = 'fleece'
    paragraph = 'Blot marks gently to protect the fleece surface. If the complete garment label permits washing, turn it inside out and use cool water with mild detergent and similar colors. Reshape while damp and air dry with the weight supported.'
    avoid = 'Bleach, hot washing, wringing and abrasive stain scrubbing.'
  } else if (ids.has('polyester-satin')) {
    profile = 'satin'
    paragraph = 'Blot small marks gently without scuffing the satin. If the complete garment label permits washing, turn it inside out and use cool water, mild detergent and gentle movement. Reshape and air dry away from rough fasteners that could snag the surface.'
    avoid = 'Bleach, wringing, vigorous rubbing and direct ironing on the satin.'
  } else if (ids.has('nylon') || ids.has('soft-shell') || ids.has('cotton-twill')) {
    profile = ids.has('soft-shell') ? 'soft-shell' : ids.has('nylon') ? 'nylon' : 'twill'
    paragraph = 'Remove loose dirt gently and blot small marks with a soft cloth. If the complete garment label permits washing, use cool water, an appropriate mild cleaner and gentle movement. Air dry fully before storage, following any instructions for coatings and trims.'
    avoid = 'Bleach, fabric softener on technical finishes and unapproved solvents.'
  } else {
    profile = 'material-unspecified'
    paragraph = 'Remove loose surface dust gently with a soft, dry cloth and blot spills without rubbing. Check the sewn label before using water, detergent or any cleaning product. Use a cleaner familiar with the complete garment for stains or thorough cleaning.'
    avoid = 'Bleach, soaking, wringing and machine washing without label approval.'
  }
  const doOne = patchesOnly ? 'Store dry and flat without crushing raised lettering.' : insulated ? 'Store fully dry and loosely hung without compressing the padding.' : profile === 'fleece' ? 'Store fully dry, folded without heavy items pressing on it.' : 'Air after wear and store fully dry with its shape supported.'
  const doTwo = decorated && !patchesOnly ? 'Protect raised stitching and patch edges from rubbing or snagging.' : 'Blot moisture gently and let damp areas dry at room temperature.'
  return { profile, careInstructions: `${paragraph}\n\nDo: ${doOne}\nDo: ${doTwo}\nAvoid: ${avoid}\nAvoid: Tumble drying, direct heat and aggressive scrubbing.\n\n${CARE_CLOSING}` }
}
