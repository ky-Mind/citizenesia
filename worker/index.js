// The online part of CITIZENESIA: one shared village (a Durable Object called Room).
// - Live: each player sends where they are about ten times a second; the room passes it on, with chat lines and emotes.
// - Accounts: a public code (CZ-XXXX) plus a secret key that only the player's phone knows. Nothing personal is kept.
// - The economy is decided HERE, not on the phone: coins, XP, the bag, stats and missions change only through actions
//   the server checks (/api/act). The phone's save (/api/save) keeps the look, position and builds; builds are paid here.
import { DurableObject } from "cloudflare:workers";

const clean = (s, n) => String(s ?? "").replace(/[<>\u0000-\u001f]/g, "").slice(0, n);
const num = (v) => (Number.isFinite(+v) ? Math.round(+v * 100) / 100 : 0);
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const okId = (code, key) => /^CZ-[A-Z0-9]{4}$/.test(code || "") && /^[a-z0-9]{12,32}$/.test(key || "");

// ---- the rules of the economy (the phone shows the same numbers, but these are the ones that count) ----
const MAX_BLOCKS = 400, MAX_HOMES = 6, BAG = 12, BLOCK = 1;
const HOUSE = { s: 50, m: 120, l: 250 };
const SHOP = { makan: 2, jajan: 1, bakso: 3 };
const ITEMS = ["bakso", "buku", "bola", "apel", "bunga", "koin", "kopi", "payung"];
const ITEM_BACK = 300000;   // a picked-up thing comes back after 5 minutes
const WORK = { coins: 10, xp: 20, gap: 4000 }, JOB = { coins: 8, xp: 30, min: 5000 }, MIS_R = { coins: 15, xp: 50 };
const MIS = { makan: 1, item: 3, drive: 300, work: 2, deliv: 2, talk: 1, gong: 1, chat: 1, jajan: 1, walk: 200 };
const EVENTS = ["talk", "gong", "chat"];
const FOOD = { makan: 40, bakso: 30, jajan: 15 }, EAT = { bakso: 25, apel: 10, kopi: 15 };   // energy back
const SELL = { buku: 3, bola: 4, apel: 1, bunga: 2, payung: 4, kopi: 2, bakso: 2 };          // what the warung pays for things
const OPEN = { jajan: [6, 22], bakso: [6, 22], makan: [0, 24] };                              // shop hours, Citizenesia time
const gameHour = () => ((Date.now() / 1000) % 1440) / 60;   // one Citizenesia day = 24 real minutes, the same clock as the game
const kindOf = (id) => ITEMS[Math.floor(h2(parseInt(id.slice(1), 10), 29) * ITEMS.length)];   // what lies at world spot wN
const BAD = /\b(anjing|anjg|bangsat|babi|kontol|memek|ngentot|goblok|tolol|bajingan|asu|jancok|fuck|shit|bitch)\b/gi;
const tidy = (t) => t.replace(BAD, (w) => "*".repeat(w.length));
// the same hash the game uses, so both pick the same three missions each day
function h2(ix, iz) { let h = (Math.imul(ix, 374761393) + Math.imul(iz, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
const today = () => Math.floor((Date.now() + 7 * 3600e3) / 86400e3);
function todays(d = today()) { const keys = Object.keys(MIS), out = []; for (let i = 0; out.length < 3; i++) { const k = keys[Math.floor(h2(d, i + 3) * keys.length)]; if (!out.includes(k)) out.push(k); } return out; }
const fresh = () => ({ energy: 100, coins: 0, xp: 0, hired: false, bag: [], stats: { walk: 0, drive: 0, jobs: 0, deliv: 0, items: 0, mis: 0 }, mis: { day: today(), p: {}, d: {} }, t: {} });
const sameKey = (a, b) => { if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env); this.env = env; this.peers = new Map(); this.next = 1; this.sql = ctx.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS players (code TEXT PRIMARY KEY, key TEXT NOT NULL, data TEXT NOT NULL, updated INTEGER NOT NULL)");
    try { this.sql.exec("ALTER TABLE players ADD COLUMN state TEXT"); } catch {}   // the economy, owned by the server
    this.sql.exec("CREATE TABLE IF NOT EXISTS builds (code TEXT PRIMARY KEY, name TEXT, blocks TEXT NOT NULL, homes TEXT NOT NULL)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS taken (id TEXT PRIMARY KEY, at INTEGER NOT NULL)");   // things on the ground, shared by everyone
  }
  // ---- accounts ----
  row(code) { return [...this.sql.exec("SELECT key, data, state, updated FROM players WHERE code = ?", code)][0]; }
  auth(code, key) {   // null = new account, false = wrong key, else the row
    if (!okId(code, key)) return false;
    const r = this.row(code); if (!r) return null;
    return sameKey(r.key, key) ? r : false;
  }
  stateOf(r) {
    if (r && r.state) return { ...fresh(), ...JSON.parse(r.state) };
    if (r) {   // an account saved before the server owned the economy: start from what it had, within sane limits, once
      const d = JSON.parse(r.data), s = fresh();
      s.coins = Math.max(0, Math.min(500, Math.floor(+d.coins || 0))); s.xp = Math.max(0, Math.min(2000, Math.floor(+d.xp || 0))); s.hired = !!d.hired;
      s.bag = (Array.isArray(d.bag) ? d.bag : []).filter((k) => ITEMS.includes(k)).slice(0, BAG); if (d.stats) Object.keys(s.stats).forEach((k) => (s.stats[k] = Math.max(0, +d.stats[k] || 0)));
      return s;
    }
    return fresh();
  }
  put(code, key, data, st) {
    this.sql.exec("INSERT INTO players (code, key, data, state, updated) VALUES (?, ?, ?, ?, ?) ON CONFLICT(code) DO UPDATE SET data = excluded.data, state = excluded.state, updated = excluded.updated",
      code, key, JSON.stringify(data), JSON.stringify(st), Date.now());
  }
  isAdmin(req) { const k = this.env.ADMIN_KEY; return !!k && sameKey(req.headers.get("x-cz-admin") || "", k); }
  pub(st, admin) { return { energy: Math.round(st.energy), coins: st.coins, xp: st.xp, hired: st.hired, bag: st.bag, stats: st.stats, mis: st.mis, admin }; }

  // ---- missions: counted on the server ----
  mission(st, k, n = 1) {
    if (st.mis.day !== today()) st.mis = { day: today(), p: {}, d: {} };
    if (!todays().includes(k) || st.mis.d[k]) return false;
    st.mis.p[k] = (st.mis.p[k] || 0) + n;
    if (st.mis.p[k] >= MIS[k]) { st.mis.d[k] = 1; st.coins += MIS_R.coins; st.xp += MIS_R.xp; st.stats.mis++; return true; }
    return false;
  }

  // ---- one action from a player; returns {ok, msg?, ...} and the new state ----
  act(st, a, admin, data) {
    const now = Date.now(), t = st.t, gap = (k, ms) => { if (now - (t[k] || 0) < ms) return false; t[k] = now; return true; };
    const tire = (n) => { st.energy = Math.max(0, st.energy - n); };
    const feed = (n) => { st.energy = Math.min(100, st.energy + n); };
    const pay = (n) => { if (admin) return true; if (st.coins < n) return false; st.coins -= n; return true; };
    switch (a.act) {
      case "work":
        if (!st.hired) { st.hired = true; return { ok: true, msg: "hired" }; }
        if (st.energy < 10 && !admin) return { ok: false, msg: "tired" };
        if (!gap("work", WORK.gap)) return { ok: false, msg: "slow" };
        tire(10); st.coins += WORK.coins; st.xp += WORK.xp; st.stats.jobs++; return { ok: true, done: this.mission(st, "work") };
      case "buy": {
        const price = SHOP[a.what]; if (price === undefined) return { ok: false, msg: "bad" };
        const [o, c] = OPEN[a.what], hr = gameHour(); if (hr < o || hr >= c) return { ok: false, msg: "closed" };
        if (!gap("buy", 600)) return { ok: false, msg: "slow" };
        if (!pay(price)) return { ok: false, msg: "broke" };
        feed(FOOD[a.what] || 0);
        return { ok: true, done: this.mission(st, a.what) };
      }
      case "take": {
        const id = clean(a.id, 24); let k = a.k;
        if (/^w\d{1,4}$/.test(id)) k = kindOf(id);   // the server knows what lies where: the phone cannot claim a coin instead of a ball
        if (!ITEMS.includes(k) || !/^[wd][a-z0-9,.-]{1,22}$/.test(id)) return { ok: false, msg: "bad" };
        if (st.bag.length >= BAG) return { ok: false, msg: "full" };
        if (!gap("take", 700)) return { ok: false, msg: "slow" };
        if (id[0] === "d") {   // something this player dropped earlier: only theirs to pick up again
          const dr = (data.items && data.items.dropped) || [], i = dr.findIndex((x) => x.id === id && x.k === k);
          if (i < 0) return { ok: false, msg: "gone" };
          dr.splice(i, 1);
        } else {
          const r = [...this.sql.exec("SELECT at FROM taken WHERE id = ?", id)][0];
          if (r && now - r.at < ITEM_BACK) return { ok: false, msg: "gone" };
          if (k === "koin" && !gap("koinTake", 20000)) return { ok: false, msg: "slow" };   // coins on the ground: at most one every 20 s
          this.sql.exec("INSERT INTO taken (id, at) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET at = excluded.at", id, now);
          this.cast(0, { t: "it", id, at: now });
        }
        st.bag.push(k); st.stats.items++; st.xp += 2; return { ok: true, done: this.mission(st, "item") };
      }
      case "use": {
        const i = st.bag.indexOf(a.k); if (i < 0) return { ok: false, msg: "bad" };
        st.bag.splice(i, 1); if (a.k === "koin") st.coins += 5; feed(EAT[a.k] || 0); return { ok: true };
      }
      case "sell": {
        const i = st.bag.indexOf(a.k), price = SELL[a.k]; if (i < 0 || !price) return { ok: false, msg: "bad" };
        const hr = gameHour(); if (hr < 6 || hr >= 22) return { ok: false, msg: "closed" };
        if (!gap("sell", 500)) return { ok: false, msg: "slow" };
        st.bag.splice(i, 1); st.coins += price; return { ok: true, price };
      }
      case "drop": {
        const i = st.bag.indexOf(a.k); if (i < 0) return { ok: false, msg: "bad" };
        st.bag.splice(i, 1);
        data.items = data.items || {}; data.items.dropped = (data.items.dropped || []).slice(-30);
        data.items.dropped.push({ id: "d" + now.toString(36), k: a.k, x: num(a.x), z: num(a.z) });
        return { ok: true, id: "d" + now.toString(36) };
      }
      case "jobStart": t.job = now; return { ok: true };
      case "deliver":
        if (!t.job || now - t.job < JOB.min) return { ok: false, msg: "slow" };
        t.job = 0; tire(5); st.coins += JOB.coins; st.xp += JOB.xp; st.stats.deliv++; return { ok: true, done: this.mission(st, "deliv") };
      case "ev": {
        if (!EVENTS.includes(a.k) || !gap("ev" + a.k, 1500)) return { ok: false, msg: "slow" };
        return { ok: true, done: this.mission(st, a.k) };
      }
      case "move": {   // distance walked and driven since the last report, capped by how fast anyone can go
        const dt = Math.min(60, (now - (t.move || now - 10000)) / 1000); t.move = now;
        const w = Math.max(0, Math.min(+a.walk || 0, dt * 8)), d = Math.max(0, Math.min(+a.drive || 0, dt * 24));
        st.stats.walk += w; st.stats.drive += d; tire(w / 40 + d / 150);
        t.wAcc = (t.wAcc || 0) + w; t.dAcc = (t.dAcc || 0) + d;
        while (t.wAcc >= 100) { t.wAcc -= 100; st.xp += 1; } while (t.dAcc >= 100) { t.dAcc -= 100; st.xp += 2; }
        const done = this.mission(st, "walk", w) | this.mission(st, "drive", d);
        return { ok: true, done: !!done };
      }
      case "fresh": st.coins = 0; st.hired = false; st.energy = 100; return { ok: true };
      default: return { ok: false, msg: "bad" };
    }
  }

  // builds cost coins: new blocks 1 each, houses by size; selling gives the money back. Returns the accepted builds.
  chargeBuilds(st, old, blocks, homes, admin) {
    const oldB = old ? JSON.parse(old.blocks) : [], oldH = old ? JSON.parse(old.homes) : [];
    const cost = (blocks.length - oldB.length) * BLOCK
      + homes.filter((h) => !oldH.some((o) => o.id === h.id)).reduce((s, h) => s + (HOUSE[h.type] || 999), 0)
      - oldH.filter((o) => !homes.some((h) => h.id === o.id)).reduce((s, h) => s + (HOUSE[h.type] || 0), 0);
    if (admin) return { blocks, homes };
    if (cost > st.coins) return { blocks: oldB, homes: oldH, refused: true };
    st.coins -= cost; return { blocks, homes };
  }

  async fetch(req) {
    const url = new URL(req.url), admin = this.isAdmin(req);
    if (url.pathname.startsWith("/api/") && url.pathname !== "/api/room") {
      if (req.method !== "POST") return json({ error: "method" }, 405);
      const text = await req.text(); if (text.length > 120000) return json({ error: "big" }, 413);
      let b; try { b = JSON.parse(text); } catch { return json({ error: "bad" }, 400); }
      const r = this.auth(b.code, b.key); if (r === false) return json({ error: "key" }, 403);
      const st = this.stateOf(r), data = r ? JSON.parse(r.data) : { name: "" };

      if (url.pathname === "/api/load") return json({ data: r ? data : null, state: this.pub(st, admin), updated: r ? r.updated : 0 });
      if (url.pathname === "/api/admin") return json({ admin });

      if (url.pathname === "/api/top") {   // the ranking: the ten highest levels (name and XP only)
        const top = [...this.sql.exec("SELECT json_extract(data, '$.name') AS name, json_extract(state, '$.xp') AS xp FROM players WHERE state IS NOT NULL ORDER BY xp DESC LIMIT 10")].map((r) => ({ name: r.name || "?", xp: r.xp || 0 }));
        return json({ top });
      }
      if (url.pathname === "/api/gift") {   // give one thing from your bag to another player (by their public code)
        const to = String(b.to || ""); if (!/^CZ-[A-Z0-9]{4}$/.test(to) || to === b.code) return json({ ok: false, msg: "bad", state: this.pub(st, admin) });
        const i = st.bag.indexOf(b.k); if (i < 0) return json({ ok: false, msg: "bad", state: this.pub(st, admin) });
        const tr = this.row(to); if (!tr) return json({ ok: false, msg: "nobody", state: this.pub(st, admin) });
        const ts = this.stateOf(tr); if (ts.bag.length >= BAG) return json({ ok: false, msg: "full", state: this.pub(st, admin) });
        const now = Date.now(); if (now - (st.t.gift || 0) < 2000) return json({ ok: false, msg: "slow", state: this.pub(st, admin) }); st.t.gift = now;
        st.bag.splice(i, 1); ts.bag.push(b.k);
        this.put(b.code, b.key, data, st); this.put(to, tr.key, JSON.parse(tr.data), ts);
        this.cast(0, { t: "gift", to, from: clean(data.name, 30), k: b.k });
        return json({ ok: true, state: this.pub(st, admin) });
      }
      if (url.pathname === "/api/act") {
        const res = this.act(st, b, admin, data);
        this.put(b.code, b.key, data, st);
        return json({ ...res, state: this.pub(st, admin) });
      }

      if (url.pathname === "/api/save") {
        if (typeof b.data !== "object" || !b.data) return json({ error: "bad" }, 400);
        const d = b.data;
        let blocks = (Array.isArray(d.blocks) ? d.blocks : []).slice(0, MAX_BLOCKS).filter((v) => Array.isArray(v) && v.length === 4 && v.every(Number.isFinite)).map((v) => v.map((n) => Math.round(n)));
        let homes = (Array.isArray(d.homes) ? d.homes : []).slice(0, MAX_HOMES).map((h) => ({ id: clean(h.id, 20), x: num(h.x), z: num(h.z), y: num(h.y), ry: num(h.ry), type: clean(h.type, 4), wall: clean(h.wall, 9), roof: clean(h.roof, 9), owner: clean(h.owner, 30) }));
        const old = [...this.sql.exec("SELECT blocks, homes FROM builds WHERE code = ?", b.code)][0];
        const paid = this.chargeBuilds(st, old, blocks, homes, admin); blocks = paid.blocks; homes = paid.homes;
        // keep only what the phone may decide; the economy fields come from the server's state
        const keep = { name: clean(d.name, 30), code: b.code, look: d.look && typeof d.look === "object" ? d.look : {}, created: !!d.created, adm: d.adm, where: "out",
          posOut: Array.isArray(d.posOut) ? d.posOut.slice(0, 2).map(num) : undefined, joyRight: !!d.joyRight, blocks, homes,
          items: { taken: {}, dropped: (data.items && data.items.dropped) || [] } };
        this.put(b.code, b.key, keep, st);
        const bs = JSON.stringify(blocks), hs = JSON.stringify(homes);
        if (!old || old.blocks !== bs || old.homes !== hs) {
          this.sql.exec("INSERT INTO builds (code, name, blocks, homes) VALUES (?, ?, ?, ?) ON CONFLICT(code) DO UPDATE SET name = excluded.name, blocks = excluded.blocks, homes = excluded.homes", b.code, keep.name, bs, hs);
          this.cast(0, { t: "w", code: b.code, name: keep.name, blocks, homes });
        }
        return json({ ok: true, refused: !!paid.refused, blocks, homes, state: this.pub(st, admin), updated: Date.now() });
      }
      return json({ error: "not found" }, 404);
    }

    // ---- the live village (WebSocket) ----
    if (req.headers.get("Upgrade") !== "websocket") return new Response("websocket only", { status: 426 });
    if (this.peers.size >= 60) return new Response("full", { status: 503 });   // the phone shows "the village is full"
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();
    this.cars = this.cars || new Map();
    const id = this.next++, me = { ws: server, s: null, last: 0, msgs: 0, sec: 0 };
    this.peers.set(id, me);
    const now = Date.now(), taken = Object.fromEntries([...this.sql.exec("SELECT id, at FROM taken WHERE at > ?", now - ITEM_BACK)].map((r) => [r.id, r.at]));
    server.send(JSON.stringify({ t: "welcome", id, now, taken, cars: [...this.cars].map(([i, c]) => ({ i, ...c })), builds: [...this.sql.exec("SELECT code, name, blocks, homes FROM builds")].map((r) => ({ code: r.code, name: r.name, blocks: JSON.parse(r.blocks), homes: JSON.parse(r.homes) })),
      all: [...this.peers].filter(([k, p]) => k !== id && p.s).map(([k, p]) => ({ id: k, ...p.s })) }));
    server.addEventListener("message", (e) => {
      const now = Date.now(); if (now - me.sec > 1000) { me.sec = now; me.msgs = 0; } if (++me.msgs > 40) return;   // flood guard
      let m; try { m = JSON.parse(e.data); } catch { return; }
      if (m.t === "p") {
        me.s = { n: clean(m.n, 30), k: m.k === "president" ? "president" : "rakyat", l: m.l && typeof m.l === "object" ? { cap: clean(m.l.cap, 9) || null, band: clean(m.l.band, 9) || null, glasses: !!m.l.glasses, stache: !!m.l.stache, helmet: !!m.l.helmet } : {},
          x: num(m.x), y: num(m.y), z: num(m.z), f: num(m.f), mv: !!m.mv, car: m.car == null ? null : num(m.car), in: !!m.in, c: /^CZ-[A-Z0-9]{4}$/.test(m.c || "") ? m.c : "" };
        this.cast(id, { t: "p", id, ...me.s });
      } else if (m.t === "c" && now - me.last > 800) {
        me.last = now; const text = tidy(clean(m.text, 80).trim()); if (text) this.cast(id, { t: "c", id, text }, true);
      } else if (m.t === "pm" && now - me.last > 800) {   // a private message to one player who is online
        me.last = now; const to = this.peers.get(+m.to), text = tidy(clean(m.text, 80).trim());
        if (to && text) { try { to.ws.send(JSON.stringify({ t: "pm", from: id, text })); server.send(JSON.stringify({ t: "pmOk", to: +m.to, text })); } catch {} }
      } else if (m.t === "car") {   // a car: taken (on) or left somewhere (off); one driver per car
        const i = Math.floor(+m.i); if (!(i >= 0 && i < 12)) return;
        const c = this.cars.get(i);
        if (m.on && c && c.by && c.by !== id && this.peers.has(c.by)) { server.send(JSON.stringify({ t: "carNo", i })); return; }
        const nc = { x: num(m.x), z: num(m.z), ry: num(m.ry), by: m.on ? id : 0 }; this.cars.set(i, nc);
        this.cast(id, { t: "car", i, ...nc }, true);
      } else if (m.t === "e") this.cast(id, { t: "e", id, e: clean(m.e, 4) });
    });
    const bye = () => {
      if (!this.peers.delete(id)) return;
      for (const [i, c] of this.cars) if (c.by === id) { c.by = 0; this.cast(id, { t: "car", i, ...c }); }   // a driver who left leaves the car where it stands
      this.cast(id, { t: "bye", id });
    };
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
    if (url.pathname.startsWith("/api/")) return env.ROOM.get(env.ROOM.idFromName("kampung")).fetch(req);
    return env.ASSETS ? env.ASSETS.fetch(req) : new Response("not found", { status: 404 });
  },
};
