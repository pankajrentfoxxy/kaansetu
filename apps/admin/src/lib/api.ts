export const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://gentle-cooperation-production-ca4c.up.railway.app';

export function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('kd_admin_token') ?? '';
}

export async function api(path: string, opts: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API}/api/v1${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(opts.headers ?? {}) },
  });
  if (res.status === 401) {
    localStorage.removeItem('kd_admin_token');
    if (typeof window !== 'undefined') window.location.reload();
    throw new Error('Session expired — please sign in again');
  }
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Error ${res.status}`);
  return res.json();
}

export async function adminLogin(email: string, password: string): Promise<string> {
  const res = await fetch(`${API}/api/v1/auth/admin-login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Login failed');
  return data.access_token;
}

export function fmt(n: number | undefined | null): string {
  return (n ?? 0).toLocaleString('en-IN');
}
export function money(n: number | undefined | null): string {
  return `₹${fmt(n)}`;
}
export function date(s?: string | null): string {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
}
export function titleCase(s?: string | null): string {
  return (s ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
