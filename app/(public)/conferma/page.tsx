import Link from 'next/link';
import { Suspense } from 'react';

function ConfermaContent({ orderId }: { orderId: string }) {
  return (
    <div className="max-w-xl mx-auto text-center py-24 px-6">
      <div className="text-5xl mb-6">✓</div>
      <h1 className="text-4xl font-black text-ink mb-4">Ordine ricevuto!</h1>
      <p className="text-gray-400 mb-2">
        Il tuo ordine <strong className="text-ink">#{orderId}</strong> è stato confermato.
      </p>
      <p className="text-gray-400 mb-10">
        Riceverai una email di conferma a breve. Ti contatteremo per organizzare i dettagli.
      </p>
      <Link href="/" className="bg-ink text-white px-8 py-3 text-sm font-semibold hover:opacity-80">
        Torna alla home
      </Link>
    </div>
  );
}

export default async function ConfermaPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  return (
    <Suspense fallback={null}>
      <ConfermaContent orderId={orderId ?? '—'} />
    </Suspense>
  );
}
