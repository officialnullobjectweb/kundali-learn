import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kundali Learn — Interactive Vedic Chart',
  description: 'Learn Vedic astrology by manipulating a live kundali chart.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
