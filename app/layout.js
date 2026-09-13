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
      </body>
    </html>
  );
}
