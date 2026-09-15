import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { isAuthenticatedAdmin } from '../../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const isAuth = await isAuthenticatedAdmin(request);
  if (!isAuth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const deals = await prisma.deal.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const totalClicks = deals.reduce((acc, d) => acc + (d.clicks || 0), 0);

    return NextResponse.json({ deals, totalClicks });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const isAuth = await isAuthenticatedAdmin(request);
  if (!isAuth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da oferta não fornecido' }, { status: 400 });
    }

    await prisma.deal.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Oferta removida com sucesso' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
