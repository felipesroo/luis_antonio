import { Inter } from "next/font/google";
import "./globals.css";
import { prisma } from "../lib/prisma";
import SiteShell from "./components/SiteShell";

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

export default async function RootLayout({ children }) {
  let whatsappVipLink = "https://chat.whatsapp.com/FySrIA5TS9F0EK2sjY93qe";
  let bannerText = "";
  let bannerActive = false;

  try {
    const configs = await prisma.appConfig.findMany();
    configs.forEach(c => {
      if (c.key === 'whatsapp_vip_link' && c.value) whatsappVipLink = c.value;
      if (c.key === 'site_banner_text') bannerText = c.value;
      if (c.key === 'site_banner_active') bannerActive = c.value === 'true';
    });
  } catch (e) {
    // Fallback silencioso para manter estabilidade
  }

  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <SiteShell
          bannerText={bannerText}
          bannerActive={bannerActive}
          whatsappVipLink={whatsappVipLink}
        >
          {children}
        </SiteShell>
      </body>
    </html>
  );
}

