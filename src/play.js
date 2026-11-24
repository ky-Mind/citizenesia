// What makes CITIZENESIA play like a phone game: cars you drive, things you pick up and carry in a bag, other players walking
// the same village live (online, through the Room on the server), chat and emotes over their heads, and a small map in the corner.
import * as THREE from "three";
import { mat, glossy, canTex, h2 } from "./kit.js";
import { baby, grow, walk } from "./actors.js";
import { president } from "./negara.js";
import { getLang } from "./i18n.js";

// ---------- words (Indonesian and English) ----------
const W = {
  id: { drive: "NAIK 🚗", exit: "TURUN", take: "AMBIL", bag: "TAS", use: "PAKAI", drop: "TARUH", empty: "Tas masih kosong. Cari barang di kampung (yang berkilau).",
    online: "ONLINE", offline: "OFFLINE", chat: "CHAT", send: "KIRIM", close: "TUTUP", rotate: "Putar HP-mu ke samping 📱↔️", rotateSub: "CITIZENESIA dimainkan dalam posisi landscape",
    joined: "{n} masuk kampung 👋", left: "{n} keluar kampung", gas: "GAS", brake: "REM", taken: "{i} masuk tas 🎒", dropped: "{i} ditaruh", full: "Tas penuh (12 barang)",
    lv: "LV", xp: "XP", prof: "PROFIL", code: "Kode pemain", move: "📲 PINDAH HP", moveHow: "Simpan kode rahasia ini. Di HP lain buka menu ☰ → PINDAH HP, lalu tempel kode ini. Jangan bagikan ke orang lain.", movePh: "Tempel kode CZ-…", moveGo: "MASUK", moveBad: "Kode tidak ditemukan", moveOk: "Berhasil! Memuat data…", cloud: "☁️ Tersimpan di server", cloudOff: "☁️ Belum tersimpan di server",
    stats: "Statistik", sWalk: "Jalan kaki", sDrive: "Menyetir", sJobs: "Kerja", sDeliv: "Paket diantar", sItems: "Barang diambil", sMis: "Misi selesai",
    mis: "🎯 Misi hari ini", misDone: "Misi selesai! +15 🪙 +50 XP", lvUp: "Naik level! Sekarang {t}", how: "CARA KERJA",
    job: "📦 ANTAR PAKET", jobGo: "Antar paket ke tanda 📦 di peta!", jobDone: "Paket sampai! +8 🪙 +30 XP", jobCancel: "BATAL ANTAR",
    titles: ["Warga Baru", "Warga Rajin", "Tetangga Teladan", "Tokoh Kampung", "Pejabat RT", "Pahlawan Citizenesia"],
    M: { makan: "Makan di Rumah Makan Rakyat", item: "Ambil 3 barang", drive: "Menyetir 300 m", work: "Kerja 2 kali", deliv: "Antar 2 paket", talk: "Ngobrol dengan Pak Presiden", gong: "Pukul gong", chat: "Kirim 1 chat", jajan: "Jajan di warung", walk: "Jalan kaki 200 m" },
    driveHint: "Joystick ke atas = gas, ke bawah = mundur, ke samping = belok", bump: "Duk! Nabrak 😅",
    quick: ["Halo semua! 👋", "Ayo ke Rumah Makan Rakyat 🍛", "Pak Presiden di mana?", "Siapa mau balapan? 🚗", "Mantap! 👍", "Sampai jumpa 👋"], chatPh: "Tulis pesan…" },
  en: { drive: "DRIVE 🚗", exit: "GET OUT", take: "TAKE", bag: "BAG", use: "USE", drop: "DROP", empty: "Your bag is empty. Look for things in the village (the shiny ones).",
    online: "ONLINE", offline: "OFFLINE", chat: "CHAT", send: "SEND", close: "CLOSE", rotate: "Turn your phone sideways 📱↔️", rotateSub: "CITIZENESIA is played in landscape",
    joined: "{n} joined the village 👋", left: "{n} left the village", gas: "GAS", brake: "BRAKE", taken: "{i} is in your bag 🎒", dropped: "{i} dropped", full: "Your bag is full (12 things)",
    lv: "LV", xp: "XP", prof: "PROFILE", code: "Player code", move: "📲 MOVE PHONE", moveHow: "Keep this secret code. On another phone open menu ☰ → MOVE PHONE and paste it. Don't share it.", movePh: "Paste code CZ-…", moveGo: "LOG IN", moveBad: "Code not found", moveOk: "Done! Loading your data…", cloud: "☁️ Saved on the server", cloudOff: "☁️ Not saved on the server yet",
    stats: "Stats", sWalk: "Walked", sDrive: "Driven", sJobs: "Jobs", sDeliv: "Parcels delivered", sItems: "Things picked up", sMis: "Missions done",
    mis: "🎯 Today's missions", misDone: "Mission done! +15 🪙 +50 XP", lvUp: "Level up! You are now {t}", how: "HOW IT WORKS",
    job: "📦 DELIVER", jobGo: "Take the parcel to the 📦 on the map!", jobDone: "Delivered! +8 🪙 +30 XP", jobCancel: "STOP DELIVERY",
    titles: ["Newcomer", "Hard Worker", "Model Neighbour", "Village Figure", "RT Official", "Hero of Citizenesia"],
    M: { makan: "Eat at the people's restaurant", item: "Pick up 3 things", drive: "Drive 300 m", work: "Work 2 times", deliv: "Deliver 2 parcels", talk: "Talk to Pak Presiden", gong: "Hit the gong", chat: "Send 1 chat", jajan: "Buy a snack at the warung", walk: "Walk 200 m" },
    driveHint: "Joystick up = gas, down = reverse, sideways = steer", bump: "Bonk! Crashed 😅",
    quick: ["Hi everyone! 👋", "Let's eat at the people's restaurant 🍛", "Where is Pak Presiden?", "Anyone up for a race? 🚗", "Nice! 👍", "See you 👋"], chatPh: "Write a message…" },
};
export const w9 = (k, v = {}) => { const s = (W[getLang()] || W.id)[k]; return typeof s === "string" ? s.replace(/\{(\w+)\}/g, (_, a) => v[a] ?? "") : s; };

