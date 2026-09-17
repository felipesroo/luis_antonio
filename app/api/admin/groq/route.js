import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { isAuthenticatedAdmin } from '../../../../lib/adminAuth';
import http from 'http';
import https from 'https';

export const dynamic = 'force-dynamic';

const N8N_URL = process.env.N8N_BASE_URL || 'http://n8n-hxxo1qfyu3ukqlmj7lntczyt.147.93.15.31.sslip.io';
const N8N_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmOWYyOWEyMi05MDcwLTQzYTAtYTcxOC1kZjEzMWUwMTRmYzAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNGNjNDY1OGUtMjFjYi00MmNlLTg3YTktODY2NzBiNTIxMzFlIiwiaWF0IjoxNzg5MzMwODQ5fQ.P6x5LD87vXdW417cfLm31UyUAQVPIgVYR1NQFATqR6o';
const GROQ_CRED_ID = 'riiy9XqI7uqQmwML';
const SHOPEE_WF_ID = process.env.N8N_WF_SHOPEE_ID || 'mcCYYe0PcvlKssqt';
const ML_WF_ID = process.env.N8N_WF_ML_ID || 'uootdY9kh793Y1pV';

const POPULAR_GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama-3.1-70b-versatile',
  'mixtral-8x7b-32768',
  'gemma2-9b-it'
];

function maskKey(key) {
  if (!key || key.length < 12) return '********';
  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
}

// Testa a chave diretamente na API da Groq
function testGroqApiKey(apiKey) {
  return new Promise((resolve) => {
    try {
      const req = https.request(new URL('https://api.groq.com/openai/v1/models'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'User-Agent': 'ofertasTOP-AdminGroqChecker/1.0'
        },
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode === 200 && parsed.data) {
              const modelIds = parsed.data.map(m => m.id);
              resolve({ ok: true, models: modelIds });
            } else {
              resolve({ ok: false, error: parsed.error?.message || `Erro HTTP ${res.statusCode}` });
            }
          } catch (e) {
            resolve({ ok: false, error: 'Resposta inválida da Groq API' });
          }
        });
      });

      req.on('error', err => resolve({ ok: false, error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, error: 'Tempo esgotado ao conectar com a Groq' });
      });
      req.end();
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

