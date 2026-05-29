import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: { material: true, thickness: { include: { price: true } } },
  });
  if (!order) return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const { id } = await params;
  const { status } = await request.json();
  const allowed = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'];
  if (!allowed.includes(status)) return NextResponse.json({ error: 'Stato non valido' }, { status: 400 });
  const order = await prisma.order.update({ where: { id: Number(id) }, data: { status } });
  return NextResponse.json(order);
}
