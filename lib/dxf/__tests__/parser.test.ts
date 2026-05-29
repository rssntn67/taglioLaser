import { calcolaMetriLineari } from '../parser';

// LINE di 100mm lungo l'asse X
const DXF_LINE_100MM = `
0
SECTION
2
ENTITIES
0
LINE
8
0
10
0.0
20
0.0
30
0.0
11
100.0
21
0.0
31
0.0
0
ENDSEC
0
EOF
`;

// ARC di raggio 100mm, da 0° a 90° → lunghezza = π/2 × 100 ≈ 157.08mm
const DXF_ARC_R100_90DEG = `
0
SECTION
2
ENTITIES
0
ARC
8
0
10
0.0
20
0.0
30
0.0
40
100.0
50
0.0
51
90.0
0
ENDSEC
0
EOF
`;

// CIRCLE di raggio 50mm → perimetro = 2π×50 ≈ 314.16mm
const DXF_CIRCLE_R50 = `
0
SECTION
2
ENTITIES
0
CIRCLE
8
0
10
0.0
20
0.0
30
0.0
40
50.0
0
ENDSEC
0
EOF
`;

describe('calcolaMetriLineari', () => {
  it('calcola una linea di 100mm = 0.1 metri', () => {
    const result = calcolaMetriLineari(DXF_LINE_100MM);
    expect(result.metriLineari).toBeCloseTo(0.1, 4);
    expect(result.entitaCount).toBe(1);
  });

  it('calcola il perimetro di un cerchio r=50mm ≈ 0.3142 metri', () => {
    const result = calcolaMetriLineari(DXF_CIRCLE_R50);
    expect(result.metriLineari).toBeCloseTo(2 * Math.PI * 50 / 1000, 4);
    expect(result.entitaCount).toBe(1);
  });

  it('restituisce 0 per DXF senza entità', () => {
    const empty = '0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF\n';
    const result = calcolaMetriLineari(empty);
    expect(result.metriLineari).toBe(0);
    expect(result.entitaCount).toBe(0);
  });

  it('calcola un arco di 90° r=100mm ≈ 0.1571 metri', () => {
    const result = calcolaMetriLineari(DXF_ARC_R100_90DEG);
    expect(result.metriLineari).toBeCloseTo((Math.PI / 2 * 100) / 1000, 4);
    expect(result.entitaCount).toBe(1);
  });

  it('lancia errore per stringa non DXF', () => {
    expect(() => calcolaMetriLineari('non valido')).toThrow();
  });
});
