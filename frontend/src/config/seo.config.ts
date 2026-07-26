export interface SEOConfig {
  title: string
  description: string
  keywords: string[]
  author: string
  siteUrl: string
  siteName: string
  twitterHandle?: string
  locale: string
  themeColor: string
  ogImage?: string
  twitterImage?: string
}

export interface PageSEO {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  noIndex?: boolean
}

// Default SEO Configuration
export const defaultSEO: SEOConfig = {
  title: 'School SOS',
  description: 'ระบบแจ้ง ประสานงาน และติดตามการแก้ไขปัญหาภายในโรงเรียน',
  keywords: [
    'School SOS',
    'แจ้งเหตุ',
    'โรงเรียน',
    'ติดตามเหตุ',
  ],
  author: import.meta.env.VITE_AUTHOR || 'School SOS Team',
  siteUrl: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  siteName: import.meta.env.VITE_SITE_NAME || 'School SOS',
  locale: 'th_TH',
  themeColor: import.meta.env.VITE_THEME_COLOR || '#1E40AF',
}

// Generate full title
export function generateTitle(pageTitle?: string): string {
  if (!pageTitle)
    return defaultSEO.title

  return `${pageTitle} | ${defaultSEO.siteName}`
}

// Generate full URL
export function generateUrl(path?: string): string {
  const baseUrl = defaultSEO.siteUrl.replace(/\/$/, '')
  if (!path)
    return baseUrl

  const cleanPath = path.startsWith('/') ? path : `/${path}`

  return `${baseUrl}${cleanPath}`
}

// Generate full image URL
export function generateImageUrl(image?: string): string {
  if (!image)
    return generateUrl(defaultSEO.ogImage)

  // If image is already a full URL, return it
  if (image.startsWith('http://') || image.startsWith('https://'))
    return image

  return generateUrl(image)
}
