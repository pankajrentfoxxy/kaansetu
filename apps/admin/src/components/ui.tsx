'use client';
import React, { useState, useCallback } from 'react';
import { Icon } from './icons';

export function Spinner() { return <div className="center-pad"><div className="spinner" /></div>; }

export function Card({ children, className = '', pad = true, style }: { children: React.ReactNode; className?: string; pad?: boolean; style?: React.CSSProperties }) {
  return <div className={`card ${pad ? 'card-pad' : ''} ${className}`} style={style}>{children}</div>;
}

export function KpiCard({ icon, color, bg, value, label }: { icon: string; color: string; bg: string; value: React.ReactNode; label: string }) {
  return (
    <Card>
      <div className="kpi">
        <div className="kpi-icon" style={{ background: bg, color }}><Icon name={icon} size={22} /></div>
        <div>
          <div className="kpi-value" style={{ color }}>{value}</div>
          <div className="kpi-label">{label}</div>
        </div>
      </div>
    </Card>
  );
}

export function Badge({ kind, children }: { kind: string; children: React.ReactNode }) {
  return <span className={`badge ${kind}`}>{children}</span>;
}

const KYC_MAP: Record<string, { kind: string; label: string }> = {
  FULLY_VERIFIED: { kind: 'b-green', label: 'Verified' },
  BLOCKED: { kind: 'b-red', label: 'Blocked' },
  SUSPENDED: { kind: 'b-red', label: 'Suspended' },
  PENDING: { kind: 'b-gray', label: 'Pending' },
  BGC_INITIATED: { kind: 'b-amber', label: 'BGC running' },
  SELFIE_DONE: { kind: 'b-amber', label: 'Selfie done' },
  AADHAAR_DONE: { kind: 'b-amber', label: 'Aadhaar done' },
  PAN_DONE: { kind: 'b-amber', label: 'PAN done' },
  GST_VERIFIED: { kind: 'b-amber', label: 'GST verified' },
  PAN_VERIFIED: { kind: 'b-amber', label: 'PAN verified' },
  REJECTED: { kind: 'b-red', label: 'Rejected' },
};
export function KycBadge({ status }: { status: string }) {
  const c = KYC_MAP[status] ?? { kind: 'b-amber', label: status?.replace(/_/g, ' ') };
  return <Badge kind={c.kind}>{c.label}</Badge>;
}

const HIRE_MAP: Record<string, string> = { OFFER_SENT: 'b-amber', EMPLOYER_SIGNED: 'b-blue', WORKER_SIGNED: 'b-blue', ACTIVE: 'b-green', TERMINATED: 'b-red' };
export function HireBadge({ status }: { status: string }) {
  return <Badge kind={HIRE_MAP[status] ?? 'b-gray'}>{(status ?? '').replace(/_/g, ' ')}</Badge>;
}

export function Drawer({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 13, color: 'var(--sub)' }}>{subtitle}</div>}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </>
  );
}

export function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-center">
      <div className="overlay" onClick={onClose} />
      <div className="modal" style={{ position: 'relative', zIndex: 51 }}>{children}</div>
    </div>
  );
}

const BAR_COLORS = ['#1A56A0', '#1D9E75', '#F4900C', '#534AB7', '#D14343', '#0F6E56', '#BA7517'];
export function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <div className="empty">No data yet</div>;
  return (
    <div>
      {data.map((d, i) => (
        <div className="bar-row" key={d.label}>
          <div className="bar-label">{(d.label ?? '').replace(/_/g, ' ').toLowerCase()}</div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(d.value / max) * 100}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} /></div>
          <div className="bar-val">{d.value}</div>
        </div>
      ))}
    </div>
  );
}

export function DL({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl style={{ margin: 0 }}>
      {rows.map(([k, v], i) => (
        <div className="dl" key={i}><dt>{k}</dt><dd>{v ?? '—'}</dd></div>
      ))}
    </dl>
  );
}

export function useToast(): [React.ReactNode, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2600); }, []);
  const node = msg ? <div className="toast">{msg}</div> : null;
  return [node, show];
}
