'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, FormEvent, Suspense } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function CheckoutForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const materialId = Number(params.get('materialId'));
  const thicknessId = Number(params.get('thicknessId'));
  const quantita = Number(params.get('quantita'));
  const metriLineari = Number(params.get('metriLineari'));
  const dxfKey = params.get('dxfKey') ?? '';
  const totale = Number(params.get('totale'));

  if (!materialId || !thicknessId || !dxfKey) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Preventivo non valido. <a href="/preventivo" className="underline">Ricomincia</a>.</p>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const payload = {
      nome: form.get('nome') as string,
      email: form.get('email') as string,
      azienda: (form.get('azienda') as string) || undefined,
      pIva: (form.get('pIva') as string) || undefined,
      note: (form.get('note') as string) || undefined,
      materialId,
      thicknessId,
      quantita,
      metriLineari,
      dxfKey,
    };

    try {
      const res = await fetch('/api/ordini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/conferma?orderId=${data.orderId}`);
      } else {
        setError(data.error ?? 'Errore durante la conferma');
      }
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div>
        <h1 className="text-3xl font-black text-ink mb-8">I tuoi dati</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Nome e Cognome *" name="nome" id="nome" required />
          <Input label="Email *" name="email" id="email" type="email" required />
          <Input label="Azienda" name="azienda" id="azienda" placeholder="Facoltativo" />
          <Input label="P.IVA" name="pIva" id="pIva" placeholder="Facoltativo" />
          <div className="space-y-1">
            <label htmlFor="note" className="block text-xs font-semibold text-ink uppercase tracking-wide">
              Note
            </label>
            <textarea
              name="note"
              id="note"
              rows={3}
              placeholder="Tolleranze particolari, finiture richieste..."
              className="w-full border border-border px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ink resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Invio in corso...' : 'Conferma ordine →'}
          </Button>
        </form>
      </div>

      <div className="bg-mist border border-border p-8 h-fit">
        <h2 className="text-sm font-black text-ink mb-6 uppercase tracking-wide">Riepilogo</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Quantità</span>
            <span className="font-semibold">{quantita} pz</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Metri lineari</span>
            <span className="font-semibold">{metriLineari.toFixed(3)} ml</span>
          </div>
          <div className="border-t border-border pt-3 mt-3 flex justify-between items-center">
            <span className="font-semibold text-ink">Totale</span>
            <span className="text-2xl font-black text-ink">€ {totale.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-400">IVA esclusa</p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Suspense fallback={<div>Caricamento...</div>}>
        <CheckoutForm />
      </Suspense>
    </div>
  );
}
