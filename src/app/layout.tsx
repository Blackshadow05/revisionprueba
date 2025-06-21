import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { UploadProvider } from '@/context/UploadContext'
import UploadIndicator from '@/components/UploadIndicator'
import UploadRecovery from '@/components/UploadRecovery'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Revisiones - Casitas',
  description: 'Sistema para gestionar revisiones de casitas',
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
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
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
