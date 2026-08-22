import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3002'),
  title: 'PaisaPilot — Personal Finance Agent',
  description: 'A privacy-first personal finance agent for categorising UPI transactions, spotting unusual spending, forecasting cash flow, and building savings plans.',
  openGraph: {
    title: 'PaisaPilot',
    description: 'Clarity for every rupee.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'PaisaPilot — Clarity for every rupee.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PaisaPilot',
    description: 'Clarity for every rupee.',
    images: ['/og.png'],
  },
  icons: { icon: '/og.png' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
