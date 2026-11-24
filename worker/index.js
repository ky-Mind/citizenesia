// The online part of CITIZENESIA: one shared village (a Durable Object called Room). Each player sends where they are about ten
// times a second; the room passes it on to everyone else, with short chat lines. Nothing personal is kept: only the in-game name.
import { DurableObject } from "cloudflare:workers";

const clean = (s, n) => String(s ?? "").replace(/[<>\u0000-\u001f]/g, "").slice(0, n);
const num = (v) => (Number.isFinite(+v) ? Math.round(+v * 100) / 100 : 0);

export class Room extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.peers = new Map(); this.next = 1; }
  async fetch() {
    if (this.peers.size >= 60) return new Response("full", { status: 503 });
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();
    const id = this.next++, me = { ws: server, s: null, last: 0, msgs: 0, sec: 0 };
    this.peers.set(id, me);
    server.send(JSON.stringify({ t: "welcome", id, all: [...this.peers].filter(([k, p]) => k !== id && p.s).map(([k, p]) => ({ id: k, ...p.s })) }));
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
    if (url.pathname === "/api/room") {
      if (req.headers.get("Upgrade") !== "websocket") return new Response("websocket only", { status: 426 });
      return env.ROOM.get(env.ROOM.idFromName("kampung")).fetch(req);
    }
    return env.ASSETS ? env.ASSETS.fetch(req) : new Response("not found", { status: 404 });
  },
};
