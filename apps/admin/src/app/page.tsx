'use client';
import React, { useEffect, useState } from 'react';
import { adminLogin } from '../lib/api';
import { Icon } from '../components/icons';
import { Dashboard } from '../sections/Dashboard';
import { Workers } from '../sections/Workers';
import { Employers } from '../sections/Employers';
import { Jobs } from '../sections/Jobs';
import { Hires, KycQueue, CaseAlerts, Promotions } from '../sections/Misc';

type Key = 'dashboard' | 'workers' | 'employers' | 'jobs' | 'hires' | 'kyc' | 'alerts' | 'promotions';

const NAV: { key: Key; label: string; icon: string; group: string }[] = [
  { key: 'dashboard', label: 'Overview', icon: 'dashboard', group: 'Main' },
  { key: 'workers', label: 'Workers', icon: 'users', group: 'Manage' },
  { key: 'employers', label: 'Employers', icon: 'building', group: 'Manage' },
  { key: 'jobs', label: 'Job Postings', icon: 'briefcase', group: 'Manage' },
  { key: 'hires', label: 'Hires', icon: 'handshake', group: 'Manage' },
  { key: 'kyc', label: 'KYC Queue', icon: 'shield', group: 'Operations' },
  { key: 'alerts', label: 'Case Alerts', icon: 'alert', group: 'Operations' },
  { key: 'promotions', label: 'Promotions', icon: 'star', group: 'Revenue' },
];

export default function AdminApp() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<Key>('dashboard');

  useEffect(() => { setToken(localStorage.getItem('kd_admin_token')); setReady(true); }, []);
  if (!ready) return null;
  if (!token) return <Login onLogin={(t) => { localStorage.setItem('kd_admin_token', t); setToken(t); }} />;

  const logout = () => { localStorage.removeItem('kd_admin_token'); setToken(null); };
  const current = NAV.find((n) => n.key === active)!;
  const groups = [...new Set(NAV.map((n) => n.group))];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">कद</div>
          <div><div className="brand-name">Kaamdhaam</div><div className="brand-sub">Admin console</div></div>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {groups.map((g) => (
            <div key={g}>
              <div className="nav-label">{g}</div>
              {NAV.filter((n) => n.group === g).map((n) => (
                <button key={n.key} className={`nav-item ${active === n.key ? 'active' : ''}`} onClick={() => setActive(n.key)}>
                  <Icon name={n.icon} size={18} /> {n.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <h1>{current.label}</h1>
          <div className="admin-chip">
            <div className="avatar-sm">AD</div>
            <button className="btn btn-ghost btn-sm" onClick={logout}><Icon name="logout" size={15} /> Logout</button>
          </div>
        </header>
        <div className="content">
          {active === 'dashboard' && <Dashboard />}
          {active === 'workers' && <Workers />}
          {active === 'employers' && <Employers />}
          {active === 'jobs' && <Jobs />}
          {active === 'hires' && <Hires />}
          {active === 'kyc' && <KycQueue />}
          {active === 'alerts' && <CaseAlerts />}
          {active === 'promotions' && <Promotions />}
        </div>
      </main>
    </div>
  );
}

function Login({ onLogin }: { onLogin: (t: string) => void }) {
  const [email, setEmail] = useState('admin@kaamdhaam.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(''); setLoading(true);
    try { onLogin(await adminLogin(email, password)); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand" style={{ marginBottom: 8, padding: 0 }}>
          <div className="brand-mark">कद</div>
          <div><div className="brand-name" style={{ fontSize: 20 }}>Kaamdhaam</div><div className="brand-sub">Admin console</div></div>
        </div>
        <p className="muted" style={{ fontSize: 13, margin: '0 0 22px' }}>Sign in to manage the platform</p>
        {error && <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: 11, borderRadius: 9, fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <label className="field-label">Email</label>
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 14 }} />
        <label className="field-label">Password</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} style={{ marginBottom: 18 }} />
        <button className="btn btn-accent" disabled={loading} onClick={submit} style={{ width: '100%', justifyContent: 'center', padding: 13, fontSize: 15 }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </div>
  );
}
