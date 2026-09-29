import { NextResponse } from 'next/server';
import { getStats } from '@/lib/api';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const stats = await getStats();
  const hoy   = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const ultimasAcciones = stats.ultimas_acciones
    .slice(0, 10)
    .map(a => `<tr>
      <td style="padding:4px 8px;border-bottom:1px solid #eee;">${a.ts?.replace('T', ' ').replace('Z', '')}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #eee;font-weight:600;">${a.usuario}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #eee;">${a.accion}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #eee;color:#666;">${a.detalle}</td>
    </tr>`)
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <div style="background:#0f172a;color:#fff;padding:20px;border-radius:8px 8px 0 0;">
    <h1 style="margin:0;font-size:20px;">Informe Diario — Orion</h1>
    <p style="margin:4px 0 0;opacity:0.7;font-size:14px;">${hoy}</p>
  </div>

  <div style="background:#f8fafc;padding:20px;display:grid;gap:12px;">
    <div style="display:flex;flex-wrap:wrap;gap:12px;">
      <div style="flex:1;min-width:120px;background:#fff;border-radius:8px;padding:16px;border-left:4px solid #3b82f6;">
        <div style="font-size:28px;font-weight:700;color:#3b82f6;">${stats.carpetas.total}</div>
        <div style="font-size:12px;color:#666;margin-top:4px;">Carpetas totales</div>
        <div style="font-size:11px;color:#999;">${stats.carpetas.en_estudio} en estudio · ${stats.carpetas.contratadas} contratadas</div>
      </div>
      <div style="flex:1;min-width:120px;background:#fff;border-radius:8px;padding:16px;border-left:4px solid #10b981;">
        <div style="font-size:28px;font-weight:700;color:#10b981;">${stats.silverdat.hoy}</div>
        <div style="font-size:12px;color:#666;margin-top:4px;">Consultas Silverdat hoy</div>
        <div style="font-size:11px;color:#999;">${stats.silverdat.mes} este mes · ${stats.silverdat.cache_total} en caché</div>
      </div>
      <div style="flex:1;min-width:120px;background:#fff;border-radius:8px;padding:16px;border-left:4px solid #f59e0b;">
        <div style="font-size:28px;font-weight:700;color:#f59e0b;">${stats.acciones_hoy}</div>
        <div style="font-size:12px;color:#666;margin-top:4px;">Acciones hoy</div>
        <div style="font-size:11px;color:#999;">${stats.mejoras_pendientes} mejoras pendientes</div>
      </div>
      <div style="flex:1;min-width:120px;background:#fff;border-radius:8px;padding:16px;border-left:4px solid #8b5cf6;">
        <div style="font-size:28px;font-weight:700;color:#8b5cf6;">${stats.corredores}</div>
        <div style="font-size:12px;color:#666;margin-top:4px;">Corredores</div>
        <div style="font-size:11px;color:#999;">${stats.usuarios} usuarios activos</div>
      </div>
    </div>

    ${ultimasAcciones ? `
    <div style="background:#fff;border-radius:8px;padding:16px;margin-top:8px;">
      <h3 style="margin:0 0 12px;font-size:14px;color:#374151;">Últimas acciones</h3>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:6px 8px;text-align:left;color:#666;">Hora</th>
            <th style="padding:6px 8px;text-align:left;color:#666;">Usuario</th>
            <th style="padding:6px 8px;text-align:left;color:#666;">Acción</th>
            <th style="padding:6px 8px;text-align:left;color:#666;">Detalle</th>
          </tr>
        </thead>
        <tbody>${ultimasAcciones}</tbody>
      </table>
    </div>` : ''}
  </div>

  <div style="background:#0f172a;color:#999;padding:12px 20px;border-radius:0 0 8px 8px;font-size:11px;">
    Generado automáticamente por Orion Admin
  </div>
</body>
</html>`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"Orion Admin" <${process.env.GMAIL_USER}>`,
    to: process.env.REPORT_EMAIL,
    subject: `Informe Orion — ${new Date().toLocaleDateString('es-ES')}`,
    html,
  });

  return NextResponse.json({ ok: true, sent_to: process.env.REPORT_EMAIL });
}
