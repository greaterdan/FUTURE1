type Resolver = (v: any) => void;

const pending = new Set<string>();
const waiters: Map<string, Resolver[]> = new Map();
let scheduled = false;

export function enqueuePriceId(mint: string): Promise<any> {
  return new Promise(res => {
    if (!waiters.has(mint)) waiters.set(mint, []);
    waiters.get(mint)!.push(res);
    pending.add(mint);
    if (!scheduled) {
      scheduled = true;
      // coalesce ids seen this tick
      setTimeout(flush, 50);
    }
  });
}

async function flush() {
  scheduled = false;
  const ids = Array.from(pending);
  pending.clear();
  if (ids.length === 0) return;

  const url = `/api/jup?type=price&ids=${encodeURIComponent(ids.join(","))}`;
  let json: any = null;
  try {
    const r = await fetch(url, { cache: "no-store" });
    json = r.ok ? await r.json() : null;
  } catch {}
  const data = json?.data || {};

  for (const id of ids) {
    const resolvers = waiters.get(id) || [];
    waiters.delete(id);
    const value = data[id] || null; // null if unknown/not tradable yet
    resolvers.forEach(fn => fn(value));
  }
}

