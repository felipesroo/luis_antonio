import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const store = searchParams.get('store') || '';
    const dealId = searchParams.get('dealId') || '';

    let coupon = null;

    // 1. Procura cupom específico vinculado ao ID da oferta
    if (dealId) {
      coupon = await prisma.coupon.findFirst({
        where: { dealId, active: true }
      });
    }

    // 2. Procura cupom específico da loja (ex: Mercado Livre ou Shopee)
    if (!coupon && store) {
      coupon = await prisma.coupon.findFirst({
        where: {
          active: true,
          store: { equals: store, mode: 'insensitive' }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      });
    }

    // 3. Procura cupom geral aplicável a Todas as Lojas
    if (!coupon) {
      coupon = await prisma.coupon.findFirst({
        where: {
          active: true,
          store: { in: ['Todas', 'geral', 'Geral', 'todas'] }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      });
    }

    if (!coupon) {
      return NextResponse.json({
        hasCoupon: false,
        code: '',
        discount: '',
        description: '',
        store: store || 'Todas',
        formattedLine: '',
        formattedFull: ''
      });
    }

    // Formata linha elegante para o WhatsApp
    const descText = coupon.description ? ` (${coupon.description})` : '';
    const formattedLine = `🎟️ Cupom: *${coupon.code}* - ${coupon.discount}${descText}`;
    const formattedFull = `🎟️ *CUPOM EXCLUSIVO:*\n👉 Use o cupom: *${coupon.code}* (${coupon.discount})${descText}`;

    return NextResponse.json({
      hasCoupon: true,
      code: coupon.code,
      discount: coupon.discount,
      description: coupon.description || '',
      store: coupon.store,
      formattedLine,
      formattedFull
    });
  } catch (error) {
    return NextResponse.json({
      hasCoupon: false,
      error: error.message,
      formattedLine: '',
      formattedFull: ''
    }, { status: 500 });
  }
}
