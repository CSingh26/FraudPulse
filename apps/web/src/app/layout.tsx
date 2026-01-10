import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';

import './globals.css';
import { SideNav } from '@/components/side-nav';

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'FraudPulse Analyst Console',
  description: 'Real-time fraud detection and investigation dashboard.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={plexSans.className}>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <div className="flex min-h-screen">
            <aside className="w-64 border-r border-slate-200 bg-white/70 backdrop-blur">
              <div className="px-6 py-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">FraudPulse</p>
                <h1 className="mt-3 text-xl font-semibold text-slate-900">Analyst Console</h1>
                <p className="mt-2 text-sm text-slate-500">Real-time monitoring workspace</p>
              </div>
              <SideNav />
            </aside>
            <div className="flex min-h-screen flex-1 flex-col">
              <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Fraud Operations
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">Active Overview</h2>
                </div>
                <div className="text-sm text-slate-500">Live pipeline health</div>
              </header>
              <main className="flex-1 px-8 py-8">{children}</main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
