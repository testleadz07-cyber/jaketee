'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Cookie, Mail } from 'lucide-react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { openCookiePreferences } from '@/lib/cookie-consent'
import { Footer } from '@/components/footer'

const LAST_UPDATED = 'July 8, 2026'
const SUPPORT_EMAIL = 'support@jacketee.com'

const categories = [
  {
    name: 'Strictly Necessary Cookies',
    required: true,
    description:
      'These cookies are essential for the site to function and cannot be switched off. They enable core functionality such as keeping you signed in, remembering items in your shopping cart, securing checkout, and load-balancing.',
    examples: 'Session/auth cookies (NextAuth), cart contents, CSRF protection, cookie consent preference itself.',
  },
  {
    name: 'Functional Cookies',
    required: false,
    description:
      'These cookies allow us to remember choices you make (such as region, currency, or recently viewed products) to provide a more personalized experience.',
    examples: 'Recently viewed items, display preferences, wishlist persistence.',
  },
  {
    name: 'Analytics Cookies',
    required: false,
    description:
      'These cookies help us understand how visitors interact with our site by collecting information anonymously, so we can measure and improve performance.',
    examples: 'Page view and traffic analytics (only set if/when enabled).',
  },
  {
    name: 'Marketing Cookies',
    required: false,
    description:
      'These cookies may be used to deliver relevant advertising and measure the effectiveness of marketing campaigns, including on third-party platforms.',
    examples: 'Ad-platform pixels and retargeting tags (only set if/when enabled).',
  },
]

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12">
        <Breadcrumbs items={[{ label: 'Cookie Policy' }]} className="mb-6 max-w-4xl mx-auto" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Cookie className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Cookie Policy</h1>
            <p className="text-muted-foreground">Last Updated: {LAST_UPDATED}</p>
          </div>

          <Card className="border-2">
            <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-8 pt-6">
              <section>
                <h2 className="text-xl font-semibold mb-3 not-prose">1. What Are Cookies?</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cookies are small text files placed on your device when you visit a website. They are widely used
                  to make websites work more efficiently, remember your preferences, and provide information to the
                  site owner. We also use similar technologies such as local storage.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 not-prose">2. How We Use Cookies</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We use cookies to operate essential site features, remember your preferences, and — only with your
                  consent — to understand site usage and support marketing. You can manage your preferences at any
                  time below.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 not-prose">3. Categories of Cookies We Use</h2>
                <div className="space-y-4 not-prose">
                  {categories.map((cat) => (
                    <div key={cat.name} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{cat.name}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            cat.required
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {cat.required ? 'Always Active' : 'Optional'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{cat.description}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Examples: </span>
                        {cat.examples}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 not-prose">4. Managing Your Preferences</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  You can change your cookie preferences at any time. Strictly necessary cookies cannot be disabled
                  since they are required for the site to function.
                </p>
                <Button onClick={() => openCookiePreferences()}>Manage Cookie Preferences</Button>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 not-prose">5. Browser Controls</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Most browsers also let you control cookies through their settings, including blocking or deleting
                  them. Note that disabling essential cookies through your browser may prevent parts of the site,
                  such as checkout or sign-in, from working correctly.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 not-prose">6. Changes to This Policy</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We may update this Cookie Policy from time to time to reflect changes in the cookies we use or for
                  legal reasons. Please revisit this page periodically. See also our{' '}
                  <a href="/privacy-policy" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                  .
                </p>
              </section>

              <div className="flex items-center gap-3 rounded-lg bg-muted p-4 text-sm">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>
                  Questions? Email{' '}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
                    {SUPPORT_EMAIL}
                  </a>
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