// Helper para chamadas ao n8n
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

      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(url, { method, headers, timeout: 15000 }, (res) => {
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

// GET: Retorna status atual da Groq, modelo e chave mascarada
export async function GET(request) {
  const isAuth = await isAuthenticatedAdmin(request);
  if (!isAuth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    // 1. Busca configurações salvas no banco
    const [savedKeyRow, savedModelRow, savedUpdateRow] = await Promise.all([
      prisma.appConfig.findUnique({ where: { key: 'groq_api_key' } }),
      prisma.appConfig.findUnique({ where: { key: 'groq_model' } }),
      prisma.appConfig.findUnique({ where: { key: 'groq_last_updated' } })
    ]);

    let currentModel = savedModelRow?.value || 'openai/gpt-oss-120b';
    let rawKey = savedKeyRow?.value || '';

    // 2. Tenta inspecionar o modelo direto dos fluxos do n8n
    try {
      const mlGet = await n8nRequest(`/api/v1/workflows/${ML_WF_ID}`);
      if (mlGet.ok && mlGet.data) {
        const groqNode = mlGet.data.nodes?.find(n => n.type?.includes('lmChatGroq') || n.name === 'Groq Chat Model');
        if (groqNode?.parameters?.model) {
          currentModel = groqNode.parameters.model;
        }
      }
    } catch (e) {
      console.warn('Não foi possível ler nó do n8n:', e.message);
    }

    // Se não tiver chave no banco, verifica se há variável de ambiente
    if (!rawKey && process.env.GROQ_API_KEY) {
      rawKey = process.env.GROQ_API_KEY;
    }

    return NextResponse.json({
      configured: !!rawKey,
      maskedKey: maskKey(rawKey),
      currentModel,
      popularModels: POPULAR_GROQ_MODELS,
      lastUpdated: savedUpdateRow?.value || null
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Testa a chave na API da Groq
export async function PUT(request) {
  const isAuth = await isAuthenticatedAdmin(request);
  if (!isAuth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { apiKey } = await request.json();
    let keyToTest = apiKey ? apiKey.trim() : '';

    // Se for enviada vazia ou mascarada, pega do banco ou do ambiente
    if (!keyToTest || keyToTest.includes('...')) {
      const savedKeyRow = await prisma.appConfig.findUnique({ where: { key: 'groq_api_key' } });
      keyToTest = savedKeyRow?.value || process.env.GROQ_API_KEY || '';
    }

    if (!keyToTest.startsWith('gsk_')) {
      return NextResponse.json({
        valid: false,
        error: 'Chave inválida. A API Key da Groq deve começar com "gsk_".'
      }, { status: 400 });
    }

    const testRes = await testGroqApiKey(keyToTest);
    if (!testRes.ok) {
      return NextResponse.json({
        valid: false,
        error: testRes.error || 'Falha na validação com a API da Groq'
      });
    }

    return NextResponse.json({
      valid: true,
      message: `Chave da Groq 100% válida e ativa! (${testRes.models.length} modelos disponíveis)`,
      models: testRes.models
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Salva a nova chave, atualiza a credencial no n8n e atualiza o modelo nos fluxos
export async function POST(request) {
  const isAuth = await isAuthenticatedAdmin(request);
  if (!isAuth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { apiKey, model } = await request.json();
    let keyToSave = apiKey ? apiKey.trim() : '';
    const selectedModel = model ? model.trim() : null;

    // Se a chave foi enviada (e não está mascarada)
    if (keyToSave && !keyToSave.includes('...')) {
      if (!keyToSave.startsWith('gsk_')) {
        return NextResponse.json({
          error: 'Chave inválida. A API Key da Groq deve começar com "gsk_".'
        }, { status: 400 });
      }

      // 1. Testa a chave na Groq antes de salvar
      const testRes = await testGroqApiKey(keyToSave);
      if (!testRes.ok) {
        return NextResponse.json({
          error: `A chave informada foi rejeitada pela Groq: ${testRes.error}`
        }, { status: 400 });
      }

      // 2. Atualiza a credencial no n8n via API PATCH
      const patchRes = await n8nRequest(`/api/v1/credentials/${GROQ_CRED_ID}`, 'PATCH', {
        name: 'Groq account',
        type: 'groqApi',
        data: {
          apiKey: keyToSave
        }
      });

      if (!patchRes.ok) {
        return NextResponse.json({
          error: patchRes.data?.message || 'Erro ao sincronizar credencial com o n8n.'
        }, { status: 500 });
      }

      // 3. Salva no banco de dados para consulta rápida do admin
      const now = new Date().toISOString();
      await prisma.$transaction([
        prisma.appConfig.upsert({
          where: { key: 'groq_api_key' },
          update: { value: keyToSave },
          create: { key: 'groq_api_key', value: keyToSave }
        }),
        prisma.appConfig.upsert({
          where: { key: 'groq_last_updated' },
          update: { value: now },
          create: { key: 'groq_last_updated', value: now }
        })
      ]);
    }

    // 4. Se o modelo foi informado, atualiza nos nós do n8n e no banco
    if (selectedModel) {
      // Atualiza Shopee
      const shopeeGet = await n8nRequest(`/api/v1/workflows/${SHOPEE_WF_ID}`);
      if (shopeeGet.ok && shopeeGet.data) {
        const wf = shopeeGet.data;
        const groqNode = wf.nodes?.find(n => n.type?.includes('lmChatGroq') || n.name === 'Groq Chat Model');
        if (groqNode) {
          if (!groqNode.parameters) groqNode.parameters = {};
          groqNode.parameters.model = selectedModel;

          await n8nRequest(`/api/v1/workflows/${SHOPEE_WF_ID}`, 'PUT', {
            name: wf.name,
            nodes: wf.nodes,
            connections: wf.connections,
            settings: { executionOrder: wf.settings?.executionOrder || 'v1' }
          });
        }
      }

      // Atualiza Mercado Livre
      const mlGet = await n8nRequest(`/api/v1/workflows/${ML_WF_ID}`);
      if (mlGet.ok && mlGet.data) {
        const wf = mlGet.data;
        const groqNode = wf.nodes?.find(n => n.type?.includes('lmChatGroq') || n.name === 'Groq Chat Model');
        if (groqNode) {
          if (!groqNode.parameters) groqNode.parameters = {};
          groqNode.parameters.model = selectedModel;

          await n8nRequest(`/api/v1/workflows/${ML_WF_ID}`, 'PUT', {
            name: wf.name,
            nodes: wf.nodes,
            connections: wf.connections,
            settings: { executionOrder: wf.settings?.executionOrder || 'v1' }
          });
        }
      }

      // Salva modelo no banco
      await prisma.appConfig.upsert({
        where: { key: 'groq_model' },
        update: { value: selectedModel },
        create: { key: 'groq_model', value: selectedModel }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Credencial e configurações da Groq atualizadas e sincronizadas com sucesso no n8n!',
      maskedKey: keyToSave ? maskKey(keyToSave) : undefined,
      model: selectedModel
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
