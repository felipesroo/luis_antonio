'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../admin.css';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/admin');
      } else {
        setError(data.error || 'Senha incorreta. Verifique e tente novamente.');
      }
    } catch {
      setError('Erro ao conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '420px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            borderRadius: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
            marginBottom: '16px'
          }}>
            🔐
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#ffffff', marginBottom: '6px' }}>
            ofertasTOP<span style={{ color: '#8b5cf6' }}>.shop</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Painel de Gestão e Comando Central
          </p>
        </div>

        <div className="admin-card" style={{ padding: '32px 28px' }}>
          <form onSubmit={handleLogin}>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="admin-pass">
                Senha do Administrador
              </label>
              <input
                id="admin-pass"
                type="password"
                className="admin-input"
                placeholder="Digite a senha mestra..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fda4af',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              style={{ width: '100%', padding: '12px' }}
              disabled={loading}
            >
              {loading ? 'Validando acesso...' : 'Acessar Painel de Controle →'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <a href="/" style={{ color: '#64748b', fontSize: '0.82rem', textDecoration: 'none' }}>
              ← Voltar para a vitrine do site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
