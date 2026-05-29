import DxfParser from 'dxf-parser';

export interface DxfCalcResult {
  metriLineari: number;
  entitaCount: number;
}

function dist2d(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

export function calcolaMetriLineari(dxfContent: string): DxfCalcResult {
  const parser = new DxfParser();
  const dxf = parser.parseSync(dxfContent.trim());

  if (!dxf) throw new Error('File DXF non valido');

  const entities = dxf.entities ?? [];
  let totaleMm = 0;
  let entitaCount = 0;

  for (const e of entities) {
    switch (e.type) {
      case 'LINE': {
        const line = e as { vertices: Array<{ x: number; y: number }> };
        totaleMm += dist2d(line.vertices[0], line.vertices[1]);
        entitaCount++;
        break;
      }
      case 'ARC': {
        // dxf-parser converts DXF degree angles to radians automatically
        const arc = e as { radius: number; startAngle: number; endAngle: number };
        let diff = arc.endAngle - arc.startAngle;
        if (diff <= 0) diff += 2 * Math.PI;
        totaleMm += arc.radius * diff;
        entitaCount++;
        break;
      }
      case 'CIRCLE': {
        const circle = e as { radius: number };
        totaleMm += 2 * Math.PI * circle.radius;
        entitaCount++;
        break;
      }
      case 'LWPOLYLINE':
      case 'POLYLINE': {
        const poly = e as { vertices: Array<{ x: number; y: number }>; shape?: boolean };
        const verts = poly.vertices;
        for (let i = 0; i < verts.length - 1; i++) {
          totaleMm += dist2d(verts[i], verts[i + 1]);
        }
        if (poly.shape && verts.length > 1) {
          totaleMm += dist2d(verts[verts.length - 1], verts[0]);
        }
        entitaCount++;
        break;
      }
      case 'ELLIPSE': {
        // Approssimazione di Ramanujan
        const ellipse = e as {
          majorAxisEndPoint: { x: number; y: number };
          axisRatio: number;
        };
        const ep = ellipse.majorAxisEndPoint;
        const a = Math.sqrt(ep.x ** 2 + ep.y ** 2);
        const b = a * ellipse.axisRatio;
        const h = (a - b) ** 2 / (a + b) ** 2;
        totaleMm += Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
        entitaCount++;
        break;
      }
    }
  }

  return { metriLineari: totaleMm / 1000, entitaCount };
}
