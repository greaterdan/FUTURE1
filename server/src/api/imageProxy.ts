import type { Request, Response } from "express";

export async function imageProxy(req: Request, res: Response): Promise<void> {
  const u = req.query.u as string;
  if (!u) {
    res.status(400).end();
    return;
  }
  
  try {
    const r = await fetch(u, { 
      headers: { 
        "User-Agent": "Solana-Token-Tracker/1.0" 
      } 
    });
    
    if (!r.ok) {
      res.status(502).end();
      return;
    }
    
    const ct = r.headers.get("content-type") || "image/*";
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=300");
    
    // Convert ReadableStream to Node.js stream
    if (r.body) {
      const reader = r.body.getReader();
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } catch (error) {
          res.status(502).end();
        }
      };
      pump();
    } else {
      res.end();
    }
  } catch {
    res.status(502).end();
  }
}
