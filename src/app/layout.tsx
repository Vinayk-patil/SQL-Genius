import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { Toaster } from '@/components/ui/toaster';
import { AppHeader } from '@/components/sql-genius/AppHeader';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SQL Genius - AI-Powered SQL Practice',
  description: 'Interactive SQL practice with AI-generated problems and feedback.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <WorkspaceProvider>
          <AppHeader />
          <main className="flex-grow">
            {children}
          </main>
          <Toaster />
        </WorkspaceProvider>
      </body>
    </html>
  );
}
