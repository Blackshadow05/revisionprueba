import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import { UploadProvider } from '@/context/UploadContext'
import { ToastProvider } from '@/context/ToastContext'
import UploadIndicator from '@/components/UploadIndicator'
import UploadRecovery from '@/components/UploadRecovery'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Revisión de Casitas',
  description: 'Sistema moderno para la gestión y control de revisiones',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#757575" />
        <link rel="icon" type="image/png" sizes="152x152" href="/icons/icon-152x152.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
                      <UploadProvider>
            {children}
            <UploadIndicator />
            <UploadRecovery />
          </UploadProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
