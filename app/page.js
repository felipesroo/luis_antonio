import { prisma } from "../lib/prisma";

export const dynamic = "force-dynamic";

// Server component para SEO e alta performance
export default async function Home() {
  // Calcula a data de 3 dias atrás
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() - 3);

  // Busca as ofertas dos últimos 3 dias (limite de 50 para performance)
  const deals = await prisma.deal.findMany({
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

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">
          <span>🔥</span>
          <span>Últimas Ofertas & Achadinhos</span>
        </h1>
        <span className="section-badge">
          {deals.length} {deals.length === 1 ? 'oferta verificada' : 'ofertas verificadas'}
        </span>
      </div>
      
      {deals.length === 0 ? (
        <div className="empty-state">
          <h3>Nenhuma oferta encontrada no momento.</h3>
          <p>O robô do ofertasTOP.shop logo trará novos achadinhos imperdíveis!</p>
        </div>
      ) : (
        <div className="deals-grid">
          {deals.map(deal => (
            <div key={deal.id} className="deal-card">
              <div className="deal-image-container">
                <div className={`deal-store-badge ${deal.store === 'Shopee' ? 'store-shopee' : 'store-ml'}`}>
                  {deal.store || 'Mercado Livre'}
                </div>
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
                  <a href={deal.affiliateLink || '#'} target="_blank" rel="noopener noreferrer" className="deal-button">
                    <span>Ver Oferta</span>
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
