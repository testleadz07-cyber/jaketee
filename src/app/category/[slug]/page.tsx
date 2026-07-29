// Resolution and the redirect both happen in layout.tsx - see the note there
// for why (a Next.js dev-webpack quirk pulls Mongoose into a browser bundle
// when a mongoose-importing module is reached from page.tsx instead of
// layout.tsx). This file intentionally does nothing.
export default function LegacyCategoryPage() {
  return null
}
