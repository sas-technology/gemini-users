'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <nav className="nav">
      <div className="nav-brand">SAS Usage Analytics</div>
      <ul className="nav-links">
        <li>
          <Link href="/" className={pathname === '/' ? 'active' : ''}>Overview</Link>
        </li>
        <li>
          <Link href="/divisions" className={pathname === '/divisions' ? 'active' : ''}>Divisions</Link>
        </li>
      </ul>
      <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span>Singapore American School</span>
        <button
          onClick={handleLogout}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
