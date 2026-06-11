'use client';
import { useEffect, useState, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gentle-cooperation-production-ca4c.up.railway.app';

const C = {
  primary: '#1A56A0', primaryDark: '#0C447C', accent: '#F4900C', accentDark: '#B26A07',
  green: '#1D9E75', red: '#D14343', amber: '#BA7517', purple: '#534AB7',
  bg: '#F4F6F9', surface: '#FFFFFF', border: '#E6EAF0', text: '#16202E', sub: '#5A6675', faint: '#8A95A3',
};

type Section = 'overview' | 'workers' | 'employers' | 'jobs' | 'promotions';

async function api(path: string, token: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}/api/v1${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers ?? {}) },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Error ${res.status}`);
  return res.json();
}

export default function AdminPanel() {
  const [token, setToken] = useState('');
  const [section, setSection] = useState<Section>('overview');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('kd_admin_token') : null;
    if (saved) setToken(saved);
  }, []);

  const logout = () => { localStorage.removeItem('kd_admin_token'); setToken(''); };

  if (!token) return <Login onToken={(t) => { localStorage.setItem('kd_admin_token', t); setToken(t); }} />;

  const NAV: { key: Section; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'workers', label: 'Workers' },
    { key: 'employers', label: 'Employers' },
    { key: 'jobs', label: 'Job Postings' },
    { key: 'promotions', label: 'Promotions' },
  ];

  return (
    <div style={{ fontFamily: 'system-ui, Arial, sans-serif', display: 'flex', minHeight: '100vh', background: C.bg, color: C.text }}>
      <aside style={{ width: 220, background: C.surface, borderRight: `1px solid ${C.border}`, padding: 20, position: 'sticky', top: 0, height: '100vh', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: C.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, position: 'relative' }}>
            कद
            <span style={{ position: 'absolute', bottom: 5, left: 7, right: 7, height: 2.5, background: C.accent, borderRadius: 2 }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Kaamdhaam</div>
            <div style={{ fontSize: 11, color: C.faint }}>Admin</div>
          </div>
        </div>
        {NAV.map((n) => (
          <button key={n.key} onClick={() => setSection(n.key)} style={{
            display: 'block', width: '100%', textAlign: 'left', padding: '11px 14px', marginBottom: 4, borderRadius: 10,
            border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: section === n.key ? 700 : 500,
            background: section === n.key ? C.primary : 'transparent', color: section === n.key ? '#fff' : C.sub,
          }}>{n.label}</button>
        ))}
        <button onClick={logout} style={{ marginTop: 24, width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.red, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Logout</button>
      </aside>

      <main style={{ flex: 1, padding: 28, maxWidth: 1100 }}>
        {section === 'overview' && <Overview token={token} />}
        {section === 'workers' && <Workers token={token} />}
        {section === 'employers' && <Employers token={token} />}
        {section === 'jobs' && <Jobs token={token} />}
        {section === 'promotions' && <Promotions token={token} />}
      </main>
    </div>
  );
}

function Login({ onToken }: { onToken: (t: string) => void }) {
  const [email, setEmail] = useState('admin@kaamdhaam.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/admin-login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Login failed');
      onToken(data.access_token);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div style={{ fontFamily: 'system-ui, Arial, sans-serif', minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 36, width: 360, boxShadow: '0 4px 24px rgba(12,35,64,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, position: 'relative' }}>
            कद<span style={{ position: 'absolute', bottom: 6, left: 8, right: 8, height: 3, background: C.accent, borderRadius: 2 }} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 20, color: C.text }}>Kaamdhaam Admin</div>
        </div>
        <p style={{ color: C.sub, fontSize: 13, marginBottom: 22 }}>Operations dashboard</p>
        {error && <div style={{ background: '#FCEBEB', color: C.red, padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</div>}
        <label style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} style={inp} />
        <label style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} style={inp} />
        <button onClick={submit} disabled={loading} style={{ width: '100%', marginTop: 10, padding: 13, borderRadius: 10, border: 'none', background: C.accent, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { width: '100%', padding: 11, margin: '6px 0 16px', borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 14, boxSizing: 'border-box' };

function H({ children }: { children: React.ReactNode }) {
  return <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 20px' }}>{children}</h1>;
}
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`, padding: 18, ...style }}>{children}</div>;
}
function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{text}</span>;
}
function btn(bg: string): React.CSSProperties {
  return { background: bg, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginRight: 6 };
}
const th: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 12, color: C.faint, fontWeight: 600, borderBottom: `1px solid ${C.border}` };
const td: React.CSSProperties = { padding: '11px 12px', fontSize: 13, borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle' };

function kycBadge(status: string) {
  if (status === 'FULLY_VERIFIED') return <Badge text="Verified" color={C.green} bg="#E1F5EE" />;
  if (status === 'BLOCKED') return <Badge text="Blocked" color={C.red} bg="#FCEBEB" />;
  if (status === 'SUSPENDED') return <Badge text="Suspended" color={C.red} bg="#FCEBEB" />;
  return <Badge text={status.replace(/_/g, ' ')} color={C.amber} bg="#FAEEDA" />;
}

function Overview({ token }: { token: string }) {
  const [d, setD] = useState<any>(null);
  const [a, setA] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    Promise.all([api('/admin/dashboard', token), api('/admin/analytics', token)])
      .then(([dash, anal]) => { setD(dash); setA(anal); })
      .catch((e) => setErr(e.message));
  }, [token]);
  if (err) return <Card><span style={{ color: C.red }}>{err}</span></Card>;
  if (!d) return <p style={{ color: C.sub }}>Loading…</p>;
  const metrics = [
    { label: 'Total Workers', value: d.workers, color: C.primary },
    { label: 'Total Employers', value: d.employers, color: C.green },
    { label: 'Active Hires', value: d.hires, color: C.amber },
    { label: 'Blocked Workers', value: d.blocked, color: C.red },
    { label: 'KYC Pending', value: d.kycPending, color: C.purple },
  ];
  return (
    <div>
      <H>Overview</H>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 22 }}>
        {metrics.map((m) => (
          <Card key={m.label} style={{ borderLeft: `4px solid ${m.color}` }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: m.color }}>{(m.value ?? 0).toLocaleString('en-IN')}</div>
            <div style={{ color: C.sub, fontSize: 13, marginTop: 2 }}>{m.label}</div>
          </Card>
        ))}
      </div>
      {a && (
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 14 }}>Platform analytics</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            <Stat label="Verification rate" value={`${a.verification_rate}%`} />
            <Stat label="Verified workers" value={a.workers?.verified ?? 0} />
            <Stat label="Total requirements" value={a.requirements?.total ?? 0} />
            <Stat label="Total hires" value={a.hires?.total ?? 0} />
          </div>
        </Card>
      )}
    </div>
  );
}
function Stat({ label, value }: { label: string; value: any }) {
  return <div><div style={{ color: C.faint, fontSize: 12 }}>{label}</div><div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div></div>;
}

