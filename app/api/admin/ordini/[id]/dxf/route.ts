import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id: Number(id) }, select: { dxfKey: true } });
  if (!order) return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 });

  if (!/^[0-9a-f-]{36}\.dxf$/.test(order.dxfKey)) {
    return NextResponse.json({ error: 'Key non valida' }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'uploads', 'dxf', order.dxfKey);
  try {
    const fileBuffer = await readFile(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/dxf',
        'Content-Disposition': `attachment; filename="ordine-${id}.dxf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'File non trovato' }, { status: 404 });
  }
}
