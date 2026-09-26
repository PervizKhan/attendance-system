// app/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

interface NavItem {
  href: string;
  label: string;
  title: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin',               label: '👨‍🎓',          title: 'Students' },
  { href: '/admin/staff',         label: '👨‍🏫',          title: 'Staff' },
  { href: '/admin/dashboard',     label: '📊',            title: 'Dashboard' },
  { href: '/admin/attendance',    label: '📋',            title: 'Attendance' },
  { href: '/admin/absent-today',  label: '📵 Absent',     title: 'Absent Today' },
  { href: '/admin/qr',            label: '📱',            title: 'QR Codes' },
  { href: '/admin/import',        label: '📥',            title: 'Import' },
  { href: '/admin/holidays',      label: '📅',            title: 'Holidays' },
  { href: '/admin/logs',          label: '📜',            title: 'Logs' },
  { href: '/admin/backup',        label: '💾',            title: 'Backup' },
  { href: '/admin/actions',       label: '⚡',            title: 'Actions' },
  { href: '/admin/admins',        label: '👥 Admins',     title: 'Admins' },
  { href: '/admin/face-training', label: '🎯 Face Training', title: 'Face Training' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(href + '/');
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/auth/check');
        const data = await res.json();

        if (cancelled) return;

        if (!data.authenticated) {
          router.push('/admin/login');
          return;
        }

        if (data.user?.role !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setIsAdmin(true);
      } catch {
        if (!cancelled) router.push('/admin/login');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, isLoginPage]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (isLoginPage) return <>{children}</>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div
        className="border-b p-4 flex justify-between items-center"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border)',
        }}
      >
        <h1 className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
          Admin Panel
        </h1>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/"
            className="px-3 py-1 rounded-lg text-sm border"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            Home
          </Link>
          <button
            onClick={async () => {
              try {
                await fetch('/api/admin/logout', { method: 'POST' });
              } finally {
                window.location.href = '/admin/login';
              }
            }}
            className="px-3 py-1 rounded-lg text-sm border hover:border-red-500 transition"
            style={{ borderColor: 'var(--border)', color: '#ef4444' }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav
        aria-label="Admin navigation"
        className="px-4 pt-4"
      >
        <div
          className="flex gap-2 overflow-x-auto pb-2 -mb-0.5 scrollbar-thin"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.title}
                aria-label={item.title}
                aria-current={active ? 'page' : undefined}
                className={`px-3 py-2 text-sm whitespace-nowrap rounded-t-lg ${
                  active
                    ? 'border-b-2 border-[var(--accent)] text-[var(--accent)] font-medium'
                    : 'opacity-70'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/user-guide.html"
            target="_blank"
            title="User Guide"
            className="px-3 py-2 text-sm whitespace-nowrap rounded-t-lg opacity-70"
          >
            📖 User Guide
          </Link>
        </div>
      </nav>

      <div className="p-6">{children}</div>
    </div>
  );
}