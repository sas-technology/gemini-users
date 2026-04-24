import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAS Gemini Usage Analytics',
  description: 'Singapore American School — Gemini AI usage tracking dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
