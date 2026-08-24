import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "PromoFamily - Os Melhores Achadinhos",
  description: "As melhores promoções e cupons da internet você encontra na PromoFamily.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <header className="header" style={{ flexDirection: 'column', gap: '0.8rem' }}>
          <img src="/logo.png" alt="PromoFamily Logo" className="header-logo" />
          <nav className="header-nav" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="/" className="nav-link">Todas Ofertas</a>
            <a href="/shopee" className="nav-link">Shopee</a>
            <a href="/mercadolivre" className="nav-link">Mercado Livre</a>
          </nav>
        </header>
        
        <main className="container">
          {children}
        </main>

        <footer className="footer">
          <p>© {new Date().getFullYear()} PromoFamily. Todos os direitos reservados.</p>
        </footer>
      </body>
    </html>
  );
}
