import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ofertas Mercado Livre - ofertasTOP.shop",
  description: "Os melhores achadinhos e cupons de desconto do Mercado Livre selecionados pelo ofertasTOP.shop.",
};

export default async function MercadoLivrePage() {
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() - 3);

  let deals = await prisma.deal.findMany({
    where: {
      store: 'Mercado Livre',
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

  // Fallback Inteligente: se houver poucas ofertas recentes (< 8), busca as últimas do catálogo ML
  if (deals.length < 8) {
    const fallbackDeals = await prisma.deal.findMany({
      where: {
        store: 'Mercado Livre'
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

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">
          <span>💛</span>
          <span>{isFallback ? 'Achadinhos Mercado Livre em Destaque' : 'Achadinhos Mercado Livre'}</span>
          <span className="deal-store-badge store-ml" style={{ position: 'relative', top: 0, left: 0 }}>
            Mercado Livre
          </span>
        </h1>
        <span className="section-badge">
          {deals.length} {deals.length === 1 ? 'oferta ativa' : 'ofertas ativas'}
          {isFallback && ' (Catálogo)'}
        </span>
      </div>
      
      {deals.length === 0 ? (
        <div className="empty-state">
          <h3>Nenhuma oferta do Mercado Livre encontrada no momento.</h3>
          <p>O robô do ofertasTOP.shop está buscando novidades agora mesmo!</p>
        </div>
      ) : (
        <div className="deals-grid">
          {deals.map(deal => (
            <div key={deal.id} className="deal-card">
              <div className="deal-image-container">
                <div className="deal-store-badge store-ml">Mercado Livre</div>
                {deal.discount && (
                  <div className="deal-discount-badge">{deal.discount} OFF</div>
                )}
                {deal.imageUrl ? (
                  <img src={deal.imageUrl} alt={deal.title} className="deal-image" loading="lazy" />
                ) : (
                  <div className="deal-image" style={{backgroundColor: '#f1f5f9'}}></div>
                )}
              </div>
              
              <div className="deal-content">
                <h3 className="deal-title" title={deal.title}>{deal.title}</h3>
                
                {deal.content && deal.content.length < 60 && (
                  <div className="deal-coupon">
                    <span>🎟️</span>
                    <span>{deal.content}</span>
                  </div>
                )}

                <div className="deal-prices">
                  {deal.originalPrice && (
                    <span className="deal-price-old">De: R$ {deal.originalPrice.toFixed(2).replace('.', ',')}</span>
                  )}
                  {deal.discountPrice && (
                    <span className="deal-price-new">Por: R$ {deal.discountPrice.toFixed(2).replace('.', ',')}</span>
                  )}
                </div>

                <div className="deal-buttons">
                  <a href={`/go/${deal.id}`} target="_blank" rel="noopener noreferrer" className="deal-button">
                    <span>Comprar no Mercado Livre</span>
                    <span>🛒</span>
                  </a>
                  <a href="https://chat.whatsapp.com/K4PWG5Z8uYZLQYDWbQo7ig?mode=ac_t" target="_blank" rel="noopener noreferrer" className="deal-button-whatsapp">
                    <span>Grupo VIP WhatsApp</span>
                    <span>💬</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
