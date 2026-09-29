'use client';

import { useEffect, useState } from 'react';
import type { StatsData } from '@/lib/api';

const S: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '20px 24px',
};

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div style={S}>
      <div style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const s = stats;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Resumen</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Estado actual de Orion</div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <StatCard label="Carpetas" value={s?.carpetas.total ?? '—'} sub={s ? `${s.carpetas.en_estudio} en estudio · ${s.carpetas.contratadas} contratadas` : undefined} />
        <StatCard label="Silverdat hoy" value={s?.silverdat.hoy ?? '—'} sub={s ? `${s.silverdat.mes} este mes · ${s.silverdat.cache_total} en caché` : undefined} />
        <StatCard label="Acciones hoy" value={s?.acciones_hoy ?? '—'} sub={s ? `${s.mejoras_pendientes} mejoras pendientes` : undefined} />
        <StatCard label="Corredores" value={s?.corredores ?? '—'} sub={s ? `${s.usuarios} usuarios` : undefined} />
      </div>

      {/* Últimas acciones */}
      <div style={S}>
        <div style={{ fontSize: 12, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 16 }}>Últimas acciones</div>

        {!s || s.ultimas_acciones.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--muted)', padding: '20px 0', textAlign: 'center' }}>
            {s ? 'Sin actividad registrada' : 'Cargando...'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Fecha / Hora', 'Usuario', 'Acción', 'Detalle'].map(h => (
                    <th key={h} style={{ padding: '0 12px 10px 0', textAlign: 'left', fontSize: 11, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.ultimas_acciones.map((a, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px 10px 0', color: 'var(--muted)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>
                      {a.ts?.replace('T', ' ').replace('Z', '').slice(0, 16)}
                    </td>
                    <td style={{ padding: '10px 12px 10px 0', fontWeight: 600 }}>{a.usuario}</td>
                    <td style={{ padding: '10px 12px 10px 0' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11, letterSpacing: '0.04em' }}>
                        {a.accion}
                      </span>
                    </td>
                    <td style={{ padding: '10px 0', color: 'var(--muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.detalle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
