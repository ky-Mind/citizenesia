// The villagers of Citizenesia (NPCs): each has a name, a job and a daily schedule on the shared Citizenesia clock
// (one day = 24 real minutes). Shopkeepers open their stall from 06:00 to 22:00; the others walk their rounds by day and go
// home at night. Where they are is worked out from the clock alone, so every player sees them in the same place.
import * as THREE from "three";
import { baby, grow, walk } from "./actors.js";
import { getLang } from "./i18n.js";

const L = (id, en) => ({ id, en });
const PEOPLE = [
  { name: "Bu Sri", look: { band: "#e83a7a" }, shirt: "#e8a91c", pants: "#8a4fd1", stay: "warung", off: [-0.6, -0.9],
    lines: [L("Jajan dulu, Nak! Bisa jual barang juga di sini.", "Grab a snack! You can sell things here too."), L("Warung buka jam enam pagi sampai jam sepuluh malam.", "The warung is open from six in the morning to ten at night.")] },
  { name: "Pak Udin", look: { cap: "#2f6fd1" }, shirt: "#fbfaf6", pants: "#22201f", stay: "bakso", off: [0.7, -0.8],
    lines: [L("Bakso panas! Tenagamu langsung penuh lagi.", "Hot meatball soup! Fills your energy right up."), L("Pak Presiden juga langganan di sini, lho.", "Even Pak Presiden eats here, you know.")] },
  { name: "Bu Guru Rina", look: { glasses: true }, shirt: "#2fa04a", pants: "#2f6fd1", route: ["sekolah", "rakyat", "kas", "sekolah"],
    lines: [L("Sekolah sudah dibuka, berkat komentar rakyat!", "The school is open, thanks to the people's comments!"), L("Baca buku sekolah, ilmunya berguna.", "Read the school book, it's useful.")] },
  { name: "Pak Joko", look: { stache: true, cap: "#e0384b" }, shirt: "#2f6fd1", pants: "#b88a5c", route: ["makan", "panggung", "rs", "kas", "warung"],
    lines: [L("Cari kerja? Ke panggung lowongan saja.", "Looking for work? Go to the job stage."), L("Kalau punya mobil, jadi Sopir Antar. Lumayan koinnya!", "Got a car? Be a delivery driver. Good coins!")] },
  { name: "Dedi", look: { cap: "#e8a91c" }, shirt: "#e0384b", pants: "#2f6fd1", age: 10, route: ["rakyat", "gong", "warung", "sekolah", "makan"],
    lines: [L("Kak, ayo pukul gongnya! GONG!", "Hey, hit the gong! GONG!"), L("Aku nabung koin buat beli rumah kecil.", "I'm saving coins for a small house.")] },
  { name: "Suster Ani", look: { band: "#fbfaf6" }, shirt: "#fbfaf6", pants: "#fbfaf6", route: ["rs", "makan", "rs", "president"],
    lines: [L("Jangan lupa makan, tenaga itu penting.", "Don't forget to eat, energy matters."), L("Rumah sakit buka untuk semua rakyat.", "The hospital is open to all the people.")] },
];
const SPEED = 1.3, PAUSE = 18;

export function createNPCs(scene, spots) {
  const list = PEOPLE.map((p, i) => {
    const a = grow(baby(p.name, p.look), p.age ?? 30, { shirt: p.shirt, pants: p.pants }); a.g.scale.setScalar(0.62); scene.add(a.g);
    let route = null, period = 0;
    if (p.route) {   // legs between the stops, then a pause at each stop
      route = p.route.map((k) => { const s = spots[k]; return new THREE.Vector2(s.x + Math.sin(i * 7) * 0.6, s.z + 0.6 + Math.cos(i * 5) * 0.4); });
      route.legs = route.map((pt, j) => pt.distanceTo(route[(j + 1) % route.length]) / SPEED);
      period = route.legs.reduce((s, l) => s + l + PAUSE, 0);
    }
    return { ...p, a, g: a.g, route, period, seed: i * 37.3 };
  });
  function place(n, nowS) {
    if (!n.route) { const s = spots[n.stay]; n.g.position.set(s.x + n.off[0], 0, s.z + n.off[1]); n.g.rotation.y = 0; return false; }
    let t = (nowS + n.seed) % n.period;
    for (let j = 0; j < n.route.length; j++) {
      const a = n.route[j], b = n.route[(j + 1) % n.route.length];
      if (t < PAUSE) { n.g.position.set(a.x, 0, a.y); return false; }
      t -= PAUSE;
      if (t < n.route.legs[j]) { const u = t / n.route.legs[j]; n.g.position.set(a.x + (b.x - a.x) * u, 0, a.y + (b.y - a.y) * u); n.g.rotation.y = Math.atan2(b.x - a.x, b.y - a.y); return true; }
      t -= n.route.legs[j];
    }
    return false;
  }
  return {
    list,
    update(dt, t, hour) {
      const open = hour >= 6 && hour < 22, nowS = Date.now() / 1000;
      for (const n of list) { n.g.visible = open; if (!open) continue; const moving = place(n, nowS); walk(n.a, t, moving, n.seed); }
    },
    near(x, z, r = 1.8) { let best = null, bd = r; for (const n of list) { if (!n.g.visible) continue; const d = Math.hypot(n.g.position.x - x, n.g.position.z - z); if (d < bd) { bd = d; best = n; } } return best && { ...best, line: (h) => { const l = best.lines[Math.floor(Date.now() / 6000) % best.lines.length]; return l[getLang()] || l.id; } }; },
  };
}
