// The online part of CITIZENESIA: one shared village (a Durable Object called Room). Each player sends where they are about ten
// times a second; the room passes it on to everyone else, with short chat lines. Nothing personal is kept: only the in-game name.
import { DurableObject } from "cloudflare:workers";

const clean = (s, n) => String(s ?? "").replace(/[<>\u0000-\u001f]/g, "").slice(0, n);
const num = (v) => (Number.isFinite(+v) ? Math.round(+v * 100) / 100 : 0);

const MAX_BLOCKS = 400, MAX_HOMES = 6;
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const ok = (code, key) => /^CZ-[A-Z0-9]{4}$/.test(code || "") && /^[a-z0-9]{12,32}$/.test(key || "");

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env); this.peers = new Map(); this.next = 1; this.sql = ctx.storage.sql;
    // accounts: a player code (public, CZ-XXXX) plus a secret key that only that phone knows; data = the save as JSON.
    // builds: what each player built, which everyone sees.
    this.sql.exec("CREATE TABLE IF NOT EXISTS players (code TEXT PRIMARY KEY, key TEXT NOT NULL, data TEXT NOT NULL, updated INTEGER NOT NULL)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS builds (code TEXT PRIMARY KEY, name TEXT, blocks TEXT NOT NULL, homes TEXT NOT NULL)");
  }
  account(code, key) { const r = [...this.sql.exec("SELECT key, data, updated FROM players WHERE code = ?", code)][0]; return r && r.key === key ? r : r ? false : null; }
  builds() { return [...this.sql.exec("SELECT code, name, blocks, homes FROM builds")].map((r) => ({ code: r.code, name: r.name, blocks: JSON.parse(r.blocks), homes: JSON.parse(r.homes) })); }
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/api/save") {
      if (req.method === "GET") {
        const code = url.searchParams.get("code"), key = url.searchParams.get("key");
        if (!ok(code, key)) return json({ error: "bad" }, 400);
        const a = this.account(code, key); if (a === false) return json({ error: "key" }, 403);
        return json(a ? { data: JSON.parse(a.data), updated: a.updated } : { data: null });
      }
      if (req.method === "POST") {
        const text = await req.text(); if (text.length > 120000) return json({ error: "big" }, 413);
        let b; try { b = JSON.parse(text); } catch { return json({ error: "bad" }, 400); }
        if (!ok(b.code, b.key) || typeof b.data !== "object" || !b.data) return json({ error: "bad" }, 400);
        const a = this.account(b.code, b.key); if (a === false) return json({ error: "key" }, 403);
        const d = b.data, now = Date.now();
        const blocks = (Array.isArray(d.blocks) ? d.blocks : []).slice(0, MAX_BLOCKS).filter((v) => Array.isArray(v) && v.length === 4 && v.every(Number.isFinite)).map((v) => v.map((n) => Math.round(n)));
        const homes = (Array.isArray(d.homes) ? d.homes : []).slice(0, MAX_HOMES).map((h) => ({ id: clean(h.id, 20), x: num(h.x), z: num(h.z), y: num(h.y), ry: num(h.ry), type: clean(h.type, 4), wall: clean(h.wall, 9), roof: clean(h.roof, 9), owner: clean(h.owner, 30) }));
        d.blocks = blocks; d.homes = homes;
        this.sql.exec("INSERT INTO players (code, key, data, updated) VALUES (?, ?, ?, ?) ON CONFLICT(code) DO UPDATE SET data = excluded.data, updated = excluded.updated", b.code, b.key, JSON.stringify(d), now);
        const bs = JSON.stringify(blocks), hs = JSON.stringify(homes), name = clean(d.name, 30);
        const old = [...this.sql.exec("SELECT blocks, homes FROM builds WHERE code = ?", b.code)][0];
        if (!old || old.blocks !== bs || old.homes !== hs) {
          this.sql.exec("INSERT INTO builds (code, name, blocks, homes) VALUES (?, ?, ?, ?) ON CONFLICT(code) DO UPDATE SET name = excluded.name, blocks = excluded.blocks, homes = excluded.homes", b.code, name, bs, hs);
          this.cast(0, { t: "w", code: b.code, name, blocks, homes });
        }
        return json({ ok: true, updated: now });
      }
      return json({ error: "method" }, 405);
    }
    if (req.headers.get("Upgrade") !== "websocket") return new Response("websocket only", { status: 426 });
    if (this.peers.size >= 60) return new Response("full", { status: 503 });
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();
    const id = this.next++, me = { ws: server, s: null, last: 0, msgs: 0, sec: 0 };
    this.peers.set(id, me);
    server.send(JSON.stringify({ t: "welcome", id, builds: this.builds(), all: [...this.peers].filter(([k, p]) => k !== id && p.s).map(([k, p]) => ({ id: k, ...p.s })) }));
    server.addEventListener("message", (e) => {
      const now = Date.now(); if (now - me.sec > 1000) { me.sec = now; me.msgs = 0; } if (++me.msgs > 40) return;   // flood guard
      let m; try { m = JSON.parse(e.data); } catch { return; }
      if (m.t === "p") {
        me.s = { n: clean(m.n, 30), k: m.k === "president" ? "president" : "rakyat", l: m.l && typeof m.l === "object" ? { cap: clean(m.l.cap, 9) || null, band: clean(m.l.band, 9) || null, glasses: !!m.l.glasses, stache: !!m.l.stache, helmet: !!m.l.helmet } : {},
          x: num(m.x), y: num(m.y), z: num(m.z), f: num(m.f), mv: !!m.mv, car: m.car == null ? null : num(m.car), in: !!m.in };
        this.cast(id, { t: "p", id, ...me.s });
      } else if (m.t === "c" && now - me.last > 800) {
        me.last = now; const text = clean(m.text, 80).trim(); if (text) this.cast(id, { t: "c", id, text }, true);
      } else if (m.t === "e") this.cast(id, { t: "e", id, e: clean(m.e, 4) });
    });
    const bye = () => { if (this.peers.delete(id)) this.cast(id, { t: "bye", id }); };
    server.addEventListener("close", bye); server.addEventListener("error", bye);
    return new Response(null, { status: 101, webSocket: client });
  }
  cast(from, msg, self = false) {
    const s = JSON.stringify(msg);
    for (const [k, p] of this.peers) if (k !== from || self) { try { p.ws.send(s); } catch { this.peers.delete(k); } }
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/api/room" || url.pathname === "/api/save") return env.ROOM.get(env.ROOM.idFromName("kampung")).fetch(req);
    return env.ASSETS ? env.ASSETS.fetch(req) : new Response("not found", { status: 404 });
  },
};
