'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { api, titleCase, money, date } from '../lib/api';
import { Card, Spinner, Badge, HireBadge, KycBadge, useToast } from '../components/ui';
import { Icon } from '../components/icons';

export function Hires() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api('/admin/hires').then((r) => setRows(r.hires ?? [])).catch(() => {}).finally(() => setLoading(false)); }, []);
  return (
    <Card pad={false}>
      {loading ? <Spinner /> : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Worker</th><th>Employer</th><th>Role</th><th>Salary</th><th>Status</th><th>Joining</th></tr></thead>
            <tbody>
              {rows.map((h) => (
                <tr key={h.id}>
                  <td className="row-name">{h.worker?.full_name ?? '—'}</td>
                  <td>{h.employer?.company_name ?? '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{titleCase(h.requirement?.job_type)}</td>
                  <td>{money(h.offer_salary)}</td>
                  <td><HireBadge status={h.status} /></td>
                  <td className="muted">{date(h.start_date)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6}><div className="empty">No hires yet</div></td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function KycQueue() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, showToast] = useToast();
  const load = useCallback(() => { setLoading(true); api('/admin/kyc-queue').then((r) => setRows(Array.isArray(r) ? r : [])).catch(() => {}).finally(() => setLoading(false)); }, []);
  useEffect(() => { load(); }, [load]);
  const act = async (path: string, body?: any) => {
    try { await api(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }); load(); showToast('Done'); }
    catch (e: any) { alert(e.message); }
  };
  return (
    <>
      <Card pad={false}>
        {loading ? <Spinner /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Name</th><th>Mobile</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>
              <tbody>
                {rows.map((w) => (
                  <tr key={w.id}>
                    <td className="row-name">{w.full_name || <span className="muted">Unnamed</span>}</td>
                    <td>{w.user?.mobile ?? '—'}</td>
                    <td><KycBadge status={w.kyc_status} /></td>
                    <td className="muted">{date(w.created_at)}</td>
                    <td>
                      <button className="btn btn-green btn-tiny" onClick={() => act(`/admin/kyc/${w.id}/approve`)} style={{ marginRight: 6 }}>Approve</button>
                      <button className="btn btn-danger btn-tiny" onClick={() => { const r = prompt('Reject reason?'); if (r) act(`/admin/kyc/${w.id}/reject`, { reason: r }); }}>Reject</button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5}><div className="empty">Queue is clear 🎉</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {toast}
    </>
  );
}

export function CaseAlerts() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api('/admin/case-alerts').then((r) => setRows(Array.isArray(r) ? r : [])).catch(() => {}).finally(() => setLoading(false)); }, []);
  if (loading) return <Spinner />;
  if (rows.length === 0) return <Card><div className="empty">No case alerts — all workers clear</div></Card>;
  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
      {rows.map((a) => (
        <Card key={a.id} style={{ borderLeft: '4px solid var(--red)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--red-light)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="alert" size={18} /></div>
            <div style={{ fontWeight: 700 }}>Security alert</div>
            {a.employer_action ? <Badge kind="b-green">Acted</Badge> : <Badge kind="b-amber">Pending</Badge>}
          </div>
          <div style={{ fontSize: 13, color: 'var(--sub)' }}>Case: {a.case_type ?? '—'} · {a.case_district ?? '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 4 }}>Employer: {a.employer?.company_name ?? '—'} · {date(a.notified_at)}</div>
        </Card>
      ))}
    </div>
  );
}

export function Promotions() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { api('/admin/promotions').then(setData).catch(() => {}); }, []);
  if (!data) return <Spinner />;
  return (
    <div className="grid" style={{ gap: 18 }}>
      <Card>
        <h3 className="card-title">Featured / urgent postings</h3>
        {(data.featured ?? []).length === 0 ? <div className="empty">None yet — promote a post from Job Postings.</div> : (
          data.featured.map((r: any) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 600, textTransform: 'capitalize', flex: 1 }}>{titleCase(r.job_type)} · <span className="muted">{r.employer?.company_name}</span></span>
              {r.is_featured && <Badge kind="b-amber"><Icon name="star" size={11} /> Featured</Badge>}
              {r.is_urgent && <Badge kind="b-red"><Icon name="fire" size={11} /> Urgent</Badge>}
            </div>
          ))
        )}
      </Card>
      <Card>
        <h3 className="card-title">Employers with unlocked contacts</h3>
        {(data.employersWithUnlocks ?? []).length === 0 ? <div className="empty">None yet — grant contacts from Employers.</div> : (
          data.employersWithUnlocks.map((e: any) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 600, flex: 1 }}>{e.company_name} {e.city ? <span className="muted">· {e.city}</span> : ''}</span>
              <Badge kind="b-purple">{e.contact_unlocks} contacts</Badge>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
