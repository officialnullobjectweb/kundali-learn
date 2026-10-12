import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/auth/Providers';

export const metadata: Metadata = {
  title: 'Kundali Learn — Interactive Vedic Chart',
  description: 'Learn Vedic astrology by manipulating a live kundali chart.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
