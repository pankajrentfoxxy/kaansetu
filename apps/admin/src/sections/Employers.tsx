'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { api, titleCase, date, money } from '../lib/api';
import { Card, Spinner, KycBadge, Drawer, DL, Badge, useToast } from '../components/ui';
import { Icon } from '../components/icons';

export function Employers() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, showToast] = useToast();

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    api(`/admin/employers?${q.toString()}`).then((r) => setRows(r.employers ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  return (
    <div>
      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={16} />
          <input className="input" placeholder="Search company or mobile…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card pad={false}>
        {loading ? <Spinner /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Company</th><th>City</th><th>KYC</th><th>Posts</th><th>Hires</th><th>Unlocks</th><th></th></tr></thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="clickable" onClick={() => setOpenId(e.id)}>
                    <td className="row-name">{e.company_name || <span className="muted">Unnamed</span>}</td>
                    <td>{e.city ?? '—'}</td>
                    <td><KycBadge status={e.kyc_status} /></td>
                    <td>{e._count?.requirements ?? 0}</td>
                    <td>{e._count?.hires ?? 0}</td>
                    <td>{e.contact_unlocks > 0 ? <Badge kind="b-purple">{e.contact_unlocks}</Badge> : <span className="muted">0</span>}</td>
                    <td style={{ textAlign: 'right' }}><Icon name="chevronRight" size={16} color="var(--faint)" /></td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={7}><div className="empty">No employers found</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {openId && <EmployerDrawer id={openId} onClose={() => setOpenId(null)} onChange={() => { load(); showToast('Updated'); }} />}
      {toast}
    </div>
  );
}

function EmployerDrawer({ id, onClose, onChange }: { id: string; onClose: () => void; onChange: () => void }) {
  const [e, setE] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const reload = useCallback(() => { api(`/admin/employers/${id}`).then(setE).catch(() => {}); }, [id]);
  useEffect(() => { reload(); }, [reload]);

  const grant = async () => {
    const count = prompt('Grant how many extra worker contacts?', '10');
    if (!count) return;
    setBusy(true);
    try { await api(`/admin/employers/${id}/grant-contacts`, { method: 'POST', body: JSON.stringify({ count: Number(count) }) }); reload(); onChange(); }
    catch (err: any) { alert(err.message); } finally { setBusy(false); }
  };

  return (
    <Drawer title={e?.company_name || 'Employer'} subtitle={e?.user?.mobile} onClose={onClose}>
      {!e ? <Spinner /> : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <KycBadge status={e.kyc_status} />
            {e.contact_unlocks > 0 && <Badge kind="b-purple">{e.contact_unlocks} contact unlocks</Badge>}
          </div>

          <button className="btn btn-accent" disabled={busy} onClick={grant} style={{ marginBottom: 18 }}>
            <Icon name="users" size={15} /> Grant contact unlocks
          </button>

          <div className="section-h">Business</div>
          <DL rows={[
            ['Entity type', titleCase(e.entity_type)],
            ['GST', e.gst_number],
            ['PAN', e.pan_number],
            ['City', e.city],
            ['Contact', e.contact_name],
          ]} />

          <div className="section-h">Job postings ({(e.requirements ?? []).length})</div>
          {(e.requirements ?? []).length === 0 ? <div className="muted" style={{ fontSize: 13 }}>None</div> : (
            e.requirements.map((r: any) => (
              <div key={r.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{titleCase(r.job_type)}</span>
                <span className="muted">{money(r.salary_min)}–{money(r.salary_max)} · {r._count?.matches ?? 0} matches</span>
              </div>
            ))
          )}

          <div className="section-h">Hires ({(e.hires ?? []).length})</div>
          {(e.hires ?? []).length === 0 ? <div className="muted" style={{ fontSize: 13 }}>None</div> : (
            e.hires.map((h: any) => (
              <div key={h.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{h.worker?.full_name ?? 'Worker'}</span>
                <span className="muted">{money(h.offer_salary)} · {(h.status ?? '').replace(/_/g, ' ')}</span>
              </div>
            ))
          )}
        </>
      )}
    </Drawer>
  );
}
