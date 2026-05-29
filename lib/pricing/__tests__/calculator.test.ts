import { calcolaPreventivo } from '../calculator';

describe('calcolaPreventivo', () => {
  it('calcola quota fissa + costo taglio + totale', () => {
    const result = calcolaPreventivo({
      quotaFissaEur: 1.50,
      costoPerMetroEur: 4.00,
      metriLineari: 3.45,
      quantita: 10,
    });
    expect(result.quotaFissaTotale).toBe(15.00);       // 1.50 × 10
    expect(result.costoTaglioTotale).toBe(138.00);     // 4.00 × 3.45 × 10
    expect(result.totale).toBe(153.00);
  });

  it('gestisce quantità 1', () => {
    const result = calcolaPreventivo({
      quotaFissaEur: 2.00,
      costoPerMetroEur: 5.00,
      metriLineari: 1.0,
      quantita: 1,
    });
    expect(result.totale).toBe(7.00);
  });

  it('arrotonda a 2 decimali', () => {
    const result = calcolaPreventivo({
      quotaFissaEur: 1.00,
      costoPerMetroEur: 3.333,
      metriLineari: 1.0,
      quantita: 1,
    });
    expect(result.costoTaglioTotale).toBe(3.33);
    expect(result.totale).toBe(4.33);
  });
});
