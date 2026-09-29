'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [pw, setPw]         = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        router.push('/dashboard');
      } else {
        const d = await res.json();
        setError(d.error || 'Contraseña incorrecta');
      }
    } catch {
      setError('Sin conexión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        {/* Logo */}
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
              <Image src="/ORION_LOGO.png" alt="ORION" fill style={{ objectFit: 'contain' }} priority />
            </div>
            <span style={{ fontFamily: 'var(--font-display), Inter, sans-serif', fontWeight: 600, fontSize: 22, letterSpacing: '0.18em', color: 'var(--text)', textTransform: 'uppercase' }}>
              ORION
            </span>
          </div>
          <div style={{ fontSize: 12, letterSpacing: '0.16em', color: 'var(--muted)', textTransform: 'uppercase' }}>Panel de administración</div>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 32 }}>
          <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
            Contraseña
          </label>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            autoFocus
            required
            placeholder="••••••••••"
            style={{
              width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '10px 14px', fontSize: 14, color: 'var(--text)',
              outline: 'none', marginBottom: 16, boxSizing: 'border-box',
            }}
          />

          {error && (
            <div style={{ fontSize: 12, color: '#f87171', marginBottom: 16, padding: '8px 12px', background: 'rgba(248,113,113,0.08)', borderRadius: 6, border: '1px solid rgba(248,113,113,0.15)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: 'var(--text)', color: 'var(--bg)',
              border: 'none', borderRadius: 6, padding: '11px 0',
              fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1, letterSpacing: '0.04em',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
