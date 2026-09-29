'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV = [
  { href: '/dashboard',             label: 'Resumen',   exact: true },
  { href: '/dashboard/primas',      label: 'Primas'               },
  { href: '/dashboard/catalogo',    label: 'Catálogo'             },
  { href: '/dashboard/auditoria',   label: 'Auditoría'            },
  { href: '/dashboard/mejoras',     label: 'Mejoras'              },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Top Bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        height: 52,
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: 32,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ position: 'relative', width: 24, height: 24 }}>
            <Image src="/ORION_LOGO.png" alt="ORION" fill style={{ objectFit: 'contain' }} priority />
          </div>
          <span style={{ fontFamily: 'var(--font-display), Inter, sans-serif', fontWeight: 600, fontSize: 14, letterSpacing: '0.18em', color: 'var(--text)', textTransform: 'uppercase' }}>
            ORION
          </span>
        </div>

        {/* Nav — desktop */}
        <nav style={{ display: 'flex', gap: 4, flex: 1 }} className="hidden-mobile">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
                color: isActive(n.href, n.exact) ? 'var(--text)' : 'var(--muted)',
                background: isActive(n.href, n.exact) ? 'var(--surface2)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Hamburger — mobile */}
        <button
          onClick={() => setMobileOpen(v => !v)}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, padding: 4 }}
          className="show-mobile"
        >
          &#9776;
        </button>

        {/* Cerrar sesión */}
        <button
          onClick={logout}
          style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 6,
            color: 'var(--muted)', fontSize: 12, padding: '5px 12px', cursor: 'pointer',
            letterSpacing: '0.04em', flexShrink: 0,
          }}
          className="hidden-mobile"
        >
          Salir
        </button>
      </header>

      {/* Mobile dropdown nav */}
      {mobileOpen && (
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '8px 16px' }}>
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'block', padding: '10px 12px', fontSize: 14,
                color: isActive(n.href, n.exact) ? 'var(--text)' : 'var(--muted)',
                textDecoration: 'none', borderRadius: 6,
              }}
            >
              {n.label}
            </Link>
          ))}
          <button onClick={logout} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: 14, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Salir
          </button>
        </div>
      )}

      {/* Content */}
      <main style={{ padding: '28px 24px', maxWidth: 1280, margin: '0 auto' }}>
        {children}
      </main>

      <style>{`
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
        }
        @media (min-width: 641px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
