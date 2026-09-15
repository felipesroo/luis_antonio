import { NextResponse } from 'next/server';
import { checkPassword, createAdminToken, isAuthenticatedAdmin } from '../../../../lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const isAuth = await isAuthenticatedAdmin(request);
  return NextResponse.json({ authenticated: isAuth });
}

export async function POST(request) {
  try {
    const { password } = await request.json();
    if (!checkPassword(password)) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
    }

    const token = createAdminToken();
    const response = NextResponse.json({ success: true, token, message: 'Autenticado com sucesso' });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: false, // Suporta conexões HTTP (como sslip.io) e HTTPS sem descarte pelo navegador
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 dias
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Desconectado' });
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0
  });
  return response;
}
