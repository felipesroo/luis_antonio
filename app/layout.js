import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ofertasTOP.shop - As Melhores Ofertas de Shopee e Mercado Livre",
  description: "As melhores promoções, achadinhos e cupons de Shopee e Mercado Livre você encontra no ofertasTOP.shop.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <header className="header">
          <a href="/" className="header-brand">
            <div className="header-logo-container">
              <img src="/logo.png" alt="ofertasTOP.shop Logo" className="header-logo" />
            </div>
            <div className="header-title-group">
              <span className="header-title">
                <span className="header-title-ofertas">ofertas</span>
                <span className="header-title-top">TOP</span>
                <span className="header-title-shop">.shop</span>
              </span>
              <span className="header-subtitle">
                Para Shopee e Mercado Livre
                <span className="header-subtitle-badge">ACHADINHOS</span>
              </span>
            </div>
          </a>

          <nav className="header-nav">
            <a href="/" className="nav-link">
              <span>🔥</span>
              <span>Todas as Ofertas</span>
            </a>
            <a href="/shopee" className="nav-link">
              <span>🧡</span>
              <span>Shopee</span>
            </a>
            <a href="/mercadolivre" className="nav-link">
              <span>💛</span>
              <span>Mercado Livre</span>
            </a>
          </nav>
        </header>
        
        <main className="container">
          {children}
        </main>

        <footer className="footer">
          <p className="footer-brand">ofertasTOP.shop</p>
          <p className="footer-tagline">O seu agregador inteligente de achadinhos da Shopee e Mercado Livre</p>
          <p>© {new Date().getFullYear()} ofertasTOP.shop. Todos os direitos reservados.</p>
        </footer>

        {/* Botão Flutuante do Grupo VIP no WhatsApp */}
        <a
          href="https://chat.whatsapp.com/K4PWG5Z8uYZLQYDWbQo7ig?mode=ac_t"
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-fab"
          aria-label="Entrar no Grupo VIP do WhatsApp"
        >
          <div className="whatsapp-fab-icon-wrapper">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.392-10.416c-4.284 0-7.768 3.484-7.768 7.768 0 1.488.423 2.879 1.155 4.067l-1.224 4.475 4.606-1.208c1.139.673 2.467 1.054 3.882 1.054 4.283 0 7.768-3.484 7.768-7.768 0-4.285-3.485-7.768-7.769-7.768z" />
            </svg>
            <span className="whatsapp-fab-pulse"></span>
          </div>
          <div className="whatsapp-fab-text">
            <span className="whatsapp-fab-badge">PROMOÇÕES EM TEMPO REAL</span>
            <span className="whatsapp-fab-title">Grupo VIP WhatsApp</span>
          </div>
        </a>
      </body>
    </html>
  );
}
