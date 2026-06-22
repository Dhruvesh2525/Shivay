// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'Shivay — The Cricketing Hub',
  description: 'Book premium Cricket Turfs and Pickleball Courts at Shivay Box Cricket and Pickleball, Karai.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport = {
  themeColor: '#34D399',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-[#0A0F0D] text-[#F0FDF4]">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
