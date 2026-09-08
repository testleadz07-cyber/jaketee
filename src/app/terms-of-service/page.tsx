'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Header } from '@/components/header'
import { FileText, Mail } from 'lucide-react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Footer } from '@/components/footer'

const LAST_UPDATED = 'July 8, 2026'
const SUPPORT_EMAIL = 'support@jacketee.com'

const sections = [
  {
    heading: '1. Agreement to Terms',
    body: `These Terms of Service ("Terms") govern your access to and use of the Jacketee website, mobile experience, and services (collectively, the "Service"). By creating an account, placing an order, or otherwise using the Service, you agree to be bound by these Terms and our Privacy Policy. If you do not agree, please do not use the Service.`,
  },
  {
    heading: '2. Eligibility',
    body: `You must be at least 18 years old, or the age of legal majority in your jurisdiction, to create an account or place an order. By using the Service, you represent that you meet this requirement.`,
  },
  {
    heading: '3. Accounts',
    list: [
      'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.',
      'You must provide accurate, current, and complete information when creating an account or placing an order.',
      'We reserve the right to suspend or terminate accounts that violate these Terms, provide false information, or engage in fraudulent activity.',
    ],
  },
  {
    heading: '4. Products, Pricing & Availability',
    body: `We strive to display product details, pricing, and availability accurately. However, errors may occur, and we reserve the right to correct pricing or descriptive errors, cancel orders arising from such errors, and update or discontinue products at any time without notice. All prices are listed in the currency indicated at checkout and exclude taxes and shipping unless stated otherwise.`,
  },
  {
    heading: '5. Orders & Payment',
    list: [
      'Placing an order constitutes an offer to purchase, which we may accept or decline for any reason, including suspected fraud or pricing errors.',
      'Payments are processed securely through Stripe and/or PayPal. By submitting payment, you represent that you are authorized to use the selected payment method.',
      'You agree to pay all charges incurred, including applicable taxes and shipping fees, at the prices in effect when the charges are incurred.',
      'Discount codes and promotions are subject to specific terms and may be modified or withdrawn at any time.',
    ],
  },
  {
    heading: '6. Shipping & Risk of Loss',
    body: `Estimated delivery times are provided for convenience and are not guaranteed. Risk of loss and title for products pass to you upon our delivery to the shipping carrier, unless otherwise required by applicable law. See our Shipping Information page for full details.`,
  },
  {
    heading: '7. Returns, Refunds & Cancellations',
    body: `Returns and refunds are handled in accordance with our Returns & Exchanges policy, available on our Returns page. Refunds, where approved, will be issued to the original payment method within a reasonable time following receipt and inspection of returned items.`,
  },
  {
    heading: '8. User Content & Reviews',
    body: `If you submit reviews, ratings, comments, or other content, you grant us a non-exclusive, worldwide, royalty-free, perpetual license to use, reproduce, modify, and display that content in connection with the Service. You represent that your content does not infringe any third-party rights and is not false, defamatory, obscene, or unlawful. We reserve the right to remove any content at our discretion.`,
  },
  {
    heading: '9. Prohibited Conduct',
    list: [
      'Using the Service for any unlawful purpose or in violation of these Terms.',
      'Attempting to gain unauthorized access to our systems, other accounts, or data.',
      'Interfering with or disrupting the integrity or performance of the Service.',
      'Using automated means (bots, scrapers) to access the Service without our prior written consent.',
      'Uploading viruses, malicious code, or engaging in fraudulent payment activity.',
    ],
  },
  {
    heading: '10. Intellectual Property',
    body: `All content on the Service — including text, graphics, logos, product images, and software — is owned by or licensed to Jacketee and is protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works from our content without prior written permission.`,
  },
  {
    heading: '11. Third-Party Links & Services',
    body: `The Service may contain links to third-party websites or services (including payment processors) that are not owned or controlled by us. We are not responsible for the content, policies, or practices of any third-party sites.`,
  },
  {
    heading: '12. Disclaimer of Warranties',
    body: `The Service and all products are provided "as is" and "as available" without warranties of any kind, express or implied, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement, to the fullest extent permitted by law.`,
  },
  {
    heading: '13. Limitation of Liability',
    body: `To the fullest extent permitted by law, Jacketee and its officers, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability for any claim arising from these Terms or the Service shall not exceed the amount you paid for the product(s) giving rise to the claim.`,
  },
  {
    heading: '14. Indemnification',
    body: `You agree to indemnify and hold harmless Jacketee from any claims, damages, losses, or expenses (including reasonable attorneys' fees) arising from your use of the Service or violation of these Terms.`,
  },
  {
    heading: '15. Governing Law & Dispute Resolution',
    body: `These Terms are governed by the laws of the jurisdiction in which Jacketee is incorporated, without regard to conflict-of-laws principles. Any disputes arising from these Terms or the Service shall first be attempted to be resolved informally by contacting customer support; unresolved disputes may be subject to binding arbitration or the courts of competent jurisdiction, as permitted by applicable consumer protection law.`,
  },
  {
    heading: '16. Changes to These Terms',
    body: `We may revise these Terms from time to time. The updated version will be indicated by an updated "Last Updated" date. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.`,
  },
  {
    heading: '17. Severability',
    body: `If any provision of these Terms is found unenforceable, the remaining provisions will remain in full force and effect.`,
  },
  {
    heading: '18. Contact Us',
    body: `Questions about these Terms should be directed to:`,
  },
]

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12">
        <Breadcrumbs items={[{ label: 'Terms of Service' }]} className="mb-6 max-w-4xl mx-auto" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
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
      <Footer />
    </div>
  )
}
