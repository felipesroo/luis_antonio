import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { isAuthenticatedAdmin } from '../../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

// GET: Lista todos os cupons ordenados por prioridade e data
export async function GET(request) {
  const isAuth = await isAuthenticatedAdmin(request);
  if (!isAuth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const activeCount = coupons.filter(c => c.active).length;

    return NextResponse.json({ coupons, total: coupons.length, activeCount });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Cria um novo cupom
export async function POST(request) {
  const isAuth = await isAuthenticatedAdmin(request);
  if (!isAuth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const { code, discount, description, store, dealId, active, priority } = body;

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'O código do cupom é obrigatório' }, { status: 400 });
    }

    if (!discount || !discount.trim()) {
      return NextResponse.json({ error: 'O valor/descrição do desconto é obrigatório (ex: 10% OFF)' }, { status: 400 });
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        discount: discount.trim(),
        description: description ? description.trim() : null,
        store: store ? store.trim() : 'Todas',
        dealId: dealId && dealId.trim() ? dealId.trim() : null,
        active: active !== undefined ? Boolean(active) : true,
        priority: priority ? parseInt(priority, 10) : 0
      }
    });

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Atualiza um cupom existente
export async function PUT(request) {
  const isAuth = await isAuthenticatedAdmin(request);
  if (!isAuth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, code, discount, description, store, dealId, active, priority } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do cupom não fornecido' }, { status: 400 });
    }

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'O código do cupom é obrigatório' }, { status: 400 });
    }

    if (!discount || !discount.trim()) {
      return NextResponse.json({ error: 'O desconto é obrigatório' }, { status: 400 });
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: {
        code: code.trim().toUpperCase(),
        discount: discount.trim(),
        description: description ? description.trim() : null,
        store: store ? store.trim() : 'Todas',
        dealId: dealId && dealId.trim() ? dealId.trim() : null,
        active: active !== undefined ? Boolean(active) : true,
        priority: priority !== undefined ? parseInt(priority, 10) : 0
      }
    });

    return NextResponse.json({ success: true, coupon: updatedCoupon });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Alterna status ativo/inativo rapidamente
export async function PATCH(request) {
  const isAuth = await isAuthenticatedAdmin(request);
  if (!isAuth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do cupom não fornecido' }, { status: 400 });
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: {
        active: Boolean(active)
      }
    });

    return NextResponse.json({ success: true, coupon: updatedCoupon });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove um cupom
export async function DELETE(request) {
  const isAuth = await isAuthenticatedAdmin(request);
  if (!isAuth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do cupom não fornecido' }, { status: 400 });
    }

    await prisma.coupon.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Cupom removido com sucesso' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
