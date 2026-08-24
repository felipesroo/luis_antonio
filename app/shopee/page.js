import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function ShopeePage() {
  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() - 3);

  const deals = await prisma.deal.findMany({
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

  return (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        Ofertas Shopee <span className="deal-store-badge store-shopee" style={{ position: 'relative', top: 0, left: 0 }}>Shopee</span>
      </h2>
      
      {deals.length === 0 ? (
        <div className="empty-state">
          <h3>Nenhuma oferta encontrada no momento.</h3>
          <p>O nosso robô logo trará novos achadinhos!</p>
        </div>
      ) : (
        <div className="deals-grid">
          {deals.map(deal => (
            <div key={deal.id} className="deal-card">
              <div className="deal-image-container">
                <div className={`deal-store-badge store-shopee`}>Shopee</div>
                {deal.discount && (
                  <div className="deal-discount-badge">{deal.discount} OFF</div>
                )}
                {deal.imageUrl ? (
                  <img src={deal.imageUrl} alt={deal.title} className="deal-image" loading="lazy" />
                ) : (
                  <div className="deal-image" style={{backgroundColor: '#eee'}}></div>
                )}
              </div>
              
              <div className="deal-content">
                <h3 className="deal-title">{deal.title}</h3>
                
                {deal.content && deal.content.length < 60 && (
                  <div className="deal-coupon">
                    🎟️ {deal.content}
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
                    Comprar na Shopee 🛒
                  </a>
                  <a href="https://chat.whatsapp.com/K4PWG5Z8uYZLQYDWbQo7ig?mode=ac_t" target="_blank" rel="noopener noreferrer" className="deal-button-whatsapp">
                    Entrar no Grupo VIP 💬
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
