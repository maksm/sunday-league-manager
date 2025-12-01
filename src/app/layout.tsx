import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { getLocale } from '@/i18n/config';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'Sunday League Manager',
  description: 'Manage your football league',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
