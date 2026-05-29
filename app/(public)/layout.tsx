import Link from 'next/link';
import { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-black text-ink tracking-tight">
            ◆ TaglioLaser
          </Link>
          <nav className="flex items-center gap-6 text-sm text-ink">
            <Link href="/preventivo" className="hover:opacity-60">Preventivo</Link>
            <Link href="/contatti" className="hover:opacity-60">Contatti</Link>
            <Link href="/preventivo" className="bg-ink text-white px-4 py-2 text-xs font-semibold hover:opacity-80">
              Calcola →
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border mt-24">
        <div className="max-w-6xl mx-auto px-6 py-8 text-xs text-gray-400">
          © {new Date().getFullYear()} TaglioLaser — Tutti i diritti riservati
        </div>
      </footer>
    </>
  );
}
