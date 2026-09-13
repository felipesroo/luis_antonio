import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const deal = await prisma.deal.findUnique({
      where: { id },
      select: { id: true, affiliateLink: true }
    });

    if (!deal || !deal.affiliateLink) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Incrementa contador de cliques de forma assíncrona
    prisma.deal.update({
      where: { id },
      data: { clicks: { increment: 1 } }
    }).catch(err => console.error("Erro ao computar clique:", err));

    // Redireciona 302 direto para o link de afiliado
    return NextResponse.redirect(deal.affiliateLink, { status: 302 });
  } catch (error) {
    console.error("Erro no redirecionador /go/[id]:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
