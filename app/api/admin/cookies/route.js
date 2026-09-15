import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { isAuthenticatedAdmin } from '../../../../lib/adminAuth';
import https from 'https';

export const dynamic = 'force-dynamic';

function testMercadoLivreCookies(cookie, userAgent, xCsrfToken) {
  return new Promise((resolve) => {
    try {
      const req = https.request('https://www.mercadolivre.com.br/cupons', {
        method: 'GET',
        headers: {
          'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Cookie': cookie,
          'x-csrf-token': xCsrfToken || '',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 8000
      }, (res) => {
        const isRedirectToLogin = res.statusCode >= 300 && res.statusCode < 400 && 
          (res.headers.location?.includes('login') || res.headers.location?.includes('account'));

        if (res.statusCode === 200 && !isRedirectToLogin) {
          resolve({ valid: true, status: res.statusCode, message: 'Cookies válidos e ativos! Sessão funcionando perfeitamente.' });
        } else if (isRedirectToLogin) {
          resolve({ valid: false, status: res.statusCode, message: 'Cookies expirados! Mercado Livre redirecionou para tela de login.' });
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          resolve({ valid: false, status: res.statusCode, message: `Acesso negado (${res.statusCode}). Cookies ou Token inválidos.` });
        } else {
          resolve({ valid: res.statusCode < 400, status: res.statusCode, message: `Resposta HTTP ${res.statusCode} do Mercado Livre.` });
        }
      });

      req.on('error', (err) => resolve({ valid: false, error: err.message, message: `Erro de conexão: ${err.message}` }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ valid: false, message: 'Tempo limite esgotado ao contatar o Mercado Livre.' });
      });
      req.end();
    } catch (err) {
      resolve({ valid: false, message: err.message });
    }
  });
}

// GET: Retorna os dados atuais da tabela cookies_config
export async function GET(request) {
  const isAuth = await isAuthenticatedAdmin(request);
  if (!isAuth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const config = await prisma.cookiesConfig.findUnique({
      where: { platform: 'mercado_livre' }
    });

    if (!config) {
      return NextResponse.json({
        platform: 'mercado_livre',
        cookie: '',
        userAgent: '',
        xCsrfToken: '',
        updatedAt: null
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Salva novos cookies, token e agente no PostgreSQL
export async function POST(request) {
  const isAuth = await isAuthenticatedAdmin(request);
  if (!isAuth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { cookie, userAgent, xCsrfToken } = await request.json();

    if (!cookie || !cookie.trim()) {
      return NextResponse.json({ error: 'O campo de Cookie não pode estar vazio.' }, { status: 400 });
    }

    const updated = await prisma.cookiesConfig.upsert({
      where: { platform: 'mercado_livre' },
      update: {
        cookie: cookie.trim(),
        userAgent: (userAgent || '').trim(),
        xCsrfToken: (xCsrfToken || '').trim(),
        updatedAt: new Date()
      },
      create: {
        platform: 'mercado_livre',
        cookie: cookie.trim(),
        userAgent: (userAgent || '').trim(),
        xCsrfToken: (xCsrfToken || '').trim()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Credenciais do Mercado Livre atualizadas com sucesso!',
      updated
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Testa a validade dos cookies diretamente contra o Mercado Livre
export async function PUT(request) {
  const isAuth = await isAuthenticatedAdmin(request);
  if (!isAuth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { cookie, userAgent, xCsrfToken } = await request.json();
    const result = await testMercadoLivreCookies(cookie, userAgent, xCsrfToken);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ valid: false, error: error.message }, { status: 500 });
  }
}
