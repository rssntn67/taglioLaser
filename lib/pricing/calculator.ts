export interface PriceParams {
  quotaFissaEur: number;
  costoPerMetroEur: number;
  metriLineari: number;
  quantita: number;
}

export interface PreventivoResult {
  quotaFissaTotale: number;
  costoTaglioTotale: number;
  totale: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calcolaPreventivo(params: PriceParams): PreventivoResult {
  const { quotaFissaEur, costoPerMetroEur, metriLineari, quantita } = params;
  const quotaFissaTotale = round2(quotaFissaEur * quantita);
  const costoTaglioTotale = round2(costoPerMetroEur * metriLineari * quantita);
  const totale = round2(quotaFissaTotale + costoTaglioTotale);
  return { quotaFissaTotale, costoTaglioTotale, totale };
}
