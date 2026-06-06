import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ColorSchemeScript } from '@mantine/core'
import './globals.css'
import { AgUIProvider } from './providers/AgUIProvider'
import { ThemeProvider } from './providers/ThemeProvider'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tailored — AI Job Search',
  description: 'AI-powered job search assistant',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <ThemeProvider>
          <AgUIProvider url="/api/agents/orchestrate">
            {children}
          </AgUIProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
