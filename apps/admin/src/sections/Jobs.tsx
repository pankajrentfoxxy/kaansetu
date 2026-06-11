'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { api, titleCase, money } from '../lib/api';
import { Card, Spinner, Badge, Modal, useToast } from '../components/ui';
import { Icon } from '../components/icons';

export function Jobs() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [promote, setPromote] = useState<any>(null);
  const [toast, showToast] = useToast();

  const load = useCallback(() => {
    setLoading(true);
    api('/admin/requirements').then((r) => setRows(r.requirements ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <Card pad={false}>
        {loading ? <Spinner /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Role</th><th>Employer</th><th>City</th><th>Salary</th><th>Matches</th><th>Promotion</th><th></th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="row-name" style={{ textTransform: 'capitalize' }}>{titleCase(r.job_type)}</td>
                    <td>{r.employer?.company_name ?? '—'}</td>
                    <td>{r.city ?? (r.is_pan_india ? 'Pan India' : '—')}</td>
                    <td>{money(r.salary_min)}–{money(r.salary_max)}</td>
                    <td>{r._count?.matches ?? 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {r.is_featured && <Badge kind="b-amber"><Icon name="star" size={11} /> Featured</Badge>}
                        {r.is_urgent && <Badge kind="b-red"><Icon name="fire" size={11} /> Urgent</Badge>}
                        {!r.is_featured && !r.is_urgent && <span className="muted">—</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-tiny" onClick={() => setPromote(r)}>Promote</button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={7}><div className="empty">No job postings yet</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {promote && <PromoteModal req={promote} onClose={() => setPromote(null)} onSaved={() => { setPromote(null); load(); showToast('Promotion updated'); }} />}
      {toast}
    </div>
  );
}

function PromoteModal({ req, onClose, onSaved }: { req: any; onClose: () => void; onSaved: () => void }) {
  const [featured, setFeatured] = useState(!!req.is_featured);
  const [urgent, setUrgent] = useState(!!req.is_urgent);
  const [note, setNote] = useState(req.promo_note ?? '');
  const [days, setDays] = useState('14');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await api(`/admin/requirements/${req.id}/promote`, {
        method: 'POST',
        body: JSON.stringify({ is_featured: featured, is_urgent: urgent, promo_note: note || null, days: Number(days) || 14 }),
      });
      onSaved();
    } catch (e: any) { alert(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal onClose={onClose}>
      <h2 style={{ margin: '0 0 4px', fontSize: 19 }}>Promote posting</h2>
      <p className="muted" style={{ marginTop: 0, fontSize: 13, textTransform: 'capitalize' }}>{titleCase(req.job_type)} · {req.employer?.company_name}</p>

      <Toggle label="Featured" desc="Show at top of workers' matches" icon="star" on={featured} onChange={setFeatured} color="var(--accent)" />
      <Toggle label="Urgent hiring" desc="Adds an 'Urgent' badge" icon="fire" on={urgent} onChange={setUrgent} color="var(--red)" />

      <label className="field-label" style={{ marginTop: 14 }}>Featured for (days)</label>
      <input className="input" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ''))} />

      <label className="field-label" style={{ marginTop: 14 }}>Internal note (optional)</label>
      <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. paid promotion — invoice #123" />

      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
        <button className="btn btn-primary" disabled={busy} onClick={save} style={{ flex: 1, justifyContent: 'center' }}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </Modal>
  );
}

function Toggle({ label, desc, icon, on, onChange, color }: { label: string; desc: string; icon: string; on: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <div onClick={() => onChange(!on)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', marginTop: 12, border: `1.5px solid ${on ? color : 'var(--border)'}`, borderRadius: 10, cursor: 'pointer', background: on ? 'var(--surface-alt)' : 'transparent' }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: on ? color : 'var(--surface-alt)', color: on ? '#fff' : 'var(--faint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={18} /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
        <div className="muted" style={{ fontSize: 12 }}>{desc}</div>
      </div>
      <div style={{ width: 44, height: 26, borderRadius: 13, background: on ? color : 'var(--border-strong)', position: 'relative', transition: 'background .15s' }}>
        <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
      </div>
    </div>
  );
}
