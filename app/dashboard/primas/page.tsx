'use client';

import { useEffect, useState, useCallback } from 'react';
import type { PrimaRow, AjusteRow } from '@/lib/api';

const TIPOS = [
  { key: 'turismo',                   label: 'Turismo' },
  { key: 'furgoneta',                  label: 'Furgoneta' },
  { key: 'cabeza_tractora',            label: 'Cabeza Tractora' },
  { key: 'camion_rigido',              label: 'Camión Rígido' },
  { key: 'semirremolque',              label: 'Semirremolque' },
  { key: 'industrial_matriculado',     label: 'Industrial Matr.' },
  { key: 'industrial_no_matriculado',  label: 'Industrial No Matr.' },
];

const COBERTURAS = [
  { key: 'terceros',          label: 'Terceros' },
  { key: 'terceros_con_luna', label: 'T. con Luna' },
  { key: 'terceros_ampliado', label: 'T. Ampliado' },
  { key: 'todo_riesgo',       label: 'Todo Riesgo' },
];

const AMBITOS = ['nacional', 'internacional'];

type PrimaMap = Record<string, number>;

function buildMap(rows: PrimaRow[]): PrimaMap {
  const m: PrimaMap = {};
  for (const r of rows) m[`${r.tipo_vehiculo}:${r.cobertura}:${r.ambito}`] = r.prima;
  return m;
}

const cellStyle = (edited: boolean): React.CSSProperties => ({
  width: 88,
  background: edited ? 'rgba(255,255,255,0.06)' : 'transparent',
  border: `1px solid ${edited ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`,
  borderRadius: 4,
  padding: '5px 8px',
  fontSize: 13,
  color: 'var(--text)',
  textAlign: 'right',
  outline: 'none',
  fontVariantNumeric: 'tabular-nums',
});

