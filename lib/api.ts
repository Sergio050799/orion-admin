const BASE = process.env.ORION_API_URL || 'http://127.0.0.1:3001';
const KEY  = process.env.ORION_API_KEY  || 'dev_secret_local';

const headers = { 'Content-Type': 'application/json', 'X-Api-Key': KEY };

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`orion-api GET ${path} → ${res.status}`);
  return res.json();
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`orion-api PUT ${path} → ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`orion-api POST ${path} → ${res.status}`);
  return res.json();
}

// ─── Primas ───────────────────────────────────────────────────────────────────

export type PrimaRow = {
  tipo_vehiculo: string;
  cobertura: string;
  ambito: string;
  prima: number;
  updated_at: string;
  updated_by: string;
};

export const getPrimas = () => get<PrimaRow[]>('/admin/primas');
export const putPrimas = (updates: Omit<PrimaRow, 'updated_at' | 'updated_by'>[], updated_by: string) =>
  put('/admin/primas', { updates, updated_by });

// ─── Ajustes ──────────────────────────────────────────────────────────────────

export type AjusteRow = {
  clave: string;
  valor: number;
  descripcion: string;
  updated_at: string;
};

export const getAjustes = () => get<AjusteRow[]>('/admin/ajustes');
export const putAjustes = (updates: { clave: string; valor: number }[]) =>
  put('/admin/ajustes', { updates });

// ─── Auditoría ────────────────────────────────────────────────────────────────

export type AuditRow = {
  id: number;
  usuario: string;
  accion: string;
  detalle: string;
  ip: string;
  ts: string;
};

export const getAudit = (params?: { limit?: number; offset?: number; usuario?: string; fecha?: string }) => {
  const q = new URLSearchParams();
  if (params?.limit)   q.set('limit',   String(params.limit));
  if (params?.offset)  q.set('offset',  String(params.offset));
  if (params?.usuario) q.set('usuario', params.usuario);
  if (params?.fecha)   q.set('fecha',   params.fecha);
  return get<{ rows: AuditRow[]; total: number }>(`/admin/audit?${q}`);
};

// ─── Mejoras ──────────────────────────────────────────────────────────────────

export type MejoraRow = {
  id: number;
  usuario: string;
  titulo: string;
  descripcion: string;
  estado: string;
  ts: string;
};

export const getMejoras = (estado?: string) =>
  get<MejoraRow[]>(`/admin/mejoras${estado ? `?estado=${estado}` : ''}`);

export const putMejora = (id: number, estado: string) =>
  put(`/admin/mejoras/${id}`, { estado });

// ─── Stats ────────────────────────────────────────────────────────────────────

export type StatsData = {
  carpetas: { total: number; en_estudio: number; contratadas: number };
  corredores: number;
  usuarios: number;
  silverdat: { hoy: number; mes: number; cache_total: number };
  mejoras_pendientes: number;
  acciones_hoy: number;
  ultimas_acciones: { usuario: string; accion: string; detalle: string; ts: string }[];
};

export const getStats = () => get<StatsData>('/admin/stats');

// ─── Audit log (para Orion_APP, no para este panel) ──────────────────────────

export const postAudit = (data: { usuario: string; accion: string; detalle: string; ip?: string }) =>
  post('/admin/audit', data);
