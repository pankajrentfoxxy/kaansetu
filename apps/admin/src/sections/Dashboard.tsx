'use client';
import React, { useEffect, useState } from 'react';
import { api, fmt } from '../lib/api';
import { Card, KpiCard, Spinner, BarChart } from '../components/ui';

export function Dashboard() {
  const [d, setD] = useState<any>(null);
  const [a, setA] = useState<any>(null);
  const [s, setS] = useState<any>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([api('/admin/dashboard'), api('/admin/analytics'), api('/admin/stats')])
      .then(([dash, anal, stats]) => { setD(dash); setA(anal); setS(stats); })
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <Card><span style={{ color: 'var(--red)' }}>{err}</span></Card>;
  if (!d) return <Spinner />;

  const kpis = [
    { icon: 'users', color: 'var(--brand)', bg: 'var(--brand-light)', value: fmt(d.workers), label: 'Total Workers' },
    { icon: 'building', color: 'var(--green)', bg: 'var(--green-light)', value: fmt(d.employers), label: 'Total Employers' },
    { icon: 'handshake', color: 'var(--amber)', bg: 'var(--amber-light)', value: fmt(d.hires), label: 'Active Hires' },
    { icon: 'shield', color: 'var(--purple)', bg: 'var(--purple-light)', value: fmt(d.kycPending), label: 'KYC Pending' },
    { icon: 'ban', color: 'var(--red)', bg: 'var(--red-light)', value: fmt(d.blocked), label: 'Blocked Workers' },
  ];

  return (
    <div>
      <div className="grid kpi-grid" style={{ marginBottom: 18 }}>
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 18 }}>
        <Card>
          <h3 className="card-title">Worker verification status</h3>
          <BarChart data={s?.kycStatus ?? []} />
        </Card>
        <Card>
          <h3 className="card-title">Top job types posted</h3>
          <BarChart data={s?.topJobTypes ?? []} />
        </Card>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        <Card>
          <h3 className="card-title">Platform health</h3>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))' }}>
            <Stat label="Verification rate" value={`${a?.verification_rate ?? 0}%`} accent />
            <Stat label="Verified workers" value={fmt(a?.workers?.verified)} />
            <Stat label="Total requirements" value={fmt(a?.requirements?.total)} />
            <Stat label="Total hires" value={fmt(a?.hires?.total)} />
          </div>
        </Card>
        <Card>
          <h3 className="card-title">Monetization</h3>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Stat label="Featured / urgent posts" value={fmt(s?.promotions?.featured)} />
            <Stat label="Employers w/ unlocks" value={fmt(s?.promotions?.employersWithUnlocks)} />
            <Stat label="Referral points issued" value={fmt(s?.pointsIssued)} />
            <Stat label="Active hires" value={fmt(d.hires)} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ fontSize: 12, color: 'var(--faint)' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: accent ? 'var(--accent)' : 'var(--text)' }}>{value}</div>
    </div>
  );
}
