'use client';

import { useState } from 'react';

export default function DealCard({ deal, coupons = [] }) {
  const [copied, setCopied] = useState(false);

  // Busca o cupom aplicável:
  // 1º: Cupom vinculado especificamente a esta oferta (dealId)
  // 2º: Cupom específico da loja (Shopee ou Mercado Livre)
  // 3º: Cupom geral para Todas as Lojas
  const applicableCoupon = coupons.find(c => c.dealId === deal.id && c.active) ||
    coupons.find(c => c.store === deal.store && !c.dealId && c.active) ||
    coupons.find(c => (c.store === 'Todas' || !c.store) && !c.dealId && c.active);

  const handleCopyCoupon = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!applicableCoupon?.code) return;

    try {
      await navigator.clipboard.writeText(applicableCoupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback caso clipboard API falhe
      const tempInput = document.createElement('input');
      tempInput.value = applicableCoupon.code;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isShopee = deal.store === 'Shopee';
  const isMl = deal.store === 'Mercado Livre' || !deal.store;

  return (
    <div className="deal-card">
      {/* Imagem e Badges */}
      <div className="deal-image-container">
        <div className={`deal-store-badge ${isShopee ? 'store-shopee' : 'store-ml'}`}>
          {deal.store || 'Mercado Livre'}
        </div>
        {deal.discount && (
          <div className="deal-discount-badge">{deal.discount} OFF</div>
        )}
        {deal.imageUrl ? (
          <img src={deal.imageUrl} alt={deal.title} className="deal-image" loading="lazy" />
        ) : (
          <div className="deal-image" style={{ backgroundColor: '#f1f5f9' }}></div>
        )}
      </div>

      {/* Conteúdo da Oferta */}
      <div className="deal-content">
        <h3 className="deal-title" title={deal.title}>{deal.title}</h3>

        {/* Informação legado de cupom se houver no conteúdo */}
        {!applicableCoupon && deal.content && deal.content.length < 60 && (
          <div className="deal-coupon">
            <span>🎟️</span>
            <span>{deal.content}</span>
          </div>
        )}

        {/* Preços */}
        <div className="deal-prices">
          {deal.originalPrice && (
            <span className="deal-price-old">De: R$ {deal.originalPrice.toFixed(2).replace('.', ',')}</span>
          )}
          {deal.discountPrice && (
            <span className="deal-price-new">Por: R$ {deal.discountPrice.toFixed(2).replace('.', ',')}</span>
          )}
        </div>

        {/* Bloco de Cupom Anexado no Final da Oferta */}
        {applicableCoupon && (
          <div className="deal-coupon-ticket" onClick={handleCopyCoupon} title="Clique para copiar o cupom">
            <div className="coupon-ticket-glow"></div>
            <div className="coupon-ticket-body">
              <div className="coupon-ticket-icon">🎟️</div>
              <div className="coupon-ticket-info">
                <div className="coupon-ticket-header">
                  <span className="coupon-code-pill">{applicableCoupon.code}</span>
                  <span className="coupon-discount-tag">{applicableCoupon.discount}</span>
                </div>
                {applicableCoupon.description && (
                  <span className="coupon-rule-text">{applicableCoupon.description}</span>
                )}
              </div>
            </div>
            <button
              type="button"
              className={`coupon-copy-btn ${copied ? 'copied' : ''}`}
              aria-label="Copiar cupom"
            >
              {copied ? '✓ Copiado!' : 'Copiar'}
            </button>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="deal-buttons">
          <a href={`/go/${deal.id}`} target="_blank" rel="noopener noreferrer" className="deal-button">
            <span>{isShopee ? 'Comprar na Shopee' : isMl ? 'Comprar no Mercado Livre' : 'Ver Oferta'}</span>
            <span>🛒</span>
          </a>
          <a href="https://chat.whatsapp.com/K4PWG5Z8uYZLQYDWbQo7ig?mode=ac_t" target="_blank" rel="noopener noreferrer" className="deal-button-whatsapp">
            <span>Grupo VIP WhatsApp</span>
            <span>💬</span>
          </a>
        </div>
      </div>
    </div>
  );
}
