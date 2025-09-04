import type { Request, Response } from "express";
import { Readable } from "node:stream";

export async function imageProxy(req: Request, res: Response): Promise<void> {
  const u = String(req.query.u || "");
  if (!u) {
    res.status(400).send("missing url");
    return;
  }

  // allow data URLs too
  if (u.startsWith("data:image/")) {
    const m = u.match(/^data:(image\/[^;]+);base64,(.*)$/i);
    if (!m) {
      res.status(400).send("bad data url");
      return;
    }
    res.setHeader("Content-Type", m[1]);
    res.setHeader("Cache-Control", "public, max-age=300");
    res.end(Buffer.from(m[2], "base64"));
    return;
  }

  // basic allowlist
  if (!/^https?:\/\//i.test(u)) {
    res.status(400).send("bad url");
    return;
  }

  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 15000);

  try {
    const r = await fetch(u, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Solana-Token-Tracker/1.0",
        "Accept": "image/*,application/octet-stream;q=0.9,*/*;q=0.8"
      }
    });
    if (!r.ok) {
      res.status(502).end();
      return;
    }

    const ct = r.headers.get("content-type") || "image/*";
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");

    if (r.body) {
      // convert WHATWG stream → Node stream
      const nodeStream = (Readable as any).fromWeb
        ? (Readable as any).fromWeb(r.body as any)
        : r.body as any;
      nodeStream.pipe(res);
    } else {
      const buf = Buffer.from(await r.arrayBuffer());
      res.end(buf);
    }
  } catch (_e) {
    res.status(502).end();
  } finally {
    clearTimeout(to);
  }
}
