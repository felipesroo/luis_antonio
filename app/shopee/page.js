import { prisma } from "../../lib/prisma";
import DealCard from "../components/DealCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ofertas Shopee - ofertasTOP.shop",
  description: "Os melhores achadinhos e cupons de desconto da Shopee selecionados pelo ofertasTOP.shop.",
};

export default async function ShopeePage() {
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() - 3);

  let deals = await prisma.deal.findMany({
    where: {
      store: 'Shopee',
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

  // Fallback Inteligente: se houver poucas ofertas recentes (< 8), busca as últimas do catálogo Shopee
  if (deals.length < 8) {
    const fallbackDeals = await prisma.deal.findMany({
      where: {
        store: 'Shopee'
      },
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
    // Fallback gracioso
  }

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">
          <span>🧡</span>
          <span>{isFallback ? 'Achadinhos Shopee em Destaque' : 'Achadinhos Shopee'}</span>
          <span className="deal-store-badge store-shopee" style={{ position: 'relative', top: 0, left: 0 }}>
            Shopee
          </span>
        </h1>
        <span className="section-badge">
          {deals.length} {deals.length === 1 ? 'oferta ativa' : 'ofertas ativas'}
          {isFallback && ' (Catálogo)'}
        </span>
      </div>
      
      {deals.length === 0 ? (
        <div className="empty-state">
          <h3>Nenhuma oferta da Shopee encontrada no momento.</h3>
          <p>O robô do ofertasTOP.shop está buscando novidades agora mesmo!</p>
        </div>
      ) : (
        <div className="deals-grid">
          {deals.map(deal => (
            <DealCard key={deal.id} deal={deal} coupons={coupons} />
          ))}
        </div>
      )}
    </div>
  );
}
