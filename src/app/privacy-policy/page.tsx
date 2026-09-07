'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Header } from '@/components/header'
import { Shield, Mail } from 'lucide-react'
import { Breadcrumbs } from '@/components/breadcrumbs'

const LAST_UPDATED = 'July 8, 2026'
const SUPPORT_EMAIL = 'support@luxestore.com'

const sections = [
  {
    heading: '1. Introduction',
    body: `Jacketee ("we", "us", or "our") respects your privacy and is committed to protecting the personal data you share with us. This Privacy Policy explains what information we collect when you visit or shop with us, why we collect it, how we use and protect it, and the choices and rights you have regarding your data. By using our site, you agree to the collection and use of information in accordance with this policy.`,
  },
  {
    heading: '2. Information We Collect',
    body: `We collect information you provide directly to us, information collected automatically as you use our site, and information from third parties.`,
    list: [
      'Account information: name, email address, and password (stored as a secure hash) when you register or check out.',
      'Order information: shipping and billing address, phone number, and order history.',
      'Payment information: payments are processed by Stripe and PayPal. We do not store full card numbers on our servers — payment card data is handled directly by our payment processors under their own PCI-compliant systems.',
      'Communications: messages you send via our contact form, newsletter subscriptions, and return/refund requests.',
      'Usage data: pages viewed, products browsed, cart activity, and device/browser information, collected via cookies and similar technologies (see our Cookie Policy).',
      'Content you submit: product reviews, ratings, and any images or text you upload.',
    ],
  },
  {
    heading: '3. How We Use Your Information',
    list: [
      'To process and fulfill orders, payments, and returns.',
      'To create and manage your account and authenticate your sessions.',
      'To communicate with you about orders, customer support requests, and (with your consent) marketing and newsletters.',
      'To improve our website, products, and customer experience.',
      'To detect, prevent, and address fraud, abuse, or security issues.',
      'To comply with legal obligations, such as tax and accounting requirements.',
    ],
  },
  {
    heading: '4. Legal Basis for Processing (GDPR)',
    body: `If you are located in the European Economic Area (EEA) or UK, we process your personal data on the following legal bases: performance of a contract (processing your order), consent (marketing communications and non-essential cookies), legitimate interests (fraud prevention, service improvement), and compliance with legal obligations (tax records).`,
  },
  {
    heading: '5. Cookies and Tracking Technologies',
    body: `We use cookies and similar technologies to operate our site, remember your preferences, keep you signed in, and understand how our site is used. You can manage your cookie preferences at any time using the "Cookie Preferences" link in the footer. For full details on the categories of cookies we use and their purposes, see our Cookie Policy.`,
  },
  {
    heading: '6. How We Share Your Information',
    body: `We do not sell your personal information. We share information only with:`,
    list: [
      'Payment processors (Stripe, PayPal) to process transactions securely.',
      'Service providers who help us operate our business, such as our database host (MongoDB Atlas), image hosting (Cloudinary), and email delivery providers.',
      'Law enforcement or regulators when required by law, or to protect our rights, property, or safety.',
      'A successor entity in the event of a merger, acquisition, or sale of assets, subject to this policy or a materially similar one.',
    ],
  },
  {
    heading: '7. Data Retention',
    body: `We retain personal data for as long as necessary to fulfill the purposes described in this policy, including to satisfy legal, accounting, or reporting obligations. Order and transaction records are typically retained for at least the period required by applicable tax law. You may request deletion of your account data at any time, subject to our legal retention obligations.`,
  },
  {
    heading: '8. Your Privacy Rights',
    body: `Depending on where you live, you may have some or all of the following rights regarding your personal data:`,
    list: [
      'Access — request a copy of the personal data we hold about you.',
      'Correction — request that we correct inaccurate or incomplete data.',
      'Deletion — request that we delete your personal data ("right to be forgotten").',
      'Portability — request a copy of your data in a machine-readable format.',
      'Objection / Restriction — object to or request restriction of certain processing.',
      'Opt-out of sale/sharing — we do not sell personal data, but California residents may still opt out of any data sharing for cross-context advertising via our Cookie Preferences.',
      'Withdraw consent — where processing is based on consent (e.g. marketing emails), you may withdraw it at any time.',
    ],
    footer: `To exercise any of these rights, email us at ${SUPPORT_EMAIL} or use the contact form. We will respond within the timeframe required by applicable law (e.g. 30 days under GDPR, 45 days under CCPA).`,
  },
  {
    heading: '9. California Privacy Rights (CCPA/CPRA)',
    body: `California residents have the right to know what personal information is collected, request deletion, correct inaccurate information, and opt out of the "sale" or "sharing" of personal information. We do not sell personal information for money. We will not discriminate against you for exercising your privacy rights.`,
  },
  {
    heading: '10. Children’s Privacy',
    body: `Our services are not directed to children under 16, and we do not knowingly collect personal information from children. If we learn we have collected data from a child without parental consent, we will delete it promptly.`,
  },
  {
    heading: '11. Data Security',
    body: `We use industry-standard technical and organizational measures — including encrypted connections (HTTPS/TLS), hashed passwords, and access controls — to protect your data. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    heading: '12. International Data Transfers',
    body: `Your information may be transferred to and processed in countries other than your own, including the United States, where our servers and service providers operate. Where required, we rely on appropriate safeguards (such as standard contractual clauses) for such transfers.`,
  },
  {
    heading: '13. Third-Party Links',
    body: `Our site may contain links to third-party websites. We are not responsible for the privacy practices of those sites and encourage you to review their privacy policies.`,
  },
  {
    heading: '14. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will post the revised policy on this page with an updated "Last Updated" date, and where changes are material, we will provide additional notice (such as an email or banner notice).`,
  },
  {
    heading: '15. Contact Us',
    body: `If you have questions about this Privacy Policy or how we handle your data, contact us at:`,
  },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header showBack backHref="/" />

      <main className="flex-1 container mx-auto px-4 py-12">
        <Breadcrumbs items={[{ label: 'Privacy Policy' }]} className="mb-6 max-w-4xl mx-auto" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last Updated: {LAST_UPDATED}</p>
          </div>

          <Card className="border-2">
            <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-8 pt-6">
              {sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-xl font-semibold mb-3 not-prose">{section.heading}</h2>
                  {section.body && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{section.body}</p>
                  )}
                  {section.list && (
                    <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
                      {section.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {section.footer && (
                    <p className="text-sm text-muted-foreground leading-relaxed mt-3">{section.footer}</p>
                  )}
                </section>
              ))}

              <div className="flex items-center gap-3 rounded-lg bg-muted p-4 text-sm">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>
                  Email:{' '}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
                    {SUPPORT_EMAIL}
                  </a>{' '}
                  · Or use our{' '}
                  <a href="/contact" className="text-primary hover:underline">
                    Contact page
                  </a>
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
