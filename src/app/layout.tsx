import type { Metadata } from 'next';
import './globals.css';
import '../styles/animations.css';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/lib/firebase/auth';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'KiroVerse - AI-Powered Code Dojo with Blockchain Credentials',
  description: 'Where AI mentorship meets verifiable blockchain achievements. Learn coding with personalized AI guidance and earn unfakeable NFT skill badges.',
  keywords: 'AI mentorship, blockchain credentials, coding education, NFT badges, skill verification, Kiro',
  authors: [{ name: 'Amaan Ahmad', url: 'https://github.com/iamaanahmad' }],
  creator: 'Amaan Ahmad',
  publisher: 'KiroVerse',
  icons: {
    icon: [
      { url: '/favicon-16.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/favicon.svg', sizes: '32x32', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'KiroVerse - AI-Powered Code Dojo with Blockchain Credentials',
    description: 'Where AI mentorship meets verifiable blockchain achievements',
    url: 'https://kiroverse.vercel.app',
    siteName: 'KiroVerse',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KiroVerse - AI-Powered Code Dojo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KiroVerse - AI-Powered Code Dojo with Blockchain Credentials',
    description: 'Where AI mentorship meets verifiable blockchain achievements',
    images: ['/og-image.png'],
    creator: '@KiroVerse',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body text-foreground antialiased dark'
        )}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
