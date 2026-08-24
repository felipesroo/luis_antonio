import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.API_SECRET_KEY}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Data esperada do n8n:
    // {
    //   title: "Nome do produto",
    //   originalPrice: 100.0,
    //   discountPrice: 80.0,
    //   discount: "20%",
    //   imageUrl: "https...",
    //   affiliateLink: "https...",
    //   coupon: "CUPOM20" (opcional),
    //   content: "..." (opcional)
    // }

    const deal = await prisma.deal.create({
      data: {
        title: data.title || "Oferta sem título",
        originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : null,
        discountPrice: data.discountPrice ? parseFloat(data.discountPrice) : null,
        discount: data.discount || null,
        affiliateLink: data.affiliateLink || null,
        imageUrl: data.imageUrl || null,
        content: data.coupon || data.content || null, // Usando o content para armazenar códido de cupom ou texto
        store: data.store || "Mercado Livre"
      }
    });

    return NextResponse.json({ success: true, deal }, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar oferta:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
