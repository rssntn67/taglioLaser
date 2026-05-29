import { ReactNode } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-mist">
      <header className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-8">
          <Link href="/admin" className="text-sm font-black text-ink">Admin</Link>
          <nav className="flex gap-6 text-sm">
            <Link href="/admin/ordini" className="text-gray-500 hover:text-ink">Ordini</Link>
            <Link href="/admin/prezzi" className="text-gray-500 hover:text-ink">Prezzi</Link>
          </nav>
          <div className="ml-auto">
            <Link href="/" className="text-xs text-gray-400 hover:text-ink">← Sito pubblico</Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