// ---------- the things you can pick up ----------
export const ITEMS = {
  bakso: { e: "🍜", id: "Bakso", en: "Meatball soup", use: { id: "Nyam! Baksonya enak, tenaga penuh lagi.", en: "Yum! The soup is good, full of energy again." } },
  buku: { e: "📘", id: "Buku sekolah", en: "School book", use: { id: "Kamu membaca: \"Rakyat pintar, negara kuat.\"", en: "You read: \"Smart people, strong country.\"" } },
  bola: { e: "⚽", id: "Bola", en: "Ball", use: { id: "Kamu main bola sebentar. Gol! ⚽", en: "You play ball for a bit. Goal! ⚽" } },
  apel: { e: "🍎", id: "Apel", en: "Apple", use: { id: "Kriuk! Apelnya segar.", en: "Crunch! A fresh apple." } },
  bunga: { e: "🌼", id: "Bunga", en: "Flower", use: { id: "Bunganya harum. Cocok untuk Pak Presiden.", en: "It smells nice. A gift for Pak Presiden?" } },
  koin: { e: "🪙", id: "Koin Citizenesia", en: "Citizenesia coin", use: { id: "+5 🪙 KOIN CITIZENESIA", en: "+5 🪙 CITIZENESIA COINS" }, coins: 5 },
  kopi: { e: "☕", id: "Kopi", en: "Coffee", use: { id: "Seruput… melek lagi!", en: "Sip… wide awake!" } },
  payung: { e: "☂️", id: "Payung", en: "Umbrella", use: { id: "Kamu membuka payung. Siap kalau hujan.", en: "You open the umbrella. Ready for rain." } },
};
export const itemName = (k) => `${ITEMS[k].e} ${ITEMS[k][getLang()] || ITEMS[k].id}`;
function itemMesh(k) {
  const g = new THREE.Group(), C = { bakso: "#f4e4c8", buku: "#2f6fd1", bola: "#ffffff", apel: "#e0384b", bunga: "#ffd84a", koin: "#f2b51c", kopi: "#7a4a2a", payung: "#e83a7a" }[k];
  const m = glossy(C);
  if (k === "buku") g.add(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.42), m));
  else if (k === "koin") g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 20).rotateX(Math.PI / 2), m));
  else if (k === "bakso" || k === "kopi") g.add(new THREE.Mesh(new THREE.CylinderGeometry(k === "kopi" ? 0.1 : 0.2, 0.12, 0.16, 16), m));
  else if (k === "payung") { g.add(new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.16, 8).translate(0, 0.25, 0), m)); g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45), mat("#333"))); }
  else if (k === "bunga") { g.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), m)); g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3).translate(0, -0.15, 0), mat("#4a9a3a"))); }
  else g.add(new THREE.Mesh(new THREE.SphereGeometry(k === "bola" ? 0.17 : 0.13, 14, 10), m));
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.42, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#fff6b0", transparent: true, opacity: 0.7, depthWrite: false }));
  ring.position.y = -0.38; g.add(ring);
  return g;
}
// world items: a fixed scatter around the village (the same for everyone), taken ones come back after 5 minutes; plus what you dropped
export function createItems(scene, free, saved) {
  const list = [], kinds = Object.keys(ITEMS);
  let n = 0;
  for (let i = 0; n < 26 && i < 400; i++) {
    const a = h2(i, 7) * Math.PI * 2, r = 4 + h2(i, 13) * 30, x = Math.cos(a) * r, z = Math.sin(a) * r - 1;
    if (!free(x, z)) continue;
    list.push({ id: "w" + i, k: kinds[n % kinds.length], x, z }); n++;
  }
  (saved.dropped || []).forEach((d) => list.push({ ...d }));
  list.forEach((it) => { it.g = itemMesh(it.k); it.g.position.set(it.x, 0.45, it.z); scene.add(it.g); });
  const taken = saved.taken || {};
  return {
    list, taken,
    near(x, z, r = 1.3) { let best = null, bd = r; for (const it of list) { if (!it.g.visible) continue; const d = Math.hypot(it.x - x, it.z - z); if (d < bd) { bd = d; best = it; } } return best; },
    take(it) { it.g.visible = false; if (it.id[0] === "d") { list.splice(list.indexOf(it), 1); it.g.parent?.remove(it.g); } else taken[it.id] = Date.now(); },
    drop(k, x, z) { const it = { id: "d" + Date.now().toString(36), k, x, z, g: itemMesh(k) }; it.g.position.set(x, 0.45, z); scene.add(it.g); list.push(it); },
    update(t, y0 = 0) {
      const now = Date.now();
      for (const it of list) {
        if (it.id[0] === "w") { const v = !(taken[it.id] && now - taken[it.id] < 300000); if (!v !== !it.g.visible) it.g.visible = v; }
        it.g.position.y = 0.5 + Math.sin(t * 2.5 + it.x) * 0.08 + y0; it.g.rotation.y = t * 1.5 + it.z;
      }
    },
    save: () => ({ taken, dropped: list.filter((i) => i.id[0] === "d").map(({ id, k, x, z }) => ({ id, k, x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100 })) }),
  };
}

