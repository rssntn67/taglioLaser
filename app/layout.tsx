import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TaglioLaser — Preventivi online',
  description: 'Preventivi automatici per taglio laser. Carica il tuo file DXF e ottieni il prezzo istantaneamente.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
