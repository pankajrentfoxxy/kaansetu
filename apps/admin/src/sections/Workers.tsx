'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { api, titleCase, date, fmt } from '../lib/api';
import { Card, Spinner, KycBadge, Drawer, DL, Badge, useToast } from '../components/ui';
import { Icon } from '../components/icons';

const FILTERS = [
  { v: '', label: 'All' },
  { v: 'FULLY_VERIFIED', label: 'Verified' },
  { v: 'BGC_INITIATED', label: 'KYC pending' },
  { v: 'BLOCKED', label: 'Blocked' },
];

export function Workers() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, showToast] = useToast();

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (status) q.set('status', status);
    api(`/admin/workers?${q.toString()}`).then((r) => setRows(r.workers ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, [search, status]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  return (
    <div>
      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={16} />
          <input className="input" placeholder="Search name or mobile…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="chip-filters">
          {FILTERS.map((f) => (
            <button key={f.v} className={`fchip ${status === f.v ? 'active' : ''}`} onClick={() => setStatus(f.v)}>{f.label}</button>
          ))}
        </div>
      </div>

      <Card pad={false}>
        {loading ? <Spinner /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Name</th><th>Mobile</th><th>Skill</th><th>KYC</th><th>Joined</th><th></th></tr></thead>
              <tbody>
                {rows.map((w) => (
                  <tr key={w.id} className="clickable" onClick={() => setOpenId(w.id)}>
                    <td className="row-name">{w.full_name || <span className="muted">Unnamed</span>}</td>
                    <td>{w.user?.mobile ?? '—'}</td>
                    <td>{titleCase(w.skills?.[0]?.skill_type) || <span className="muted">—</span>}</td>
                    <td><KycBadge status={w.kyc_status} /></td>
                    <td className="muted">{date(w.created_at)}</td>
                    <td style={{ textAlign: 'right' }}><Icon name="chevronRight" size={16} color="var(--faint)" /></td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={6}><div className="empty">No workers found</div></td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {openId && <WorkerDrawer id={openId} onClose={() => setOpenId(null)} onChange={() => { load(); showToast('Updated'); }} />}
      {toast}
    </div>
  );
}

function WorkerDrawer({ id, onClose, onChange }: { id: string; onClose: () => void; onChange: () => void }) {
  const [w, setW] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => { api(`/admin/workers/${id}`).then(setW).catch(() => {}); }, [id]);
  useEffect(() => { reload(); }, [reload]);

  const act = async (path: string, body?: any) => {
    setBusy(true);
    try { await api(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }); reload(); onChange(); }
    catch (e: any) { alert(e.message); } finally { setBusy(false); }
  };

  const verified = (t: string) => (w?.verifications ?? []).some((v: any) => v.check_type === t && v.status === 'VERIFIED');
  const isBlocked = w?.kyc_status === 'BLOCKED';

  return (
    <Drawer title={w?.full_name || 'Worker'} subtitle={w?.user?.mobile} onClose={onClose}>
      {!w ? <Spinner /> : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <KycBadge status={w.kyc_status} />
            {w.is_open_to_work && <Badge kind="b-green">Available</Badge>}
            {w.referrals_count > 0 && <Badge kind="b-purple">{w.referrals_count} referrals</Badge>}
            {w.points > 0 && <Badge kind="b-amber">{w.points} pts</Badge>}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {!isBlocked && w.kyc_status !== 'FULLY_VERIFIED' && (
              <button className="btn btn-green" disabled={busy} onClick={() => act(`/admin/kyc/${id}/approve`)}><Icon name="check" size={15} /> Approve KYC</button>
            )}
            {!isBlocked && w.kyc_status !== 'FULLY_VERIFIED' && (
              <button className="btn btn-ghost" disabled={busy} onClick={() => { const r = prompt('Reject reason?'); if (r) act(`/admin/kyc/${id}/reject`, { reason: r }); }}>Reject KYC</button>
            )}
            {isBlocked
              ? <button className="btn btn-primary" disabled={busy} onClick={() => act(`/admin/workers/${id}/reinstate`)}>Reinstate</button>
              : <button className="btn btn-danger" disabled={busy} onClick={() => { const r = prompt('Block reason?'); if (r) act(`/admin/workers/${id}/block`, { reason: r, case_type: 'MANUAL' }); }}><Icon name="ban" size={15} /> Block</button>}
          </div>

          <div className="section-h">Profile</div>
          <DL rows={[
            ['Father / Husband', w.father_name],
            ['Gender', w.gender === 'M' ? 'Male' : w.gender === 'F' ? 'Female' : w.gender || '—'],
            ['Education', titleCase(w.education_level)],
            ['City', w.location?.city],
            ['Open to work', w.is_open_to_work ? 'Yes' : 'No'],
            ['Pan-India', w.is_pan_india ? 'Yes' : 'No'],
          ]} />

          <div className="section-h">Skills</div>
          {(w.skills ?? []).length === 0 ? <div className="muted" style={{ fontSize: 13 }}>None</div> : (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {w.skills.map((s: any) => <Badge key={s.id} kind="b-blue">{titleCase(s.skill_type)} · {s.experience_years}y</Badge>)}
            </div>
          )}

          <div className="section-h">Verifications</div>
          <DL rows={[
            ['Selfie', verified('SELFIE') ? <Badge kind="b-green">✓</Badge> : <span className="muted">Pending</span>],
            ['Aadhaar', verified('AADHAAR') ? <Badge kind="b-green">✓</Badge> : <span className="muted">Pending</span>],
            ['PAN', verified('PAN') ? <Badge kind="b-green">✓</Badge> : <span className="muted">Pending</span>],
            ['Background', w.kyc_status === 'FULLY_VERIFIED' ? <Badge kind="b-green">Clear</Badge> : <span className="muted">Pending</span>],
          ]} />

          {(w.work_history ?? []).length > 0 && (<>
            <div className="section-h">Work history</div>
            {w.work_history.map((h: any, i: number) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>{h.employer_name} · {titleCase(h.role)}</div>
                <div className="muted">{date(h.from_date)} — {h.to_date ? date(h.to_date) : 'Present'}</div>
              </div>
            ))}
          </>)}

          {w.referral_code && (<>
            <div className="section-h">Referral</div>
            <DL rows={[['Code', w.referral_code], ['Joined via', w.referred_by_code || '—'], ['Points', fmt(w.points)]]} />
          </>)}
        </>
      )}
    </Drawer>
  );
}
