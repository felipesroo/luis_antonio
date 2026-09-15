import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '../../../../lib/adminAuth';
import http from 'http';

export const dynamic = 'force-dynamic';

const N8N_URL = process.env.N8N_BASE_URL || 'http://n8n-hxxo1qfyu3ukqlmj7lntczyt.147.93.15.31.sslip.io';
const N8N_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmOWYyOWEyMi05MDcwLTQzYTAtYTcxOC1kZjEzMWUwMTRmYzAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNGNjNDY1OGUtMjFjYi00MmNlLTg3YTktODY2NzBiNTIxMzFlIiwiaWF0IjoxNzg5MzMwODQ5fQ.P6x5LD87vXdW417cfLm31UyUAQVPIgVYR1NQFATqR6o';
const SHOPEE_WF_ID = process.env.N8N_WF_SHOPEE_ID || 'mcCYYe0PcvlKssqt';
const ML_WF_ID = process.env.N8N_WF_ML_ID || 'uootdY9kh793Y1pV';

function n8nRequest(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    try {
      const url = new URL(path, N8N_URL);
      const postData = body ? JSON.stringify(body) : '';
      const headers = {
        'X-N8N-API-KEY': N8N_KEY,
        'Accept': 'application/json'
      };

      if (body) {
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = http.request(url, { method, headers, timeout: 15000 }, (res) => {
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
      });

      req.on('error', err => resolve({ ok: false, error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, error: 'Timeout n8n' });
      });

      if (postData) req.write(postData);
      req.end();
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

// GET: Retorna status dos fluxos, prompts e grupo alvo
export async function GET(request) {
  const isAuth = await isAuthenticatedAdmin(request);
  if (!isAuth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const [shopeeRes, mlRes] = await Promise.all([
      n8nRequest(`/api/v1/workflows/${SHOPEE_WF_ID}`),
      n8nRequest(`/api/v1/workflows/${ML_WF_ID}`)
    ]);

    // Parse Shopee
    let shopeeInfo = { id: SHOPEE_WF_ID, name: 'Shopee', active: false, targetGroup: '', prompt: '' };
    if (shopeeRes.ok && shopeeRes.data) {
      const wf = shopeeRes.data;
      shopeeInfo.active = !!wf.active;
      shopeeInfo.name = wf.name;

      const prepNode = wf.nodes?.find(n => n.name === 'prepara_envio');
      const remoteAssignment = prepNode?.parameters?.assignments?.assignments?.find(a => a.name === 'remoteJid');
      shopeeInfo.targetGroup = remoteAssignment?.value || '';

      const aiNode = wf.nodes?.find(n => n.type?.includes('agent') || n.name === 'AI Agent');
      shopeeInfo.prompt = aiNode?.parameters?.options?.systemMessage || '';
    }

    // Parse ML
    let mlInfo = { id: ML_WF_ID, name: 'Mercado Livre', active: false, targetGroup: '', prompt: '' };
    if (mlRes.ok && mlRes.data) {
      const wf = mlRes.data;
      mlInfo.active = !!wf.active;
      mlInfo.name = wf.name;

      const prepNode = wf.nodes?.find(n => n.name === 'PREPARA PARA O ENVIO');
      const remoteAssignment = prepNode?.parameters?.assignments?.assignments?.find(a => a.name === 'remoteJid');
      mlInfo.targetGroup = remoteAssignment?.value || '';

      const aiNode = wf.nodes?.find(n => n.type?.includes('agent') || n.name === 'Gemini1');
      mlInfo.prompt = aiNode?.parameters?.options?.systemMessage || '';
    }

    return NextResponse.json({ shopee: shopeeInfo, ml: mlInfo });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Alterna status (liga/desliga), atualiza grupo ou atualiza prompt
export async function POST(request) {
  const isAuth = await isAuthenticatedAdmin(request);
  if (!isAuth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // 1. Alternar Liga / Desliga (Ativar / Desativar)
  if (action === 'toggle') {
    try {
      const { platform, active } = await request.json();
      const wfId = platform === 'shopee' ? SHOPEE_WF_ID : ML_WF_ID;
      const subPath = active ? 'activate' : 'deactivate';

      const res = await n8nRequest(`/api/v1/workflows/${wfId}/${subPath}`, 'POST');
      if (!res.ok) {
        return NextResponse.json({ error: res.data?.message || 'Falha ao alterar status no n8n' }, { status: 500 });
      }

      return NextResponse.json({ success: true, active, platform, data: res.data });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // 2. Atualizar Grupo do WhatsApp em Ambos os Fluxos
  if (action === 'update_group') {
    try {
      const { targetGroup } = await request.json();
      if (!targetGroup) return NextResponse.json({ error: 'targetGroup é obrigatório' }, { status: 400 });

      // Atualiza Shopee
      const shopeeGet = await n8nRequest(`/api/v1/workflows/${SHOPEE_WF_ID}`);
      if (shopeeGet.ok && shopeeGet.data) {
        const wf = shopeeGet.data;
        const prepNode = wf.nodes.find(n => n.name === 'prepara_envio');
        if (prepNode?.parameters?.assignments?.assignments) {
          const item = prepNode.parameters.assignments.assignments.find(a => a.name === 'remoteJid');
          if (item) item.value = targetGroup;
        }
        await n8nRequest(`/api/v1/workflows/${SHOPEE_WF_ID}`, 'PUT', {
          name: wf.name,
          nodes: wf.nodes,
          connections: wf.connections,
          settings: { executionOrder: wf.settings?.executionOrder || 'v1' }
        });
      }

      // Atualiza Mercado Livre
      const mlGet = await n8nRequest(`/api/v1/workflows/${ML_WF_ID}`);
      if (mlGet.ok && mlGet.data) {
        const wf = mlGet.data;
        const prepNode = wf.nodes.find(n => n.name === 'PREPARA PARA O ENVIO');
        if (prepNode?.parameters?.assignments?.assignments) {
          const item = prepNode.parameters.assignments.assignments.find(a => a.name === 'remoteJid');
          if (item) item.value = targetGroup;
        }
        await n8nRequest(`/api/v1/workflows/${ML_WF_ID}`, 'PUT', {
          name: wf.name,
          nodes: wf.nodes,
          connections: wf.connections,
          settings: { executionOrder: wf.settings?.executionOrder || 'v1' }
        });
      }

      return NextResponse.json({ success: true, message: `Grupo atualizado para: ${targetGroup}` });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // 3. Atualizar Prompt do Modelo de IA (Groq)
  if (action === 'update_prompt') {
    try {
      const { platform, prompt } = await request.json();
      if (!prompt) return NextResponse.json({ error: 'prompt é obrigatório' }, { status: 400 });

      const wfId = platform === 'shopee' ? SHOPEE_WF_ID : ML_WF_ID;
      const getRes = await n8nRequest(`/api/v1/workflows/${wfId}`);
      if (!getRes.ok || !getRes.data) {
        return NextResponse.json({ error: 'Fluxo não encontrado no n8n' }, { status: 404 });
      }

      const wf = getRes.data;
      const nodeName = platform === 'shopee' ? 'AI Agent' : 'Gemini1';
      const aiNode = wf.nodes.find(n => n.name === nodeName || n.type?.includes('agent'));

      if (!aiNode) {
        return NextResponse.json({ error: `Nó de IA (${nodeName}) não encontrado no fluxo.` }, { status: 404 });
      }

      if (!aiNode.parameters) aiNode.parameters = {};
      if (!aiNode.parameters.options) aiNode.parameters.options = {};
      aiNode.parameters.options.systemMessage = prompt;

      const putRes = await n8nRequest(`/api/v1/workflows/${wfId}`, 'PUT', {
        name: wf.name,
        nodes: wf.nodes,
        connections: wf.connections,
        settings: { executionOrder: wf.settings?.executionOrder || 'v1' }
      });

      if (!putRes.ok) {
        return NextResponse.json({ error: putRes.data?.message || 'Erro ao salvar novo prompt no n8n' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `Prompt de ${platform.toUpperCase()} atualizado com sucesso!` });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 });
}
