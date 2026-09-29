'use client';

import { useEffect, useState, useCallback } from 'react';
import type { MejoraRow } from '@/lib/api';

const ESTADOS = ['pendiente', 'revisando', 'aprobada', 'descartada'] as const;
type Estado = typeof ESTADOS[number];

const ESTADO_COLOR: Record<Estado, { bg: string; text: string }> = {
  pendiente:  { bg: 'rgba(251,191,36,0.1)',  text: '#fbbf24' },
  revisando:  { bg: 'rgba(96,165,250,0.1)',  text: '#60a5fa' },
  aprobada:   { bg: 'rgba(52,211,153,0.1)',  text: '#34d399' },
  descartada: { bg: 'rgba(100,116,139,0.1)', text: '#64748b' },
};

export default function MejorasPage() {
  const [mejoras,  setMejoras]  = useState<MejoraRow[]>([]);
  const [filter,   setFilter]   = useState<Estado | ''>('pendiente');
  const [loading,  setLoading]  = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = filter ? `?estado=${filter}` : '';
      const d = await fetch(`/api/mejoras${q}`).then(r => r.json());
      setMejoras(Array.isArray(d) ? d : []);
    } catch { setMejoras([]); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function changeEstado(id: number, estado: Estado) {
    setUpdating(id);
    try {
      await fetch('/api/mejoras', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, estado }) });
      await load();
    } finally { setUpdating(null); }
  }

  const filterBtn = (e: Estado | ''): React.CSSProperties => ({
    padding: '5px 14px', background: 'none', cursor: 'pointer',
    border: `1px solid ${filter === e ? 'var(--dim)' : 'var(--border)'}`,
    borderRadius: 6, fontSize: 12, fontWeight: 500,
    color: filter === e ? 'var(--text)' : 'var(--muted)',
    textTransform: 'capitalize',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Mejoras sugeridas</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Sugerencias enviadas por los usuarios desde Orion</div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setFilter('')} style={filterBtn('')}>Todas</button>
        {ESTADOS.map(e => <button key={e} onClick={() => setFilter(e)} style={filterBtn(e)}>{e}</button>)}
        <button onClick={load} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--muted)', fontSize: 12, cursor: 'pointer' }}>
          Actualizar
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40, fontSize: 13 }}>Cargando...</div>
      ) : mejoras.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          No hay mejoras {filter ? `con estado "${filter}"` : 'registradas'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mejoras.map(m => {
            const ec = ESTADO_COLOR[m.estado as Estado] ?? ESTADO_COLOR.pendiente;
            return (
              <div key={m.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{m.titulo}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {m.usuario || 'Anónimo'} · {m.ts?.replace('T', ' ').replace('Z', '').slice(0, 16)}
                    </div>
                  </div>
                  <span style={{ padding: '3px 10px', background: ec.bg, color: ec.text, borderRadius: 4, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
                    {m.estado}
                  </span>
                </div>

                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 14px', whiteSpace: 'pre-wrap' }}>{m.descripcion}</p>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ESTADOS.filter(e => e !== m.estado).map(e => (
                    <button key={e} onClick={() => changeEstado(m.id, e)} disabled={updating === m.id} style={{
                      background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5,
                      padding: '4px 12px', fontSize: 12, color: 'var(--muted)', cursor: updating === m.id ? 'not-allowed' : 'pointer',
                      opacity: updating === m.id ? 0.4 : 1, textTransform: 'capitalize',
                    }}>
                      {updating === m.id ? '...' : e}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
