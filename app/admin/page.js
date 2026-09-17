'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './admin.css';

export default function AdminDashboard() {
  const router = useRouter();

  // Estados de navegação e autenticação
  const [activeTab, setActiveTab] = useState('ml_cookies');
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [toast, setToast] = useState(null);

  // Estados dos Módulos
  // 1. Mercado Livre
  const [mlData, setMlData] = useState({ cookie: '', xCsrfToken: '', userAgent: '', scrapingUrl: '', updatedAt: null });
  const [loadingMl, setLoadingMl] = useState(false);
  const [mlTestStatus, setMlTestStatus] = useState(null);
  const [showF12Help, setShowF12Help] = useState(false);

  // 2. WhatsApp / WAHA
  const [wahaStatus, setWahaStatus] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loadingWaha, setLoadingWaha] = useState(false);
  const [liveScreenshotUrl, setLiveScreenshotUrl] = useState(null);

  // 3. Grupos WhatsApp
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [testSendingId, setTestSendingId] = useState(null);

  // 4. Automações n8n
  const [n8nData, setN8nData] = useState({ shopee: null, ml: null });
  const [loadingN8n, setLoadingN8n] = useState(false);
  const [cronPlatform, setCronPlatform] = useState('both');
  const [cronExpression, setCronExpression] = useState('*/15 8-22 * * *');
  const [savingCron, setSavingCron] = useState(false);

  // 5. Prompts e Configurações de IA (Groq)
  const [promptPlatform, setPromptPlatform] = useState('ml');
  const [promptText, setPromptText] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [groqKey, setGroqKey] = useState('');
  const [groqModel, setGroqModel] = useState('openai/gpt-oss-120b');
  const [groqPopularModels, setGroqPopularModels] = useState([]);
  const [groqMaskedKey, setGroqMaskedKey] = useState('');
  const [groqLastUpdated, setGroqLastUpdated] = useState(null);
  const [showGroqKeyRaw, setShowGroqKeyRaw] = useState(false);
  const [testingGroq, setTestingGroq] = useState(false);
  const [groqTestStatus, setGroqTestStatus] = useState(null);
  const [savingGroq, setSavingGroq] = useState(false);


  // 6. Configurações do Site
  const [siteConfigs, setSiteConfigs] = useState({
    whatsapp_vip_link: '',
    site_banner_text: '',
    site_banner_active: 'true',
    site_title: 'ofertasTOP.shop',
    site_subtitle: ''
  });
  const [savingConfigs, setSavingConfigs] = useState(false);

  // 7. Catálogo & Métricas
  const [deals, setDeals] = useState([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [loadingDeals, setLoadingDeals] = useState(false);

  // 8. Cupons de Desconto
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount: '',
    description: '',
    store: 'Todas',
    dealId: '',
    active: true,
    priority: 0
  });
  const [savingCoupon, setSavingCoupon] = useState(false);

  // Helper para requisições autenticadas com suporte a Token Bearer e Cookies
  function adminFetch(url, options = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    const headers = { ...(options.headers || {}) };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  }

  // Helper para toast
  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  // 1. Checa autenticação inicial
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await adminFetch('/api/admin/auth');
        const data = await res.json();
        if (!data.authenticated) {
          router.push('/admin/login');
        } else {
          setLoadingAuth(false);
          loadAllData();
        }
      } catch {
        router.push('/admin/login');
      }
    }
    checkAuth();
  }, [router]);

  // Carrega todos os dados
  function loadAllData() {
    loadMlCookies();
    loadWaha();
    loadGroups();
    loadN8n();
    loadGroqConfig();
    loadSiteConfigs();
    loadDeals();
    loadCoupons();
  }

  // === MÓDULO MERCADO LIVRE ===
  async function loadMlCookies() {
    try {
      const res = await adminFetch('/api/admin/cookies');
      if (res.ok) {
        const data = await res.json();
        setMlData({
          cookie: data.cookie || '',
          xCsrfToken: data.xCsrfToken || '',
          userAgent: data.userAgent || '',
          scrapingUrl: data.scrapingUrl || 'https://www.mercadolivre.com.br/ofertas?container_id=MLB779362-1&page=1',
          updatedAt: data.updatedAt
        });
      }
    } catch (e) {
      console.error('Erro ao carregar cookies ML:', e);
    }
  }

  async function handleSaveMl(e) {
    e?.preventDefault();
    setLoadingMl(true);
    try {
      const res = await adminFetch('/api/admin/cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mlData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Credenciais do Mercado Livre salvas com sucesso!');
        loadMlCookies();
      } else {
        showToast(data.error || 'Erro ao salvar', 'danger');
      }
    } catch {
      showToast('Erro de conexão ao salvar', 'danger');
    } finally {
      setLoadingMl(false);
    }
  }

  async function handleTestMl() {
    setMlTestStatus({ loading: true });
    try {
      const res = await adminFetch('/api/admin/cookies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mlData)
      });
      const data = await res.json();
      setMlTestStatus({
        loading: false,
        valid: data.valid,
        message: data.message || (data.valid ? 'Cookies válidos!' : 'Cookies inválidos')
      });
    } catch (e) {
      setMlTestStatus({ loading: false, valid: false, message: e.message });
    }
  }

  // === MÓDULO WHATSAPP (WAHA) ===
  async function loadWaha() {
    setLoadingWaha(true);
    try {
      const res = await adminFetch('/api/admin/waha?action=status');
      if (res.ok) {
        const data = await res.json();
        setWahaStatus(data);
        if (data.status !== 'WORKING') {
          loadQrCode();
        }
      }
    } catch (e) {
      console.error('Erro WAHA status:', e);
    } finally {
      setLoadingWaha(false);
    }
  }

  async function loadQrCode() {
    try {
      const res = await adminFetch('/api/admin/waha?action=qr');
      if (res.ok) {
        const data = await res.json();
        setQrCodeData(data);
      }
    } catch (e) {
      console.error('Erro ao buscar QR Code:', e);
    }
  }

  function handleRefreshScreenshot() {
    setLiveScreenshotUrl(`/api/admin/waha?action=screenshot&t=${Date.now()}`);
  }

  async function handleRestartWaha() {
    if (!confirm('Deseja realmente reiniciar a sessão do WhatsApp?')) return;
    setLoadingWaha(true);
    try {
      const res = await adminFetch('/api/admin/waha?action=restart', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Sessão reiniciada! Aguardando reconexão...');
        setTimeout(loadWaha, 4000);
      } else {
        showToast('Falha ao reiniciar sessão', 'danger');
      }
    } catch {
      showToast('Erro de conexão ao reiniciar', 'danger');
    } finally {
      setLoadingWaha(false);
    }
  }

  async function handleLogoutWaha() {
    if (!confirm('Atenção: Ao desconectar, você precisará ler o QR Code novamente para reconectar. Continuar?')) return;
    setLoadingWaha(true);
    try {
      const res = await adminFetch('/api/admin/waha?action=logout', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Sessão desconectada. Gerando novo QR Code...');
        setTimeout(() => {
          loadWaha();
          loadQrCode();
        }, 2000);
      }
    } catch {
      showToast('Erro ao desconectar', 'danger');
    } finally {
      setLoadingWaha(false);
    }
  }

  // === MÓDULO GRUPOS WHATSAPP ===
  async function loadGroups() {
    setLoadingGroups(true);
    try {
      const res = await adminFetch('/api/admin/waha?action=groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (e) {
      console.error('Erro ao carregar grupos:', e);
    } finally {
      setLoadingGroups(false);
    }
  }

  async function handleSetTargetGroup(groupId) {
    try {
      const res = await adminFetch('/api/admin/n8n?action=update_group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetGroup: groupId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedGroup(groupId);
        showToast(`Grupo oficial atualizado nos robôs para: ${groupId}`);
        loadN8n();
      } else {
        showToast(data.error || 'Erro ao definir grupo', 'danger');
      }
    } catch {
      showToast('Erro de conexão ao definir grupo', 'danger');
    }
  }

  async function handleSendTestMessage(groupId) {
    setTestSendingId(groupId);
    try {
      const res = await adminFetch('/api/admin/waha?action=test_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: groupId,
          text: '🧪 *[ofertasTOP.shop]* Teste de Comunicação do Robô: Grupo configurado e pronto para receber achadinhos!'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Mensagem de teste enviada com sucesso no grupo!');
      } else {
        showToast('Erro ao enviar mensagem no grupo', 'danger');
      }
    } catch {
      showToast('Erro ao enviar mensagem de teste', 'danger');
    } finally {
      setTestSendingId(null);
    }
  }

  // === MÓDULO N8N AUTOMATIONS ===
  async function loadN8n() {
    setLoadingN8n(true);
    try {
      const res = await adminFetch('/api/admin/n8n');
      if (res.ok) {
        const data = await res.json();
        setN8nData(data);
        if (data.shopee?.targetGroup) {
          setSelectedGroup(data.shopee.targetGroup);
        }
        if (promptPlatform === 'ml' && data.ml?.prompt) {
          setPromptText(data.ml.prompt);
        } else if (promptPlatform === 'shopee' && data.shopee?.prompt) {
          setPromptText(data.shopee.prompt);
        }
        if (data.shopee?.cron || data.ml?.cron) {
          setCronExpression(data.shopee?.cron || data.ml?.cron || '*/15 8-22 * * *');
        }
      }
    } catch (e) {
      console.error('Erro ao carregar n8n:', e);
    } finally {
      setLoadingN8n(false);
    }
  }

  async function handleToggleWorkflow(platform, currentActive) {
    try {
      const res = await adminFetch('/api/admin/n8n?action=toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, active: !currentActive })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Fluxo ${platform.toUpperCase()} ${!currentActive ? 'ATIVADO' : 'PAUSADO'}!`);
        loadN8n();
      } else {
        showToast(data.error || 'Erro ao alterar fluxo', 'danger');
      }
    } catch {
      showToast('Erro de comunicação com o n8n', 'danger');
    }
  }

  // Tradução amigável para expressões Cron comuns
  function formatCronReadable(cron) {
    if (!cron) return 'Não configurado';
    const c = cron.trim();
    if (c === '*/10 8-22 * * *') return 'A cada 10 min (08h às 22h)';
    if (c === '*/15 8-22 * * *') return 'A cada 15 min (08h às 22h) - Padrão';
    if (c === '0,30 8-22 * * *') return 'A cada 30 min (08h às 22h)';
    if (c === '0 8-22 * * *') return 'A cada 1 hora (08h às 22h)';
    if (c === '0 8,10,12,14,16,18,20,22 * * *') return 'A cada 2 horas (08h às 22h)';
    if (c === '*/30 * * * *') return '24 Horas: A cada 30 min';
    if (c === '0 * * * *') return '24 Horas: A cada 1 hora';
    if (c === '*/15 8-21 * * *') return 'A cada 15 min (08h às 21h)';
    if (c === '0,30 8-21 * * *') return 'A cada 30 min (08h às 21h)';
    return `${c}`;
  }

  async function handleSaveCron(e) {
    e?.preventDefault();
    if (!cronExpression || !cronExpression.trim()) {
      showToast('Informe uma expressão Cron válida.', 'danger');
      return;
    }
    setSavingCron(true);
    try {
      const res = await adminFetch('/api/admin/n8n?action=update_cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: cronPlatform,
          cronExpression: cronExpression.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Agendamento dos disparos atualizado com sucesso!');
        loadN8n();
      } else {
        showToast(data.error || 'Erro ao salvar agendamento Cron', 'danger');
      }
    } catch {
      showToast('Erro de conexão ao salvar Cron', 'danger');
    } finally {
      setSavingCron(false);
    }
  }

  // === MÓDULO PROMPTS IA ===
  function handleChangePromptTab(platform) {
    setPromptPlatform(platform);
    if (platform === 'ml' && n8nData.ml?.prompt) {
      setPromptText(n8nData.ml.prompt);
    } else if (platform === 'shopee' && n8nData.shopee?.prompt) {
      setPromptText(n8nData.shopee.prompt);
    }
  }

  async function handleSavePrompt() {
    setSavingPrompt(true);
    try {
      const res = await adminFetch('/api/admin/n8n?action=update_prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: promptPlatform, prompt: promptText })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Prompt de ${promptPlatform.toUpperCase()} atualizado no robô!`);
        loadN8n();
      } else {
        showToast(data.error || 'Erro ao salvar prompt', 'danger');
      }
    } catch {
      showToast('Erro de comunicação com o n8n', 'danger');
    } finally {
      setSavingPrompt(false);
    }
  }

  function handleApplyPromptPreset(template) {
    let text = '';
    if (template === 'urgente') {
      text = `=Atue como um Especialista em Achadinhos e Ofertas Relâmpago.\n\n"Adicione apenas emojis dinâmicos e mantenha o tom de urgência."\n\n--- MODELO ---\n🚨 *MEGA PROMOÇÃO DETECTADA!*\n\n📦 {{ $json.name || $json.productName }}\n\n❌ De: ~R$ {{ $json.original_price || $json.price }}~\n🔥 *Por: R$ {{ $json.actual_price || $json.price }}*\n🎟️ Desconto: {{ $json.discount || $json.priceDiscountRate + '%' }}\n{{ $json.coupon_line ? $json.coupon_line + '\\n' : '' }}\n⚡ *Aproveite antes que acabe o estoque:*\n🔗 {{ $json.short_url || $json.shortLink }}\n\n🚀 *Mais ofertas exclusivas:* http://wqvie9pfrpbncwetgt7qnebb.147.93.15.31.sslip.io`;
    } else if (template === 'direto') {
      text = `=Atue como um Editor de Ofertas Direto e Objetivo.\n\n--- MODELO ---\n{{ $json.name || $json.productName }}\n\n💰 *R$ {{ $json.actual_price || $json.price }}* ({{ $json.discount || $json.priceDiscountRate + '%' }} OFF)\n{{ $json.coupon_line ? $json.coupon_line + '\\n' : '' }}\n👉 Compre aqui: {{ $json.short_url || $json.shortLink }}`;
    }
    if (text) setPromptText(text);
  }

  // === MÓDULO CREDENCIAL & MODELOS GROQ ===
  async function loadGroqConfig() {
    try {
      const res = await adminFetch('/api/admin/groq');
      if (res.ok) {
        const data = await res.json();
        setGroqMaskedKey(data.maskedKey || '');
        if (data.currentModel) setGroqModel(data.currentModel);
        if (data.popularModels) setGroqPopularModels(data.popularModels);
        setGroqLastUpdated(data.lastUpdated);
      }
    } catch (e) {
      console.error('Erro ao carregar Groq config:', e);
    }
  }

  async function handleTestGroqKey() {
    setTestingGroq(true);
    setGroqTestStatus(null);
    try {
      const res = await adminFetch('/api/admin/groq', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: groqKey || groqMaskedKey })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setGroqTestStatus({ valid: true, message: data.message });
        showToast('Chave da Groq validada com sucesso na API oficial!');
      } else {
        setGroqTestStatus({ valid: false, message: data.error || 'Chave inválida ou não autorizada pela Groq.' });
        showToast(data.error || 'Falha ao validar chave Groq', 'danger');
      }
    } catch (e) {
      setGroqTestStatus({ valid: false, message: e.message || 'Erro de conexão ao testar chave' });
      showToast('Erro de conexão ao testar chave', 'danger');
    } finally {
      setTestingGroq(false);
    }
  }

  async function handleSaveGroq(e) {
    e?.preventDefault();
    setSavingGroq(true);
    try {
      const res = await adminFetch('/api/admin/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: groqKey, model: groqModel })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Credencial e modelo Groq salvos no n8n!');
        setGroqKey('');
        setShowGroqKeyRaw(false);
        loadGroqConfig();
        loadN8n();
      } else {
        showToast(data.error || 'Erro ao salvar credencial da Groq', 'danger');
      }
    } catch {
      showToast('Erro de conexão ao salvar na Groq', 'danger');
    } finally {
      setSavingGroq(false);
    }
  }

  // === MÓDULO CONFIGS SITE ===
  async function loadSiteConfigs() {
    try {
      const res = await adminFetch('/api/admin/config');
      if (res.ok) {
        const data = await res.json();
        setSiteConfigs(data.configs || {});
      }
    } catch (e) {
      console.error('Erro ao carregar configs site:', e);
    }
  }

  async function handleSaveSiteConfigs(e) {
    e?.preventDefault();
    setSavingConfigs(true);
    try {
      const res = await adminFetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteConfigs)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Configurações do site salvas com sucesso!');
      } else {
        showToast(data.error || 'Erro ao salvar', 'danger');
      }
    } catch {
      showToast('Erro de conexão ao salvar', 'danger');
    } finally {
      setSavingConfigs(false);
    }
  }

  // === MÓDULO CATÁLOGO & MÉTRICAS ===
  async function loadDeals() {
    setLoadingDeals(true);
    try {
      const res = await adminFetch('/api/admin/deals');
      if (res.ok) {
        const data = await res.json();
        setDeals(data.deals || []);
        setTotalClicks(data.totalClicks || 0);
      }
    } catch (e) {
      console.error('Erro ao carregar ofertas:', e);
    } finally {
      setLoadingDeals(false);
    }
  }

  async function handleDeleteDeal(id, title) {
    if (!confirm(`Remover do site a oferta: "${title.slice(0, 35)}..."?`)) return;
    try {
      const res = await fetch(`/api/admin/deals?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Oferta removida com sucesso!');
        setDeals(deals.filter(d => d.id !== id));
      } else {
        showToast(data.error || 'Erro ao remover oferta', 'danger');
      }
    } catch {
      showToast('Erro ao remover oferta', 'danger');
    }
  }

  // === MÓDULO CUPONS DE DESCONTO ===
  async function loadCoupons() {
    setLoadingCoupons(true);
    try {
      const res = await adminFetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (e) {
      console.error('Erro ao carregar cupons:', e);
    } finally {
      setLoadingCoupons(false);
    }
  }

  function handleStartCreateCoupon() {
    setEditingCouponId(null);
    setCouponForm({
      code: '',
      discount: '',
      description: '',
      store: 'Todas',
      dealId: '',
      active: true,
      priority: 0
    });
  }

  function handleStartEditCoupon(coupon) {
    setEditingCouponId(coupon.id);
    setCouponForm({
      code: coupon.code,
      discount: coupon.discount,
      description: coupon.description || '',
      store: coupon.store || 'Todas',
      dealId: coupon.dealId || '',
      active: coupon.active,
      priority: coupon.priority || 0
    });
    // Rola suavemente até o formulário de cupons
    window.scrollTo({ top: 400, behavior: 'smooth' });
  }

  async function handleSaveCoupon(e) {
    e?.preventDefault();
    if (!couponForm.code.trim() || !couponForm.discount.trim()) {
      showToast('Preencha o código e o desconto do cupom.', 'danger');
      return;
    }
    setSavingCoupon(true);
    try {
      const method = editingCouponId ? 'PUT' : 'POST';
      const body = editingCouponId ? { id: editingCouponId, ...couponForm } : couponForm;

      const res = await adminFetch('/api/admin/coupons', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(editingCouponId ? 'Cupom atualizado com sucesso!' : 'Cupom criado e aplicado às ofertas!');
        handleStartCreateCoupon();
        loadCoupons();
      } else {
        showToast(data.error || 'Erro ao salvar cupom', 'danger');
      }
    } catch {
      showToast('Erro de conexão ao salvar cupom', 'danger');
    } finally {
      setSavingCoupon(false);
    }
  }

  async function handleToggleCoupon(id, currentActive) {
    try {
      const res = await adminFetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentActive })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Cupom ${!currentActive ? 'ATIVADO' : 'PAUSADO'}!`);
        loadCoupons();
      } else {
        showToast(data.error || 'Erro ao alterar status do cupom', 'danger');
      }
    } catch {
      showToast('Erro ao atualizar cupom', 'danger');
    }
  }

  async function handleDeleteCoupon(id, code) {
    if (!confirm(`Tem certeza que deseja excluir o cupom "${code}"?`)) return;
    try {
      const res = await adminFetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Cupom "${code}" excluído com sucesso!`);
        setCoupons(coupons.filter(c => c.id !== id));
        if (editingCouponId === id) handleStartCreateCoupon();
      } else {
        showToast(data.error || 'Erro ao excluir cupom', 'danger');
      }
    } catch {
      showToast('Erro de conexão ao excluir', 'danger');
    }
  }

  async function handleLogout() {
    await adminFetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  }

  if (loadingAuth) {
    return (
      <div className="admin-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Carregando Painel de Gestão...</p>
      </div>
    );
  }

  return (
    <div className="admin-body">
      {/* Topo do Header */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand">
            <div className="admin-brand-icon">⚡</div>
            <div>
              <span className="admin-brand-title">ofertasTOP.shop</span>
              <span className="admin-brand-badge">Comando Central</span>
            </div>
          </div>

          <div className="admin-header-actions">
            <a href="/" target="_blank" className="admin-btn admin-btn-secondary admin-btn-sm" style={{ textDecoration: 'none' }}>
              🌐 Ver Site
            </a>
            <button onClick={handleLogout} className="admin-btn admin-btn-danger admin-btn-sm">
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="admin-container">
        {/* Barra de Métricas Rápida */}
        <div className="admin-metrics-grid">
          <div className="admin-metric-card">
            <div className="admin-metric-icon" style={{ background: 'rgba(255, 230, 0, 0.15)', color: '#ffe600' }}>
              🍪
            </div>
            <div className="admin-metric-info">
              <span className="admin-metric-label">Status Mercado Livre</span>
              <span className="admin-metric-value" style={{ fontSize: '1.1rem' }}>
                {mlData.updatedAt ? 'Configurado' : 'Pendente'}
              </span>
            </div>
          </div>

          <div className="admin-metric-card">
            <div className="admin-metric-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              📱
            </div>
            <div className="admin-metric-info">
              <span className="admin-metric-label">WhatsApp WAHA</span>
              <span className="admin-metric-value" style={{ fontSize: '1.1rem' }}>
                {wahaStatus?.status === 'WORKING' ? (
                  <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="admin-dot admin-dot-pulse" style={{ background: '#10b981' }}></span> Conectado
                  </span>
                ) : (
                  <span style={{ color: '#f43f5e' }}>Aguardando QR</span>
                )}
              </span>
            </div>
          </div>

          <div className="admin-metric-card">
            <div className="admin-metric-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
              ⚡
            </div>
            <div className="admin-metric-info">
              <span className="admin-metric-label">Robôs de Disparo</span>
              <span className="admin-metric-value" style={{ fontSize: '1.1rem' }}>
                Shopee ({n8nData.shopee?.active ? 'Ativo' : 'Pausado'}) | ML ({n8nData.ml?.active ? 'Ativo' : 'Pausado'})
              </span>
            </div>
          </div>

          <div className="admin-metric-card">
            <div className="admin-metric-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
              📊
            </div>
            <div className="admin-metric-info">
              <span className="admin-metric-label">Cliques no Site</span>
              <span className="admin-metric-value">{totalClicks} cliques</span>
            </div>
          </div>

          <div className="admin-metric-card">
            <div className="admin-metric-icon" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
              🎟️
            </div>
            <div className="admin-metric-info">
              <span className="admin-metric-label">Cupons de Desconto</span>
              <span className="admin-metric-value" style={{ fontSize: '1.1rem' }}>
                {coupons.filter(c => c.active).length} ativos ({coupons.length} total)
              </span>
            </div>
          </div>
        </div>

        {/* Menu de Abas */}
        <nav className="admin-tabs">
          <button
            className={`admin-tab-btn ${activeTab === 'ml_cookies' ? 'active' : ''}`}
            onClick={() => setActiveTab('ml_cookies')}
          >
            <span>🍪</span>
            <span>Mercado Livre (Cookies & Token)</span>
          </button>

          <button
            className={`admin-tab-btn ${activeTab === 'whatsapp' ? 'active' : ''}`}
            onClick={() => setActiveTab('whatsapp')}
          >
            <span>📱</span>
            <span>WhatsApp & QR Code</span>
          </button>

          <button
            className={`admin-tab-btn ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            <span>👥</span>
            <span>Grupos de Disparo ({groups.length})</span>
          </button>

          <button
            className={`admin-tab-btn ${activeTab === 'disparos' ? 'active' : ''}`}
            onClick={() => setActiveTab('disparos')}
          >
            <span>⚡</span>
            <span>Controle dos Robôs</span>
          </button>

          <button
            className={`admin-tab-btn ${activeTab === 'prompts' ? 'active' : ''}`}
            onClick={() => setActiveTab('prompts')}
          >
            <span>🧠</span>
            <span>Prompts & IA (Groq)</span>
          </button>

          <button
            className={`admin-tab-btn ${activeTab === 'site_config' ? 'active' : ''}`}
            onClick={() => setActiveTab('site_config')}
          >
            <span>⚙️</span>
            <span>Configurações do Site</span>
          </button>

          <button
            className={`admin-tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
            onClick={() => setActiveTab('coupons')}
          >
            <span>🎟️</span>
            <span>Cupons de Desconto ({coupons.length})</span>
          </button>

          <button
            className={`admin-tab-btn ${activeTab === 'deals' ? 'active' : ''}`}
            onClick={() => setActiveTab('deals')}
          >
            <span>🛍️</span>
            <span>Ofertas & Catálogo ({deals.length})</span>
          </button>
        </nav>

        {/* ========================================================= */}
        {/* ABA 1: MERCADO LIVRE (COOKIES, TOKEN E USER-AGENT)       */}
        {/* ========================================================= */}
        {activeTab === 'ml_cookies' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">
                  <span>🍪</span> Gestão de Cookies, Token e Agente - Mercado Livre
                </h2>
                <p className="admin-card-subtitle">
                  Atualize suas credenciais de scraping em 5 segundos sem precisar abrir o banco de dados. O robô lerá estas credenciais no próximo ciclo.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowF12Help(!showF12Help)}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  ❓ Como pegar os cookies (F12)
                </button>
                <button
                  type="button"
                  onClick={handleTestMl}
                  className="admin-btn admin-btn-primary admin-btn-sm"
                  disabled={mlTestStatus?.loading}
                >
                  {mlTestStatus?.loading ? 'Testando no Mercado Livre...' : '🧪 Testar Conexão Agora'}
                </button>
              </div>
            </div>

            {/* Resultado do Teste */}
            {mlTestStatus && !mlTestStatus.loading && (
              <div style={{
                background: mlTestStatus.valid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                border: `1px solid ${mlTestStatus.valid ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
                color: mlTestStatus.valid ? '#6ee7b7' : '#fda4af',
                padding: '12px 18px',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '20px' }}>{mlTestStatus.valid ? '✅' : '❌'}</span>
                <div>
                  <strong>{mlTestStatus.valid ? 'Conexão Aprovada:' : 'Falha na Validação:'}</strong> {mlTestStatus.message}
                </div>
              </div>
            )}

            {/* Guia Rápido F12 */}
            {showF12Help && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                padding: '18px 20px',
                borderRadius: '12px',
                marginBottom: '24px',
                fontSize: '0.88rem',
                lineHeight: '1.6'
              }}>
                <h4 style={{ color: '#c4b5fd', marginBottom: '8px', fontWeight: '700' }}>
                  📌 Passo a passo para renovar os cookies do Mercado Livre:
                </h4>
                <ol style={{ paddingLeft: '20px', color: '#cbd5e1' }}>
                  <li>Abra o navegador no computador e acesse <strong>mercadolivre.com.br</strong> com sua conta conectada.</li>
                  <li>Pressione <strong>F12</strong> no teclado (ou clique com botão direito &gt; Inspecionar) e vá na aba <strong>Rede (Network)</strong>.</li>
                  <li>Acesse a página de Cupons (<code>mercadolivre.com.br/cupons</code>) ou atualize a página (F5).</li>
                  <li>No primeiro item da lista da rede (tipo "cupons" ou documento), clique nele e olhe a aba <strong>Cabeçalhos (Headers)</strong>.</li>
                  <li>Role até <strong>Request Headers</strong>: copie o valor de <strong>Cookie</strong>, <strong>x-csrf-token</strong> e <strong>User-Agent</strong> e cole nos campos abaixo!</li>
                </ol>
              </div>
            )}

            <form onSubmit={handleSaveMl}>
              {/* Link da Página de Ofertas / Categoria do Mercado Livre */}
              <div className="admin-form-group" style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 230, 0, 0.35)',
                borderRadius: '12px',
                padding: '18px 20px',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <label className="admin-label" style={{ color: '#ffe600', fontSize: '1rem', fontWeight: '700', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🔗</span> Link da Página de Ofertas / Categoria a Disparar
                  </label>
                  {mlData.scrapingUrl && (
                    <a
                      href={mlData.scrapingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                      style={{ textDecoration: 'none', color: '#ffe600', borderColor: 'rgba(255, 230, 0, 0.4)' }}
                    >
                      🌐 Abrir Link no Mercado Livre ↗
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  className="admin-input"
                  placeholder="https://www.mercadolivre.com.br/ofertas?container_id=MLB779362-1&page=1"
                  value={mlData.scrapingUrl || ''}
                  onChange={(e) => setMlData({ ...mlData, scrapingUrl: e.target.value })}
                  style={{ fontSize: '0.92rem', padding: '12px 14px' }}
                />
                <p className="admin-help-text" style={{ color: '#cbd5e1', marginTop: '8px', lineHeight: '1.5' }}>
                  💡 <strong>Quer trocar o que o robô dispara?</strong> Abra o Mercado Livre no seu navegador, navegue até a categoria desejada (ex: Celulares, Eletrodomésticos, Ferramentas, etc.), copie o link da barra de endereço e cole aqui. Ao clicar em <strong>Salvar</strong>, o robô passará a extrair ofertas desse novo link!
                </p>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  String de Cookies Completa (cookie)
                  {mlData.updatedAt && (
                    <span style={{ color: '#64748b', fontSize: '0.78rem', marginLeft: '10px' }}>
                      Última atualização: {new Date(mlData.updatedAt).toLocaleString('pt-BR')}
                    </span>
                  )}
                </label>
                <textarea
                  rows="6"
                  className="admin-textarea"
                  placeholder="Cole aqui o cookie completo: _csrf=...; _mldataSessionId=...; ssid=..."
                  value={mlData.cookie}
                  onChange={(e) => setMlData({ ...mlData, cookie: e.target.value })}
                  required
                />
                <p className="admin-help-text">
                  Contém as credenciais de sessão. Quando o robô começar a avisar erro de login ou 401/403 no WhatsApp, basta colar um novo cookie aqui.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                <div className="admin-form-group">
                  <label className="admin-label">Token CSRF (x-csrf-token)</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Ex: q5G26nvF--kYLtXm2c8SqiaoUoiC7BE560mQ"
                    value={mlData.xCsrfToken}
                    onChange={(e) => setMlData({ ...mlData, xCsrfToken: e.target.value })}
                  />
                  <p className="admin-help-text">Token de proteção anti-CSRF do cabeçalho da requisição.</p>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">User-Agent (Agente do Navegador)</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
                    value={mlData.userAgent}
                    onChange={(e) => setMlData({ ...mlData, userAgent: e.target.value })}
                  />
                  <p className="admin-help-text">Identificação do navegador para evitar bloqueios por bot.</p>
                </div>
              </div>

              <div style={{ marginTop: '10px', display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  className="admin-btn admin-btn-success"
                  disabled={loadingMl}
                >
                  {loadingMl ? 'Salvando no PostgreSQL...' : '💾 Salvar e Atualizar Robô Mercado Livre'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 2: WHATSAPP & QR CODE (WAHA)                         */}
        {/* ========================================================= */}
        {activeTab === 'whatsapp' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">
                  <span>📱</span> Conexão WhatsApp & Leitor de QR Code
                </h2>
                <p className="admin-card-subtitle">
                  Conecte seu celular ao robô sem precisar acessar a API externa do WAHA.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={loadWaha}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  disabled={loadingWaha}
                >
                  🔄 Atualizar Status
                </button>
                <button
                  type="button"
                  onClick={handleRestartWaha}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  ⚡ Reiniciar Sessão
                </button>
                <button
                  type="button"
                  onClick={handleLogoutWaha}
                  className="admin-btn admin-btn-danger admin-btn-sm"
                >
                  🚪 Desconectar / Trocar Número
                </button>
              </div>
            </div>

            {/* Se estiver conectado */}
            {wahaStatus?.status === 'WORKING' ? (
              <div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '24px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  marginBottom: '28px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#10b981',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
                  }}>
                    ✓
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff' }}>
                        WhatsApp Conectado e Operando
                      </h3>
                      <span className="admin-badge admin-badge-success">Sessão: {wahaStatus.name}</span>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
                      Identificador: <strong>{wahaStatus.me?.id || 'Autenticado'}</strong> | Nome: <strong>{wahaStatus.me?.pushName || 'Automação'}</strong>
                    </p>
                  </div>
                </div>

                {/* Live Screenshot do WhatsApp Web */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff' }}>
                      🖥️ Captura em Tempo Real da Tela do WhatsApp Web
                    </h4>
                    <button
                      onClick={handleRefreshScreenshot}
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                    >
                      📸 Atualizar Print da Tela
                    </button>
                  </div>

                  <div style={{
                    background: '#0a0f1c',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    maxHeight: '450px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px'
                  }}>
                    <img
                      src={liveScreenshotUrl || `/api/admin/waha?action=screenshot&t=${Date.now()}`}
                      alt="WhatsApp Web Live Screen"
                      style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: '8px', objectFit: 'contain' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Se precisar ler QR Code */
              <div className="admin-qr-container">
                <span className="admin-badge admin-badge-warning" style={{ fontSize: '0.9rem', padding: '6px 16px' }}>
                  ⏳ Status: {wahaStatus?.status || 'Aguardando Leitura de QR'}
                </span>

                <h3 style={{ fontSize: '1.2rem', color: '#ffffff', fontWeight: '700' }}>
                  Aponte seu celular para conectar o WhatsApp
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '450px' }}>
                  No seu celular, abra o WhatsApp &gt; Configurações &gt; Aparelhos conectados &gt; Conectar um aparelho.
                </p>

                <div className="admin-qr-image-wrapper">
                  {qrCodeData?.qrImage ? (
                    <img src={qrCodeData.qrImage} alt="QR Code WhatsApp" className="admin-qr-img" />
                  ) : (
                    <div style={{ width: '260px', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                      Gerando QR Code...
                    </div>
                  )}
                </div>

                <button onClick={loadQrCode} className="admin-btn admin-btn-primary admin-btn-sm">
                  🔄 Atualizar Imagem do QR Code
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 3: GRUPOS WHATSAPP (LISTAR E ESCOLHER DISPAROS)      */}
        {/* ========================================================= */}
        {activeTab === 'groups' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">
                  <span>👥</span> Grupos de Disparo no WhatsApp
                </h2>
                <p className="admin-card-subtitle">
                  Selecione para qual grupo seus robôs (Shopee e Mercado Livre) devem enviar as ofertas diárias.
                </p>
              </div>

              <button
                onClick={loadGroups}
                className="admin-btn admin-btn-secondary admin-btn-sm"
                disabled={loadingGroups}
              >
                {loadingGroups ? 'Buscando grupos...' : '🔄 Atualizar Grupos do Celular'}
              </button>
            </div>

            {selectedGroup && (
              <div style={{
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                padding: '12px 18px',
                borderRadius: '10px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <span style={{ color: '#c4b5fd', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
                    Grupo Ativo nos Robôs:
                  </span>
                  <div style={{ color: '#ffffff', fontWeight: '700', fontSize: '0.98rem' }}>
                    {groups.find(g => g.id === selectedGroup)?.name || selectedGroup}
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    ID: {selectedGroup}
                  </span>
                </div>

                <button
                  onClick={() => handleSendTestMessage(selectedGroup)}
                  className="admin-btn admin-btn-primary admin-btn-sm"
                  disabled={testSendingId === selectedGroup}
                >
                  {testSendingId === selectedGroup ? 'Enviando teste...' : '🧪 Enviar Mensagem de Teste'}
                </button>
              </div>
            )}

            {groups.length === 0 ? (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>
                Nenhum grupo encontrado ou WhatsApp desconectado. Conecte o WhatsApp na aba anterior.
              </p>
            ) : (
              <div className="admin-groups-grid">
                {groups.map((group) => {
                  const isCurrent = selectedGroup === group.id;
                  return (
                    <div
                      key={group.id}
                      className={`admin-group-card ${isCurrent ? 'selected' : ''}`}
                    >
                      <div className="admin-group-header">
                        <div>
                          <div className="admin-group-name">{group.name}</div>
                          <div className="admin-group-jid">{group.id}</div>
                        </div>

                        {isCurrent && (
                          <span className="admin-badge admin-badge-success">
                            Oficial
                          </span>
                        )}
                      </div>

                      <div className="admin-group-meta">
                        <span>👥 {group.participantsCount} membros</span>
                        <span>•</span>
                        <span>📬 {group.unreadCount} não lidas</span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <button
                          onClick={() => handleSetTargetGroup(group.id)}
                          className={`admin-btn admin-btn-sm ${isCurrent ? 'admin-btn-secondary' : 'admin-btn-success'}`}
                          style={{ flex: 1 }}
                        >
                          {isCurrent ? '✓ Grupo Selecionado' : 'Selecionar para Disparos'}
                        </button>

                        <button
                          onClick={() => handleSendTestMessage(group.id)}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          title="Enviar teste neste grupo"
                          disabled={testSendingId === group.id}
                        >
                          {testSendingId === group.id ? '...' : '🧪 Teste'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 4: CONTROLE DOS ROBÔS E DISPAROS (N8N)               */}
        {/* ========================================================= */}
        {activeTab === 'disparos' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">
                  <span>⚡</span> Controle de Disparos e Automações (n8n)
                </h2>
                <p className="admin-card-subtitle">
                  Pause ou ative os robôs e configure a frequência exata de buscas e disparos automáticos nos grupos do WhatsApp.
                </p>
              </div>

              <button
                onClick={loadN8n}
                className="admin-btn admin-btn-secondary admin-btn-sm"
                disabled={loadingN8n}
              >
                {loadingN8n ? 'Atualizando...' : '🔄 Atualizar Status'}
              </button>
            </div>

            {/* Cards dos Robôs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              {/* Robô Shopee */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '28px' }}>🧡</span>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#ffffff' }}>Robô Shopee</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Workflow: {n8nData.shopee?.id || 'mcCYYe0PcvlKssqt'}</p>
                      </div>
                    </div>

                    <span className={`admin-badge ${n8nData.shopee?.active ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                      {n8nData.shopee?.active ? 'Ativo (Disparando)' : 'Pausado'}
                    </span>
                  </div>

                  <p style={{ color: '#cbd5e1', fontSize: '0.88rem', marginBottom: '14px', lineHeight: '1.5' }}>
                    Filtro ativo: Produtos com avaliação &gt;= 4.0★ e desconto mínimo &gt;= 15%.
                  </p>

                  <div style={{
                    background: 'rgba(249, 115, 22, 0.1)',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    fontSize: '0.84rem'
                  }}>
                    <span style={{ color: '#fdba74', fontWeight: '600' }}>⏰ Frequência de Disparos:</span>
                    <div style={{ color: '#ffffff', fontWeight: '700', marginTop: '2px' }}>
                      {formatCronReadable(n8nData.shopee?.cron)}
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '0.74rem', fontFamily: 'monospace' }}>
                      Expressão: {n8nData.shopee?.cron || 'Não definida'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleToggleWorkflow('shopee', n8nData.shopee?.active)}
                    className={`admin-btn ${n8nData.shopee?.active ? 'admin-btn-danger' : 'admin-btn-success'}`}
                    style={{ flex: 1 }}
                  >
                    {n8nData.shopee?.active ? '⏸️ Pausar Robô Shopee' : '▶️ Ativar Robô Shopee'}
                  </button>
                </div>
              </div>

              {/* Robô Mercado Livre */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 230, 0, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '28px' }}>💛</span>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#ffffff' }}>Robô Mercado Livre</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Workflow: {n8nData.ml?.id || 'uootdY9kh793Y1pV'}</p>
                      </div>
                    </div>

                    <span className={`admin-badge ${n8nData.ml?.active ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                      {n8nData.ml?.active ? 'Ativo (Disparando)' : 'Pausado'}
                    </span>
                  </div>

                  <p style={{ color: '#cbd5e1', fontSize: '0.88rem', marginBottom: '14px', lineHeight: '1.5' }}>
                    Filtro ativo: Desconto real &gt;= 15% e alerta de cookies no WhatsApp em caso de deslogar.
                  </p>

                  <div style={{
                    background: 'rgba(255, 230, 0, 0.08)',
                    border: '1px solid rgba(255, 230, 0, 0.25)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    fontSize: '0.84rem'
                  }}>
                    <span style={{ color: '#fef08a', fontWeight: '600' }}>⏰ Frequência de Disparos:</span>
                    <div style={{ color: '#ffffff', fontWeight: '700', marginTop: '2px' }}>
                      {formatCronReadable(n8nData.ml?.cron)}
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '0.74rem', fontFamily: 'monospace' }}>
                      Expressão: {n8nData.ml?.cron || 'Não definida'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleToggleWorkflow('ml', n8nData.ml?.active)}
                    className={`admin-btn ${n8nData.ml?.active ? 'admin-btn-danger' : 'admin-btn-success'}`}
                    style={{ flex: 1 }}
                  >
                    {n8nData.ml?.active ? '⏸️ Pausar Robô ML' : '▶️ Ativar Robô ML'}
                  </button>
                </div>
              </div>
            </div>

            {/* SEÇÃO DO AGENDADOR CRON DE DISPAROS */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⏱️</span> Agendamento e Frequência de Disparos (Cron n8n)
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.86rem', marginTop: '4px' }}>
                    Escolha de quanto em quanto tempo seus robôs devem buscar ofertas e disparar nos grupos do WhatsApp.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveCron}>
                {/* Seleção de Plataforma Alvo */}
                <div className="admin-form-group" style={{ marginBottom: '20px' }}>
                  <label className="admin-label">Aplicar agendamento em qual robô?</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setCronPlatform('both')}
                      className={`admin-btn admin-btn-sm ${cronPlatform === 'both' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                      style={{ flex: 1, minWidth: '150px' }}
                    >
                      ⚡ Ambos os Robôs (Shopee + ML)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCronPlatform('shopee')}
                      className={`admin-btn admin-btn-sm ${cronPlatform === 'shopee' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                      style={{ flex: 1, minWidth: '130px' }}
                    >
                      🧡 Apenas Shopee
                    </button>
                    <button
                      type="button"
                      onClick={() => setCronPlatform('ml')}
                      className={`admin-btn admin-btn-sm ${cronPlatform === 'ml' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                      style={{ flex: 1, minWidth: '130px' }}
                    >
                      💛 Apenas Mercado Livre
                    </button>
                  </div>
                </div>

                {/* Presets Rápidos */}
                <div className="admin-form-group" style={{ marginBottom: '20px' }}>
                  <label className="admin-label">Escolha um intervalo rápido (ou digite abaixo):</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setCronExpression('*/10 8-22 * * *')}
                      className={`admin-cron-preset-btn ${cronExpression === '*/10 8-22 * * *' ? 'active' : ''}`}
                    >
                      <span className="cron-preset-icon">⚡</span>
                      <div>
                        <strong>A cada 10 minutos</strong>
                        <small>Das 08:00 às 22:59</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCronExpression('*/15 8-22 * * *')}
                      className={`admin-cron-preset-btn ${cronExpression === '*/15 8-22 * * *' ? 'active' : ''}`}
                    >
                      <span className="cron-preset-icon">⭐</span>
                      <div>
                        <strong>A cada 15 minutos</strong>
                        <small>Das 08:00 às 22:59 (Recomendado)</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCronExpression('0,30 8-22 * * *')}
                      className={`admin-cron-preset-btn ${cronExpression === '0,30 8-22 * * *' ? 'active' : ''}`}
                    >
                      <span className="cron-preset-icon">🕒</span>
                      <div>
                        <strong>A cada 30 minutos</strong>
                        <small>Das 08:00 às 22:59</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCronExpression('0 8-22 * * *')}
                      className={`admin-cron-preset-btn ${cronExpression === '0 8-22 * * *' ? 'active' : ''}`}
                    >
                      <span className="cron-preset-icon">⏱️</span>
                      <div>
                        <strong>A cada 1 hora</strong>
                        <small>Das 08:00 às 22:59</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCronExpression('0 8,10,12,14,16,18,20,22 * * *')}
                      className={`admin-cron-preset-btn ${cronExpression === '0 8,10,12,14,16,18,20,22 * * *' ? 'active' : ''}`}
                    >
                      <span className="cron-preset-icon">🕑</span>
                      <div>
                        <strong>A cada 2 horas</strong>
                        <small>Das 08:00 às 22:59</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCronExpression('*/30 * * * *')}
                      className={`admin-cron-preset-btn ${cronExpression === '*/30 * * * *' ? 'active' : ''}`}
                    >
                      <span className="cron-preset-icon">🌙</span>
                      <div>
                        <strong>24 Horas: A cada 30 min</strong>
                        <small>Dia e noite sem pausa</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCronExpression('0 * * * *')}
                      className={`admin-cron-preset-btn ${cronExpression === '0 * * * *' ? 'active' : ''}`}
                    >
                      <span className="cron-preset-icon">🌙</span>
                      <div>
                        <strong>24 Horas: A cada 1 hora</strong>
                        <small>Dia e noite sem pausa</small>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Input de Expressão Cron Customizada */}
                <div className="admin-form-group" style={{ marginBottom: '20px' }}>
                  <label className="admin-label">
                    Expressão Cron (Formato padrão n8n de 5 posições):
                  </label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="admin-input"
                      style={{ fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: '700', letterSpacing: '1px', flex: 1, minWidth: '220px' }}
                      value={cronExpression}
                      onChange={(e) => setCronExpression(e.target.value)}
                      placeholder="*/15 8-22 * * *"
                      required
                    />

                    <div style={{
                      background: 'rgba(139, 92, 246, 0.15)',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      color: '#c4b5fd',
                      fontSize: '0.88rem',
                      fontWeight: '600'
                    }}>
                      💬 {formatCronReadable(cronExpression)}
                    </div>
                  </div>

                  <p className="admin-help-text" style={{ marginTop: '8px' }}>
                    Estrutura da expressão: <code>[minuto] [hora] [dia do mês] [mês] [dia da semana]</code>. Exemplo: <code>*/15 8-22 * * *</code> roda a cada 15 minutos entre as 08:00 e as 22:59 todos os dias.
                  </p>
                </div>

                {/* Botão de Salvar Cron */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="submit"
                    className="admin-btn admin-btn-success"
                    disabled={savingCron}
                    style={{ padding: '12px 28px', fontSize: '0.98rem' }}
                  >
                    {savingCron ? 'Salvando no n8n...' : '💾 Salvar e Aplicar Agendamento no n8n'}
                  </button>
                  <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                    O n8n atualizará o nó Schedule Trigger instantaneamente sem reiniciar os servidores.
                  </span>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 5: PROMPTS E INTELIGÊNCIA ARTIFICIAL (GROQ)           */}
        {/* ========================================================= */}
        {activeTab === 'prompts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* CARD 1: GESTÃO DA CREDENCIAL E MODELO GROQ */}
            <div className="admin-card" style={{ border: '1px solid rgba(139, 92, 246, 0.4)', background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 27, 75, 0.4))' }}>
              <div className="admin-card-header">
                <div>
                  <h2 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>🔑</span> Credencial & Modelo da Groq API (IA Central dos Robôs)
                  </h2>
                  <p className="admin-card-subtitle">
                    Atualize a chave de API da Groq e o modelo utilizado pelos fluxos da Shopee e Mercado Livre diretamente por aqui sem abrir o n8n.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    ↗️ Obter Chave na Groq Cloud
                  </a>
                  <button
                    type="button"
                    onClick={handleTestGroqKey}
                    className="admin-btn admin-btn-primary admin-btn-sm"
                    disabled={testingGroq}
                  >
                    {testingGroq ? 'Testando na Groq...' : '🧪 Testar Chave Agora'}
                  </button>
                </div>
              </div>

              {/* Status do Teste */}
              {groqTestStatus && (
                <div style={{
                  background: groqTestStatus.valid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  border: `1px solid ${groqTestStatus.valid ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
                  color: groqTestStatus.valid ? '#6ee7b7' : '#fda4af',
                  padding: '12px 18px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ fontSize: '20px' }}>{groqTestStatus.valid ? '✅' : '❌'}</span>
                  <div>
                    <strong>{groqTestStatus.valid ? 'Validação Groq Aprovada:' : 'Falha na Validação:'}</strong> {groqTestStatus.message}
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveGroq}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                  {/* Input da Chave Groq */}
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="admin-label" style={{ marginBottom: 0 }}>
                        Chave de API (Groq API Key)
                      </label>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        Atual: <code style={{ color: '#c4b5fd' }}>{groqMaskedKey || 'gsk_...'}</code>
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type={showGroqKeyRaw ? 'text' : 'password'}
                        className="admin-input"
                        placeholder="gsk_..."
                        value={groqKey}
                        onChange={(e) => setGroqKey(e.target.value)}
                        style={{ fontFamily: 'monospace' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowGroqKeyRaw(!showGroqKeyRaw)}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        title={showGroqKeyRaw ? 'Ocultar chave' : 'Mostrar chave'}
                        style={{ minWidth: '42px', padding: '0 12px' }}
                      >
                        {showGroqKeyRaw ? '🙈' : '👁️'}
                      </button>
                    </div>
                    <p className="admin-help-text" style={{ marginTop: '6px' }}>
                      Deixe em branco para manter a chave atual. Se preenchido, a nova chave será testada e sincronizada com o n8n.
                    </p>
                  </div>

                  {/* Seletor de Modelo Groq */}
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label className="admin-label">
                      Modelo de IA (Groq Chat Model)
                    </label>
                    <select
                      className="admin-select"
                      value={groqModel}
                      onChange={(e) => setGroqModel(e.target.value)}
                    >
                      <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (Padrão de Alto Desempenho)</option>
                      <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recomendado - Meta Llama 3.3)</option>
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Ultra Rápido & Econômico)</option>
                      <option value="llama-3.1-70b-versatile">llama-3.1-70b-versatile</option>
                      <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                      <option value="gemma2-9b-it">gemma2-9b-it</option>
                    </select>
                    <p className="admin-help-text" style={{ marginTop: '6px' }}>
                      O modelo selecionado será atualizado nos nós da Shopee e do Mercado Livre no n8n.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    className="admin-btn admin-btn-success"
                    disabled={savingGroq}
                    style={{ padding: '10px 24px' }}
                  >
                    {savingGroq ? 'Salvando e Sincronizando...' : '💾 Salvar e Atualizar Robôs n8n'}
                  </button>
                  <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                    {groqLastUpdated ? `Última sincronização: ${new Date(groqLastUpdated).toLocaleString('pt-BR')}` : 'Sincronização instantânea com a credencial riiy9XqI7uqQmwML'}
                  </span>
                </div>
              </form>
            </div>

            {/* CARD 2: EDITOR VISUAL DE PROMPTS */}
            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h2 className="admin-card-title">
                    <span>🧠</span> Editor Visual de Prompts da IA
                  </h2>
                  <p className="admin-card-subtitle">
                    Altere a copy, emojis e chamada para ação geradas pela inteligência artificial para as mensagens do WhatsApp.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleChangePromptTab('ml')}
                    className={`admin-btn admin-btn-sm ${promptPlatform === 'ml' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                  >
                    💛 Mercado Livre
                  </button>
                  <button
                    onClick={() => handleChangePromptTab('shopee')}
                    className={`admin-btn admin-btn-sm ${promptPlatform === 'shopee' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                  >
                    🧡 Shopee
                  </button>
                </div>
              </div>

              {/* Modelos Prontos */}
              <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: '600' }}>Modelos Rápidos:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPromptPreset('urgente')}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  🔥 Super Urgência com Emojis
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPromptPreset('direto')}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  ⚡ Direto & Minimalista
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
                {/* Editor de Código */}
                <div>
                  <label className="admin-label">
                    Prompt do Sistema ({promptPlatform === 'ml' ? 'Mercado Livre' : 'Shopee'})
                  </label>
                  <textarea
                    rows="15"
                    className="admin-textarea"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Escreva as instruções para a IA..."
                  />
                  <p className="admin-help-text">
                    Variáveis suportadas: <code>&#123;&#123; $json.name &#125;&#125;</code>, <code>&#123;&#123; $json.actual_price &#125;&#125;</code>, <code>&#123;&#123; $json.short_url &#125;&#125;</code>
                  </p>

                  <div style={{ marginTop: '16px' }}>
                    <button
                      type="button"
                      onClick={handleSavePrompt}
                      className="admin-btn admin-btn-success"
                      disabled={savingPrompt}
                    >
                      {savingPrompt ? 'Salvando no n8n...' : `💾 Salvar Prompt de ${promptPlatform.toUpperCase()}`}
                    </button>
                  </div>
                </div>

                {/* Preview da Mensagem */}
                <div>
                  <label className="admin-label">Simulação Visual (Como fica no WhatsApp)</label>
                  <div className="admin-wa-preview">
                    <div className="admin-wa-bubble">
                      {promptText ? (
                        promptText
                          .replace(/^=/, '')
                          .replace(/Atue como.*?\n\n/is, '')
                          .replace(/--- MODELO ---\n/is, '')
                          .replace(/\{\{ \$json\.name \|\| \$json\.productName \}\}/g, 'Fone de Ouvido Bluetooth TWS Pro')
                          .replace(/\{\{ \$json\.actual_price \|\| \$json\.price \}\}/g, '89,90')
                          .replace(/\{\{ \$json\.original_price \|\| \$json\.price \}\}/g, '189,90')
                          .replace(/\{\{ \$json\.discount \|\| \$json\.priceDiscountRate \+ '%' \}\}/g, '52% OFF')
                          .replace(/\{\{ \$json\.short_url \|\| \$json\.shortLink \}\}/g, 'https://mercadolivre.com/sec/xyz123')
                      ) : (
                        'Nenhum prompt carregado.'
                      )}
                    </div>
                  </div>
                  <p className="admin-help-text" style={{ marginTop: '10px' }}>
                    A IA gerará a mensagem seguindo exatamente a estrutura e emojis configurados.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 6: CONFIGURAÇÕES DO SITE (OFERTASTOP.SHOP)          */}
        {/* ========================================================= */}
        {activeTab === 'site_config' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">
                  <span>⚙️</span> Configurações do Site (ofertasTOP.shop)
                </h2>
                <p className="admin-card-subtitle">
                  Edite parâmetros do site sem precisar alterar o código fonte ou realizar novo deploy.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSiteConfigs}>
              <div className="admin-form-group">
                <label className="admin-label">Link de Convite do Grupo VIP (WhatsApp)</label>
                <input
                  type="url"
                  className="admin-input"
                  placeholder="https://chat.whatsapp.com/..."
                  value={siteConfigs.whatsapp_vip_link || ''}
                  onChange={(e) => setSiteConfigs({ ...siteConfigs, whatsapp_vip_link: e.target.value })}
                  required
                />
                <p className="admin-help-text">
                  Utilizado no botão flutuante animado (FAB) do site e links de chamada para ação.
                </p>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Faixa de Alerta / Banner no Topo do Site</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="Ex: 🔥 Entre no nosso Grupo VIP no WhatsApp e receba os achadinhos em primeira mão!"
                  value={siteConfigs.site_banner_text || ''}
                  onChange={(e) => setSiteConfigs({ ...siteConfigs, site_banner_text: e.target.value })}
                />
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="banner-toggle"
                    checked={siteConfigs.site_banner_active === 'true'}
                    onChange={(e) => setSiteConfigs({ ...siteConfigs, site_banner_active: e.target.checked ? 'true' : 'false' })}
                  />
                  <label htmlFor="banner-toggle" style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    Exibir faixa de aviso no topo da página
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div className="admin-form-group">
                  <label className="admin-label">Título Principal do Site</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={siteConfigs.site_title || ''}
                    onChange={(e) => setSiteConfigs({ ...siteConfigs, site_title: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Subtítulo</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={siteConfigs.site_subtitle || ''}
                    onChange={(e) => setSiteConfigs({ ...siteConfigs, site_subtitle: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <button
                  type="submit"
                  className="admin-btn admin-btn-success"
                  disabled={savingConfigs}
                >
                  {savingConfigs ? 'Salvando...' : '💾 Salvar Configurações do Site'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA: CUPONS DE DESCONTO                                   */}
        {/* ========================================================= */}
        {activeTab === 'coupons' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">
                  <span>🎟️</span> Gestão de Cupons de Desconto para as Ofertas
                </h2>
                <p className="admin-card-subtitle">
                  Cadastre e altere cupons que aparecem no final de cada oferta no site. O visitante copia o código com 1 clique.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleStartCreateCoupon}
                  className="admin-btn admin-btn-primary admin-btn-sm"
                >
                  ➕ Novo Cupom
                </button>
                <button
                  type="button"
                  onClick={loadCoupons}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                  disabled={loadingCoupons}
                >
                  🔄 Recarregar
                </button>
              </div>
            </div>

            {/* Formulário de Criação / Edição de Cupom */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: editingCouponId ? '1px solid #8b5cf6' : '1px solid var(--admin-border)',
              borderRadius: '14px',
              padding: '20px',
              marginBottom: '28px',
              boxShadow: editingCouponId ? '0 0 15px rgba(139, 92, 246, 0.2)' : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{editingCouponId ? '✏️' : '✨'}</span>
                  <span>{editingCouponId ? 'Editar Cupom' : 'Cadastrar Novo Cupom'}</span>
                </h3>
                {editingCouponId && (
                  <span style={{ fontSize: '0.78rem', background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd', padding: '2px 8px', borderRadius: '4px' }}>
                    Editando ID: {editingCouponId.slice(0, 8)}...
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveCoupon}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label className="admin-label">Código do Cupom *</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Ex: CUPOM10, SHOPEE20"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                      required
                    />
                    <p className="admin-help-text">O código exato que o comprador irá copiar.</p>
                  </div>

                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label className="admin-label">Destaque de Desconto *</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Ex: 10% OFF, R$ 20 OFF"
                      value={couponForm.discount}
                      onChange={(e) => setCouponForm({ ...couponForm, discount: e.target.value })}
                      required
                    />
                    <p className="admin-help-text">Texto chamativo exibido na tag de desconto.</p>
                  </div>

                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label className="admin-label">Loja de Aplicação</label>
                    <select
                      className="admin-select"
                      value={couponForm.store}
                      onChange={(e) => setCouponForm({ ...couponForm, store: e.target.value })}
                    >
                      <option value="Todas">🔥 Todas as Lojas (Geral)</option>
                      <option value="Mercado Livre">💛 Mercado Livre</option>
                      <option value="Shopee">🧡 Shopee</option>
                      <option value="Oferta Específica">🎯 Oferta Específica</option>
                    </select>
                    <p className="admin-help-text">Onde este cupom aparecerá no site.</p>
                  </div>
                </div>

                {/* Seletor se for cupom para Oferta Específica */}
                {couponForm.store === 'Oferta Específica' && (
                  <div className="admin-form-group" style={{ marginBottom: '16px' }}>
                    <label className="admin-label">Selecione a Oferta Específica</label>
                    <select
                      className="admin-select"
                      value={couponForm.dealId}
                      onChange={(e) => setCouponForm({ ...couponForm, dealId: e.target.value })}
                      required
                    >
                      <option value="">-- Escolha um produto da lista ({deals.length} disponíveis) --</option>
                      {deals.map(d => (
                        <option key={d.id} value={d.id}>
                          [{d.store || 'Geral'}] {d.title.slice(0, 60)}... (R$ {d.discountPrice?.toFixed(2) || '0.00'})
                        </option>
                      ))}
                    </select>
                    <p className="admin-help-text">O cupom será exibido exclusivamente no card desta oferta selecionada.</p>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label className="admin-label">Regra / Descrição Rápida (Opcional)</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="Ex: Em compras acima de R$ 99, Válido no App"
                      value={couponForm.description}
                      onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                    />
                    <p className="admin-help-text">Condições simples de uso para o comprador.</p>
                  </div>

                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label className="admin-label">Prioridade de Exibição</label>
                    <input
                      type="number"
                      className="admin-input"
                      placeholder="0"
                      value={couponForm.priority}
                      onChange={(e) => setCouponForm({ ...couponForm, priority: e.target.value })}
                    />
                    <p className="admin-help-text">Valores maiores (ex: 10) têm preferência caso haja múltiplos cupons.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <input
                    type="checkbox"
                    id="coupon-active-toggle"
                    checked={couponForm.active}
                    onChange={(e) => setCouponForm({ ...couponForm, active: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
                  />
                  <label htmlFor="coupon-active-toggle" style={{ fontSize: '0.88rem', color: '#e2e8f0', cursor: 'pointer', fontWeight: '500' }}>
                    Ativar cupom imediatamente nas ofertas do site
                  </label>
                </div>

                {/* Prévia ao Vivo de como ficará na Oferta */}
                <div style={{
                  background: 'rgba(10, 15, 28, 0.7)',
                  border: '1px dashed rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '20px'
                }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    👀 PRÉ-VISUALIZAÇÃO NO FINAL DA OFERTA:
                  </span>
                  <div className="deal-coupon-ticket" style={{ maxWidth: '400px', margin: 0 }}>
                    <div className="coupon-ticket-body">
                      <div className="coupon-ticket-icon">🎟️</div>
                      <div className="coupon-ticket-info">
                        <div className="coupon-ticket-header">
                          <span className="coupon-code-pill">{couponForm.code || 'CUPOMEXEMPLO'}</span>
                          <span className="coupon-discount-tag">{couponForm.discount || '10% OFF'}</span>
                        </div>
                        {couponForm.description && (
                          <span className="coupon-rule-text">{couponForm.description}</span>
                        )}
                      </div>
                    </div>
                    <button type="button" className="coupon-copy-btn">Copiar</button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    className="admin-btn admin-btn-success"
                    disabled={savingCoupon}
                  >
                    {savingCoupon ? 'Salvando...' : (editingCouponId ? '💾 Atualizar Cupom' : '💾 Salvar e Ativar Cupom')}
                  </button>
                  {editingCouponId && (
                    <button
                      type="button"
                      onClick={handleStartCreateCoupon}
                      className="admin-btn admin-btn-secondary"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Listagem de Cupons Cadastrados */}
            <div className="admin-table-wrapper">
              <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📋</span>
                <span>Cupons Cadastrados ({coupons.length})</span>
              </h3>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Código</th>
                    <th>Desconto</th>
                    <th>Loja / Aplicação</th>
                    <th>Regra / Descrição</th>
                    <th>Prioridade</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                        Nenhum cupom cadastrado ainda. Use o formulário acima para adicionar seu primeiro cupom!
                      </td>
                    </tr>
                  ) : (
                    coupons.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleCoupon(c.id, c.active)}
                            className={`admin-badge ${c.active ? 'admin-badge-success' : 'admin-badge-danger'}`}
                            style={{ cursor: 'pointer', border: 'none' }}
                            title="Clique para alternar o status deste cupom"
                          >
                            <span className={`admin-dot ${c.active ? 'admin-dot-pulse' : ''}`} style={{
                              background: c.active ? '#10b981' : '#f43f5e'
                            }}></span>
                            {c.active ? 'Ativo no Site' : 'Pausado'}
                          </button>
                        </td>
                        <td>
                          <span className="coupon-code-pill" style={{ display: 'inline-block' }}>
                            {c.code}
                          </span>
                        </td>
                        <td>
                          <span className="coupon-discount-tag" style={{ display: 'inline-block' }}>
                            {c.discount}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            background: c.store === 'Shopee' ? 'rgba(249, 115, 22, 0.15)' : c.store === 'Mercado Livre' ? 'rgba(255, 230, 0, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                            color: c.store === 'Shopee' ? '#f97316' : c.store === 'Mercado Livre' ? '#ffe600' : '#c4b5fd',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '0.78rem'
                          }}>
                            {c.dealId ? '🎯 Oferta Específica' : c.store || 'Todas'}
                          </span>
                        </td>
                        <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#94a3b8', fontSize: '0.84rem' }}>
                          {c.description || '—'}
                        </td>
                        <td style={{ color: '#cbd5e1', fontWeight: '600' }}>
                          {c.priority || 0}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleStartEditCoupon(c)}
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                              title="Editar cupom"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCoupon(c.id, c.code)}
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              title="Excluir cupom"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 7: CATÁLOGO & MÉTRICAS DE OFERTAS                    */}
        {/* ========================================================= */}
        {activeTab === 'deals' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <h2 className="admin-card-title">
                  <span>🛍️</span> Catálogo de Ofertas & Métricas de Cliques
                </h2>
                <p className="admin-card-subtitle">
                  Visualize as promoções ativas no site, acompanhe o número de acessos e remova produtos esgotados.
                </p>
              </div>

              <button onClick={loadDeals} className="admin-btn admin-btn-secondary admin-btn-sm" disabled={loadingDeals}>
                🔄 Atualizar Ofertas
              </button>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Loja</th>
                    <th>Título do Produto</th>
                    <th>Preço</th>
                    <th>Cliques</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        Nenhuma oferta encontrada no banco.
                      </td>
                    </tr>
                  ) : (
                    deals.map((deal) => (
                      <tr key={deal.id}>
                        <td>
                          <span style={{
                            background: deal.store?.toLowerCase().includes('shopee') ? 'rgba(249, 115, 22, 0.15)' : 'rgba(255, 230, 0, 0.15)',
                            color: deal.store?.toLowerCase().includes('shopee') ? '#f97316' : '#ffe600',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '0.78rem'
                          }}>
                            {deal.store || 'Geral'}
                          </span>
                        </td>
                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span title={deal.title} style={{ fontWeight: '600', color: '#f8fafc' }}>
                            {deal.title}
                          </span>
                        </td>
                        <td style={{ fontWeight: '700', color: '#10b981' }}>
                          R$ {deal.discountPrice?.toFixed(2) || '0.00'}
                          {deal.discount && <span style={{ color: '#f43f5e', fontSize: '0.75rem', marginLeft: '6px' }}>({deal.discount})</span>}
                        </td>
                        <td>
                          <span style={{
                            background: 'rgba(6, 182, 212, 0.15)',
                            color: '#22d3ee',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontWeight: '700',
                            fontSize: '0.8rem'
                          }}>
                            {deal.clicks || 0} 🔥
                          </span>
                        </td>
                        <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                          {new Date(deal.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <a
                              href={`/go/${deal.id}`}
                              target="_blank"
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                              style={{ textDecoration: 'none' }}
                              title="Testar link"
                            >
                              🔗
                            </a>
                            <button
                              onClick={() => handleDeleteDeal(deal.id, deal.title)}
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              title="Excluir do site"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Toast flutuante */}
      {toast && (
        <div className="admin-toast" style={{
          borderColor: toast.type === 'danger' ? 'rgba(244, 63, 94, 0.5)' : 'rgba(16, 185, 129, 0.5)'
        }}>
          <span>{toast.type === 'danger' ? '❌' : '✅'}</span>
          <span style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: '500' }}>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
