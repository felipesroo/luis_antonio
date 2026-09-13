'use client';

import { useState, useMemo } from 'react';

export default function DealsExplorer({ initialDeals, isFallback }) {
  const [search, setSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [filter30Off, setFilter30Off] = useState(false);
  const [priceFilter, setPriceFilter] = useState('all'); // 'all', '50', '100'

  const filteredDeals = useMemo(() => {
    return initialDeals.filter(deal => {
      // 1. Filtro de Busca (Texto)
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = deal.title?.toLowerCase().includes(query);
        const matchesStore = deal.store?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesStore) return false;
      }

      // 2. Filtro de Loja
      if (selectedStore !== 'all' && deal.store !== selectedStore) {
        return false;
      }

      // 3. Filtro de Desconto (+30% OFF)
      if (filter30Off) {
        const discountNum = parseInt(deal.discount?.replace(/\D/g, '') || '0', 10);
        if (discountNum < 30) return false;
      }

      // 4. Filtro de Preço Máximo
      if (priceFilter === '50' && (deal.discountPrice > 50 || !deal.discountPrice)) {
        return false;
      }
      if (priceFilter === '100' && (deal.discountPrice > 100 || !deal.discountPrice)) {
        return false;
      }

      return true;
    });
  }, [initialDeals, search, selectedStore, filter30Off, priceFilter]);

  const hasActiveFilters = search.trim() !== '' || selectedStore !== 'all' || filter30Off || priceFilter !== 'all';

  const resetFilters = () => {
    setSearch('');
    setSelectedStore('all');
    setFilter30Off(false);
    setPriceFilter('all');
  };

  return (
    <div className="deals-explorer">
      {/* Barra de Busca & Filtros Rápidos */}
      <div className="search-filter-card">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por produto, fone, panela, celular..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear-btn" onClick={() => setSearch('')} title="Limpar busca">
              ✕
            </button>
          )}
        </div>

        <div className="filter-chips-container">
          <button
            className={`filter-chip ${selectedStore === 'all' && !filter30Off && priceFilter === 'all' ? 'active' : ''}`}
            onClick={resetFilters}
          >
            🔥 Todas
          </button>

          <button
            className={`filter-chip chip-shopee ${selectedStore === 'Shopee' ? 'active' : ''}`}
            onClick={() => setSelectedStore(selectedStore === 'Shopee' ? 'all' : 'Shopee')}
          >
            🧡 Shopee
          </button>

          <button
            className={`filter-chip chip-ml ${selectedStore === 'Mercado Livre' ? 'active' : ''}`}
            onClick={() => setSelectedStore(selectedStore === 'Mercado Livre' ? 'all' : 'Mercado Livre')}
          >
            💛 Mercado Livre
          </button>

          <button
            className={`filter-chip chip-discount ${filter30Off ? 'active' : ''}`}
            onClick={() => setFilter30Off(!filter30Off)}
          >
            🏷️ +30% OFF
          </button>

          <button
            className={`filter-chip ${priceFilter === '50' ? 'active' : ''}`}
            onClick={() => setPriceFilter(priceFilter === '50' ? 'all' : '50')}
          >
            💰 Até R$ 50
          </button>

          <button
            className={`filter-chip ${priceFilter === '100' ? 'active' : ''}`}
            onClick={() => setPriceFilter(priceFilter === '100' ? 'all' : '100')}
          >
            ⚡ Até R$ 100
          </button>

          {hasActiveFilters && (
            <button className="filter-chip-reset" onClick={resetFilters}>
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Header com contagem */}
      <div className="section-header">
        <h1 className="section-title">
          <span>🔥</span>
          <span>{isFallback ? 'Achadinhos & Ofertas em Destaque' : 'Últimas Ofertas & Achadinhos'}</span>
        </h1>
        <span className="section-badge">
          {filteredDeals.length} {filteredDeals.length === 1 ? 'oferta encontrada' : 'ofertas encontradas'}
          {isFallback && !hasActiveFilters && ' (Catálogo)'}
        </span>
      </div>

      {/* Listagem de Ofertas */}
      {filteredDeals.length === 0 ? (
        <div className="empty-state">
          <h3>Nenhuma oferta encontrada para sua busca.</h3>
          <p>Tente buscar por outro termo ou remova os filtros aplicados.</p>
          <button className="deal-button" style={{ maxWidth: '200px', margin: '1rem auto 0' }} onClick={resetFilters}>
            Ver Todas as Ofertas
          </button>
        </div>
      ) : (
        <div className="deals-grid">
          {filteredDeals.map(deal => (
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
                  <div className="deal-image" style={{ backgroundColor: '#f1f5f9' }}></div>
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
