import { prisma } from "../lib/prisma";
import DealsExplorer from "./components/DealsExplorer";

export const dynamic = "force-dynamic";

// Server component para SEO e alta performance
export default async function Home() {
  // Calcula a data de 3 dias atrás
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() - 3);

  // Busca as ofertas dos últimos 3 dias (limite de 50 para performance)
  let deals = await prisma.deal.findMany({
    where: {
      createdAt: {
        gte: limitDate,
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  });

  let isFallback = false;

  // Fallback Inteligente: se houver poucas ofertas recentes (< 8), busca as últimas do catálogo
  if (deals.length < 8) {
    const fallbackDeals = await prisma.deal.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });
    if (fallbackDeals.length > 0) {
      deals = fallbackDeals;
      isFallback = true;
    }
  }

  // Busca cupons de desconto ativos para renderizar no final das ofertas
  let coupons = [];
  try {
    coupons = await prisma.coupon.findMany({
      where: { active: true },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  } catch (e) {
    // Fallback gracioso se a tabela ainda não tiver cupons
  }

  return (
    <DealsExplorer initialDeals={deals} isFallback={isFallback} coupons={coupons} />
  );
}
