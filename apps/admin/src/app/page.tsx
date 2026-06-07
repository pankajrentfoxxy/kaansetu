'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface DashboardData {
  workers: number;
  employers: number;
  hires: number;
  blocked: number;
  kycPending: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async (t: string) => {
    setLoading(true);
    try {
      const [dash, anal] = await Promise.all([
        fetch(`${API}/api/v1/admin/dashboard`, { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json()),
        fetch(`${API}/api/v1/admin/analytics`, { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json()),
      ]);
      setData(dash);
      setAnalytics(anal);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: 24, backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      <h1 style={{ color: '#1A56A0', marginBottom: 8 }}>KaamSetu Admin Panel</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>Operations Dashboard</p>

      <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
        <input
          type="text"
          placeholder="Admin JWT token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: 14 }}
        />
        <button
          onClick={() => fetchData(token)}
          style={{ padding: '10px 20px', backgroundColor: '#1A56A0', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
        >
          {loading ? 'Loading...' : 'Load Dashboard'}
        </button>
      </div>

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
            <MetricCard title="Total Workers" value={data.workers} color="#1A56A0" />
            <MetricCard title="Total Employers" value={data.employers} color="#3B6D11" />
            <MetricCard title="Active Hires" value={data.hires} color="#854F0B" />
            <MetricCard title="Blocked Workers" value={data.blocked} color="#A32D2D" />
            <MetricCard title="KYC Pending" value={data.kycPending} color="#6B3FA0" />
          </div>

          {analytics && (
            <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <h2 style={{ color: '#1A1A1A', marginBottom: 16 }}>Platform Analytics</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <AnalyticsItem label="Verification Rate" value={`${analytics.verification_rate}%`} />
                <AnalyticsItem label="Total Requirements" value={analytics.requirements?.total ?? 0} />
                <AnalyticsItem label="Verified Workers" value={analytics.workers?.verified ?? 0} />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <AdminSection title="KYC Queue" token={token} endpoint="/admin/kyc-queue" />
            <AdminSection title="Case Alerts" token={token} endpoint="/admin/case-alerts" />
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, borderLeft: `4px solid ${color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value.toLocaleString('en-IN')}</div>
      <div style={{ color: '#555', fontSize: 13, marginTop: 4 }}>{title}</div>
    </div>
  );
}

function AnalyticsItem({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ borderBottom: '1px solid #eee', paddingBottom: 12 }}>
      <div style={{ color: '#888', fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: '#1A1A1A' }}>{value}</div>
    </div>
  );
}

function AdminSection({ title, token, endpoint }: { title: string; token: string; endpoint: string }) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/v1${endpoint}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => {});
  }, [token, endpoint]);

  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <h3 style={{ color: '#1A1A1A', marginBottom: 16 }}>{title}</h3>
      {items.length === 0 ? (
        <p style={{ color: '#888', fontSize: 13 }}>No items to show</p>
      ) : (
        items.map((item, i) => (
          <div key={i} style={{ borderBottom: '1px solid #eee', paddingBottom: 8, marginBottom: 8, fontSize: 13, color: '#333' }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(item, null, 2).slice(0, 200)}</pre>
          </div>
        ))
      )}
    </div>
  );
}
