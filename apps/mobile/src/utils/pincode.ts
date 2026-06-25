// Look up an Indian pincode → city/state/areas via the free India Post API.
// No key needed. Returns null on failure (caller keeps manual entry).
export async function lookupPincode(pin: string): Promise<{ city: string; state: string; areas: string[] } | null> {
  if (!/^\d{6}$/.test(pin)) return null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();
    const rec = data?.[0];
    if (rec?.Status !== 'Success' || !rec.PostOffice?.length) return null;
    const po = rec.PostOffice;
    return {
      city: po[0].District ?? '',
      state: po[0].State ?? '',
      areas: [...new Set<string>(po.map((p: any) => String(p.Name)))],
    };
  } catch {
    return null;
  }
}