// ---------- cars ----------
export const CAR_COLOURS = ["#e0384b", "#2f6fd1", "#ffd84a", "#2fa04a", "#f2f2f2", "#e8a91c"];
export function makeCar(colour, plate = "CZ") {
  const g = new THREE.Group(), body = glossy(colour), dark = mat("#2a2a30", { roughness: 0.6 }), glass = mat("#9fd3ea", { roughness: 0.1, metalness: 0.2 });
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  add(new THREE.BoxGeometry(1.5, 0.5, 2.9), body, 0, 0.55, 0);
  add(new THREE.BoxGeometry(1.32, 0.48, 1.5), body, 0, 1.03, -0.15);
  add(new THREE.BoxGeometry(1.34, 0.36, 0.05), glass, 0, 1.05, 0.62).rotation.x = -0.35;
  add(new THREE.BoxGeometry(1.34, 0.34, 0.05), glass, 0, 1.05, -0.92).rotation.x = 0.35;
  [-1, 1].forEach((s) => add(new THREE.BoxGeometry(0.05, 0.3, 1.2), glass, s * 0.67, 1.05, -0.15));
  [-1, 1].forEach((s) => { add(new THREE.SphereGeometry(0.11, 10, 8), mat("#fff8c8", { emissive: "#fff3a0", emissiveIntensity: 0.6 }), s * 0.5, 0.6, 1.45); add(new THREE.BoxGeometry(0.22, 0.1, 0.04), mat("#e0384b", { emissive: "#a01020" }), s * 0.5, 0.62, -1.46); });
  add(new THREE.BoxGeometry(0.5, 0.16, 0.03), mat("#fffdf4", { map: canTex(160, 48, (c, w, h) => { c.fillStyle = "#fffdf4"; c.fillRect(0, 0, w, h); c.fillStyle = "#222"; c.font = "bold 34px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(plate, w / 2, h / 2 + 2); }) }), 0, 0.42, 1.46);
  const wheels = [];
  [[-0.72, 0.95], [0.72, 0.95], [-0.72, -0.95], [0.72, -0.95]].forEach(([x, z]) => {
    const wg = new THREE.Group(); wg.position.set(x, 0.32, z); g.add(wg);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.24, 16).rotateZ(Math.PI / 2), dark); t.castShadow = true; wg.add(t);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.26, 8).rotateZ(Math.PI / 2), mat("#d9d9d9")); wg.add(hub);
    wheels.push(wg);
  });
  return { g, wheels };
}
export function createCars(scene, free) {
  const cars = [], spots = [];
  for (let i = 0; spots.length < 5 && i < 600; i++) {
    const a = h2(i, 91) * Math.PI * 2, r = 9 + h2(i, 57) * 22, x = Math.cos(a) * r, z = Math.sin(a) * r - 1;
    if ([[0, 0], [1.6, 0], [-1.6, 0], [0, 2.2], [0, -2.2], [1.6, 2.2], [-1.6, -2.2]].every(([dx, dz]) => free(x + dx, z + dz)) && spots.every((s) => Math.hypot(s[0] - x, s[1] - z) > 6)) spots.push([x, z, a + Math.PI / 2]);
  }
  spots.forEach(([x, z, ry], i) => {
    const c = makeCar(CAR_COLOURS[i % CAR_COLOURS.length], "CZ " + (101 + i)); c.g.position.set(x, 0, z); c.g.rotation.y = ry; scene.add(c.g);
    cars.push({ ...c, i, x, z, ry, speed: 0, steer: 0, y: 0 });
  });
  return cars;
}
export const carBox = (c, m = 0) => {   // the ground footprint of a car (rotated, kept as a circle-ish box test on 3 points)
  const s = Math.sin(c.ry), co = Math.cos(c.ry);
  return [-1.05, 0, 1.05].map((k) => ({ x: c.x + s * k, z: c.z + co * k, r: 0.85 + m }));
};

// ---------- small text sprites over heads ----------
function textSprite(txt, bg = "#fffdf4", fg = "#3a2414") {
  const tex = canTex(512, 96, (c, w, h) => {
    c.font = "bold 44px Poppins, sans-serif"; let tw = Math.min(w - 20, c.measureText(txt).width + 40);
    c.fillStyle = bg; c.beginPath(); c.roundRect((w - tw) / 2, 6, tw, h - 12, 30); c.fill();
    c.fillStyle = fg; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, w / 2, h / 2 + 2, w - 40);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true })); s.scale.set(2.6, 0.49, 1); s.renderOrder = 10; return s;
}

