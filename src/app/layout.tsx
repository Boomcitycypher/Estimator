import type { Metadata } from 'next';
import './globals.css';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'R&G Imports',
  description: 'Dealership Operating System — Rent & Go Imports, Barbados',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0e1a2b" />
      </head>
      <body>
        <TopBar />
        <main className="pb-nav pt-14 min-h-screen">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
