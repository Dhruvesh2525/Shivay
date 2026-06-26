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
  themeColor: '#abd600',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anybody:wght@100..900&family=Hanken+Grotesk:wght@100..900&family=JetBrains+Mono:wght@100..900&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans relative overflow-x-hidden" suppressHydrationWarning>
        {/* Dynamic 3D Mesh Grid Background */}
        <div className="mesh-grid-3d" />

        {/* Ambient Floating Neon Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-5]">
          <div className="absolute top-[10%] left-[-10%] w-[35vw] h-[35vw] bg-primary/10 rounded-full blur-[100px] animate-blob-1" />
          <div className="absolute bottom-[20%] right-[-10%] w-[40vw] h-[40vw] bg-secondary/8 rounded-full blur-[120px] animate-blob-2" />
          <div className="absolute top-[50%] left-[40%] w-[25vw] h-[25vw] bg-primary/5 rounded-full blur-[90px] animate-blob-3" />
        </div>

        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