// ---------- online: everyone in the same village ----------
export function createOnline(scene, { onCount, onLog, onBuilds }) {
  const others = new Map();
  let ws = null, me = null, up = false, tries = 0, sendT = 0, last = "";
  function connect() {
    try { ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/api/room"); } catch { return retry(); }
    ws.onopen = () => { up = true; tries = 0; last = ""; onCount(others.size + 1, true); };
    ws.onclose = () => { up = false; others.forEach((o) => scene.remove(o.root)); others.clear(); onCount(0, false); retry(); };
    ws.onerror = () => {};
    ws.onmessage = (e) => {
      let m; try { m = JSON.parse(e.data); } catch { return; }
      if (m.t === "welcome") { me = m.id; onBuilds && onBuilds(m.builds || [], true); m.all.forEach((p) => upsert(p.id, p, true)); onCount(others.size + 1, true); }
      else if (m.t === "p") { const fresh = !others.has(m.id); upsert(m.id, m); if (fresh) { onLog(w9("joined", { n: m.n })); onCount(others.size + 1, true); } }
      else if (m.t === "w") onBuilds && onBuilds([m], false);
      else if (m.t === "bye") { const o = others.get(m.id); if (o) { scene.remove(o.root); others.delete(m.id); onLog(w9("left", { n: o.s.n })); onCount(others.size + 1, true); } }
      else if (m.t === "c") { onLog(`${m.id === me ? "@" + "kamu" : others.get(m.id)?.s.n || "?"}: ${m.text}`, m.id === me); const o = others.get(m.id); if (o) bubble(o, m.text); }
      else if (m.t === "e") { const o = others.get(m.id); if (o) bubble(o, m.e, true); }
    };
  }
  function retry() { if (tries++ < 30) setTimeout(connect, Math.min(15000, 1000 * tries)); }
  function upsert(id, s, snap) {
    let o = others.get(id);
    if (!o) { o = { root: new THREE.Group(), s, sig: "", pos: new THREE.Vector3(s.x, s.y, s.z), f: s.f, bub: null, bubT: 0, car: null }; others.set(id, o); scene.add(o.root); snap = true; }
    o.s = s; o.root.visible = !s.in;
    const sig = s.k + "|" + s.n + "|" + JSON.stringify(s.l) + "|" + s.car;
    if (sig !== o.sig) {
      o.sig = sig; if (o.av) o.root.remove(o.av.g); if (o.car) o.root.remove(o.car.g); o.car = null;
      o.av = s.k === "president" ? president(s.n) : grow(baby(s.n, s.l || {}), 25); o.av.g.scale.setScalar(0.62); o.root.add(o.av.g);
      if (s.car != null) { o.car = makeCar(CAR_COLOURS[s.car % CAR_COLOURS.length], "CZ " + (101 + s.car)); o.root.add(o.car.g); o.av.g.visible = false; }
    }
    if (snap) { o.pos.set(s.x, s.y, s.z); o.f = s.f; }
  }
  function bubble(o, text, big) {
    if (o.bub) o.root.remove(o.bub);
    o.bub = big ? textSprite(text, "rgba(0,0,0,0)") : textSprite(text.length > 34 ? text.slice(0, 33) + "…" : text);
    if (big) o.bub.scale.set(3.2, 0.6, 1);
    o.bub.position.set(0, o.car ? 2.4 : 2.2, 0); o.root.add(o.bub); o.bubT = 4;
  }
  connect();
  return {
    get up() { return up; }, get count() { return others.size + 1; }, others,
    update(dt, t, state) {
      for (const o of others.values()) {
        const k = 1 - Math.exp(-dt * 10);
        const dx = o.s.x - o.pos.x, dz = o.s.z - o.pos.z;
        o.pos.x += dx * k; o.pos.y += (o.s.y - o.pos.y) * k; o.pos.z += dz * k;
        let df = o.s.f - o.f; df = Math.atan2(Math.sin(df), Math.cos(df)); o.f += df * k;
        o.root.position.copy(o.pos);
        if (o.car) { o.car.g.rotation.y = o.f; o.car.wheels.forEach((w) => (w.children[0].rotation.x += Math.hypot(dx, dz) * 3)); }
        else { o.av.g.rotation.y = o.f; walk(o.av, t, o.s.mv, 1); }
        if (o.bubT > 0) { o.bubT -= dt; if (o.bubT <= 0) { o.root.remove(o.bub); o.bub = null; } }
      }
      sendT -= dt;
      if (up && sendT <= 0 && state) {
        const msg = JSON.stringify({ t: "p", ...state });
        if (msg !== last || sendT < -2) { ws.send(msg); last = msg; sendT = 0.1; }
      }
    },
    chat(text) { if (up && text.trim()) ws.send(JSON.stringify({ t: "c", text })); },
    emote(e) { if (up) ws.send(JSON.stringify({ t: "e", e })); },
    solids() { return [...others.values()].filter((o) => o.car && o.root.visible).map((o) => ({ x: o.pos.x, z: o.pos.z, r: 1.3 })); },
  };
}

// ---------- the small map in the corner ----------
export function drawMap(cv, { player, facing, spots, cars, others, items, house, job }) {
  const c = cv.getContext("2d"), w = cv.width, h = cv.height, S = w / 70;   // 70 m across
  c.clearRect(0, 0, w, h); c.save();
  c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2); c.clip();
  c.fillStyle = "#a8d88a"; c.fillRect(0, 0, w, h);
  const P = (x, z) => [w / 2 + (x - player.x) * S, h / 2 + (z - player.z) * S];
  c.fillStyle = "#e8dcc0"; const [vx, vz] = P(0, -1); c.beginPath(); c.arc(vx, vz, 15 * S, 0, Math.PI * 2); c.fill();   // the village square
  c.fillStyle = "#d9694a"; for (const d of house) { const [x, y] = P(d.x, d.z); c.fillRect(x - 3, y - 3, 6, 6); }
  c.fillStyle = "#fff6b0"; for (const it of items) if (it.g.visible) { const [x, y] = P(it.x, it.z); c.fillRect(x - 1.5, y - 1.5, 3, 3); }
  for (const car of cars) { const [x, y] = P(car.x, car.z); c.fillStyle = CAR_COLOURS[car.i % CAR_COLOURS.length]; c.fillRect(x - 3, y - 4, 6, 8); }
  c.fillStyle = "#2f8be6"; for (const o of others.values()) { const [x, y] = P(o.pos.x, o.pos.z); c.beginPath(); c.arc(x, y, 3.5, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = "#ffd84a"; const pr = spots.president; { const [x, y] = P(pr.x, pr.z); c.font = "12px sans-serif"; c.textAlign = "center"; c.fillText("⭐", x, y + 4); }
  if (job) { let [x, y] = P(job.x, job.z); const d = Math.hypot(x - w / 2, y - h / 2), m = w / 2 - 10; if (d > m) { x = w / 2 + (x - w / 2) * m / d; y = h / 2 + (y - h / 2) * m / d; } c.font = "16px sans-serif"; c.textAlign = "center"; c.fillText("📦", x, y + 5); }
  c.restore();
  c.save(); c.translate(w / 2, h / 2); c.rotate(-facing + Math.PI); c.fillStyle = "#e0384b"; c.beginPath(); c.moveTo(0, -7); c.lineTo(5, 5); c.lineTo(-5, 5); c.closePath(); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 1.5; c.stroke(); c.restore();
  c.strokeStyle = "rgba(58,36,20,.6)"; c.lineWidth = 3; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2); c.stroke();
}
