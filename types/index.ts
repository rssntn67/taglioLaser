export interface ThicknessWithPrice {
  id: number;
  valore: number;
  price: { quotaFissaEur: number; costoPerMetroEur: number } | null;
}

export interface MaterialWithThicknesses {
  id: number;
  nome: string;
  slug: string;
  thicknesses: ThicknessWithPrice[];
}

export interface DxfParseResult {
  metriLineari: number;
  entitaCount: number;
  dxfKey: string;
}

export interface PreventivoResult {
  quotaFissaTotale: number;
  costoTaglioTotale: number;
  totale: number;
}

export interface OrderPayload {
  nome: string;
  email: string;
  azienda?: string;
  pIva?: string;
  note?: string;
  materialId: number;
  thicknessId: number;
  quantita: number;
  metriLineari: number;
  dxfKey: string;
}
