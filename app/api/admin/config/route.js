import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { isAuthenticatedAdmin } from '../../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

const DEFAULT_CONFIGS = {
  whatsapp_vip_link: 'https://chat.whatsapp.com/K4PWG5Z8uYZLQYDWbQo7ig?mode=ac_t',
  site_banner_text: '🔥 Entre no nosso Grupo VIP no WhatsApp e receba os achadinhos em primeira mão!',
  site_banner_active: 'true',
  site_title: 'ofertasTOP.shop',
  site_subtitle: 'As Melhores Ofertas de Shopee e Mercado Livre',
  shopee_active: 'true',
  mercadolivre_active: 'true',
  min_discount_filter: '15'
};

export async function GET(request) {
  try {
    const rows = await prisma.appConfig.findMany();
    const configMap = { ...DEFAULT_CONFIGS };

    rows.forEach(r => {
      configMap[r.key] = r.value;
    });

    return NextResponse.json({ configs: configMap });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const isAuth = await isAuthenticatedAdmin(request);
  if (!isAuth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const updates = [];

    for (const [key, val] of Object.entries(body)) {
      updates.push(
        prisma.appConfig.upsert({
          where: { key },
          update: { value: String(val) },
          create: { key, value: String(val) }
        })
      );
    }

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true, message: 'Configurações salvas com sucesso!' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
