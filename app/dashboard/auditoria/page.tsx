'use client';

import { useEffect, useState, useCallback } from 'react';
import type { AuditRow } from '@/lib/api';

const PAGE_SIZE = 50;

export default function AuditoriaPage() {
  const [rows,    setRows]    = useState<AuditRow[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(0);
  const [usuario, setUsuario] = useState('');
  const [fecha,   setFecha]   = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
    if (usuario) q.set('usuario', usuario);
    if (fecha)   q.set('fecha', fecha);
    try {
      const d = await fetch(`/api/audit?${q}`).then(r => r.json());
      setRows(d.rows ?? []);
      setTotal(d.total ?? 0);
    } catch { setRows([]); setTotal(0); }
    finally { setLoading(false); }
  }, [page, usuario, fecha]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const inputStyle: React.CSSProperties = {
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 6, padding: '7px 12px', fontSize: 13,
    color: 'var(--text)', outline: 'none', width: 160,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Auditoría</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Registro de actividad de todos los usuarios</div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Usuario"
          value={usuario}
          onChange={e => { setUsuario(e.target.value.toUpperCase()); setPage(0); }}
          style={inputStyle}
        />
        <input
          type="date"
          value={fecha}
          onChange={e => { setFecha(e.target.value); setPage(0); }}
          style={{ ...inputStyle, colorScheme: 'dark' }}
        />
        {(usuario || fecha) && (
          <button onClick={() => { setUsuario(''); setFecha(''); setPage(0); }}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
            Limpiar
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>{total} registros</span>
      </div>

      {/* Tabla */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Cargando...</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            {total === 0 && !loading ? 'Sin registros de actividad' : 'Sin resultados'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Fecha / Hora', 'Usuario', 'Acción', 'Detalle', 'IP'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--muted)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>
                      {r.ts?.replace('T', ' ').replace('Z', '').slice(0, 16)}
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 600 }}>{r.usuario}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                        {r.accion}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--muted)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.detalle}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--dim)', fontSize: 11, fontFamily: 'monospace' }}>{r.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 14px', fontSize: 13, color: 'var(--muted)', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1 }}>
            Anterior
          </button>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 14px', fontSize: 13, color: 'var(--muted)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1 }}>
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
