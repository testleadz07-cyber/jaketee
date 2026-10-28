import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const restrictedPaths = [
    '/admin/',
    '/api/',
    '/checkout/',
    '/cart',
    '/profile/',
    '/order-confirmation/',
    '/search',
    '/*?*sort=',
    '/*?*filter=',
    '/*?*color=',
    '/*?*size=',
  ]

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: restrictedPaths,
      },
      {
        userAgent: 'bingbot',
        crawlDelay: 5,
        allow: '/',
        disallow: restrictedPaths,
      },
      {
        userAgent: [
          'GPTBot',
          'ClaudeBot',
          'PerplexityBot',
          'Bytespider',
          'CCBot',
          'Amazonbot',
          'meta-externalagent',
        ],
        disallow: '/',
      },
      {
        userAgent: ['AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'PetalBot'],
        disallow: '/',
      },
    ],
    sitemap: 'https://www.jacketee.com/sitemap.xml',
  }
}
