import Link from 'next/link';

const MATERIALI = [
  { nome: 'Acciaio Inox', desc: 'Spessori 0.5–10mm' },
  { nome: 'Acciaio al Carbonio', desc: 'Spessori 1–15mm' },
  { nome: 'Alluminio', desc: 'Spessori 0.5–8mm' },
  { nome: 'Ottone / Rame', desc: 'Spessori 0.5–5mm' },
];

const VANTAGGI = [
  { titolo: '±0.1mm', desc: 'Precisione di taglio' },
  { titolo: '24/48h', desc: 'Tempi di consegna' },
  { titolo: 'DXF', desc: 'Upload diretto del file' },
  { titolo: 'Online', desc: 'Preventivo istantaneo' },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
            Servizio professionale di taglio laser
          </p>
          <h1 className="text-6xl font-black text-ink leading-none mb-6">
            Precisione<br />al decimo<br />di millimetro.
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-md">
            Carica il tuo file DXF, scegli materiale e spessore: ottieni il preventivo in pochi secondi.
          </p>
          <div className="flex gap-4">
            <Link
              href="/preventivo"
              className="bg-ink text-white px-8 py-4 font-semibold text-sm hover:opacity-80 transition-opacity"
            >
              Calcola preventivo →
            </Link>
            <Link
              href="/contatti"
              className="border border-border text-ink px-8 py-4 font-semibold text-sm hover:border-ink transition-colors"
            >
              Contattaci
            </Link>
          </div>
        </div>
      </section>

      {/* Vantaggi */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {VANTAGGI.map((v) => (
            <div key={v.titolo}>
              <div className="text-3xl font-black text-ink mb-1">{v.titolo}</div>
              <div className="text-sm text-gray-400">{v.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Materiali */}
      <section className="bg-mist">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-black text-ink mb-8">Materiali lavorati</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {MATERIALI.map((m) => (
              <div key={m.nome} className="bg-white border border-border p-6">
                <div className="text-sm font-bold text-ink mb-1">{m.nome}</div>
                <div className="text-xs text-gray-400">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl font-black text-ink mb-4">Pronto a iniziare?</h2>
        <p className="text-gray-400 mb-8">Nessuna registrazione richiesta. Preventivo gratuito e immediato.</p>
        <Link
          href="/preventivo"
          className="inline-block bg-ink text-white px-10 py-4 font-semibold text-sm hover:opacity-80"
        >
          Calcola il tuo preventivo →
        </Link>
      </section>
    </>
  );
}