export default function PrimasPage() {
  const [primaMap, setPrimaMap] = useState<PrimaMap>({});
  const [ajustes,  setAjustes]  = useState<AjusteRow[]>([]);
  const [edited,   setEdited]   = useState<PrimaMap>({});
  const [ajEdited, setAjEdited] = useState<Record<string, number>>({});
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');
  const [tab,      setTab]      = useState<'primas' | 'ajustes'>('primas');

  const globalPct = (): number => {
    if ('ajuste_global_pct' in ajEdited) return ajEdited['ajuste_global_pct'];
    return ajustes.find(a => a.clave === 'ajuste_global_pct')?.valor ?? 0;
  };
  const adjPct = globalPct();

  const load = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([
        fetch('/api/primas').then(r => r.json()),
        fetch('/api/ajustes').then(r => r.json()),
      ]);
      setPrimaMap(buildMap(Array.isArray(p) ? p : []));
      setAjustes(Array.isArray(a) ? a : []);
      setEdited({});
      setAjEdited({});
    } catch { /* orion-api offline */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getValue = (tipo: string, cob: string, amb: string): string => {
    const key = `${tipo}:${cob}:${amb}`;
    const v = key in edited ? edited[key] : primaMap[key];
    return v !== undefined ? String(v) : '';
  };

  const onChange = (tipo: string, cob: string, amb: string, val: string) => {
    setEdited(prev => ({ ...prev, [`${tipo}:${cob}:${amb}`]: Number(val) }));
  };

  const totalChanges = Object.keys(edited).length + Object.keys(ajEdited).length;

  async function saveAll() {
    setSaving(true);
    setMsg('');
    try {
      const primaUpdates = Object.entries(edited).map(([key, prima]) => {
        const [tipo_vehiculo, cobertura, ambito] = key.split(':');
        return { tipo_vehiculo, cobertura, ambito, prima };
      });
      const ajusteUpdates = Object.entries(ajEdited).map(([clave, valor]) => ({ clave, valor }));
      if (primaUpdates.length > 0) {
        await fetch('/api/primas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates: primaUpdates, updated_by: 'admin' }) });
      }
      if (ajusteUpdates.length > 0) {
        await fetch('/api/ajustes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates: ajusteUpdates }) });
      }
      await load();
      setMsg(`${totalChanges} valor${totalChanges !== 1 ? 'es' : ''} guardado${totalChanges !== 1 ? 's' : ''}`);
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setMsg('Error — orion-api no disponible');
    } finally {
      setSaving(false);
    }
  }

  const thStyle: React.CSSProperties = {
    padding: '0 8px 12px 0',
    textAlign: 'right',
    fontSize: 11,
    letterSpacing: '0.08em',
    color: 'var(--muted)',
    textTransform: 'uppercase',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '6px 8px 6px 0',
    borderBottom: '1px solid var(--border)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Primas de Referencia</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Edita los valores y guarda. Orion los leerá automáticamente.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {msg && <span style={{ fontSize: 12, color: msg.startsWith('Error') ? '#f87171' : 'var(--muted)' }}>{msg}</span>}
          {totalChanges > 0 && (
            <button onClick={saveAll} disabled={saving} style={{
              background: 'var(--text)', color: 'var(--bg)', border: 'none',
              borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1,
            }}>
              {saving ? 'Guardando...' : `Guardar (${totalChanges})`}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {(['primas', 'ajustes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 500,
            color: tab === t ? 'var(--text)' : 'var(--muted)',
            borderBottom: `2px solid ${tab === t ? 'var(--text)' : 'transparent'}`,
            marginBottom: -1,
            textTransform: 'capitalize',
          }}>
            {t === 'primas' ? 'Tabla de primas' : 'Ajustes y recargos'}
          </button>
        ))}
      </div>

      {tab === 'primas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Ajuste global */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>Ajuste global</div>
              <div style={{ fontSize: 12, color: 'var(--dim)' }}>Se aplica sobre el total calculado en Orion</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
              <button onClick={() => setAjEdited(p => ({ ...p, ajuste_global_pct: Math.round((adjPct - 1) * 10) / 10 }))}
                style={{ width: 28, height: 28, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text)', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>
                −
              </button>
              <input
                type="number" step="0.5"
                value={adjPct}
                onChange={e => setAjEdited(p => ({ ...p, ajuste_global_pct: Number(e.target.value) }))}
                style={{ width: 64, textAlign: 'center', background: 'var(--surface2)', border: `1px solid ${'ajuste_global_pct' in ajEdited ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`, borderRadius: 5, padding: '5px 8px', fontSize: 14, fontWeight: 600, color: 'var(--text)', outline: 'none' }}
              />
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>%</span>
              <button onClick={() => setAjEdited(p => ({ ...p, ajuste_global_pct: Math.round((adjPct + 1) * 10) / 10 }))}
                style={{ width: 28, height: 28, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text)', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>
                +
              </button>
              {adjPct !== 0 && (
                <span style={{ fontSize: 12, color: adjPct > 0 ? '#34d399' : '#f87171', marginLeft: 4 }}>
                  {adjPct > 0 ? `+${adjPct}%` : `${adjPct}%`} sobre todas las primas
                </span>
              )}
              {adjPct === 0 && (
                <span style={{ fontSize: 12, color: 'var(--dim)', marginLeft: 4 }}>sin ajuste</span>
              )}
            </div>
          </div>

          {AMBITOS.map(ambito => (
            <div key={ambito} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: 11, letterSpacing: '0.12em', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                {ambito === 'nacional' ? 'Nacional' : 'Internacional'}
              </div>
              <div style={{ overflowX: 'auto', padding: '16px 20px' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, textAlign: 'left', minWidth: 160 }}>Tipo vehículo</th>
                      {COBERTURAS.map(c => <th key={c.key} style={thStyle}>{c.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {TIPOS.map(tipo => (
                      <tr key={tipo.key}>
                        <td style={{ ...tdStyle, color: 'var(--muted)', fontSize: 12, paddingRight: 20, whiteSpace: 'nowrap' }}>{tipo.label}</td>
                        {COBERTURAS.map(cob => {
                          const val = getValue(tipo.key, cob.key, ambito);
                          const key = `${tipo.key}:${cob.key}:${ambito}`;
                          const exists = key in primaMap || val !== '';
                          const adjVal = val !== '' && adjPct !== 0
                            ? Math.round(Number(val) * (1 + adjPct / 100))
                            : null;
                          return (
                            <td key={cob.key} style={{ ...tdStyle, textAlign: 'right' }}>
                              {exists ? (
                                <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                                  <input
                                    type="number"
                                    value={val}
                                    onChange={e => onChange(tipo.key, cob.key, ambito, e.target.value)}
                                    style={cellStyle(key in edited)}
                                  />
                                  {adjVal !== null && (
                                    <span style={{ fontSize: 10, color: adjPct > 0 ? '#34d399' : '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                                      → {adjVal}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--dim)', fontSize: 12 }}>—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'ajustes' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {ajustes.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Sin datos — orion-api no disponible
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Concepto', 'Descripción', 'Valor', 'Modificado'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ajustes.filter(aj => aj.clave !== 'ajuste_global_pct').map(aj => {
                  const val  = aj.clave in ajEdited ? ajEdited[aj.clave] : aj.valor;
                  const isPct = aj.clave.endsWith('_pct');
                  return (
                    <tr key={aj.clave} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 20px', fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)' }}>{aj.clave}</td>
                      <td style={{ padding: '10px 20px', color: 'var(--muted)', fontSize: 12 }}>{aj.descripcion}</td>
                      <td style={{ padding: '8px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="number"
                            step={isPct ? '0.01' : '1'}
                            value={val}
                            onChange={e => setAjEdited(prev => ({ ...prev, [aj.clave]: Number(e.target.value) }))}
                            style={cellStyle(aj.clave in ajEdited)}
                          />
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{isPct ? '%' : '€'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 20px', fontSize: 12, color: 'var(--muted)' }}>{aj.updated_at?.slice(0, 10)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
