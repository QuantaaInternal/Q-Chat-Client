import { cn } from '@/lib/utils';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import { fontBriColage, fontDepartureMono, fontJost } from '../../assets/fonts';
import './globals.css';
import QueryProvider from '@/lib/QueryProvider';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/sonner';
import AuthSessionSync from '@/components/auth/AuthSessionSync';
import '@crayonai/react-ui/styles/index.css';

export const metadata: Metadata = {
  title:
    'Qchat(Beta): Your AI-Powered guide to Mutual Funds, FDs, and Tax Saving',
  description:
    'Try Qchat! Get clear, reliable answers on mutual funds, tax-saving, FDs, debt funds, and more',
  keywords: [
    'Qchat AI assistant',
    'Indian mutual funds guide',
    'best mutual funds India',
    'FD rates comparison India',
    'fixed deposit calculator',
    'tax saving investments India',
    'ELSS tax saving funds',
    'debt funds overview',
    'SIP investment tips',
    'NPS vs PPF comparison',
    'tax deduction under 80C',
    'wealth management chatbot',
    'investment advice AI,',
    'Qchat for Gen Z investors',
  ],
  openGraph: {
    title:
      'Qchat(Beta): Your AI-Powered guide to Mutual Funds, FDs, and Tax Saving',
    description:
      'Try Qchat! Get clear, reliable answers on mutual funds, tax-saving, FDs, debt funds, and more',
    images: [
      'https://ik.imagekit.io/hmeujbosa/QBanner.png?updatedAt=1754347327241',
    ],
    url: 'https://chat.quantaa.club',
  },
  twitter: {
    title:
      'Qchat(Beta): Your AI-Powered guide to Mutual Funds, FDs, and Tax Saving',
    description:
      'Try Qchat! Get clear, reliable answers on mutual funds, tax-saving, FDs, debt funds, and more',
    images: [
      'https://ik.imagekit.io/hmeujbosa/QBanner.png?updatedAt=1754347327241',
    ],
    card: 'summary_large_image',
    creator: '@teamquantaa',
    site: '@teamquantaa',
  },
  appleWebApp: {
    title:
      'Qchat(Beta): Your AI-Powered guide to Mutual Funds, FDs, and Tax Saving',
    startupImage: [
      'https://ik.imagekit.io/hmeujbosa/QBanner.png?updatedAt=1754347327241',
    ],
  },
  category: 'technology',
  authors: [
    { name: 'Team Quantaa', url: 'https://www.quantaa.club' },
    { name: 'Tejas Joshi', url: '' },
  ],
  creator: 'Team Quantaa',
  verification: {
    google: '8zmsgtRy5MbitlBu9DMLcVY-t5fjsHZrxepdBHjuELI',
  },
};

export const viewport: Viewport = {
  themeColor: '#181818',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <html lang="en" suppressHydrationWarning={true}>
        <body
          className={cn(
            `dark antialiased ${fontBriColage.variable} ${fontDepartureMono.variable} ${fontJost.variable}`,
          )}
        >
          <AuthSessionSync />
          {children}
          <Toaster />
          <ReactQueryDevtools initialIsOpen={false} />
        </body>
        <Analytics />
      </html>
    </QueryProvider>
  );
}
