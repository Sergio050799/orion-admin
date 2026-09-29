'use client';

import { useEffect, useRef, useState } from 'react';

interface Version {
  fecha:  string;
  activo: boolean;
  bytes:  number;
}

function fmtBytes(b: number) {
  if (b >= 1_000_000) return `${(b / 1_000_000).toFixed(1)} MB`;
  if (b >= 1_000)     return `${(b / 1_000).toFixed(0)} KB`;
  return `${b} B`;
}

function fmtNum(n: number) {
  return n.toLocaleString('es-ES');
}

function countRows(text: string): number {
  let n = 0;
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') n++;
  return Math.max(0, n - 1); // descontar cabecera
}

export default function CatalogoPage() {
  const [versiones,     setVersiones]     = useState<Version[]>([]);
  const [currentCount,  setCurrentCount]  = useState<number | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [msg,           setMsg]           = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [file,          setFile]          = useState<File | null>(null);
  const [newCount,      setNewCount]      = useState<number | null>(null);
  const [counting,      setCounting]      = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const d = await fetch('/api/catalogo').then(r => r.json());
      setVersiones(Array.isArray(d.catalogo) ? d.catalogo : []);
      setCurrentCount(d.currentCount ?? null);
    } catch { setVersiones([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function handleFile(f: File | null) {
    setFile(f);
    setNewCount(null);
    setMsg(null);
    if (!f) return;
    setCounting(true);
    const reader = new FileReader();
    reader.onload = e => {
      const text = (e.target?.result as string) ?? '';
      setNewCount(countRows(text));
      setCounting(false);
    };
    reader.readAsText(f, 'utf-8');
  }

  async function upload() {
    if (!file || newCount === null) return;
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append('file',     file);
      fd.append('rowCount', String(newCount));
      const res  = await fetch('/api/catalogo', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.ok) {
        setMsg({ type: 'ok', text: `Catálogo actualizado — versión ${data.version} · ${fmtNum(newCount)} vehículos · ${fmtBytes(data.bytes)}` });
        setFile(null);
        setNewCount(null);
        if (inputRef.current) inputRef.current.value = '';
        await load();
      } else {
        setMsg({ type: 'err', text: data.error ?? 'Error al subir' });
      }
    } catch {
      setMsg({ type: 'err', text: 'Sin conexión con Orion' });
    } finally {
      setUploading(false);
    }
  }

  const diff = newCount !== null && currentCount !== null ? newCount - currentCount : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Catálogo de vehículos</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Sube un nuevo CSV para actualizar el catálogo que usa Orion MMT</div>
      </div>

      {/* Upload */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 16 }}>Subir nueva versión</div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--surface2)', border: `1px solid ${file ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`,
            borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontSize: 13,
            color: file ? 'var(--text)' : 'var(--muted)',
          }}>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files?.[0] ?? null)}
            />
            {file ? file.name : 'Seleccionar archivo .csv'}
          </label>

          {file && (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtBytes(file.size)}</span>
          )}

          <button
            onClick={upload}
            disabled={!file || uploading || counting || newCount === null}
            style={{
              background: file && !uploading && newCount !== null ? 'var(--text)' : 'var(--surface2)',
              color:       file && !uploading && newCount !== null ? 'var(--bg)'   : 'var(--dim)',
              border: 'none', borderRadius: 6, padding: '8px 18px',
              fontSize: 13, fontWeight: 600,
              cursor: file && !uploading && newCount !== null ? 'pointer' : 'not-allowed',
            }}
          >
            {uploading ? 'Subiendo...' : counting ? 'Leyendo...' : 'Subir'}
          </button>
        </div>

        {/* Preview diferencial */}
        {(counting || newCount !== null) && (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {counting ? (
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Contando vehículos...</span>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Antes</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#fbbf24', fontVariantNumeric: 'tabular-nums' }}>
                    {currentCount !== null ? fmtNum(currentCount) : '—'}
                  </span>
                </div>

                <span style={{ fontSize: 18, color: 'var(--dim)' }}>→</span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Ahora</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtNum(newCount!)}
                  </span>
                </div>

                {diff !== null && diff !== 0 && (
                  <span style={{ fontSize: 13, color: diff > 0 ? '#34d399' : '#f87171', marginLeft: 4 }}>
                    {diff > 0 ? `+${fmtNum(diff)}` : fmtNum(diff)} vehículos
                  </span>
                )}
                {diff === 0 && (
                  <span style={{ fontSize: 13, color: 'var(--dim)' }}>mismo número de filas</span>
                )}
              </>
            )}
          </div>
        )}

        {msg && (
          <div style={{
            marginTop: 14, fontSize: 12, padding: '8px 12px', borderRadius: 6,
            color:       msg.type === 'ok' ? '#34d399' : '#f87171',
            background:  msg.type === 'ok' ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
            border:     `1px solid ${msg.type === 'ok' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)'}`,
          }}>
            {msg.text}
          </div>
        )}
      </div>

      {/* Versiones */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>Historial de versiones</span>
          {currentCount !== null && (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              Activa: <strong style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{fmtNum(currentCount)}</strong> vehículos
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Cargando...</div>
        ) : versiones.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            Sin versiones — Orion no disponible o catálogo no subido aún
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Versión (fecha)', 'Tamaño', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {versiones.map(v => (
                <tr key={v.fecha} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontSize: 13 }}>{v.fecha}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--muted)' }}>{fmtBytes(v.bytes)}</td>
                  <td style={{ padding: '12px 20px' }}>
                    {v.activo ? (
                      <span style={{ padding: '2px 8px', background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 4, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        Activa
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--dim)' }}>Anterior</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
