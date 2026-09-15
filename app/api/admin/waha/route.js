import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '../../../../lib/adminAuth';
import http from 'http';

export const dynamic = 'force-dynamic';

const WAHA_URL = process.env.WAHA_BASE_URL || 'http://mmcok4wxvmt52pwie2ofstvo.147.93.15.31.sslip.io';
const WAHA_KEY = process.env.WAHA_API_KEY || 'NquBVZnYrbTcXCMXzYS73m5gPXTyUzpm';
const WAHA_SESSION = process.env.WAHA_SESSION || 'felipe';

function wahaRequest(path, method = 'GET', body = null, isBinary = false) {
  return new Promise((resolve) => {
    try {
      const url = new URL(path, WAHA_URL);
      const headers = {
        'X-Api-Key': WAHA_KEY,
        'Accept': isBinary ? 'image/jpeg,image/png,*/*' : 'application/json'
      };

      let payload = null;
      if (body) {
        payload = typeof body === 'string' ? body : JSON.stringify(body);
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = Buffer.byteLength(payload);
      }

      const req = http.request(url, {
        method,
        headers,
        timeout: 12000
      }, (res) => {
        if (isBinary) {
          const chunks = [];
          res.on('data', chunk => chunks.push(chunk));
          res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              contentType: res.headers['content-type'] || 'image/jpeg',
              buffer
            });
          });
        } else {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve({
                ok: res.statusCode >= 200 && res.statusCode < 300,
                status: res.statusCode,
                data: JSON.parse(data)
              });
            } catch {
              resolve({
                ok: res.statusCode >= 200 && res.statusCode < 300,
                status: res.statusCode,
                raw: data
              });
            }
          });
        }
      });

      req.on('error', (err) => resolve({ ok: false, error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, error: 'Timeout ao contatar WAHA' });
      });

      if (payload) req.write(payload);
      req.end();
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

export async function GET(request) {
  const isAuth = await isAuthenticatedAdmin(request);
  if (!isAuth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';

  // 1. Status da Sessão
  if (action === 'status') {
    const res = await wahaRequest(`/api/sessions/${WAHA_SESSION}`);
    if (!res.ok) {
      return NextResponse.json({ status: 'UNKNOWN', error: res.error || 'Erro ao obter status da sessão' });
    }
    return NextResponse.json(res.data);
  }

  // 2. Grupos do WhatsApp
  if (action === 'groups') {
    const res = await wahaRequest(`/api/${WAHA_SESSION}/groups`);
    if (!res.ok) {
      return NextResponse.json({ error: res.error || 'Falha ao buscar grupos' }, { status: res.status || 500 });
    }

    const groups = Array.isArray(res.data) ? res.data.map(g => ({
      id: g.id?._serialized || g.id,
      name: g.name || 'Grupo sem nome',
      participantsCount: g.groupMetadata?.participants?.length || 0,
      unreadCount: g.unreadCount || 0
    })) : [];

    return NextResponse.json({ groups });
  }

  // 3. Screenshot ao vivo do WhatsApp Web
  if (action === 'screenshot') {
    const res = await wahaRequest(`/api/screenshot?session=${WAHA_SESSION}`, 'GET', null, true);
    if (!res.ok || !res.buffer) {
      return NextResponse.json({ error: 'Falha ao capturar tela' }, { status: 500 });
    }
    return new NextResponse(res.buffer, {
      headers: {
        'Content-Type': res.contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  }

  // 4. Imagem do QR Code
  if (action === 'qr') {
    // Primeiro checa status
    const statusRes = await wahaRequest(`/api/sessions/${WAHA_SESSION}`);
    const sessionStatus = statusRes.data?.status;

    if (sessionStatus === 'WORKING') {
      return NextResponse.json({
        connected: true,
        status: 'WORKING',
        me: statusRes.data?.me
      });
    }

    // Se estiver precisando de QR
    const qrRes = await wahaRequest(`/api/${WAHA_SESSION}/auth/qr`, 'GET', null, true);
    if (qrRes.ok && qrRes.buffer) {
      const base64Image = `data:${qrRes.contentType};base64,${qrRes.buffer.toString('base64')}`;
      return NextResponse.json({
        connected: false,
        status: sessionStatus || 'SCAN_QR_CODE',
        qrImage: base64Image
      });
    }

    // Fallback para screenshot se o endpoint qr não devolver imagem direta
    const ssRes = await wahaRequest(`/api/screenshot?session=${WAHA_SESSION}`, 'GET', null, true);
    if (ssRes.ok && ssRes.buffer) {
      const base64Image = `data:${ssRes.contentType};base64,${ssRes.buffer.toString('base64')}`;
      return NextResponse.json({
        connected: false,
        status: sessionStatus || 'SCAN_QR_CODE',
        qrImage: base64Image
      });
    }

    return NextResponse.json({
      connected: false,
      status: sessionStatus || 'CONNECTING',
      message: 'Aguardando inicialização da sessão...'
    });
  }

  return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 });
}

export async function POST(request) {
  const isAuth = await isAuthenticatedAdmin(request);
  if (!isAuth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // 1. Reiniciar Sessão
  if (action === 'restart') {
    const res = await wahaRequest(`/api/sessions/${WAHA_SESSION}/restart`, 'POST');
    return NextResponse.json({ success: res.ok, data: res.data || res.error });
  }

  // 2. Desconectar Sessão (Logout para escanear novo número)
  if (action === 'logout') {
    const res = await wahaRequest(`/api/sessions/${WAHA_SESSION}/logout`, 'POST');
    return NextResponse.json({ success: res.ok, data: res.data || res.error });
  }

  // 3. Enviar Mensagem de Teste para um Grupo ou Telefone
  if (action === 'test_message') {
    try {
      const body = await request.json();
      const { chatId, text } = body;
      if (!chatId || !text) {
        return NextResponse.json({ error: 'chatId e text são obrigatórios' }, { status: 400 });
      }

      const res = await wahaRequest('/api/sendText', 'POST', {
        session: WAHA_SESSION,
        chatId,
        text
      });

      return NextResponse.json({ success: res.ok, result: res.data || res.error });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 });
}
