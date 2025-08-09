import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'mAIcrolearning - Personalized AI Education',
  description: 'Personalized, actionable, hands-on AI learning for all industries. Master AI fundamentals through micro-learning designed for non-tech professionals.',
  keywords: 'AI education, machine learning, micro-learning, personalized learning, industry-specific AI',
  authors: [{ name: 'mAIcrolearning Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'mAIcrolearning - Personalized AI Education',
    description: 'Master AI fundamentals through personalized micro-learning',
    type: 'website',
    locale: 'en_US',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">
        <div id="root" className="min-h-full">
          {children}
        </div>
      </body>
    </html>
  )
}
