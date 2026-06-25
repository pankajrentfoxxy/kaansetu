// Shared display formatters (salary, dates, relative time). Used across worker
// and employer screens — keep one copy here, not per-screen.

export function formatSalary(n?: number | null): string {
  if (n == null) return '';
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
}

// Salary range label; "Negotiable" when no salary was set on the job.
export function salaryRange(min?: number | null, max?: number | null, en = true): string {
  if (min == null && max == null) return en ? 'Negotiable' : 'तय नहीं';
  if (min != null && max != null) return `${formatSalary(min)}–${formatSalary(max)}`;
  return formatSalary(min ?? max);
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return dateStr; }
}

export function timeAgo(dateStr: string, lang: string): string {
  const h = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3.6e6);
  if (h < 1) return lang === 'en' ? 'just now' : 'अभी';
  if (h < 24) return lang === 'en' ? `${h}h ago` : `${h} घंटे पहले`;
  const d = Math.floor(h / 24);
  return lang === 'en' ? `${d}d ago` : `${d} दिन पहले`;
}