function Workers({ token }: { token: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState('');
  const load = useCallback(() => {
    api('/admin/workers', token).then((r) => setRows(r.workers ?? [])).catch((e) => setErr(e.message));
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const act = async (path: string, body?: any) => {
    try { await api(path, token, { method: 'POST', body: body ? JSON.stringify(body) : undefined }); load(); }
    catch (e: any) { alert(e.message); }
  };

  return (
    <div>
      <H>Workers</H>
      {err && <Card style={{ marginBottom: 12 }}><span style={{ color: C.red }}>{err}</span></Card>}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>Name</th><th style={th}>Mobile</th><th style={th}>Skill</th><th style={th}>KYC</th><th style={th}>Actions</th></tr></thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id}>
                <td style={td}>{w.full_name || <span style={{ color: C.faint }}>—</span>}</td>
                <td style={td}>{w.user?.mobile ?? '—'}</td>
                <td style={{ ...td, textTransform: 'capitalize' }}>{w.skills?.[0]?.skill_type?.replace(/_/g, ' ') ?? '—'}</td>
                <td style={td}>{kycBadge(w.kyc_status)}</td>
                <td style={td}>
                  {w.kyc_status !== 'FULLY_VERIFIED' && w.kyc_status !== 'BLOCKED' && (
                    <button style={btn(C.green)} onClick={() => act(`/admin/kyc/${w.id}/approve`)}>Approve</button>
                  )}
                  {w.kyc_status === 'BLOCKED'
                    ? <button style={btn(C.primary)} onClick={() => act(`/admin/workers/${w.id}/reinstate`)}>Reinstate</button>
                    : <button style={btn(C.red)} onClick={() => { const reason = prompt('Block reason?'); if (reason) act(`/admin/workers/${w.id}/block`, { reason, case_type: 'MANUAL' }); }}>Block</button>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td style={{ ...td, color: C.faint }} colSpan={5}>No workers yet</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Employers({ token }: { token: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const load = useCallback(() => { api('/admin/employers', token).then((r) => setRows(r.employers ?? [])).catch(() => {}); }, [token]);
  useEffect(() => { load(); }, [load]);
  const grant = async (id: string) => {
    const count = prompt('How many extra worker contacts to grant?', '10');
    if (!count) return;
    try { await api(`/admin/employers/${id}/grant-contacts`, token, { method: 'POST', body: JSON.stringify({ count: Number(count) }) }); load(); }
    catch (e: any) { alert(e.message); }
  };
  return (
    <div>
      <H>Employers</H>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>Company</th><th style={th}>City</th><th style={th}>KYC</th><th style={th}>Contact unlocks</th><th style={th}>Actions</th></tr></thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td style={td}>{e.company_name || <span style={{ color: C.faint }}>—</span>}</td>
                <td style={td}>{e.city ?? '—'}</td>
                <td style={td}>{kycBadge(e.kyc_status)}</td>
                <td style={td}><Badge text={String(e.contact_unlocks ?? 0)} color={C.purple} bg="#EEEDFE" /></td>
                <td style={td}><button style={btn(C.accent)} onClick={() => grant(e.id)}>Grant contacts</button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td style={{ ...td, color: C.faint }} colSpan={5}>No employers yet</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Jobs({ token }: { token: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const load = useCallback(() => { api('/admin/requirements', token).then((r) => setRows(r.requirements ?? [])).catch(() => {}); }, [token]);
  useEffect(() => { load(); }, [load]);
  const promote = async (r: any, patch: any) => {
    try {
      await api(`/admin/requirements/${r.id}/promote`, token, {
        method: 'POST',
        body: JSON.stringify({ is_featured: r.is_featured, is_urgent: r.is_urgent, promo_note: r.promo_note, days: 14, ...patch }),
      });
      load();
    } catch (e: any) { alert(e.message); }
  };
  return (
    <div>
      <H>Job Postings</H>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={th}>Role</th><th style={th}>Employer</th><th style={th}>City</th><th style={th}>Salary</th><th style={th}>Matches</th><th style={th}>Promotion</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ ...td, textTransform: 'capitalize', fontWeight: 600 }}>{r.job_type?.replace(/_/g, ' ')}</td>
                <td style={td}>{r.employer?.company_name ?? '—'}</td>
                <td style={td}>{r.city ?? (r.is_pan_india ? 'Pan India' : '—')}</td>
                <td style={td}>₹{(r.salary_min ?? 0).toLocaleString('en-IN')}–{(r.salary_max ?? 0).toLocaleString('en-IN')}</td>
                <td style={td}>{r._count?.matches ?? 0}</td>
                <td style={td}>
                  <button style={btn(r.is_featured ? C.accentDark : C.faint)} onClick={() => promote(r, { is_featured: !r.is_featured })}>
                    {r.is_featured ? '★ Featured' : 'Feature'}
                  </button>
                  <button style={btn(r.is_urgent ? C.red : C.faint)} onClick={() => promote(r, { is_urgent: !r.is_urgent })}>
                    {r.is_urgent ? '● Urgent' : 'Urgent'}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td style={{ ...td, color: C.faint }} colSpan={6}>No job postings yet</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Promotions({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => { api('/admin/promotions', token).then(setData).catch(() => {}); }, [token]);
  return (
    <div>
      <H>Paid Promotions</H>
      <Card style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Featured / Urgent posts</div>
        {(data?.featured ?? []).length === 0 ? <p style={{ color: C.faint, fontSize: 13 }}>None yet — feature a post from the Job Postings tab.</p> : (
          (data.featured).map((r: any) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontWeight: 600, textTransform: 'capitalize', flex: 1 }}>{r.job_type?.replace(/_/g, ' ')} · {r.employer?.company_name}</span>
              {r.is_featured && <Badge text="Featured" color={C.accentDark} bg="#FAEEDA" />}
              {r.is_urgent && <Badge text="Urgent" color={C.red} bg="#FCEBEB" />}
            </div>
          ))
        )}
      </Card>
      <Card>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Employers with unlocked contacts</div>
        {(data?.employersWithUnlocks ?? []).length === 0 ? <p style={{ color: C.faint, fontSize: 13 }}>None yet — grant contacts from the Employers tab.</p> : (
          (data.employersWithUnlocks).map((e: any) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontWeight: 600, flex: 1 }}>{e.company_name} {e.city ? `· ${e.city}` : ''}</span>
              <Badge text={`${e.contact_unlocks} contacts`} color={C.purple} bg="#EEEDFE" />
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
