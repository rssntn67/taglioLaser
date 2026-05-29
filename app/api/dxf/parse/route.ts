import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { calcolaMetriLineari } from '@/lib/dxf/parser';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Nessun file ricevuto' }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith('.dxf')) {
    return NextResponse.json({ error: 'Il file deve essere in formato DXF' }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File troppo grande (max 10MB)' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const content = Buffer.from(bytes).toString('utf-8');

  let calcResult;
  try {
    calcResult = calcolaMetriLineari(content);
  } catch {
    return NextResponse.json({ error: 'File DXF non valido o corrotto' }, { status: 422 });
  }

  const dxfKey = `${uuidv4()}.dxf`;
  const uploadDir = path.join(process.cwd(), 'uploads', 'dxf');
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, dxfKey), Buffer.from(bytes));

  return NextResponse.json({
    metriLineari: calcResult.metriLineari,
    entitaCount: calcResult.entitaCount,
    dxfKey,
  });
}
