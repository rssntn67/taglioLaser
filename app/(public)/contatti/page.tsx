export default function ContattiPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-black text-ink mb-2">Contatti</h1>
      <p className="text-gray-400 mb-12">Per informazioni, richieste speciali o ordini su misura.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Email</p>
            <p className="text-sm text-ink">info@tagliolaser.it</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Telefono</p>
            <p className="text-sm text-ink">+39 000 000 0000</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Orari</p>
            <p className="text-sm text-ink">Lun–Ven 8:00–18:00</p>
          </div>
        </div>

        <div className="bg-mist border border-border p-8">
          <p className="text-sm text-gray-500 mb-6">
            Per la maggior parte delle richieste, usa il nostro strumento online:
          </p>
          <a
            href="/preventivo"
            className="inline-block bg-ink text-white px-6 py-3 text-sm font-semibold hover:opacity-80"
          >
            Calcola preventivo online →
          </a>
        </div>
      </div>
    </div>
  );
}
