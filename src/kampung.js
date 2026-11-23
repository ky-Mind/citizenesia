// The village of CITIZENESIA, copied from the world of the latest video episode (EP 009 "Sekolah Dibuka!"), so the game looks exactly
// like the reels: the alun-alun with the gapura, the president's podium and KURSI RAKYAT, the Rumah Makan Rakyat and its open kitchen,
// the Wapres chair, the debate stage, the Kas Negara hen, the 5-storey hospital, the school and the people from the comments.
// The episode script is kept as it is; the game calls renderAt() with a time after the end of the episode, so everything stands built
// and only the idle life (flags, steam, breathing, cheering) moves. Money is KOIN CITIZENESIA (toy coins), never rupiah.
import "./kampung-data.js";
import * as THREE from "three";
import { clamp, sm, lerp, hash, M, mat, glossy, signTex, liveSign, canTex, SKY } from "./kit.js";
import { baby, walk, grow, sit } from "./actors.js";

const TM = window.__TIMES, A = TM.at, W = 1080, H = 1920;
const camera = new THREE.PerspectiveCamera(46, W / H, 0.1, 400);

// ---------- the square: warm tropical light ----------
const scene = new THREE.Scene(); scene.background = new THREE.Color(SKY); scene.fog = new THREE.Fog("#d6ecf5", 40, 110);
scene.add(new THREE.HemisphereLight("#fff6e6", "#9fbf8a", 1.3));
const sun = new THREE.DirectionalLight("#ffeccc", 2.5); sun.position.set(9, 22, 12); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 70 }); sun.shadow.bias = -0.0004; sun.shadow.radius = 4;
scene.add(sun);
const paving = canTex(512, 512, (c, w, h) => {   // grey paving blocks, as on every alun-alun
  c.fillStyle = "#d9d2c4"; c.fillRect(0, 0, w, h);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { c.fillStyle = (x + y) % 3 ? "#cfc7b7" : "#c4bba9"; c.fillRect(x * 32 + 1 + (y % 2) * 16, y * 32 + 1, 30, 30); }
});
paving.wrapS = paving.wrapT = THREE.RepeatWrapping; paving.repeat.set(5, 5);
M(new THREE.CylinderGeometry(8.5, 8.5, 0.06, 48), mat("#fff", { map: paving }), 0, 0.03, -1, scene);
M(new THREE.CylinderGeometry(1.6, 1.6, 0.08, 32), mat("#b8a98f"), 0, 0.05, 1.2, scene);

// tile-roofed kampung houses
function house(x, z, wall, ry, door = "#6b4a33") {
  const h = new THREE.Group(); h.position.set(x, 0, z); h.rotation.y = ry; scene.add(h);
  M(new THREE.BoxGeometry(2.4, 1.7, 1.9), mat(wall), 0, 0.85, 0, h);
  [-1, 1].forEach((k) => { const r = M(new THREE.BoxGeometry(2.8, 0.1, 1.45), mat("#c0532f"), 0, 2.05, k * 0.55, h); r.rotation.x = k * 0.62; });
  const gable = new THREE.Shape(); gable.moveTo(-0.95, 0); gable.lineTo(0.95, 0); gable.lineTo(0, 0.68);
  [-1.2, 1.2].forEach((xx) => { const g = M(new THREE.ShapeGeometry(gable), mat(wall, { side: THREE.DoubleSide }), xx, 1.7, 0, h); g.rotation.y = Math.PI / 2; });
  M(new THREE.BoxGeometry(0.5, 0.85, 0.05), mat(door), -0.4, 0.43, 0.96, h);
  M(new THREE.BoxGeometry(0.5, 0.42, 0.05), mat("#3a4a5a"), 0.5, 1.1, 0.96, h);
  M(new THREE.BoxGeometry(2.6, 0.08, 0.7), mat("#8a5a3a"), 0, 1.5, 1.25, h);   // teras roof
  [-1.15, 1.15].forEach((px) => M(new THREE.BoxGeometry(0.08, 1.5, 0.08), mat("#8a5a3a"), px, 0.75, 1.55, h));
}
[[-9, -9, "#f6e6c4", 0.6], [-4, -12.5, "#d9ecd1", 0.15], [4, -12.5, "#f7d9d9", -0.15], [9, -9.5, "#dfe7f6", -0.6],
 [-12.5, -2, "#f3e7b8", 1.2], [12.5, -2.5, "#e9e2f4", -1.2], [-13, 6, "#f6e6c4", 1.9], [13, 6, "#d9ecd1", -1.9]].forEach((a) => house(...a));

// trees: round shade trees, coconut palms, banana plants
function palm(x, z, s = 1, seed = 0) {
  const t = new THREE.Group(); t.position.set(x, 0, z); t.scale.setScalar(s); scene.add(t);
  let px = 0, py = 0;
  for (let i = 0; i < 7; i++) { const seg = M(new THREE.CylinderGeometry(0.13, 0.16, 0.7, 8), mat("#9a7a55"), px, py + 0.35, 0, t); seg.rotation.z = -0.06 * i; px += Math.sin(0.06 * i) * 0.7; py += 0.68; }
  const top = new THREE.Group(); top.position.set(px, py, 0); t.add(top);
  for (let k = 0; k < 7; k++) { const lf = M(new THREE.ConeGeometry(0.28, 2.1, 4), mat(k % 2 ? "#4f9a3f" : "#5fae48"), 0, 0, 0, top); lf.rotation.set(0, k / 7 * Math.PI * 2 + seed, 0); lf.rotateZ(-1.9); lf.translateY(0.95); lf.scale.set(1, 1, 0.25); }
  [0, 1, 2].forEach((k) => M(new THREE.SphereGeometry(0.14, 8, 6), mat("#7a5a2a"), Math.cos(k * 2.1) * 0.18, -0.15, Math.sin(k * 2.1) * 0.18, top));
}
function banana(x, z, seed = 0) {
  const t = new THREE.Group(); t.position.set(x, 0, z); scene.add(t);
  M(new THREE.CylinderGeometry(0.14, 0.18, 1.6, 8), mat("#8fae5a"), 0, 0.8, 0, t);
  for (let k = 0; k < 6; k++) { const lf = M(new THREE.BoxGeometry(0.5, 0.02, 1.6), mat(k % 2 ? "#6fbf4a" : "#5aa83c"), 0, 1.6, 0, t); lf.rotation.y = k / 6 * Math.PI * 2 + seed; lf.rotateX(-0.5); lf.translateZ(0.7); }
}
for (let i = 0; i < 40; i++) {
  const a = i / 40 * Math.PI * 2, r = 17 + hash(i) * 9, x = Math.cos(a) * r, z = Math.sin(a) * r - 2;
  if (i % 3 === 0) { palm(x, z, 0.9 + hash(i + 3) * 0.3, i); continue; }
  if (i % 3 === 1) { banana(x, z, i); continue; }
  const tr = new THREE.Group(); tr.position.set(x, 0, z); scene.add(tr);
  M(new THREE.CylinderGeometry(0.12, 0.16, 0.9, 8), mat("#8a5a3a"), 0, 0.45, 0, tr);
  M(new THREE.SphereGeometry(0.8 + hash(i + 7) * 0.35, 14, 10), mat(i % 2 ? "#5f9f4c" : "#73b55b"), 0, 1.4, 0, tr);
}
[[-9.5, 1.5], [9.5, 1.5], [-14.5, 8.5], [8.4, 6.6]].forEach(([x, z], i) => palm(x, z, 1.05, i));
// the twin banyan trees of the alun-alun, behind the gapura
function beringin(x, z) {
  const t = new THREE.Group(); t.position.set(x, 0, z); scene.add(t);
  M(new THREE.CylinderGeometry(0.45, 0.7, 2.6, 12), mat("#7a5a3e"), 0, 1.3, 0, t);
  [[0, 3.6, 0, 2.3], [-1.6, 3.1, 0.4, 1.6], [1.7, 3.2, -0.3, 1.7], [0.3, 4.6, -0.4, 1.7], [-0.8, 3.4, 1.4, 1.4], [1, 3.3, 1.2, 1.4]]
    .forEach(([a, b, c, r], i) => M(new THREE.SphereGeometry(r, 16, 12), mat(i % 2 ? "#3f7f3a" : "#4c8f42"), a, b, c, t));
  for (let k = 0; k < 10; k++) { const ang = k / 10 * Math.PI * 2; M(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 4), mat("#6b5a3e"), Math.cos(ang) * 1.5, 1.6, Math.sin(ang) * 1.5, t); }   // hanging aerial roots
}
beringin(-6.5, -10.5); beringin(6.5, -10.5);

// gapura: red-and-white gate with a welcome sign
const gap = new THREE.Group(); gap.position.set(0, 0, -8.6); scene.add(gap);
const stripe = canTex(64, 256, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#fbfaf6" : "#d8263a"; c.fillRect(0, i * 32, w, 32); } });
[-3, 3].forEach((x) => { M(new THREE.BoxGeometry(0.7, 4.2, 0.7), mat("#fff", { map: stripe }), x, 2.1, 0, gap); M(new THREE.BoxGeometry(0.95, 0.35, 0.95), mat("#e8c45a"), x, 4.35, 0, gap); M(new THREE.ConeGeometry(0.45, 0.7, 4), mat("#e8c45a"), x, 4.85, 0, gap).rotation.y = Math.PI / 4; });
const gapSign = M(new THREE.BoxGeometry(5.6, 0.95, 0.2), mat("#fff"), 0, 3.7, 0, gap);

// red-and-white bunting and umbul-umbul around the square
const flagMat = [mat("#d8263a", { side: THREE.DoubleSide }), mat("#fbfaf6", { side: THREE.DoubleSide })];
const flagGeo = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([-0.16, 0, 0, 0.16, 0, 0, 0, -0.36, 0], 3)); flagGeo.computeVertexNormals();
const buntings = [];
function bunting(a, b, sag = 0.6) {
  const n = Math.round(Math.hypot(b[0] - a[0], b[2] - a[2]) / 0.42), pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n; pts.push(new THREE.Vector3(lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * sag, lerp(a[2], b[2], u))); }
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: "#5a4a3a" })); scene.add(line);
  const ang = Math.atan2(b[2] - a[2], b[0] - a[0]);
  pts.slice(1, -1).forEach((p, i) => { const f = new THREE.Mesh(flagGeo, flagMat[i % 2]); f.position.copy(p); f.rotation.y = -ang; scene.add(f); buntings.push({ f, i: buntings.length }); });
}
const POLES = [[-7.5, -5.5], [-2.6, -7.4], [2.6, -7.4], [7.5, -5.5], [8.6, -0.5], [-8.6, -0.5]];
POLES.forEach(([x, z]) => M(new THREE.CylinderGeometry(0.06, 0.08, 5.6, 8), mat("#c9a66b"), x, 2.8, z, scene));
const PP = POLES.map(([x, z]) => [x, 5.5, z]);
bunting(PP[5], PP[0]); bunting(PP[0], PP[1]); bunting(PP[1], PP[2], 0.4); bunting(PP[2], PP[3]); bunting(PP[3], PP[4]);
bunting(PP[1], [0, 4.6, -2.4], 0.3); bunting(PP[2], [0, 4.6, -2.4], 0.3);
const umbul = [];
[[-9.6, -4], [-10, 0.5], [-9.6, 4.5], [9.6, -4], [10, 0.5], [9.6, 4.5]].forEach(([x, z], i) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  M(new THREE.CylinderGeometry(0.05, 0.08, 6.2, 8), mat("#c9a66b"), 0, 3.1, 0, g);
  const cols = [["#d8263a", "#fbfaf6"], ["#e8c45a", "#2f6b4f"], ["#2f6fd1", "#fbfaf6"]][i % 3];
  const tex = canTex(64, 512, (c, w, h) => { c.fillStyle = cols[0]; c.fillRect(0, 0, w, h); c.fillStyle = cols[1]; c.fillRect(w * 0.6, 0, w * 0.4, h); for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(0, h - k * 18); c.lineTo(w, h - k * 18 - 30); c.lineTo(w, h - k * 18 - 22); c.lineTo(0, h - k * 18 + 8); c.fill(); } });
  const banner = M(new THREE.PlaneGeometry(0.55, 3.6, 1, 10), mat("#fff", { map: tex, side: THREE.DoubleSide }), 0.3, 4.1, 0, g);
  umbul.push({ banner, base: banner.geometry.attributes.position.array.slice(), i });
});

// power poles with sagging cables, behind the houses on the left and right
function cable(a, b, sag = 0.5) {
  const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push(new THREE.Vector3(lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * sag, lerp(a[2], b[2], u))); }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: "#2a2a2a" })));
}
const TL = [[-15, 10], [-15.5, 0], [-15, -9], [-9, -15], [0, -16], [9, -15], [15, -9], [15.5, 0], [15, 10]];
TL.forEach(([x, z]) => { M(new THREE.CylinderGeometry(0.1, 0.14, 7, 8), mat("#b9b4aa"), x, 3.5, z, scene); M(new THREE.BoxGeometry(1.4, 0.1, 0.1), mat("#5a5550"), x, 6.6, z, scene).rotation.y = Math.atan2(-x, -z); });
for (let i = 0; i < TL.length - 1; i++) for (const dy of [6.65, 6.3, 6.0]) cable([TL[i][0], dy, TL[i][1]], [TL[i + 1][0], dy, TL[i + 1][1]], 0.5 + (dy - 6) * 0.3);

// warung 24 jam and the bakso cart
const war = new THREE.Group(); war.position.set(-7.4, 0, -4.2); war.rotation.y = 0.75; scene.add(war);
M(new THREE.BoxGeometry(2.6, 2.2, 1.6), mat("#f2ead8"), 0, 1.1, -0.3, war);
M(new THREE.BoxGeometry(2.6, 1.0, 0.5), mat("#8a5a3a"), 0, 0.5, 0.65, war);
const awning = canTex(256, 64, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#fbfaf6" : "#2f6fd1"; c.fillRect(i * 32, 0, 32, h); } });
const aw = M(new THREE.BoxGeometry(2.9, 0.06, 1.2), mat("#fff", { map: awning }), 0, 2.15, 0.85, war); aw.rotation.x = 0.28;
for (let k = 0; k < 7; k++) M(new THREE.BoxGeometry(0.16, 0.7, 0.02), mat(["#e0384b", "#ffd84a", "#2fa04a", "#e8742a", "#8a4fd1", "#2f6fd1", "#e83a7a"][k]), -1.1 + k * 0.36, 1.6, 1.25, war);   // hanging sachet strips
for (let k = 0; k < 3; k++) { M(new THREE.CylinderGeometry(0.17, 0.17, 0.42, 14), mat("#cfe8f5", { transparent: true, opacity: 0.6 }), -0.8 + k * 0.8, 1.21, 0.65, war); M(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 14), mat("#e0384b"), -0.8 + k * 0.8, 1.45, 0.65, war); }   // kerupuk jars
const warSign = M(new THREE.BoxGeometry(2.4, 0.5, 0.08), mat("#fff"), 0, 2.55, 0.52, war);
const bak = new THREE.Group(); bak.position.set(9.4, 0, -6.6); bak.rotation.y = -0.8; scene.add(bak);
M(new THREE.BoxGeometry(1.6, 0.7, 0.8), mat("#2f6fd1"), 0, 0.85, 0, bak);
M(new THREE.BoxGeometry(1.6, 0.5, 0.8), mat("#cfe8f5", { transparent: true, opacity: 0.5 }), 0, 1.45, 0, bak);
M(new THREE.BoxGeometry(1.7, 0.06, 0.9), mat("#e0384b"), 0, 1.72, 0, bak);
[-0.55, 0.55].forEach((x) => { const w = M(new THREE.TorusGeometry(0.3, 0.06, 8, 18), mat("#3a3a3a"), x, 0.32, 0.45, bak); });
M(new THREE.CylinderGeometry(0.28, 0.26, 0.4, 16), mat("#c9c9c9", { metalness: 0.6, roughness: 0.3 }), 0.45, 1.95, 0, bak);
const bakSign = M(new THREE.BoxGeometry(1.4, 0.36, 0.04), mat("#fff"), 0, 0.85, 0.42, bak);
M(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 6), mat("#888"), -0.6, 2.4, 0, bak);
M(new THREE.ConeGeometry(1.2, 0.5, 8, 1, true), mat("#e8c45a", { side: THREE.DoubleSide }), -0.6, 3.3, 0, bak);
const bakSteam = Array.from({ length: 4 }, () => M(new THREE.SphereGeometry(0.12, 8, 6), mat("#ffffff", { transparent: true, opacity: 0.7 }), 0, 0, 0, bak));

// ---------- signs ----------
const rakyatSign = liveSign(512, 320, (c, w, h, v) => {
  c.fillStyle = "#fffaf0"; c.fillRect(0, 0, w, h); c.fillStyle = "#2f6b4f"; c.fillRect(0, 0, w, 84);
  c.fillStyle = "#fff"; c.font = "900 60px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("RAKYAT", w / 2, 46);
  const n = v.num || 0; c.fillStyle = v.hot ? "#e0384b" : "#2f6b4f"; c.font = `900 ${n >= 100 ? 150 : 180}px 'Archivo Black'`; c.fillText(String(n), w / 2, 200);
  c.font = "700 26px Poppins"; c.fillStyle = "#8a7a66"; c.fillText("1 follow = 1 rakyat", w / 2, 292);
});
const lotSign = liveSign(512, 300, (c, w, h) => {
  c.fillStyle = "#fffdf4"; c.fillRect(0, 0, w, h); c.fillStyle = "#e8a91c"; c.fillRect(0, 0, w, 80);
  c.fillStyle = "#3a2414"; c.font = "900 50px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("TANAH KOSONG", w / 2, 42);
  c.font = "700 30px Poppins"; c.fillText("akan dibangun sesuai", w / 2, 150); c.fillText("komen terbanyak", w / 2, 195);
  c.font = "900 64px 'Archivo Black'"; c.fillStyle = "#e0384b"; c.fillText("?", w / 2, 262);
});
const chairTag = liveSign(256, 128, (c, w, h) => {
  c.fillStyle = "#fffdf4"; c.fillRect(0, 0, w, h); c.strokeStyle = "#e0384b"; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8);
  c.fillStyle = "#3a2414"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "700 26px Poppins"; c.fillText("KURSI", w / 2, 38); c.font = "900 40px 'Archivo Black'"; c.fillText("RAKYAT 001", w / 2, 86);
});
function board(x, z, ry, tex, w, hgt) {
  const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = ry; scene.add(b);
  [-w / 2 + 0.2, w / 2 - 0.2].forEach((px) => M(new THREE.CylinderGeometry(0.08, 0.08, 3.6, 8), mat("#fff", { map: stripe }), px, 1.8, 0, b));
  M(new THREE.BoxGeometry(w, hgt, 0.1), mat("#fff", { map: tex }), 0, 3.6 - hgt / 2 + 0.1, 0.06, b);
  return b;
}
const POP = { x: -3.7, z: -1.0, ry: 0.35 };
board(POP.x, POP.z, POP.ry, rakyatSign.tex, 2.9, 1.82);

// ---------- the president's podium, rows of empty plastic chairs, a bench ----------
const pod = new THREE.Group(); pod.position.set(0, 0, -1.6); scene.add(pod);
M(new THREE.BoxGeometry(1.2, 1.15, 0.6), mat("#fff", { map: stripe }), 0, 0.58, 0, pod);
M(new THREE.BoxGeometry(1.3, 0.08, 0.7), mat("#8a5a3a"), 0, 1.19, 0, pod);
const mic = new THREE.Group(); mic.position.set(0, 1.2, -0.05); pod.add(mic);
M(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6), mat("#333"), 0, 0.22, 0, mic).rotation.x = -0.4;
M(new THREE.SphereGeometry(0.05, 10, 8), mat("#222"), 0, 0.42, -0.1, mic);
M(new THREE.BoxGeometry(5.4, 0.12, 2.4), mat("#b5562a"), 0, 0.06, -2.0, scene);   // a small stage carpet
const chairs = [];
const CC = ["#e0384b", "#2fa04a", "#2f6fd1"];
for (let r = 0; r < 4; r++) for (let k = 0; k < 7; k++) {
  const ch = new THREE.Group(); ch.position.set(-2.4 + k * 0.8 + (r % 2) * 0.05, 0, 1.2 + r * 1.0); ch.rotation.y = Math.PI + (hash(r * 7 + k) - 0.5) * 0.12; scene.add(ch);
  const c = CC[(r + k) % 3];
  M(new THREE.BoxGeometry(0.5, 0.05, 0.5), mat(c), 0, 0.45, 0, ch); M(new THREE.BoxGeometry(0.5, 0.5, 0.05), mat(c), 0, 0.7, -0.24, ch);
  [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([x, z]) => M(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 6), mat(c), x, 0.22, z, ch));
  chairs.push({ ch, r, k });
}
const first = chairs.find((c) => c.r === 0 && c.k === 3).ch;   // the front-row centre chair: KURSI RAKYAT 001
const tag = M(new THREE.PlaneGeometry(0.42, 0.21), mat("#fff", { map: chairTag.tex, side: THREE.DoubleSide }), 0, 0.72, -0.27, first); tag.rotation.y = Math.PI;
const glow = M(new THREE.CylinderGeometry(0.42, 0.42, 0.02, 32), new THREE.MeshBasicMaterial({ color: "#ffe9a8", transparent: true, opacity: 0 }), 0, 0.012, 0, first);
const bench = new THREE.Group(); bench.position.set(2.7, 0, 0.1); scene.add(bench);
M(new THREE.BoxGeometry(1.5, 0.08, 0.45), mat("#8a5a3a"), 0, 0.45, 0, bench); M(new THREE.BoxGeometry(1.5, 0.4, 0.06), mat("#8a5a3a"), 0, 0.72, -0.22, bench);
[-0.65, 0.65].forEach((x) => M(new THREE.BoxGeometry(0.08, 0.45, 0.4), mat("#5a3a22"), x, 0.22, 0, bench));
// the empty plot: stakes, a sagging rope, a sign, and ghosts of what the comments might build
const LOT = { x: 5.4, z: -1.6 };
const lot = new THREE.Group(); lot.position.set(LOT.x, 0, LOT.z); scene.add(lot);
M(new THREE.BoxGeometry(3.2, 0.02, 3.0), mat("#c9b48a"), 0, 0.04, 0, lot);
[[-1.5, -1.4], [1.5, -1.4], [1.5, 1.4], [-1.5, 1.4]].forEach(([x, z]) => M(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), mat("#8a5a3a"), x, 0.3, z, lot));
[[[-1.5, -1.4], [1.5, -1.4]], [[1.5, -1.4], [1.5, 1.4]], [[1.5, 1.4], [-1.5, 1.4]], [[-1.5, 1.4], [-1.5, -1.4]]].forEach(([a, b]) => {
  const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push(new THREE.Vector3(lerp(a[0], b[0], u), 0.55 - Math.sin(u * Math.PI) * 0.08, lerp(a[1], b[1], u))); }
  lot.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: "#e0384b" })));
});
const lotBoard = new THREE.Group(); lotBoard.position.set(1.35, 0, 1.75); lotBoard.rotation.y = -0.55; lot.add(lotBoard);
[-0.55, 0.55].forEach((x) => M(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), mat("#8a5a3a"), x, 0.7, 0, lotBoard));
M(new THREE.BoxGeometry(1.4, 0.82, 0.05), mat("#fff", { map: lotSign.tex }), 0, 1.35, 0.03, lotBoard);
const ghostMat = new THREE.MeshStandardMaterial({ color: "#bfe3ff", transparent: true, opacity: 0.62, emissive: "#6fb6ff", emissiveIntensity: 0.6, depthWrite: false });
const ghosts = [
  (() => { const g = new THREE.Group(); M(new THREE.BoxGeometry(2, 1.4, 1.8), ghostMat, 0, 0.7, 0, g); const r = M(new THREE.ConeGeometry(1.6, 1, 4), ghostMat, 0, 1.9, 0, g); r.rotation.y = Math.PI / 4; return g; })(),   // a house
  (() => { const g = new THREE.Group(); M(new THREE.BoxGeometry(2.4, 0.5, 1.6), ghostMat, 0, 0.25, 0, g); [-1.1, 1.1].forEach((x) => M(new THREE.CylinderGeometry(0.05, 0.05, 2, 6), ghostMat, x, 1.25, -0.7, g)); M(new THREE.BoxGeometry(2.4, 0.4, 0.05), ghostMat, 0, 2.1, -0.7, g); return g; })(),   // a stage
  (() => { const g = new THREE.Group(); [-1.1, 1.1].forEach((x) => M(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 6), ghostMat, x, 0.65, 0, g)); M(new THREE.CylinderGeometry(0.06, 0.06, 2.3, 6), ghostMat, 0, 1.3, 0, g).rotation.z = Math.PI / 2; return g; })(),   // a goal
  (() => { const g = new THREE.Group(); M(new THREE.CylinderGeometry(0.35, 0.45, 2.2, 16), ghostMat, 0, 1.3, 0, g); M(new THREE.ConeGeometry(0.35, 0.7, 16), ghostMat, 0, 2.75, 0, g); [0, 2.1, 4.2].forEach((a) => { const f = M(new THREE.BoxGeometry(0.05, 0.6, 0.4), ghostMat, Math.cos(a) * 0.45, 0.4, Math.sin(a) * 0.45, g); f.rotation.y = -a; }); return g; })(),   // a rocket
];
ghosts.forEach((g) => { g.traverse((m) => m.isMesh && (m.castShadow = false)); g.visible = false; lot.add(g); });
// a dry leaf tumbling across the empty chairs
const leaf = M(new THREE.PlaneGeometry(0.22, 0.12), mat("#b98a3a", { side: THREE.DoubleSide }), 0, 0, 0, scene);

// ---------- EP 002: the people (126 followers), the Rumah Makan Rakyat built on the plot ----------
const SKIN = ["#f1c9a0", "#e0b088", "#c99572", "#a87554"], SHIRT = ["#e0384b", "#2f6fd1", "#2fa04a", "#ffd84a", "#e8742a", "#8a4fd1", "#ff7eb6", "#20b2aa", "#fbfaf6", "#5aa83c"];
function citizen(i) {   // a small round-headed villager: shirt, legs, arms on shoulder pivots, hair or a hijab
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const sk = mat(SKIN[Math.floor(hash(i + 3) * 4)]), sh = mat(SHIRT[i % SHIRT.length]);
  M(new THREE.CylinderGeometry(0.16, 0.2, 0.5, 12), sh, 0, 0.6, 0, body);
  const legs = [-1, 1].map((k) => { const l = new THREE.Group(); l.position.set(k * 0.08, 0.36, 0); body.add(l); M(new THREE.CylinderGeometry(0.065, 0.065, 0.34, 8), mat(hash(i + 11) < 0.5 ? "#3a3a48" : "#5a4632"), 0, -0.17, 0, l); return l; });
  M(new THREE.SphereGeometry(0.19, 16, 12), sk, 0, 1.03, 0, body);
  const hijab = i % 5 === 2;
  const hair = M(new THREE.SphereGeometry(hijab ? 0.205 : 0.195, 16, 10, 0, Math.PI * 2, 0, Math.PI * (hijab ? 0.6 : 0.5)), mat(hijab ? ["#e98fb0", "#7fb8e0", "#f0d27a", "#9fd39a"][i % 4] : "#231e1b"), 0, hijab ? 1.01 : 1.05, -0.01, body);
  if (hijab) { hair.scale.set(1.05, 1.05, 1.1); M(new THREE.CylinderGeometry(0.2, 0.24, 0.16, 16), hair.material, 0, 0.86, -0.02, body); }
  [-1, 1].forEach((k) => M(new THREE.SphereGeometry(0.026, 8, 6), mat("#1a1414"), k * 0.065, 1.05, 0.172, body));
  M(new THREE.TorusGeometry(0.045, 0.012, 6, 12, Math.PI), mat("#7a2a2a"), 0, 0.98, 0.18, body).rotation.z = Math.PI;
  const arms = [-1, 1].map((k) => { const a = new THREE.Group(); a.position.set(k * 0.19, 0.8, 0); body.add(a); M(new THREE.CapsuleGeometry(0.05, 0.26, 4, 8), sk, 0, -0.16, 0, a); a.rotation.z = k * 0.35; return a; });
  g.traverse((m) => m.isMesh && (m.castShadow = true));
  g.userData = { body, arms, legs, i };
  return g;
}
const crowd = [];   // seated on the plastic chairs, then a standing crowd behind and beside the rows
chairs.forEach(({ ch, r, k }, n) => {
  const c = citizen(n), cx = ch.position.x, cz = ch.position.z, ax = cx + 0.4;   // walk in down the aisle beside the column, step into the chair
  c.userData.path = [[ax, 10.5 + hash(n + 2) * 1.5], [ax, cz], [cx, cz]]; c.userData.sitFace = Math.PI + (hash(n) - 0.5) * 0.3;
  c.userData.seated = true; scene.add(c); crowd.push(c);
});
for (let n = 0; n < 46; n++) {
  let x, z;
  if (n < 22) { x = -3.0 + (n % 11) * 0.6 + (hash(n + 40) - 0.5) * 0.25; z = 5.4 + Math.floor(n / 11) * 0.7 + (hash(n + 41) - 0.5) * 0.2; }
  else if (n < 34) { const m = n - 22; x = -3.4 - (m % 2) * 0.6; z = 1.0 + Math.floor(m / 2) * 0.75; }
  else { const m = n - 34; x = 3.2 + (m % 2) * 0.55; z = 1.6 + Math.floor(m / 2) * 0.7; }
  const c = citizen(28 + n); c.userData.sitFace = Math.atan2(0 - x, -1.6 - z) + (hash(n + 7) - 0.5) * 0.4;
  c.userData.path = n < 22 ? [[x, 11 + hash(n + 3) * 2], [x, z]] : n < 34 ? [[-11 - hash(n + 3) * 2, z], [x, z]] : [[11 + hash(n + 3) * 2, z], [x, z]];
  scene.add(c); crowd.push(c);
}
// when each one sets off (seated first, the standing crowd a little later), how long the walk takes at a brisk run
crowd.forEach((c, n) => {
  const ud = c.userData, P = ud.path; let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
  ud.len = L; ud.go = (ud.seated ? 0 : 0.7) + hash(n + 90) * 1.1; ud.dur = L / 4.6;
  c.position.set(P[0][0], 0, P[0][1]);
});
function along(P, d) {   // the point at distance d along a polyline, and the heading there
  for (let i = 1; i < P.length; i++) { const sl = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); if (d <= sl || i === P.length - 1) { const u = sl ? clamp(d / sl) : 1; return { x: lerp(P[i - 1][0], P[i][0], u), z: lerp(P[i - 1][1], P[i][1], u), h: Math.atan2(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]) }; } d -= sl; }
}
// the queue with empty plates outside the rumah makan
const queue = Array.from({ length: 7 }, (_, n) => {
  const c = citizen(80 + n); c.userData.spot = [8.85 + (hash(n + 60) - 0.5) * 0.1, 0.95 + n * 0.55]; c.userData.from = [12.5, 0.95 + n * 0.55];
  const plate = M(new THREE.CylinderGeometry(0.13, 0.11, 0.025, 18), mat("#fbfaf6", { roughness: 0.3 }), 0, 0.72, 0.24, c.userData.body);
  c.userData.arms.forEach((a, k) => (a.rotation.set(-1.1, 0, (k ? 1 : -1) * 0.25)));
  c.visible = false; scene.add(c); return c;
});
// the restaurant, built in three beats on "palu, semen, genteng"
const rm = new THREE.Group(); rm.position.set(LOT.x, 0, LOT.z); scene.add(rm);
const slab = new THREE.Group(); rm.add(slab); M(new THREE.BoxGeometry(3.0, 0.16, 2.6), mat("#c7bba4"), 0, 0.08, 0, slab);
const tileTex = canTex(256, 256, (c, w, h) => { c.fillStyle = "#e9dcc3"; c.fillRect(0, 0, w, h); c.strokeStyle = "#cbb894"; c.lineWidth = 4; for (let k = 0; k <= 8; k++) { c.beginPath(); c.moveTo(k * 32, 0); c.lineTo(k * 32, h); c.stroke(); c.beginPath(); c.moveTo(0, k * 32); c.lineTo(w, k * 32); c.stroke(); } });
tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping; tileTex.repeat.set(3, 3);
M(new THREE.BoxGeometry(2.9, 0.02, 2.5), mat("#fff", { map: tileTex }), 0, 0.17, 0, slab);
const walls = new THREE.Group(); rm.add(walls);
const wallM = mat("#f4e3c1"), woodM = mat("#8a5a3a");
M(new THREE.BoxGeometry(3.0, 2.0, 0.12), wallM, 0, 1.16, -1.24, walls);
[-1, 1].forEach((k) => M(new THREE.BoxGeometry(0.12, 2.0, 2.6), wallM, k * 1.44, 1.16, 0, walls));
[-1, 1].forEach((k) => M(new THREE.BoxGeometry(0.14, 2.0, 0.14), woodM, k * 1.44, 1.16, 1.27, walls));
M(new THREE.BoxGeometry(1.5, 0.75, 0.14), woodM, -0.72, 0.55, 1.24, walls);   // a low wooden front counter, the right half open as the door
M(new THREE.BoxGeometry(3.0, 0.16, 0.16), woodM, 0, 2.12, 1.27, walls);
const roof = new THREE.Group(); rm.add(roof);
const gentengTex = canTex(256, 256, (c, w, h) => { c.fillStyle = "#c0532f"; c.fillRect(0, 0, w, h); c.fillStyle = "#a8441f"; for (let y = 0; y < 8; y++) c.fillRect(0, y * 32 + 26, w, 6); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = "rgba(255,200,160,.15)"; c.fillRect(x * 32 + (y % 2) * 16, y * 32, 14, 24); } });
[-1, 1].forEach((k) => { const r = M(new THREE.BoxGeometry(3.5, 0.1, 1.75), mat("#fff", { map: gentengTex }), 0, 2.62, k * 0.66, roof); r.rotation.x = k * 0.62; });
const gable = new THREE.Shape(); gable.moveTo(-1.3, 0); gable.lineTo(1.3, 0); gable.lineTo(0, 0.85); gable.lineTo(-1.3, 0);
[-1.45, 1.45].forEach((xx) => { const g = M(new THREE.ShapeGeometry(gable), mat("#f4e3c1", { side: THREE.DoubleSide }), xx, 2.2, 0, roof); g.rotation.y = Math.PI / 2; });
const rmSign = liveSign(768, 180, (c, w, h) => {
  c.fillStyle = "#d8263a"; c.fillRect(0, 0, w, h); c.strokeStyle = "#ffd84a"; c.lineWidth = 10; c.strokeRect(8, 8, w - 16, h - 16);
  c.fillStyle = "#ffd84a"; c.font = "700 34px Poppins"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("RUMAH MAKAN", w / 2, 52);
  c.fillStyle = "#fff"; c.font = "900 78px 'Archivo Black'"; c.fillText("RAKYAT", w / 2, 122);
});
const signG = new THREE.Group(); signG.position.set(0, 2.55, 1.42); rm.add(signG);
M(new THREE.BoxGeometry(2.4, 0.58, 0.08), mat("#fff", { map: rmSign.tex }), 0, 0, 0, signG);
const bulbs = Array.from({ length: 9 }, (_, k) => M(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshStandardMaterial({ color: "#fff3b0", emissive: "#ffcf40", emissiveIntensity: 0 }), -1.3 + k * 0.325, 2.04 - Math.sin(k / 8 * Math.PI) * 0.12, 1.36, rm));
// inside: a table with empty plates, two stools, a steel stove with a flickering flame and an empty pot, a menu board with a "?"
const inside = new THREE.Group(); rm.add(inside);
M(new THREE.BoxGeometry(1.6, 0.06, 0.7), woodM, -0.35, 0.82, 0.15, inside);
[[-1.05, -0.15], [0.35, -0.15], [-1.05, 0.45], [0.35, 0.45]].forEach(([x, z]) => M(new THREE.CylinderGeometry(0.03, 0.03, 0.64, 6), woodM, x, 0.5, z, inside));
const plates = [-0.95, -0.55, -0.15, 0.25].map((x, k) => M(new THREE.CylinderGeometry(0.15, 0.12, 0.025, 20), mat("#fbfaf6", { roughness: 0.25 }), x, 0.865, k % 2 ? 0.32 : -0.02, inside));
[-0.75, 0.05].forEach((x) => M(new THREE.CylinderGeometry(0.16, 0.16, 0.45, 12), mat("#e0384b"), x, 0.4, 0.75, inside));
M(new THREE.BoxGeometry(1.2, 0.85, 0.5), mat("#a9b1ba", { metalness: 0.5, roughness: 0.35 }), 0.75, 0.6, -0.92, inside);
M(new THREE.BoxGeometry(1.1, 0.04, 0.42), mat("#222"), 0.75, 1.04, -0.92, inside);
const flames = [0.5, 1.0].map((x) => M(new THREE.ConeGeometry(0.09, 0.2, 10), new THREE.MeshStandardMaterial({ color: "#5aa0ff", emissive: "#2f6fff", emissiveIntensity: 1.6, transparent: true, opacity: 0.85 }), x, 1.15, -0.92, inside));
M(new THREE.CylinderGeometry(0.2, 0.17, 0.22, 16, 1, true), mat("#8f969e", { metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide }), 1.0, 1.25, -0.92, inside);
const menuSign = liveSign(384, 448, (c, w, h) => {
  c.fillStyle = "#2b2b2b"; c.fillRect(0, 0, w, h); c.strokeStyle = "#8a5a3a"; c.lineWidth = 18; c.strokeRect(9, 9, w - 18, h - 18);
  c.fillStyle = "#fff"; c.font = "900 64px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("MENU", w / 2, 80);
  c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 4; [160, 215, 270].forEach((y) => { c.beginPath(); c.moveTo(60, y); c.lineTo(w - 60, y); c.stroke(); });
  c.fillStyle = "#ffd84a"; c.font = "900 150px 'Archivo Black'"; c.fillText("?", w / 2, 350);
});
M(new THREE.BoxGeometry(0.9, 1.05, 0.04), mat("#fff", { map: menuSign.tex }), -0.6, 1.5, -1.16, inside);
const lamp = new THREE.PointLight("#ffd9a0", 0, 5, 1.5); lamp.position.set(0, 1.9, 0.1); rm.add(lamp);
const scaffold = new THREE.Group(); rm.add(scaffold);
[[-1.6, -1.4], [1.6, -1.4], [1.6, 1.45], [-1.6, 1.45]].forEach(([x, z]) => M(new THREE.CylinderGeometry(0.035, 0.035, 2.8, 6), mat("#b98a4a"), x, 1.4, z, scaffold));
const puffs = Array.from({ length: 10 }, (_, k) => M(new THREE.SphereGeometry(0.25, 10, 8), mat("#e8dcc2", { transparent: true, opacity: 0.7 }), 0, 0, 0, rm));

// the grand opening: a red ribbon across the door between two gold stanchions, big scissors, a confetti burst on the snip
const opening = new THREE.Group(); opening.position.set(0, 0, 1.75); rm.add(opening);
const goldM = mat("#e8c45a", { metalness: 0.6, roughness: 0.3 });
[-1.55, 1.55].forEach((x) => { M(new THREE.CylinderGeometry(0.05, 0.07, 1.1, 10), goldM, x, 0.55, 0, opening); M(new THREE.SphereGeometry(0.09, 12, 10), goldM, x, 1.12, 0, opening); M(new THREE.CylinderGeometry(0.16, 0.18, 0.05, 16), goldM, x, 0.03, 0, opening); });
const ribM = mat("#d8263a", { roughness: 0.5 });
const ribbonHalves = [-1, 1].map((k) => { const p = new THREE.Group(); p.position.set(k * 1.55, 1.05, 0); opening.add(p); M(new THREE.BoxGeometry(1.55, 0.14, 0.02), ribM, -k * 0.775, 0, 0, p); return { p, k }; });
const bow = new THREE.Group(); bow.position.set(0, 1.05, 0.02); opening.add(bow);
[-1, 1].forEach((k) => { const l = M(new THREE.SphereGeometry(0.13, 12, 8), ribM, k * 0.13, 0, 0, bow); l.scale.set(1.2, 0.75, 0.3); const tail = M(new THREE.BoxGeometry(0.07, 0.3, 0.02), ribM, k * 0.07, -0.18, 0, bow); tail.rotation.z = k * 0.35; });
M(new THREE.SphereGeometry(0.06, 10, 8), mat("#b01a2c"), 0, 0, 0.02, bow);
const scissors = new THREE.Group(); scissors.scale.setScalar(1.6); scene.add(scissors);
const blades = [-1, 1].map((k) => { const g = new THREE.Group(); scissors.add(g); M(new THREE.BoxGeometry(0.05, 0.02, 0.55), mat("#d7dde3", { metalness: 0.8, roughness: 0.2 }), 0, k * 0.012, 0.3, g); const ring = M(new THREE.TorusGeometry(0.08, 0.025, 8, 16), mat("#e0384b"), 0, k * 0.012, -0.12, g); ring.rotation.x = Math.PI / 2; return { g, k }; });
const burst = Array.from({ length: 36 }, (_, i) => M(new THREE.PlaneGeometry(0.07, 0.045), mat(["#e0384b", "#ffd84a", "#2fa04a", "#2f6fd1", "#fbfaf6", "#ff7eb6"][i % 6], { side: THREE.DoubleSide }), 0, 0, 0, scene));
const rope = lot.children.filter((c) => c.isLine);
leaf.visible = false;

// ---------- EP 003: the open kitchen in front of the restaurant, the menu banner, the gong, the secret corner ----------
const KZ = 1.05, LANE = 0.4, ST = [4.3, 5.1, 5.9, 6.7];   // counter line, the president's lane behind it, the four stations
const kit = new THREE.Group(); scene.add(kit);
const steelM = mat("#aab3bc", { metalness: 0.55, roughness: 0.35 }), darkM = mat("#2b2b2e", { metalness: 0.4, roughness: 0.5 });
M(new THREE.BoxGeometry(3.7, 0.08, 0.6), mat("#8a5a3a"), 5.75, 0.86, KZ, kit);                          // counter top (x 3.9..7.6)
M(new THREE.BoxGeometry(3.6, 0.8, 0.5), mat("#c96f3b"), 5.75, 0.42, KZ, kit);                           // front panel
M(new THREE.BoxGeometry(3.6, 0.06, 0.04), mat("#ffd84a"), 5.75, 0.7, KZ + 0.26, kit);
const awn = canTex(256, 64, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#fbfaf6" : "#d8263a"; c.fillRect(i * 32, 0, 32, h); } });
[3.95, 7.55].forEach((x) => M(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), mat("#c9a66b"), x, 1.2, KZ + 0.25, kit));
const tarp = M(new THREE.BoxGeometry(3.9, 0.04, 1.5), mat("#fff", { map: awn }), 5.75, 2.42, 0.55, kit); tarp.rotation.x = -0.12;
const stoves = ST.map((x, i) => {
  const g = new THREE.Group(); g.position.set(x, 0.9, KZ - 0.05); kit.add(g);
  M(new THREE.BoxGeometry(0.5, 0.1, 0.42), steelM, 0, 0.05, 0, g);
  const fl = [0, 1, 2].map((k) => M(new THREE.ConeGeometry(0.07, 0.18, 8), new THREE.MeshStandardMaterial({ color: i === 2 ? "#ffb02e" : "#5aa0ff", emissive: i === 2 ? "#ff6a00" : "#2f6fff", emissiveIntensity: 1.8, transparent: true, opacity: 0.9 }), Math.cos(k * 2.1) * 0.08, 0.17, Math.sin(k * 2.1) * 0.08, g));
  const pot = new THREE.Group(); pot.position.y = 0.2; g.add(pot);
  const food = new THREE.Group(); pot.add(food); food.visible = false;
  if (i === 0) {   // pecel lele: a shallow black wajan, two catfish in bubbling oil
    M(new THREE.CylinderGeometry(0.3, 0.16, 0.12, 20, 1, true), darkM, 0, 0.06, 0, pot).material.side = THREE.DoubleSide;
    M(new THREE.CylinderGeometry(0.24, 0.24, 0.01, 20), mat("#d9a441", { roughness: 0.2 }), 0, 0.08, 0, food);
    [-1, 1].forEach((s) => { const f = M(new THREE.SphereGeometry(0.1, 10, 8), mat("#7a4a22"), s * 0.08, 0.1, s * 0.03, food); f.scale.set(1.9, 0.5, 0.6); f.rotation.y = s * 0.4; });
  } else if (i === 1) {   // mie: a tall steel pot, yellow noodles
    M(new THREE.CylinderGeometry(0.2, 0.18, 0.32, 18, 1, true), steelM, 0, 0.16, 0, pot).material.side = THREE.DoubleSide;
    for (let k = 0; k < 7; k++) { const n = M(new THREE.TorusGeometry(0.06 + hash(k) * 0.05, 0.015, 6, 14), mat("#f2c84b"), (hash(k + 3) - 0.5) * 0.18, 0.3, (hash(k + 5) - 0.5) * 0.18, food); n.rotation.set(1.3 + k, k, 0); }
  } else if (i === 2) {   // nasi goreng: a big wok over a roaring fire
    M(new THREE.SphereGeometry(0.32, 20, 10, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38), darkM, 0, 0.32, 0, pot).material.side = THREE.DoubleSide;
    M(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), mat("#5a3a22"), 0.42, 0.12, 0, pot).rotation.z = Math.PI / 2;
    for (let k = 0; k < 14; k++) M(new THREE.SphereGeometry(0.05, 6, 5), mat(k % 4 ? "#c9782f" : "#e8c45a"), (hash(k) - 0.5) * 0.3, 0.06 + hash(k + 2) * 0.05, (hash(k + 4) - 0.5) * 0.3, food);
  } else {   // rendang: a heavy kuali, dark chunks in thick brown sauce
    M(new THREE.CylinderGeometry(0.26, 0.2, 0.22, 18, 1, true), mat("#3a2a20", { roughness: 0.6 }), 0, 0.11, 0, pot).material.side = THREE.DoubleSide;
    M(new THREE.CylinderGeometry(0.24, 0.24, 0.01, 18), mat("#6b3a1a", { roughness: 0.4 }), 0, 0.17, 0, food);
    for (let k = 0; k < 6; k++) M(new THREE.BoxGeometry(0.08, 0.06, 0.08), mat("#4a2410"), Math.cos(k) * 0.12, 0.19, Math.sin(k) * 0.12, food).rotation.y = k;
  }
  return { g, fl, pot, food, i };
});
// the served plates that pop up on "JADI!"
const SERVE = [["#d9a441", "#7a4a22"], ["#f2c84b", "#f2c84b"], ["#c9782f", "#e8c45a"], ["#6b3a1a", "#4a2410"]];
const served = ST.map((x, i) => { const g = new THREE.Group(); g.position.set(x, 0.91, KZ + 0.17); kit.add(g);
  M(new THREE.CylinderGeometry(0.15, 0.12, 0.025, 20), mat("#fbfaf6", { roughness: 0.25 }), 0, 0, 0, g);
  const mound = M(new THREE.SphereGeometry(0.1, 12, 8), mat(SERVE[i][0]), 0, 0.03, 0, g); mound.scale.set(1.2, 0.5, 1);
  M(new THREE.SphereGeometry(0.05, 8, 6), mat(SERVE[i][1]), 0.05, 0.07, 0.02, g); g.visible = false; return g; });
// the menu banner on the restaurant front, four slots that fill one by one
const MENU = ["PECEL LELE", "MIE", "NASI GORENG", "RENDANG"];
const menuBan = liveSign(1024, 256, (c, w, h, v) => {
  c.fillStyle = "#2b2b2b"; c.fillRect(0, 0, w, h); c.strokeStyle = "#8a5a3a"; c.lineWidth = 14; c.strokeRect(7, 7, w - 14, h - 14);
  c.fillStyle = "#ffd84a"; c.font = "900 44px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("MENU RAKYAT", w / 2, 44);
  const n = v.n || 0;
  MENU.forEach((m, k) => { const x = 128 + k * 256; c.strokeStyle = "rgba(255,255,255,.3)"; c.lineWidth = 3; c.strokeRect(x - 118, 82, 236, 104);
    c.fillStyle = k < n ? "#fff" : "rgba(255,255,255,.35)"; c.font = `900 ${m.length > 8 ? 34 : 42}px 'Archivo Black'`; c.fillText(k < n ? m : "?", x, 134); });
  if (v.by) { c.fillStyle = "#9fd39a"; c.font = "700 30px Poppins"; c.fillText("pilihan @m.bilal26_lb", w / 2, 222); }
});
M(new THREE.BoxGeometry(2.7, 0.66, 0.05), mat("#fff", { map: menuBan.tex }), 5.4, 1.78, -0.16, scene);
// the gong on a carved frame, turned towards the camera, right of the counter
const gongG = new THREE.Group(); gongG.position.set(8.15, 0, -0.1); gongG.rotation.y = -0.25; scene.add(gongG);
[-0.38, 0.38].forEach((x) => M(new THREE.BoxGeometry(0.1, 1.7, 0.1), mat("#7a3a1e"), x, 0.85, 0, gongG));
M(new THREE.BoxGeometry(1.0, 0.12, 0.12), mat("#7a3a1e"), 0, 1.72, 0, gongG);
const gong = new THREE.Group(); gong.position.set(0, 1.2, 0); gongG.add(gong);
M(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 28), mat("#d9a83a", { metalness: 0.75, roughness: 0.25 }), 0, 0, 0, gong).rotation.x = Math.PI / 2;
M(new THREE.SphereGeometry(0.08, 12, 8), mat("#c9902a", { metalness: 0.75, roughness: 0.25 }), 0, 0, 0.03, gong);
const mallet = new THREE.Group(); M(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), mat("#c9a66b"), 0, -0.2, 0, mallet); M(new THREE.SphereGeometry(0.07, 10, 8), mat("#e0384b"), 0, 0.05, 0, mallet); scene.add(mallet);
// the secret corner at the right end of the counter: an ulekan, a covered plate, a little sign
const sec = new THREE.Group(); sec.position.set(7.35, 0.9, KZ - 0.05); kit.add(sec);
M(new THREE.CylinderGeometry(0.11, 0.08, 0.07, 14), mat("#6f6a64", { roughness: 0.9 }), -0.08, 0.035, -0.13, sec);
M(new THREE.CylinderGeometry(0.15, 0.12, 0.025, 20), mat("#fbfaf6", { roughness: 0.25 }), 0.02, 0.01, 0.06, sec);
const penyet = M(new THREE.SphereGeometry(0.1, 12, 8), mat("#c98a3a"), 0.02, 0.05, 0.06, sec); penyet.scale.set(1.3, 0.55, 1);
M(new THREE.SphereGeometry(0.04, 8, 6), mat("#d8263a"), 0.1, 0.06, 0.1, sec);
const cloth = M(new THREE.SphereGeometry(0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat("#fbfaf6", { roughness: 0.9 }), 0.02, 0.01, 0.06, sec);
const secSign = liveSign(320, 120, (c, w, h) => { c.fillStyle = "#3a2414"; c.fillRect(0, 0, w, h); c.fillStyle = "#ffd84a"; c.font = "900 40px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("MENU RAHASIA", w / 2, 46); c.font = "700 26px Poppins"; c.fillStyle = "#fff"; c.fillText("sstt... jangan bilang-bilang", w / 2, 92); });
const secTag = M(new THREE.BoxGeometry(0.42, 0.16, 0.02), mat("#fff", { map: secSign.tex }), 0.02, 0.33, -0.12, sec);
// smoke over the kitchen while he panics
const smoke = Array.from({ length: 14 }, (_, k) => M(new THREE.SphereGeometry(0.22, 10, 8), mat("#d8d4cc", { transparent: true, opacity: 0.6, depthWrite: false }), 0, 0, 0, scene));
const splash = Array.from({ length: 10 }, (_, k) => M(new THREE.SphereGeometry(0.018, 6, 4), mat("#ffd36a", { emissive: "#ffb000", emissiveIntensity: 0.8 }), 0, 0, 0, scene));
const sweat = Array.from({ length: 6 }, () => M(new THREE.SphereGeometry(0.03, 8, 6), mat("#9fd8ff", { transparent: true, opacity: 0.85 }), 0, 0, 0, scene));
// ---------- the teaser: a row of empty numbered plots behind the crowd (EP 004 brings the city plan) ----------
const plots = new THREE.Group(); scene.add(plots);
const plotSign = (n) => canTex(256, 128, (c, w, h) => { c.fillStyle = "#fffdf4"; c.fillRect(0, 0, w, h); c.fillStyle = "#e8a91c"; c.fillRect(0, 0, w, 34); c.fillStyle = "#3a2414"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "700 22px Poppins"; c.fillText("KAVLING", w / 2, 18); c.font = "900 64px 'Archivo Black'"; c.fillText(String(n).padStart(2, "0"), w / 2, 86); });
let pn = 0;
[9.6, 12.3].forEach((z) => [-2.6, 0, 2.6].forEach((x) => {
  pn++; const p = new THREE.Group(); p.position.set(x, 0, z); plots.add(p);
  M(new THREE.BoxGeometry(2.3, 0.03, 2.3), mat("#c9b48a"), 0, 0.02, 0, p);
  [[-1.1, -1.1], [1.1, -1.1], [1.1, 1.1], [-1.1, 1.1]].forEach(([a, b]) => M(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 6), mat("#8a5a3a"), a, 0.25, b, p));
  [[[-1.1, -1.1], [1.1, -1.1]], [[1.1, -1.1], [1.1, 1.1]], [[1.1, 1.1], [-1.1, 1.1]], [[-1.1, 1.1], [-1.1, -1.1]]].forEach(([a, b]) => p.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a[0], 0.45, a[1]), new THREE.Vector3(b[0], 0.45, b[1])]), new THREE.LineBasicMaterial({ color: "#e0384b" }))));
  const sg = new THREE.Group(); sg.position.set(0, 0, -0.9); p.add(sg);
  M(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), mat("#8a5a3a"), 0, 0.45, 0, sg);
  M(new THREE.BoxGeometry(0.6, 0.3, 0.03), mat("#fff", { map: plotSign(pn) }), 0, 0.95, 0.02, sg);
}));
// the moon and the night glow
const moon = M(new THREE.SphereGeometry(2.2, 24, 16), new THREE.MeshBasicMaterial({ color: "#fff6d8", fog: false }), -14, 30, 46, scene);
const zzzTex = canTex(256, 128, (c, w, h) => { c.fillStyle = "#fff"; c.strokeStyle = "#24324f"; c.lineWidth = 8; c.textBaseline = "middle"; [["Z", 70, 40, 80], ["z", 46, 120, 60], ["z", 34, 176, 34]].forEach(([s, f, x, y]) => { c.font = `900 ${f}px 'Archivo Black'`; c.strokeText(s, x, y + 30); c.fillText(s, x, y + 30); }); });
const zzz = Array.from({ length: 10 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: zzzTex, transparent: true, depthWrite: false })); s.scale.set(0.6, 0.3, 1); s.visible = false; scene.add(s); return s; });
const hemi = scene.children.find((o) => o.isHemisphereLight);
const kitLamp = new THREE.PointLight("#ffcf80", 0, 7, 1.4); kitLamp.position.set(5.6, 2.2, 1.0); scene.add(kitLamp);
// 20 newcomers walk in from both roads during the hook and stand at the back
const newbies = Array.from({ length: 20 }, (_, n) => {
  const c = citizen(120 + n), row = n % 2, x = -3.0 + Math.floor(n / 2) * 0.66 + (hash(n + 200) - 0.5) * 0.15, z = row ? 7.0 : 6.6;
  c.userData.path = [[x < 0 ? -11.5 - hash(n) * 2 : 11.5 + hash(n) * 2, z], [x, z]]; c.userData.sitFace = Math.PI + (hash(n + 9) - 0.5) * 0.5;
  const ud = c.userData; ud.len = Math.abs(ud.path[0][0] - x); ud.go = 0.9 + hash(n + 300) * 1.4; ud.dur = ud.len / 4.6;
  c.position.set(ud.path[0][0], 0, z); c.visible = false; scene.add(c); return c;
});


// ---------- EP 004 (special edition): the empty Wapres chair, sirens, the signing desk, the stalled project, the bricks ----------
const SEAT = [-1.05, -1.75];
const wseat = new THREE.Group(); wseat.position.set(SEAT[0], 0, SEAT[1]); scene.add(wseat);
const velvet = mat("#8a1f2b", { roughness: 0.6 }), gold2 = mat("#e8c45a", { metalness: 0.6, roughness: 0.3 });
const seatTurn = new THREE.Group(); wseat.add(seatTurn);
M(new THREE.CylinderGeometry(0.06, 0.06, 0.42, 8), mat("#333"), 0, 0.21, 0, seatTurn);
M(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 16), mat("#333"), 0, 0.02, 0, seatTurn);
M(new THREE.BoxGeometry(0.62, 0.12, 0.58), velvet, 0, 0.48, 0, seatTurn);
M(new THREE.BoxGeometry(0.62, 0.8, 0.1), velvet, 0, 0.92, -0.26, seatTurn);
M(new THREE.BoxGeometry(0.66, 0.06, 0.14), gold2, 0, 1.34, -0.26, seatTurn);
[-1, 1].forEach((k) => M(new THREE.BoxGeometry(0.08, 0.22, 0.5), gold2, k * 0.33, 0.62, 0, seatTurn));
const vpTag = liveSign(384, 128, (c, w, h) => { c.fillStyle = "#fffdf4"; c.fillRect(0, 0, w, h); c.strokeStyle = "#d8263a"; c.lineWidth = 10; c.strokeRect(5, 5, w - 10, h - 10);
  c.fillStyle = "#3a2414"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "700 28px Poppins"; c.fillText("KURSI", w / 2, 36); c.font = "900 42px 'Archivo Black'"; c.fillText("WAKIL PRESIDEN", w / 2, 88); });
M(new THREE.BoxGeometry(0.62, 0.21, 0.02), mat("#fff", { map: vpTag.tex }), 0, 1.0, -0.2, seatTurn);
const spotM = new THREE.MeshBasicMaterial({ color: "#fff3c4", transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, fog: false });
const spotCone = M(new THREE.ConeGeometry(0.75, 4.4, 32, 1, true), spotM, 0, 2.2, 0, wseat); spotCone.castShadow = false;
const spotDisc = M(new THREE.CircleGeometry(0.75, 32), new THREE.MeshBasicMaterial({ color: "#fff3c4", transparent: true, opacity: 0.4, depthWrite: false }), 0, 0.075, 0, wseat); spotDisc.rotation.x = -Math.PI / 2;
const kamu = liveSign(256, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#ffd84a"; c.fillRect(6, 6, w - 12, h - 12); c.strokeStyle = "#3a2414"; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12);
  c.fillStyle = "#3a2414"; c.font = "900 66px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("KAMU?", w / 2, h / 2 + 4); });
const kamuSign = new THREE.Group(); kamuSign.position.set(0, 1.62, 0); wseat.add(kamuSign);
M(new THREE.BoxGeometry(0.8, 0.4, 0.03), mat("#fff", { map: kamu.tex }), 0, 0, 0, kamuSign);
// sirens on the podium
const sirens = [[-0.5, "#ff2a3a"], [0.5, "#2a6bff"]].map(([x, c]) => {
  M(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 14), mat("#333"), x, 1.25, 0.2, pod);
  const m = M(new THREE.SphereGeometry(0.11, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0 }), x, 1.27, 0.2, pod);
  const l = new THREE.PointLight(c, 0, 7, 1.4); l.position.set(x, 1.6, 0.6); pod.add(l); return { m, l };
});
// the signing desk: blueprint, budget chest, approval sheet, pen
const DESK = [1.35, -0.75];
const desk = new THREE.Group(); desk.position.set(DESK[0], 0, DESK[1]); scene.add(desk);
M(new THREE.BoxGeometry(1.5, 0.07, 0.75), mat("#7a4a2a"), 0, 0.8, 0, desk);
[[-0.68, -0.32], [0.68, -0.32], [-0.68, 0.32], [0.68, 0.32]].forEach(([x, z]) => M(new THREE.BoxGeometry(0.07, 0.8, 0.07), mat("#5a3420"), x, 0.4, z, desk));
M(new THREE.BoxGeometry(1.46, 0.45, 0.03), mat("#d8263a"), 0, 0.52, 0.36, desk);
M(new THREE.BoxGeometry(1.46, 0.2, 0.035), mat("#fbfaf6"), 0, 0.62, 0.36, desk);
const bpSign = liveSign(512, 320, (c, w, h) => { c.fillStyle = "#1f5fa8"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = 5; c.strokeRect(14, 14, w - 28, h - 28);
  c.beginPath(); c.moveTo(150, 250); c.lineTo(150, 150); c.lineTo(256, 78); c.lineTo(362, 150); c.lineTo(362, 250); c.closePath(); c.stroke(); c.strokeRect(232, 190, 50, 60); c.strokeRect(172, 166, 42, 34); c.strokeRect(298, 166, 42, 34);
  c.fillStyle = "#fff"; c.font = "900 30px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("RUMAH RAKYAT", w / 2, 290); c.font = "700 20px Poppins"; c.textAlign = "left"; c.fillText("DESAIN · KAVLING 01–06", 30, 40); });
const bp = new THREE.Group(); bp.position.set(-0.68, 0.842, -0.05); desk.add(bp);
const bpSheet = M(new THREE.PlaneGeometry(0.8, 0.5), mat("#fff", { map: bpSign.tex }), 0.4, 0, 0, bp); bpSheet.rotation.x = -Math.PI / 2;
const bpRoll = M(new THREE.CylinderGeometry(0.035, 0.035, 0.52, 12), mat("#2a6bc0"), 0, 0.03, 0, desk); bpRoll.rotation.x = Math.PI / 2;
const chest = new THREE.Group(); chest.position.set(0.5, 0.835, -0.05); desk.add(chest);
M(new THREE.BoxGeometry(0.42, 0.24, 0.28), mat("#8a5a2a"), 0, 0.12, 0, chest);
[-0.15, 0.15].forEach((x) => M(new THREE.BoxGeometry(0.04, 0.25, 0.29), gold2, x, 0.12, 0, chest));
const lid = new THREE.Group(); lid.position.set(0, 0.24, -0.14); chest.add(lid); M(new THREE.BoxGeometry(0.42, 0.06, 0.28), mat("#a86a32"), 0, 0.03, 0.14, lid);
const coins = Array.from({ length: 10 }, (_, k) => M(new THREE.CylinderGeometry(0.035, 0.035, 0.014, 12), gold2, (hash(k) - 0.5) * 0.3, 0.25, (hash(k + 1) - 0.5) * 0.16, chest));
const angSign = liveSign(256, 64, (c, w, h) => { c.fillStyle = "#ffd84a"; c.fillRect(0, 0, w, h); c.fillStyle = "#3a2414"; c.font = "900 34px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("ANGGARAN", w / 2, h / 2 + 2); });
M(new THREE.BoxGeometry(0.34, 0.085, 0.01), mat("#fff", { map: angSign.tex }), 0, 0.11, 0.145, chest);
const docSign = liveSign(320, 384, (c, w, h, v) => { c.fillStyle = "#fffdf4"; c.fillRect(0, 0, w, h); c.fillStyle = "#3a2414"; c.textAlign = "center"; c.textBaseline = "middle";
  c.font = "900 26px 'Archivo Black'"; c.fillText("PERSETUJUAN", w / 2, 40); c.font = "700 20px Poppins"; c.fillText("pembangunan rumah rakyat", w / 2, 72);
  c.strokeStyle = "#3a2414"; c.lineWidth = 3; [[40, 230, "PRESIDEN"], [180, 230, "WAKIL PRES."]].forEach(([x, y, s]) => { c.strokeRect(x, y - 70, 110, 70); c.font = "700 16px Poppins"; c.fillText(s, x + 55, y + 16); });
  if (v.sig) { c.strokeStyle = "#1f3fa8"; c.lineWidth = 4; c.beginPath(); for (let k = 0; k <= 20; k++) { const x = 52 + k * 4.4, y = 200 + Math.sin(k * 1.3) * 12 - k * 0.6; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  if (v.q) { c.fillStyle = "#e0384b"; c.font = "900 64px 'Archivo Black'"; c.fillText("?", 235, 196); } });
const doc = M(new THREE.PlaneGeometry(0.34, 0.4), mat("#fff", { map: docSign.tex }), 0.0, 0.843, 0.12, desk); doc.rotation.x = -Math.PI / 2;
const pen = new THREE.Group(); desk.add(pen); M(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8), mat("#1f3fa8"), 0, 0.1, 0, pen); pen.rotation.z = 0.5;
// the stalled project: a board behind the crowd that gets a DITUNDA band
const projSign = liveSign(640, 320, (c, w, h, v) => { c.fillStyle = "#fffdf4"; c.fillRect(0, 0, w, h); c.fillStyle = "#2f6b4f"; c.fillRect(0, 0, w, 90);
  c.fillStyle = "#fff"; c.font = "900 46px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("PROYEK RUMAH RAKYAT", w / 2, 48);
  c.fillStyle = "#3a2414"; c.font = "700 30px Poppins"; c.fillText("kavling 01–06 · pilihan rakyat", w / 2, 150); c.fillText("tanda tangan: Presiden ✓  Wapres ✗", w / 2, 210);
  if (v.stop) { c.save(); c.translate(w / 2, h / 2 + 30); c.rotate(-0.18); c.fillStyle = "#e0384b"; c.fillRect(-w * 0.6, -48, w * 1.2, 96); c.fillStyle = "#fff"; c.font = "900 72px 'Archivo Black'"; c.fillText("DITUNDA", 0, 6); c.restore(); } });
const proj = new THREE.Group(); proj.position.set(0, 0, 8.5); proj.rotation.y = Math.PI; scene.add(proj);
[-1.15, 1.15].forEach((x) => M(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8), mat("#fff", { map: stripe }), x, 1.4, 0, proj));
const projBoard = M(new THREE.BoxGeometry(2.6, 1.3, 0.08), mat("#fff", { map: projSign.tex }), 0, 2.2, 0.05, proj);
// a pile of bricks next to the desk, and the stack the president carries
const brickM = mat("#b5562a", { roughness: 0.85 });
const PILE = [2.45, -0.85];
const pile = Array.from({ length: 12 }, (_, k) => M(new THREE.BoxGeometry(0.3, 0.12, 0.15), brickM, PILE[0] + ((k % 3) - 1) * 0.31, 0.06 + Math.floor(k / 3) * 0.125, PILE[1] + (Math.floor(k / 3) % 2) * 0.04, scene));
// the flashback: reporters with microphones, a tower of DOKUMEN folders, a letter left on the counter
const VPP = [6.1, 2.25];
const REP = [[5.3, 2.15], [6.95, 2.5], [5.5, 2.95], [6.75, 3.05], [5.55, 1.62]];
const reporters = REP.map(([x, z], n) => {
  const c = citizen(140 + n); c.position.set(x, 0, z); c.rotation.y = Math.atan2(VPP[0] - x, VPP[1] - z); c.scale.setScalar(1.15);
  const micG = new THREE.Group(); micG.position.set(0, -0.34, 0); c.userData.arms[1].add(micG);
  M(new THREE.CylinderGeometry(0.015, 0.015, 0.16, 6), mat("#222"), 0, -0.06, 0, micG); M(new THREE.SphereGeometry(0.045, 10, 8), mat(n % 2 ? "#e0384b" : "#333"), 0, -0.16, 0, micG);
  const note = M(new THREE.BoxGeometry(0.1, 0.13, 0.02), mat("#fffdf4"), 0, -0.32, 0.03, c.userData.arms[0]);
  c.visible = false; scene.add(c); return c;
});
const folderSign = liveSign(256, 96, (c, w, h) => { c.fillStyle = "#f2c84b"; c.fillRect(0, 0, w, h); c.fillStyle = "#3a2414"; c.font = "900 40px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("DOKUMEN", w / 2, h / 2 + 2); });
const folderM = [mat("#fff", { map: folderSign.tex }), mat("#e8b93a")];
const folders = Array.from({ length: 14 }, (_, k) => { const f = M(new THREE.BoxGeometry(0.34, 0.07, 0.25), [folderM[1], folderM[1], folderM[1], folderM[1], folderM[0], folderM[1]], 6.3 + (hash(k) - 0.5) * 0.05, 0.94 + k * 0.072, 0.98, scene); f.rotation.y = (hash(k + 4) - 0.5) * 0.4; f.visible = false; return f; });
const letter = M(new THREE.PlaneGeometry(0.22, 0.28), mat("#fffdf4"), 6.95, 0.912, KZ + 0.2, scene); letter.rotation.x = -Math.PI / 2; letter.rotation.z = 0.3;
const letterInk = M(new THREE.PlaneGeometry(0.15, 0.03), mat("#3a2414"), 6.95, 0.915, KZ + 0.14, scene); letterInk.rotation.x = -Math.PI / 2; letterInk.rotation.z = 0.3;

// ---------- the president ----------
// ---------- people in peci and batik ----------
function batikTex(base, ink) {   // a simple kawung pattern
  const t = canTex(256, 256, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h); c.fillStyle = ink;
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) { const cx = x * 56 + (y % 2) * 28, cy = y * 56;
      [[0, -12], [12, 0], [0, 12], [-12, 0]].forEach(([dx, dy]) => { c.beginPath(); c.ellipse(cx + dx, cy + dy, dx ? 11 : 6, dy ? 11 : 6, 0, 0, Math.PI * 2); c.fill(); }); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1); return t;
}
function dress(b, o) {
  const torso = b.body.children.find((c) => c.userData.part === "torso");
  if (o.batik) torso.material = mat("#fff", { map: batikTex(...o.batik), roughness: 0.8 });
  if (o.peci) {
    b.head.traverse((c) => { if (c.isMesh && c.material.color && c.material.color.getHexString() === "2a2421") c.visible = false; });
    const p = M(new THREE.CylinderGeometry(0.46, 0.5, 0.32, 24), mat("#1c1a1a", { roughness: 0.95 }), 0, 0.42, -0.02, b.head); p.scale.set(1, 1, 0.88);
  }
  return b;
}
const pres = dress(grow(baby("PRESIDEN", { glasses: true }), 45, { pants: "#22232b" }), { peci: true });
pres.body.children.find((c) => c.userData.part === "torso").material = mat("#24324f", { roughness: 0.7 });
const sash = M(new THREE.BoxGeometry(0.12, 1.15, 0.05), mat("#d8263a"), 0, 1.12, 0.36, pres.body); sash.rotation.z = 0.6;
M(new THREE.BoxGeometry(0.1, 0.12, 0.02), mat("#e8c45a", { metalness: 0.5, roughness: 0.3 }), -0.14, 1.28, 0.42, pres.body);
pres.g.scale.setScalar(0.62); scene.add(pres.g);
let mouth = null; pres.head.traverse((m) => { if (m.isMesh && m.geometry.type === "TorusGeometry" && m.geometry.parameters.arc < 4 && m.position.y < 0) mouth = m; });
const broom = new THREE.Group(); M(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6), mat("#c9a66b"), 0, 0, 0, broom); M(new THREE.ConeGeometry(0.12, 0.25, 8), mat("#d9c27a"), 0, -0.58, 0, broom); broom.visible = false; scene.add(broom);


// the Wapres (seen from behind in the flashback) and the president's megaphone and bricks
const vp = dress(grow(baby("WAPRES", {}), 45, { pants: "#2a2420" }), { peci: true });
vp.body.children.find((c) => c.userData.part === "torso").material = mat("#6b2a2a", { roughness: 0.7 });
vp.g.scale.setScalar(0.62); vp.g.visible = false; scene.add(vp.g);
const carry = new THREE.Group(); carry.position.set(0, 1.0, 0.5); vp.body.add(carry);
M(new THREE.CylinderGeometry(0.24, 0.2, 0.04, 20), mat("#fbfaf6", { roughness: 0.25 }), 0, 0, 0, carry);
const carryP = M(new THREE.SphereGeometry(0.16, 12, 8), mat("#c98a3a"), 0, 0.07, 0, carry); carryP.scale.set(1.3, 0.55, 1);
const mega = new THREE.Group(); mega.position.set(0, -0.42, 0.1); pres.arms[1].add(mega);
M(new THREE.CylinderGeometry(0.22, 0.08, 0.5, 16, 1, true), mat("#fbfaf6", { side: THREE.DoubleSide }), 0, 0, 0, mega).rotation.x = Math.PI / 2;
M(new THREE.CylinderGeometry(0.225, 0.225, 0.05, 16, 1, true), mat("#d8263a", { side: THREE.DoubleSide }), 0, 0, 0.24, mega).rotation.x = Math.PI / 2;
const stack = new THREE.Group(); stack.position.set(0.85, 0.55, 0.3); pres.body.add(stack);
const sBricks = Array.from({ length: 6 }, (_, k) => M(new THREE.BoxGeometry(0.5, 0.2, 0.25), brickM, 0, k * 0.21, 0, stack));


// ---------- EP 005 (special edition): the debate stage with three candidates, the queue of 23, the ballot box, the party confetti ----------
const STG = { x: -3.6, z: -5.3, ry: 0.35 };
const stgW = (lx, ly, lz) => [STG.x + lx * Math.cos(STG.ry) + lz * Math.sin(STG.ry), ly, STG.z - lx * Math.sin(STG.ry) + lz * Math.cos(STG.ry)];
const stg = new THREE.Group(); stg.position.set(STG.x, 0, STG.z); stg.rotation.y = STG.ry; scene.add(stg);
M(new THREE.BoxGeometry(5.2, 0.3, 1.8), mat("#24324f"), 0, 0.15, 0, stg);
M(new THREE.BoxGeometry(5.2, 0.04, 1.8), mat("#b5562a"), 0, 0.32, 0, stg);
M(new THREE.BoxGeometry(5.22, 0.08, 0.05), mat("#ffd84a"), 0, 0.28, 0.91, stg);
const debSign = liveSign(1024, 256, (c, w, h) => { c.fillStyle = "#24324f"; c.fillRect(0, 0, w, h); c.strokeStyle = "#ffd84a"; c.lineWidth = 14; c.strokeRect(7, 7, w - 14, h - 14);
  c.fillStyle = "#ffd84a"; c.font = "900 92px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("PELANTIKAN WAPRES", w / 2, 108);
  c.fillStyle = "#fff"; c.font = "800 38px Poppins"; c.fillText("CITIZENESIA · EDISI SPESIAL · RAKYAT MEMILIH", w / 2, 196); });
[-2.4, 2.4].forEach((x) => M(new THREE.CylinderGeometry(0.07, 0.07, 3.7, 8), mat("#fff", { map: stripe }), x, 1.85, -0.75, stg));
M(new THREE.BoxGeometry(4.7, 1.17, 0.08), mat("#fff", { map: debSign.tex }), 0, 3.1, -0.75, stg);
const CANDS = [["m.bilal26_lb", "#e0384b", 0], ["zioo22_04_10", "#2f6fd1", 1], ["abdulm4jid_", "#2fa04a", 2]];
const PODX = [-1.65, 0, 1.65];
const cands = CANDS.map(([u, col, i], k) => {
  const g = new THREE.Group(); g.position.set(PODX[k], 0.34, 0.2); stg.add(g);
  M(new THREE.BoxGeometry(0.95, 1.0, 0.5), mat(col), 0, 0.5, 0, g);
  M(new THREE.BoxGeometry(1.05, 0.07, 0.6), mat("#8a5a3a"), 0, 1.03, 0, g);
  const s = liveSign(512, 384, (c, w, h) => { c.fillStyle = "#fffdf4"; c.fillRect(0, 0, w, h); c.fillStyle = col; c.fillRect(0, h - 22, w, 22);
    c.fillStyle = col; c.font = "900 220px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(k + 1), w / 2, 140);
    c.fillStyle = "#3a2414"; c.font = `800 ${u.length > 12 ? 40 : 46}px Poppins`; c.fillText("@" + u, w / 2, 315); });
  M(new THREE.BoxGeometry(0.82, 0.62, 0.02), mat("#fff", { map: s.tex }), 0, 0.55, 0.26, g);
  const c = citizen([300, 311, 323][k]); c.position.set(0, 0, -0.42); c.scale.setScalar(1.3); g.add(c);
  const cm = new THREE.MeshBasicMaterial({ color: "#fff3c4", transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const cone = M(new THREE.ConeGeometry(0.62, 3.6, 28, 1, true), cm, 0, 1.75, -0.3, g); cone.castShadow = false;
  return { g, c, s, cm, k, u };
});
// candidate 2's giant promise banner
const lowSign = liveSign(768, 320, (c, w, h) => { c.fillStyle = "#ffd84a"; c.fillRect(0, 0, w, h); c.strokeStyle = "#3a2414"; c.lineWidth = 12; c.strokeRect(6, 6, w - 12, h - 12);
  c.fillStyle = "#d8263a"; c.font = "900 150px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("9.000", w / 2, 120);
  c.fillStyle = "#3a2414"; c.font = "900 58px 'Archivo Black'"; c.fillText("LOWONGAN KERJA", w / 2, 255); });
const lowG = new THREE.Group(); lowG.position.set(0, 2.75, -0.5); stg.add(lowG);
M(new THREE.BoxGeometry(2.1, 0.88, 0.03), mat("#fff", { map: lowSign.tex }), 0, -0.44, 0, lowG);
// the 23 who signed up: two lines behind the president, running in from the right
const Q23 = Array.from({ length: 23 }, (_, n) => {
  const c = citizen(400 + n), row = n < 11 ? 0 : 1, k = row ? n - 11 : n;
  const x = -0.55 + k * 0.4 + row * 0.2 + (hash(n + 500) - 0.5) * 0.08, z = row ? -3.75 : -3.05;
  c.userData.spot = [x, z]; c.userData.from = [x + 8 + hash(n + 501) * 3, z]; c.userData.go = hash(n + 502) * 0.9; c.userData.out = hash(n + 503) * 0.6;
  c.scale.setScalar(1.15); c.visible = false; scene.add(c); return c;
});
// more people at the back (492 now)
const more = Array.from({ length: 26 }, (_, n) => {
  const c = citizen(460 + n), row = n % 2, x = -3.6 + Math.floor(n / 2) * 0.6 + (hash(n + 600) - 0.5) * 0.15, z = row ? 7.95 : 7.55;
  c.userData.sitFace = Math.PI + (hash(n + 601) - 0.5) * 0.5; c.position.set(x, 0, z); c.scale.setScalar(1.15); scene.add(c); return c;
});
// the ballot box
const BOX = [-0.45, -0.5];
const boxG = new THREE.Group(); boxG.position.set(BOX[0], 0, BOX[1]); scene.add(boxG);
M(new THREE.BoxGeometry(0.75, 0.75, 0.6), mat("#fbfaf6", { roughness: 0.4 }), 0, 0.375, 0, boxG);
M(new THREE.BoxGeometry(0.76, 0.06, 0.61), mat("#d8263a"), 0, 0.76, 0, boxG);
M(new THREE.BoxGeometry(0.4, 0.02, 0.06), mat("#222"), 0, 0.795, 0, boxG);
const boxSign = liveSign(256, 128, (c, w, h) => { c.fillStyle = "#fbfaf6"; c.fillRect(0, 0, w, h); c.fillStyle = "#d8263a"; c.font = "900 46px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("KOTAK", w / 2, 40); c.fillText("SUARA", w / 2, 92); });
M(new THREE.PlaneGeometry(0.6, 0.3), mat("#fff", { map: boxSign.tex }), 0, 0.42, 0.302, boxG);
const slipCol = ["#e0384b", "#2f6fd1", "#2fa04a"];
const slips = Array.from({ length: 9 }, (_, k) => M(new THREE.PlaneGeometry(0.16, 0.22), mat(slipCol[k % 3], { side: THREE.DoubleSide }), 0, 0, 0, boxG));
// party confetti
const CONF = ["#e0384b", "#ffd84a", "#2fa04a", "#2f6fd1", "#fbfaf6", "#ff7eb6"];
const conf = Array.from({ length: 140 }, (_, i) => M(new THREE.PlaneGeometry(0.08, 0.05), mat(CONF[i % 6], { side: THREE.DoubleSide }), 0, 0, 0, scene));


// ---------- EP 006: the inauguration book, the new VP in the chair, cabinet props, the covered party, application folders ----------
const book = new THREE.Group(); book.position.set(0.12, 1.1, 0.05); cands[2].g.add(book);
M(new THREE.BoxGeometry(0.34, 0.07, 0.26), mat("#7a1f2b"), 0, 0, 0, book); M(new THREE.BoxGeometry(0.3, 0.075, 0.22), mat("#f4ead2"), 0.01, 0.002, 0, book);
M(new THREE.BoxGeometry(0.2, 0.01, 0.12), mat("#e8c45a", { metalness: 0.6, roughness: 0.3 }), 0, 0.04, 0, book);
const newVP = citizen(323); newVP.scale.setScalar(1.15); newVP.visible = false; wseat.add(newVP); newVP.position.set(0, 0.12, 0.05);
newVP.userData.legs.forEach((l) => (l.rotation.x = -1.4));
const vpPeci = M(new THREE.CylinderGeometry(0.17, 0.19, 0.13, 20), mat("#1c1a1a", { roughness: 0.95 }), 0, 1.2, -0.01, newVP.userData.body);
const izinSign = liveSign(256, 320, (c, w, h, v) => { c.fillStyle = "#fffdf4"; c.fillRect(0, 0, w, h); c.fillStyle = "#7a1f2b"; c.fillRect(0, 0, w, 44);
  c.fillStyle = "#fff"; c.font = "900 26px 'Archivo Black'"; c.textAlign = "center"; c.fillText("IZIN RUMAH", w / 2, 32);
  c.fillStyle = "#3a2414"; c.font = "700 20px Poppins"; c.fillText("RAKYAT", w / 2, 72); c.strokeStyle = "#c9b99a"; c.lineWidth = 3; c.beginPath(); c.moveTo(30, 190); c.lineTo(226, 190); c.stroke();
  if (v >= 1) { c.strokeStyle = "#1d3fa8"; c.lineWidth = 5; c.beginPath(); c.moveTo(40, 170); c.bezierCurveTo(70, 110, 90, 210, 120, 150); c.bezierCurveTo(140, 120, 160, 200, 210, 140); c.stroke(); }
  if (v >= 2) { c.strokeStyle = "#2fa04a"; c.lineWidth = 9; c.strokeRect(50, 220, 156, 70); c.fillStyle = "#2fa04a"; c.font = "900 44px 'Archivo Black'"; c.fillText("SAH", w / 2, 272); } });
izinSign.draw(0);
const vpPaper = M(new THREE.BoxGeometry(0.3, 0.38, 0.012), mat("#fff", { map: izinSign.tex }), 0.02, -0.5, 0.12, newVP.userData.arms[0]); vpPaper.rotation.set(-0.2, 0, 0.4);
const zioSash = M(new THREE.BoxGeometry(0.09, 0.62, 0.05), mat("#ffd84a"), 0, 0.62, 0.2, cands[1].c.userData.body); zioSash.rotation.z = 0.6;
const bilalHat = new THREE.Group(); bilalHat.position.set(0, 1.25, 0); cands[0].c.userData.body.add(bilalHat);
M(new THREE.ConeGeometry(0.12, 0.32, 16), mat("#ff7eb6"), 0, 0.12, 0, bilalHat); M(new THREE.SphereGeometry(0.05, 10, 8), mat("#ffd84a"), 0, 0.3, 0, bilalHat);
const roleSign = (txt, col) => liveSign(512, 160, (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h); c.strokeStyle = "#fff"; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12);
  c.fillStyle = "#fff"; c.font = `900 ${txt.length > 16 ? 50 : 60}px 'Archivo Black'`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, w / 2, h / 2 + 4); });
const rs1 = roleSign("MENTERI LAPANGAN KERJA", "#2f6fd1"), rs0 = roleSign("KETUA PANITIA PESTA", "#e0384b"), rs2 = roleSign("WAPRES TERPILIH ✓", "#2fa04a");
const roleBoards = [[0, rs0], [1, rs1], [2, rs2]].map(([k, s]) => { const m = M(new THREE.BoxGeometry(0.95, 0.3, 0.03), mat("#fff", { map: s.tex }), 0, 2.15, -0.1, cands[k].g); m.visible = false; return m; });
// the party, covered and waiting for 500
const PARTY = [0, 10.9];
const party = new THREE.Group(); party.position.set(PARTY[0], 0, PARTY[1]); party.rotation.y = Math.PI; scene.add(party);
M(new THREE.BoxGeometry(3.6, 0.4, 1.8), mat("#b5562a"), 0, 0.2, 0, party);
const tarpP = M(new THREE.BoxGeometry(3.4, 1.3, 1.6), mat("#2f6fd1", { roughness: 0.85 }), 0, 1.05, 0, party);
[-1.2, 0, 1.2].forEach((x) => M(new THREE.BoxGeometry(0.06, 1.32, 1.62), mat("#24508f"), x, 1.05, 0, party));
const BAL = ["#e0384b", "#ffd84a", "#2fa04a", "#2f6fd1", "#ff7eb6", "#e8742a", "#8a4fd1", "#fbfaf6"];
const balloons = Array.from({ length: 10 }, (_, k) => { const g = new THREE.Group(); const x = -1.6 + k * 0.36, y = 2.5 + hash(k + 800) * 0.6; g.position.set(x, y, -0.5 + hash(k + 801) * 0.4); party.add(g);
  const b = M(new THREE.SphereGeometry(0.17, 14, 10), mat(BAL[k % 8], { roughness: 0.3 }), 0, 0, 0, g); b.scale.set(1, 1.2, 1);
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(0, -(y - 1.7), 0)]), new THREE.LineBasicMaterial({ color: "#555" }))); return g; });
const tumpeng = new THREE.Group(); tumpeng.position.set(-2.3, 0, 0.6); party.add(tumpeng);
M(new THREE.CylinderGeometry(0.35, 0.35, 0.7, 12), mat("#8a5a3a"), 0, 0.35, 0, tumpeng); M(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 20), mat("#5aa83c"), 0, 0.72, 0, tumpeng);
M(new THREE.ConeGeometry(0.3, 0.6, 18), mat("#f2c84b"), 0, 1.04, 0, tumpeng);
const waitSign = liveSign(768, 320, (c, w, h, v) => { c.fillStyle = "#fffdf4"; c.fillRect(0, 0, w, h); c.fillStyle = "#d8263a"; c.fillRect(0, 0, w, 96);
  c.fillStyle = "#fff"; c.font = "900 52px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("PESTA PELANTIKAN", w / 2, 50);
  c.fillStyle = "#3a2414"; c.font = "800 40px Poppins"; c.fillText("menunggu 500 rakyat", w / 2, 140);
  c.fillStyle = "#ddd"; c.fillRect(70, 190, w - 140, 44); c.fillStyle = v.hot ? "#e0384b" : "#ffb02e"; c.fillRect(70, 190, (w - 140) * 0.99, 44);
  c.fillStyle = "#3a2414"; c.font = "900 48px 'Archivo Black'"; c.fillText("495 / 500", w / 2, 280); });
const waitG = new THREE.Group(); waitG.position.set(0, 0, 1.25); party.add(waitG);
[-1.1, 1.1].forEach((x) => M(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 8), mat("#fff", { map: stripe }), x, 1.1, 0, waitG));
M(new THREE.BoxGeometry(2.4, 1.0, 0.05), mat("#fff", { map: waitSign.tex }), 0, 1.75, 0, waitG);
// application folders for the job-seekers
const folders23 = Q23.map((c) => { const f = M(new THREE.BoxGeometry(0.22, 0.28, 0.03), mat("#f2c84b"), 0, 0.7, 0.24, c.userData.body); f.rotation.x = -0.2; f.visible = false; return f; });


// ---------- EP 007: the Kas Negara (a giant clay celengan ayam), the party uncovered, the hospital plot on a tiny budget ----------
const rupiah = (n) => "🪙 " + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const KAS = [1.3, -0.35];
const kasG = new THREE.Group(); kasG.position.set(KAS[0], 0, KAS[1]); kasG.rotation.y = 0.3; scene.add(kasG);
const clay = mat("#d9783a", { roughness: 0.75 }), clayD = mat("#a8501f", { roughness: 0.8 });
M(new THREE.CylinderGeometry(0.75, 0.85, 0.35, 28), mat("#fff", { map: stripe }), 0, 0.175, 0, kasG);
const hen = new THREE.Group(); hen.position.set(0, 0.35, 0); kasG.add(hen);
M(new THREE.SphereGeometry(0.6, 28, 20), clay, 0, 0.62, 0, hen).scale.set(1.15, 0.95, 0.85);
M(new THREE.SphereGeometry(0.3, 20, 14), clay, 0.55, 1.15, 0, hen);
[-0.1, 0.02, 0.14].forEach((x, k) => M(new THREE.SphereGeometry(0.09 - k * 0.012, 12, 10), mat("#d8263a"), 0.5 + x, 1.47 - Math.abs(x) * 0.6, 0, hen));
M(new THREE.ConeGeometry(0.08, 0.2, 12), mat("#f2c84b"), 0.88, 1.12, 0, hen).rotation.z = -Math.PI / 2;
M(new THREE.SphereGeometry(0.07, 12, 10), mat("#d8263a"), 0.76, 0.98, 0, hen).scale.set(0.7, 1.3, 0.7);
[-1, 1].forEach((k) => { M(new THREE.SphereGeometry(0.05, 10, 8), mat("#fff"), 0.68, 1.2, k * 0.2, hen); M(new THREE.SphereGeometry(0.028, 8, 6), mat("#1a1414"), 0.71, 1.2, k * 0.225, hen); });
for (let k = 0; k < 5; k++) { const f = M(new THREE.SphereGeometry(0.2, 12, 10), k % 2 ? clayD : clay, -0.62 - k * 0.02, 0.95 + k * 0.08, (k - 2) * 0.1, hen); f.scale.set(0.35, 1.4, 0.4); f.rotation.z = 0.5 + k * 0.05; }
[0, 1, 2, 3, 4, 5].forEach((k) => M(new THREE.SphereGeometry(0.06, 10, 8), mat(["#ffd84a", "#2fa04a", "#fbfaf6", "#2f6fd1", "#ffd84a", "#e0384b"][k]), -0.25 + (k % 3) * 0.25, 0.5 + Math.floor(k / 3) * 0.25, 0.5, hen));
M(new THREE.BoxGeometry(0.34, 0.03, 0.07), mat("#1a1414"), -0.05, 1.18, 0, hen);
const kasSign = liveSign(768, 384, (c, w, h, v) => { c.fillStyle = "#24324f"; c.fillRect(0, 0, w, h); c.strokeStyle = "#ffd84a"; c.lineWidth = 14; c.strokeRect(7, 7, w - 14, h - 14);
  c.fillStyle = "#ffd84a"; c.font = "900 84px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("KAS NEGARA", w / 2, 82);
  const rs = rupiah(v.rp || 0); c.fillStyle = v.hot ? "#ff6a6a" : "#fff"; c.font = `900 ${rs.length > 12 ? 74 : rs.length > 10 ? 92 : 110}px 'Archivo Black'`; c.fillText(rs, w / 2, 220);
  c.fillStyle = "#c9d6f2"; c.font = "800 34px Poppins"; c.fillText(v.goal ? "target rumah sakit: 🪙 100.000.000" : "KOIN CITIZENESIA · uang mainan", w / 2, 330); });
const kasBoard = new THREE.Group(); kasBoard.position.set(-0.1, 0, -0.75); kasG.add(kasBoard);
[-0.95, 0.95].forEach((x) => M(new THREE.CylinderGeometry(0.06, 0.06, 3.0, 8), mat("#fff", { map: stripe }), x, 1.5, 0, kasBoard));
M(new THREE.BoxGeometry(2.0, 1.0, 0.06), mat("#fff", { map: kasSign.tex }), 0, 2.45, 0.04, kasBoard);
const goldC = mat("#f2c84b", { metalness: 0.7, roughness: 0.25 });
const kcoins = Array.from({ length: 12 }, () => { const c = M(new THREE.CylinderGeometry(0.09, 0.09, 0.025, 18), goldC, 0, 0, 0, kasG); c.visible = false; return c; });
// the party set: lift the tarp, a 500 balloon arch and a banner under it; the new VP with a plate of ayam penyet next to the tumpeng
const tarpParts = party.children.filter((m) => m.isMesh && m.geometry.type === "BoxGeometry" && (m === tarpP || (m.geometry.parameters.width === 0.06 && m.geometry.parameters.height === 1.32)));
const pBan = liveSign(1024, 256, (c, w, h) => { c.fillStyle = "#d8263a"; c.fillRect(0, 0, w, h); c.strokeStyle = "#ffd84a"; c.lineWidth = 12; c.strokeRect(6, 6, w - 12, h - 12);
  c.fillStyle = "#fff"; c.font = "900 104px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("PESTA 500 RAKYAT!", w / 2, 108); c.fillStyle = "#ffd84a"; c.font = "800 44px Poppins"; c.fillText("panitia: @m.bilal26_lb", w / 2, 200); });
const under = new THREE.Group(); party.add(under);
[-1.6, 1.6].forEach((x) => M(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 8), mat("#fff", { map: stripe }), x, 1.7, -0.6, under));
M(new THREE.BoxGeometry(3.3, 0.8, 0.05), mat("#fff", { map: pBan.tex }), 0, 2.55, -0.6, under);
const dig = (ch) => liveSign(256, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#e8b82a"; c.strokeStyle = "#8a5a1a"; c.lineWidth = 10; c.font = "900 230px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.strokeText(ch, w / 2, h / 2 + 10); c.fillText(ch, w / 2, h / 2 + 10); });
const digits = ["5", "0", "0"].map((ch, k) => { const s = dig(ch); const m = M(new THREE.PlaneGeometry(0.75, 0.75), new THREE.MeshStandardMaterial({ map: s.tex, transparent: true, metalness: 0.2, roughness: 0.4, emissive: "#ffcf40", emissiveMap: s.tex, emissiveIntensity: 0.55, side: THREE.DoubleSide }), -0.75 + k * 0.75, 1.15, 0.3, under); m.castShadow = false; return { m, s }; });
const speakers = [-1.35, 1.35].map((x) => M(new THREE.BoxGeometry(0.4, 0.7, 0.35), mat("#2b2b2e"), x, 0.75, 0.35, under));
party.add(newVP); newVP.visible = true; newVP.position.set(-1.6, 0.4, 0.85); newVP.rotation.set(0, 0, 0); newVP.userData.legs.forEach((l) => (l.rotation.x = 0));
const vpPlate = new THREE.Group(); vpPlate.position.set(0, -0.32, 0.1); newVP.userData.arms[1].add(vpPlate);
M(new THREE.CylinderGeometry(0.16, 0.13, 0.025, 18), mat("#fbfaf6", { roughness: 0.25 }), 0, 0, 0, vpPlate);
const vpAyam = M(new THREE.SphereGeometry(0.1, 12, 8), mat("#c98a3a"), 0, 0.05, 0, vpPlate); vpAyam.scale.set(1.3, 0.55, 1);
M(new THREE.SphereGeometry(0.035, 8, 6), mat("#d8263a"), 0.08, 0.05, 0.05, vpPlate);
const vpTagS = liveSign(384, 96, (c, w, h) => { c.fillStyle = "#2fa04a"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.font = "900 46px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("WAPRES", w / 2, h / 2 + 3); });
M(new THREE.BoxGeometry(0.5, 0.13, 0.02), mat("#fff", { map: vpTagS.tex }), 0, 1.5, 0, newVP.userData.body);
const miniT = new THREE.Group(); miniT.position.set(0, 0.74, 0); tumpeng.add(miniT);
// the hospital plot, right of the party: stakes and rope, a sign that pops on "menang", a folding mattress, a box of plasters, two doctors, the budget board
const RS = [4.4, 10.2];
const rsG = new THREE.Group(); rsG.position.set(RS[0], 0, RS[1]); rsG.rotation.y = Math.PI; scene.add(rsG);
M(new THREE.BoxGeometry(2.8, 0.03, 2.6), mat("#c9b48a"), 0, 0.02, 0, rsG);
[[-1.35, -1.25], [1.35, -1.25], [1.35, 1.25], [-1.35, 1.25]].forEach(([a, b]) => M(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 6), mat("#8a5a3a"), a, 0.25, b, rsG));
const rsSign = liveSign(1024, 420, (c, w, h) => { c.fillStyle = "#fffdf4"; c.fillRect(0, 0, w, h); c.fillStyle = "#d8263a"; c.fillRect(40, 60, 70, 210); c.fillRect(-35 + 40, 130, 210, 70);
  c.fillStyle = "#d8263a"; c.font = "900 96px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("RUMAH SAKIT", w / 2 + 70, 110);
  c.fillStyle = "#24324f"; c.font = "900 66px 'Archivo Black'"; c.fillText("CITIZENESIA", w / 2 + 70, 215);
  c.fillStyle = "#8a7a66"; c.font = "800 44px Poppins"; c.fillText("(sesuai anggaran: 🪙 520 rb)", w / 2, 340); });
const rsBoard = new THREE.Group(); rsBoard.position.set(0, 0, -1.15); rsG.add(rsBoard);
[-1.1, 1.1].forEach((x) => M(new THREE.CylinderGeometry(0.06, 0.06, 2.9, 8), mat("#fff", { map: stripe }), x, 1.45, 0, rsBoard));
const rsPanel = M(new THREE.BoxGeometry(2.4, 0.98, 0.06), mat("#fff", { map: rsSign.tex }), 0, 2.3, 0.04, rsBoard);
const mattress = new THREE.Group(); mattress.position.set(0.15, 0.04, 0.05); rsG.add(mattress);
const tick = canTex(128, 128, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#fbfaf6" : "#5b8fd6"; c.fillRect(i * 16, 0, 16, h); } });
M(new THREE.BoxGeometry(0.62, 0.09, 1.0), mat("#fff", { map: tick }), 0, 0.045, 0, mattress);
const flap = new THREE.Group(); flap.position.set(0, 0.09, -0.5); mattress.add(flap); M(new THREE.BoxGeometry(0.62, 0.09, 0.5), mat("#fff", { map: tick }), 0, 0.045, 0.25, flap);
const plBox = new THREE.Group(); plBox.position.set(-0.75, 0, 0.45); rsG.add(plBox);
M(new THREE.CylinderGeometry(0.16, 0.16, 0.42, 12), mat("#e0384b"), 0, 0.21, 0, plBox);
const plS = liveSign(256, 128, (c, w, h) => { c.fillStyle = "#fbfaf6"; c.fillRect(0, 0, w, h); c.fillStyle = "#d8263a"; c.font = "900 50px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("PLESTER", w / 2, 50); c.fillStyle = "#8a7a66"; c.font = "800 30px Poppins"; c.fillText("isi 10", w / 2, 100); });
M(new THREE.BoxGeometry(0.3, 0.14, 0.2), mat("#fff", { map: plS.tex }), 0, 0.49, 0, plBox);
const flag = new THREE.Group(); flag.position.set(1.15, 0, -0.95); rsG.add(flag); M(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), mat("#c9a66b"), 0, 1.1, 0, flag);
const fTex = canTex(128, 96, (c, w, h) => { c.fillStyle = "#fff"; c.fillRect(0, 0, w, h); c.fillStyle = "#d8263a"; c.fillRect(50, 14, 28, 68); c.fillRect(30, 34, 68, 28); });
const flagCloth = M(new THREE.PlaneGeometry(0.6, 0.45), mat("#fff", { map: fTex, side: THREE.DoubleSide }), 0.31, 1.95, 0, flag);
const docTag = (t1, t2, col) => liveSign(512, 160, (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h); c.strokeStyle = "#fff"; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12);
  c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "900 58px 'Archivo Black'"; c.fillText(t1, w / 2, 58); c.font = "800 34px Poppins"; c.fillText(t2, w / 2, 118); });
const DOCS = [[-0.62, 0.75, 911, docTag("dr. MANDA", "@manda__2609", "#2f6fd1")], [0.95, 0.65, 932, docTag("drg. SHERLY", "@sherly60887", "#2fa04a")]].map(([x, z, i, s], k) => {
  const c = citizen(i); c.position.set(x, 0, z); c.scale.setScalar(1.15); rsG.add(c);
  M(new THREE.CylinderGeometry(0.175, 0.215, 0.52, 12), mat("#fbfaf6"), 0, 0.6, 0, c.userData.body);
  M(new THREE.TorusGeometry(0.1, 0.012, 6, 16, Math.PI), mat("#333"), 0, 0.78, 0.16, c.userData.body).rotation.z = Math.PI;
  if (k === 1) { const tooth = M(new THREE.SphereGeometry(0.08, 12, 10), mat("#fff", { roughness: 0.2 }), 0, -0.36, 0.08, c.userData.arms[1]); tooth.scale.set(1, 1.3, 0.8); }
  const tag = M(new THREE.BoxGeometry(0.85, 0.27, 0.02), mat("#fff", { map: s.tex }), 0, 1.6, 0, c.userData.body); return { c, s, tag, k };
});
const budS = liveSign(512, 384, (c, w, h, v) => { c.fillStyle = "#fffdf4"; c.fillRect(0, 0, w, h); c.fillStyle = "#24324f"; c.fillRect(0, 0, w, 90);
  c.fillStyle = "#ffd84a"; c.font = "900 54px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("DANA RS", w / 2, 48);
  c.fillStyle = "#3a2414"; c.font = "900 56px 'Archivo Black'"; c.fillText("🪙 520 rb", w / 2, 150); c.font = "800 34px Poppins"; c.fillStyle = "#8a7a66"; c.fillText("dari 🪙 100.000.000", w / 2, 206);
  c.fillStyle = "#ddd"; c.fillRect(40, 250, w - 80, 46); c.fillStyle = v.hot ? "#e0384b" : "#ffb02e"; c.fillRect(40, 250, Math.max(8, (w - 80) * 0.0052), 46);
  c.fillStyle = "#e0384b"; c.font = "900 44px 'Archivo Black'"; c.fillText("0,5% 😭", w / 2, 340); });
const bud = new THREE.Group(); bud.position.set(-1.05, 0, -0.35); bud.rotation.y = 0.35; rsG.add(bud);
[-0.42, 0.42].forEach((x) => M(new THREE.CylinderGeometry(0.035, 0.035, 1.6, 6), mat("#8a5a3a"), x, 0.8, 0, bud));
M(new THREE.BoxGeometry(1.0, 0.75, 0.04), mat("#fff", { map: budS.tex }), 0, 1.35, 0.03, bud);
rsG.traverse((m) => m.isMesh && (m.castShadow = true)); kasG.traverse((m) => m.isMesh && (m.castShadow = true));


// ---------- EP 008: Kas tembus 1 miliar: coin fountain, padlock, the doubled crowd, the 5-storey hospital, Manda redrawn, the school ghost ----------
const fcoins = Array.from({ length: 60 }, () => { const c = M(new THREE.CylinderGeometry(0.09, 0.09, 0.025, 14), goldC, 0, 0, 0, scene); c.visible = false; return c; });
const lock = new THREE.Group(); lock.position.set(0.05, 0.75, 0.55); hen.add(lock);
M(new THREE.BoxGeometry(0.42, 0.36, 0.14), mat("#e8b82a", { metalness: 0.7, roughness: 0.3 }), 0, 0, 0, lock);
M(new THREE.TorusGeometry(0.14, 0.035, 8, 20, Math.PI), mat("#bfc4c9", { metalness: 0.8, roughness: 0.25 }), 0, 0.18, 0, lock);
M(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 10), mat("#3a2414"), 0, -0.02, 0.075, lock).rotation.x = Math.PI / 2;
const chainL = Array.from({ length: 14 }, (_, k) => { const t = M(new THREE.TorusGeometry(0.07, 0.018, 6, 12), mat("#bfc4c9", { metalness: 0.8, roughness: 0.25 }), 0, 0, 0, hen); const a = -1.2 + k * 0.19; t.position.set(Math.sin(a) * 0.72, 0.62 + Math.cos(a * 1.3) * 0.12, Math.cos(a) * 0.55); t.rotation.set(k % 2 ? Math.PI / 2 : 0, a, 0); return t; });
const awasS = liveSign(512, 160, (c, w, h) => { c.fillStyle = "#ffd84a"; c.fillRect(0, 0, w, h); c.fillStyle = "#3a2414"; for (let i = -2; i < 12; i++) { c.beginPath(); c.moveTo(i * 60, 0); c.lineTo(i * 60 + 30, 0); c.lineTo(i * 60 - 10, 40); c.lineTo(i * 60 - 40, 40); c.fill(); }
  c.fillStyle = "#e0384b"; c.font = "900 76px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("AWAS MALING!", w / 2, 102); });
const awas = M(new THREE.BoxGeometry(1.1, 0.34, 0.03), mat("#fff", { map: awasS.tex }), -0.1, 1.05, 0.0, kasBoard);
// more people: the crowd doubles (564 -> 1.134)
const more2 = Array.from({ length: 50 }, (_, n) => {
  const c = citizen(700 + n); let x, z;
  if (n < 22) { x = -3.6 + (n % 11) * 0.72 + (hash(n + 900) - 0.5) * 0.15; z = n < 11 ? 8.35 : 8.8; }
  else { const m = n - 22; x = -5.4 - (m % 5) * 0.55 + (hash(n + 901) - 0.5) * 0.12; z = 0.8 + Math.floor(m / 5) * 0.62; }
  c.userData.sitFace = n < 22 ? Math.PI + (hash(n + 902) - 0.5) * 0.5 : Math.atan2(0 - x, -1.6 - z); c.position.set(x, 0, z); c.scale.setScalar(1.15); c.visible = false; scene.add(c); return c;
});
// the luxury hospital: five glass floors, a glass lift, AC units, a rooftop helipad with a helicopter, a ribbon between two gold stanchions
const FL = 0.78, TW = 2.6, TD = 1.5;
const tower = new THREE.Group(); tower.position.set(0, 0, -0.55); rsG.add(tower);
const glassTex = canTex(512, 512, (c, w, h) => { c.fillStyle = "#e9eef2"; c.fillRect(0, 0, w, h);
  for (let f = 0; f < 5; f++) for (let k = 0; k < 6; k++) { const g = c.createLinearGradient(0, 0, 0, 90); g.addColorStop(0, "#7fc3ea"); g.addColorStop(1, "#2f7fb8"); c.fillStyle = g; c.fillRect(14 + k * 83, 14 + f * 102, 70, 80); }
  c.fillStyle = "#c9d3db"; for (let f = 0; f <= 5; f++) c.fillRect(0, f * 102 + 2, w, 8); });
const glassM = mat("#fff", { map: glassTex, roughness: 0.2, metalness: 0.3 });
const body5 = M(new THREE.BoxGeometry(TW, FL * 5, TD), [mat("#e9eef2"), mat("#e9eef2"), mat("#dfe5ea"), mat("#dfe5ea"), glassM, mat("#e9eef2")], 0, FL * 2.5, 0, tower);
const rsTop = liveSign(1024, 200, (c, w, h) => { c.fillStyle = "#fff"; c.fillRect(0, 0, w, h); c.fillStyle = "#d8263a"; c.fillRect(80, 30, 44, 140); c.fillRect(32, 78, 140, 44);
  c.font = "900 104px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("RS CITIZENESIA", w / 2 + 80, 108); });
const topSign = M(new THREE.BoxGeometry(TW * 0.95, 0.42, 0.05), mat("#fff", { map: rsTop.tex }), 0, FL * 5 + 0.3, TD / 2 + 0.02, tower);
M(new THREE.BoxGeometry(TW + 0.1, 0.08, TD + 0.1), mat("#c9d3db"), 0, FL * 5 + 0.04, 0, tower);
const canopy = M(new THREE.BoxGeometry(1.4, 0.06, 0.6), mat("#d8263a"), 0, 0.9, TD / 2 + 0.3, tower);
[-0.6, 0.6].forEach((x) => M(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), mat("#c9d3db"), x, 0.45, TD / 2 + 0.55, tower));
const liftShaft = M(new THREE.BoxGeometry(0.42, FL * 5, 0.3), mat("#bfe6ff", { transparent: true, opacity: 0.35, roughness: 0.1 }), TW / 2 + 0.24, FL * 2.5, 0.35, tower);
const liftCar = M(new THREE.BoxGeometry(0.36, 0.5, 0.26), mat("#ffd84a", { metalness: 0.4, roughness: 0.3 }), TW / 2 + 0.24, 0.3, 0.35, tower);
const acs = Array.from({ length: 8 }, (_, k) => { const a = M(new THREE.BoxGeometry(0.1, 0.22, 0.34), mat("#f4f4f4"), -TW / 2 - 0.06, FL * (0.5 + (k % 4)) + 0.2, -0.35 + Math.floor(k / 4) * 0.7, tower); M(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12), mat("#999"), -0.05, 0, 0, a).rotation.z = Math.PI / 2; return a; });
const pad = new THREE.Group(); pad.position.set(0, FL * 5 + 0.09, 0); tower.add(pad);
const hTex = canTex(256, 256, (c, w, h) => { c.fillStyle = "#3a3d42"; c.beginPath(); c.arc(128, 128, 126, 0, 7); c.fill(); c.strokeStyle = "#ffd84a"; c.lineWidth = 10; c.beginPath(); c.arc(128, 128, 104, 0, 7); c.stroke();
  c.fillStyle = "#fff"; c.font = "900 150px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("H", 128, 138); });
M(new THREE.CylinderGeometry(0.68, 0.68, 0.04, 32), mat("#fff", { map: hTex }), 0, 0, 0, pad);
const heli = new THREE.Group(); tower.add(heli);
M(new THREE.SphereGeometry(0.28, 16, 12), mat("#e0384b", { roughness: 0.4 }), 0, 0.3, 0, heli).scale.set(1.5, 1, 1);
M(new THREE.SphereGeometry(0.18, 12, 10), mat("#bfe6ff", { transparent: true, opacity: 0.7 }), 0.3, 0.36, 0, heli);
M(new THREE.CylinderGeometry(0.05, 0.03, 0.7, 8), mat("#e0384b"), -0.65, 0.36, 0, heli).rotation.z = Math.PI / 2;
[-0.12, 0.12].forEach((z) => M(new THREE.BoxGeometry(0.7, 0.03, 0.03), mat("#555"), 0, 0.05, z, heli));
const rotor = new THREE.Group(); rotor.position.set(0, 0.62, 0); heli.add(rotor); M(new THREE.BoxGeometry(1.5, 0.02, 0.08), mat("#333"), 0, 0, 0, rotor); M(new THREE.BoxGeometry(0.08, 0.02, 1.5), mat("#333"), 0, 0, 0, rotor);
const dust = Array.from({ length: 14 }, () => M(new THREE.SphereGeometry(0.3, 10, 8), mat("#e8dcc2", { transparent: true, opacity: 0.7, depthWrite: false }), 0, 0, 0, rsG));
const ribG = new THREE.Group(); ribG.position.set(0, 0, 1.05); rsG.add(ribG);
[-1.25, 1.25].forEach((x) => { M(new THREE.CylinderGeometry(0.04, 0.05, 1.0, 10), goldM, x, 0.5, 0, ribG); M(new THREE.SphereGeometry(0.07, 10, 8), goldM, x, 1.03, 0, ribG); });
const ribs = [-1, 1].map((k) => { const g = new THREE.Group(); g.position.set(k * 1.25, 0.92, 0); ribG.add(g); M(new THREE.BoxGeometry(1.25, 0.1, 0.02), ribM, -k * 0.625, 0, 0, g); return { g, k }; });
const bowR = M(new THREE.SphereGeometry(0.12, 12, 10), mat("#b01a2c"), 0, 0.92, 0.02, ribG);
// Manda redrawn: long hair, a pink clip
const mandaF = (() => { const c = citizen(915); c.position.set(-1.7, 0, 0.75); c.scale.setScalar(1.15); rsG.add(c);
  M(new THREE.CylinderGeometry(0.175, 0.215, 0.52, 12), mat("#fbfaf6"), 0, 0.6, 0, c.userData.body);
  M(new THREE.TorusGeometry(0.1, 0.012, 6, 16, Math.PI), mat("#333"), 0, 0.78, 0.16, c.userData.body).rotation.z = Math.PI;
  c.userData.body.children.forEach((m) => { if (m.isMesh && m.geometry.type === "SphereGeometry" && m.geometry.parameters.radius > 0.19 && m.geometry.parameters.radius < 0.21) m.material = mat("#3a2414"); });
  M(new THREE.SphereGeometry(0.205, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat("#3a2414"), 0, 1.04, -0.01, c.userData.body);
  const back = M(new THREE.CylinderGeometry(0.19, 0.16, 0.5, 14, 1, true, Math.PI * 0.6, Math.PI * 0.8), mat("#3a2414", { side: THREE.DoubleSide }), 0, 0.86, -0.02, c.userData.body); 
  M(new THREE.SphereGeometry(0.05, 10, 8), mat("#ff7eb6"), 0.15, 1.13, 0.08, c.userData.body);
  [-1, 1].forEach((k) => M(new THREE.BoxGeometry(0.07, 0.42, 0.16), mat("#3a2414"), k * 0.19, 0.86, 0.0, c.userData.body));
  M(new THREE.BoxGeometry(0.85, 0.27, 0.02), mat("#fff", { map: DOCS[0].s.tex }), 0, 1.6, 0, c.userData.body); c.visible = false; return c; })();
const revS = liveSign(384, 128, (c, w, h) => { c.strokeStyle = "#2fa04a"; c.lineWidth = 12; c.fillStyle = "rgba(255,255,255,.92)"; c.fillRect(8, 8, w - 16, h - 16); c.strokeRect(8, 8, w - 16, h - 16);
  c.fillStyle = "#2fa04a"; c.font = "900 62px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("DIREVISI ✓", w / 2, h / 2 + 4); });
const revStamp = M(new THREE.PlaneGeometry(0.8, 0.27), mat("#fff", { map: revS.tex, transparent: true, side: THREE.DoubleSide }), 0, 1.95, 0.05, mandaF.userData.body); revStamp.rotation.z = 0.15;
const puffM = Array.from({ length: 10 }, () => M(new THREE.SphereGeometry(0.16, 10, 8), mat("#fff", { transparent: true, opacity: 0.8, depthWrite: false }), 0, 0, 0, rsG));
// the school ghost on the left plot, with Tirta's pempek cart
const SK = [-4.4, 10.2];
const skG = new THREE.Group(); skG.position.set(SK[0], 0, SK[1]); skG.rotation.y = Math.PI; scene.add(skG);
M(new THREE.BoxGeometry(2.8, 0.03, 2.6), mat("#c9b48a"), 0, 0.02, 0, skG);
[[-1.35, -1.25], [1.35, -1.25], [1.35, 1.25], [-1.35, 1.25]].forEach(([a, b]) => M(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 6), mat("#8a5a3a"), a, 0.25, b, skG));
const ghostM = new THREE.MeshBasicMaterial({ color: "#7fc3ea", transparent: true, opacity: 0.18, depthWrite: false });
const ghost = M(new THREE.BoxGeometry(2.5, 2.4, 1.4), ghostM, 0, 1.2, -0.5, skG); ghost.castShadow = false;
const ghostEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.5, 2.4, 1.4)), new THREE.LineDashedMaterial({ color: "#2f7fb8", dashSize: 0.12, gapSize: 0.08 })); ghostEdge.position.set(0, 1.2, -0.5); ghostEdge.computeLineDistances(); skG.add(ghostEdge);
const ghostRoof = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.ConeGeometry(1.6, 0.8, 4)), new THREE.LineBasicMaterial({ color: "#2f7fb8" })); ghostRoof.position.set(0, 2.8, -0.5); ghostRoof.rotation.y = Math.PI / 4; skG.add(ghostRoof);
const skS = liveSign(1024, 420, (c, w, h, v) => { c.fillStyle = "#fffdf4"; c.fillRect(0, 0, w, h); c.fillStyle = "#2fa04a"; c.fillRect(0, 0, w, 110);
  c.fillStyle = "#fff"; c.font = "900 76px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("SEKOLAH CITIZENESIA", w / 2, 58);
  c.fillStyle = "#3a2414"; c.font = "800 44px Poppins"; c.fillText("+ kantin pempek @tirtaa11_", w / 2, 170);
  c.fillStyle = v.hot ? "#e0384b" : "#2f6fd1"; c.font = "900 64px 'Archivo Black'"; c.fillText("PILIHAN NO. 1 🗳️", w / 2, 270);
  c.fillStyle = "#8a7a66"; c.font = "800 40px Poppins"; c.fillText("vote di komen: 1 · 2 · 3 · 4", w / 2, 360); });
const skBoard = new THREE.Group(); skBoard.position.set(0, 0, 0.75); skG.add(skBoard);
[-1.05, 1.05].forEach((x) => M(new THREE.CylinderGeometry(0.05, 0.05, 1.9, 8), mat("#fff", { map: stripe }), x, 0.95, 0, skBoard));
M(new THREE.BoxGeometry(2.3, 0.94, 0.05), mat("#fff", { map: skS.tex }), 0, 1.45, 0.03, skBoard);
const cart = new THREE.Group(); cart.position.set(1.85, 0, 0.6); cart.rotation.y = -0.4; skG.add(cart);
M(new THREE.BoxGeometry(1.0, 0.55, 0.55), mat("#ffd84a"), 0, 0.65, 0, cart); M(new THREE.BoxGeometry(1.0, 0.35, 0.55), mat("#cfe8f5", { transparent: true, opacity: 0.5 }), 0, 1.1, 0, cart);
M(new THREE.BoxGeometry(1.1, 0.05, 0.65), mat("#e0384b"), 0, 1.3, 0, cart);
[-0.35, 0.35].forEach((x) => M(new THREE.TorusGeometry(0.2, 0.05, 8, 16), mat("#333"), x, 0.22, 0.3, cart));
const pmS = liveSign(256, 96, (c, w, h) => { c.fillStyle = "#fbfaf6"; c.fillRect(0, 0, w, h); c.fillStyle = "#d8263a"; c.font = "900 50px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("PEMPEK", w / 2, h / 2 + 2); });
M(new THREE.BoxGeometry(0.8, 0.28, 0.02), mat("#fff", { map: pmS.tex }), 0, 0.65, 0.29, cart);
for (let k = 0; k < 6; k++) M(new THREE.SphereGeometry(0.06, 8, 6), mat("#e2b56a"), -0.3 + k * 0.12, 0.98, 0, cart).scale.set(1.4, 0.7, 1);
const tears = Array.from({ length: 24 }, () => M(new THREE.SphereGeometry(0.035, 8, 6), mat("#7fd0ff", { transparent: true, opacity: 0.9 }), 0, 0, 0, scene));
[skG, tower, cart].forEach((g) => g.traverse((m) => m.isMesh && (m.castShadow = true))); more2.forEach((c) => c.traverse((m) => m.isMesh && (m.castShadow = true)));

// ---------- EP 009: Sekolah dibuka. The school rises (2 floors, roof, sign), a bell, a flag, the field, the pool, the kantin carts,
// the school staff with name tags, the giant phone of comments, the ambulance and new hospital staff, the lunch truck, the thief gang
// with a rat in a tie, the satpam chase, and the president's cat asleep in an ISTANA box ----------
const WORDS = window.__WORDS;
const W_ = (w, after = 0) => { for (const [, a, , x] of WORDS) if (a >= after && x.toLowerCase().replace(/[.,?!:…"]/g, "") === w) return a; console.warn("missing word", w); return 0; };
let FOLLOW = TM.follow || 1799; const FOLLOW0 = 1597;
export const setFollow = (n) => { if (n) FOLLOW = n; };
const T_2000 = W_("2000"), T_SEKOLAH0 = W_("sekolah"), T_DIBUKA = W_("dibuka"), T_HITUNG = W_("hitung"), T_MENANG = W_("menang"),
  T_B1 = W_("bangun"), T_B2 = W_("bangun", T_B1 + 0.1), T_B3 = W_("bangun", T_B2 + 0.1), T_KELAS = W_("kelas"), T_LAP = W_("lapangan"), T_KOLAM = W_("kolam"),
  T_KANTIN = W_("kantin"), T_RESMI = W_("resmi", T_KANTIN), T_BAPAK = W_("bapak"), T_KABUL = W_("kabulin"), T_KEPALA = W_("kepala"),
  T_OR = W_("olahraga"), T_VIVIN = W_("vivin"), T_EJA = W_("eja"), T_MTK = W_("matematika"), T_ING = W_("inggris"), T_KIM = W_("kimia"), T_BP = W_("bp"),
  T_SATP = W_("satpamnya"), T_IBU = W_("ibu"), T_CILOK = W_("cilok"), T_TAHU = W_("tahu"), T_MOCHI = W_("mochi"), T_RAME = W_("rame"),
  T_DOKTER = W_("dokter"), T_NIH = W_("nih"), T_DAPUR = W_("dapur"), T_MURID = W_("murid"), T_EH = W_("eh"), T_BANYAK = W_("banyak"), T_WISNU = W_("wisnu"),
  T_PEMPEK2 = W_("pempeknya"), T_DIBAWA = W_("dibawa"), T_SATPAM = W_("satpam", T_DIBAWA), T_TUH = W_("tuh"), T_TERUS = W_("terus"), T_KALIAN = W_("kalian", T_TERUS),
  T_SATU = W_("satu"), T_KOMEN2 = W_("komen", T_SATU), T_YANG = W_("yang", T_KOMEN2), T_SHARE = W_("share");
const S9 = [];
const sign9 = (w, h, f) => { const s = liveSign(w, h, f); S9.push(s); return s; };
const fit = (c, txt, font, size, maxW, min = 20) => { let f = size; c.font = font.replace("#", f); while (c.measureText(txt).width > maxW && f > min) { f -= 2; c.font = font.replace("#", f); } };
const tag9 = (t1, t2, col) => sign9(512, 160, (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h); c.strokeStyle = "#fff"; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12);
  c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle"; fit(c, t1, "900 #px 'Archivo Black'", 58, w - 44); c.fillText(t1, w / 2, 56);
  fit(c, t2, "800 #px Poppins", 38, w - 34); c.fillStyle = "#ffe98a"; c.fillText(t2, w / 2, 118); });
const tagOn = (c, s, y = 1.62, wd = 0.9) => M(new THREE.BoxGeometry(wd, wd * 0.3125, 0.02), mat("#fff", { map: s.tex }), 0, y, 0, c.userData.body);
const coat = (c, col, h = 0.52) => M(new THREE.CylinderGeometry(0.175, 0.215, h, 12), mat(col), 0, 0.6, 0, c.userData.body);
const inHand = (c, k = 1) => { const g = new THREE.Group(); g.position.set(0, -0.36, 0.05); c.userData.arms[k].add(g); return g; };
function person9(i, x, z, ry = Math.PI, s = 1.15, parent = scene) { const c = citizen(i); c.position.set(x, 0, z); c.rotation.y = ry; c.scale.setScalar(s); c.visible = false; parent.add(c); return c; }
const pop9 = (o, t, t0, s = 1.15, d = 0.35) => { const u = backOut(clamp((t - t0) / d)); o.visible = t > t0; o.scale.setScalar(s * Math.max(0.001, u)); return u; };
const shadowAll = (g) => g.traverse((m) => m.isMesh && (m.castShadow = true));

// the plot: hide the EP 008 board and the old pempek cart, keep the ghost for the hook
skBoard.visible = false; cart.visible = false;
const FH = 0.95, SW = 2.6, SD = 1.3;
const front = (floor) => canTex(512, 192, (c, w, h) => { c.fillStyle = "#f6e7c6"; c.fillRect(0, 0, w, h); c.fillStyle = "#e3c896"; c.fillRect(0, h - 16, w, 16);
  const n = 5; for (let k = 0; k < n; k++) { const x = 18 + k * 98; if (floor === 0 && k === 2) { c.fillStyle = "#7a4a2a"; c.fillRect(x + 6, 50, 78, 142); c.fillStyle = "#5a3418"; c.fillRect(x + 44, 50, 3, 142); continue; }
    c.fillStyle = "#fff"; c.fillRect(x, 34, 90, 104); const g = c.createLinearGradient(0, 40, 0, 132); g.addColorStop(0, "#9fd6f2"); g.addColorStop(1, "#4a9ad0"); c.fillStyle = g; c.fillRect(x + 7, 41, 76, 90);
    c.fillStyle = "#fff"; c.fillRect(x + 43, 41, 4, 90); c.fillRect(x + 7, 84, 76, 4); } });
const wall9M = mat("#f6e7c6"), sideM = mat("#efdcb4");
const floors = [0, 1].map((f) => { const g = new THREE.Group(); g.position.set(0, f * FH, -0.5); skG.add(g);
  M(new THREE.BoxGeometry(SW, FH, SD), [sideM, sideM, wall9M, wall9M, mat("#fff", { map: front(f) }), wall9M], 0, FH / 2, 0, g);
  M(new THREE.BoxGeometry(SW + 0.12, 0.08, SD + 0.12), mat("#c9a66b"), 0, FH, 0, g); g.visible = false; return g; });
const roof9 = new THREE.Group(); roof9.position.set(0, FH * 2 + 0.04, -0.5); skG.add(roof9);
[-1, 1].forEach((k) => { const r = M(new THREE.BoxGeometry(SW + 0.4, 0.09, SD * 0.62), mat("#c0532f"), 0, 0.3, k * SD * 0.27, roof9); r.rotation.x = k * 0.55; });
const gab = new THREE.Shape(); gab.moveTo(-SD / 2, 0); gab.lineTo(SD / 2, 0); gab.lineTo(0, 0.6);
[-SW / 2, SW / 2].forEach((x) => { const g = M(new THREE.ShapeGeometry(gab), mat("#f6e7c6", { side: THREE.DoubleSide }), x, 0, 0, roof9); g.rotation.y = Math.PI / 2; });
const schS = sign9(1024, 200, (c, w, h) => { c.fillStyle = "#2fa04a"; c.fillRect(0, 0, w, h); c.strokeStyle = "#ffd84a"; c.lineWidth = 12; c.strokeRect(6, 6, w - 12, h - 12);
  c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "900 86px 'Archivo Black'"; c.fillText("SEKOLAH CITIZENESIA", w / 2, 82); c.fillStyle = "#ffd84a"; c.font = "800 40px Poppins"; c.fillText("hasil vote rakyat · EP 009", w / 2, 156); });
const schSign = M(new THREE.BoxGeometry(SW * 0.92, 0.46, 0.05), mat("#fff", { map: schS.tex }), 0, 0.18, SD / 2 + 0.12, roof9);
const kidsW = Array.from({ length: 8 }, (_, k) => { const f = k < 4 ? 0 : 1, slot = [0, 1, 3, 4][k % 4]; const x = -SW / 2 + (18 + slot * 98 + 45) / 512 * SW;
  const g = new THREE.Group(); g.position.set(x, f * FH + FH * (1 - 0.6 * 0.5) + 0.02, -0.5 + SD / 2 - 0.08); skG.add(g);
  M(new THREE.SphereGeometry(0.1, 12, 10), mat(SKIN[k % 4]), 0, 0, 0, g); M(new THREE.SphereGeometry(0.104, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(k % 3 === 1 ? "#e98fb0" : "#231e1b"), 0, 0.01, 0, g);
  [-1, 1].forEach((s) => M(new THREE.SphereGeometry(0.016, 6, 4), mat("#1a1414"), s * 0.035, 0.01, 0.095, g)); g.visible = false; return g; });
const kelasS = sign9(256, 96, (c, w, h) => { c.fillStyle = "#24324f"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.font = "900 54px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("KELAS 1", w / 2, h / 2 + 3); });
const kelasP = M(new THREE.BoxGeometry(0.5, 0.19, 0.03), mat("#fff", { map: kelasS.tex }), 0, FH + 0.02, SD / 2 + 0.03, floors[0]); kelasP.position.y = FH - 0.1;
const dust9 = Array.from({ length: 16 }, () => M(new THREE.SphereGeometry(0.3, 10, 8), mat("#e8dcc2", { transparent: true, opacity: 0.7, depthWrite: false }), 0, 0, 0, skG));
// the school bell on a wooden frame, the flag
const bell9 = new THREE.Group(); bell9.position.set(-2.45, 0, 9.35); scene.add(bell9);
[-0.45, 0.45].forEach((x) => M(new THREE.BoxGeometry(0.1, 1.9, 0.1), mat("#8a5a3a"), x, 0.95, 0, bell9)); M(new THREE.BoxGeometry(1.1, 0.12, 0.14), mat("#6b4428"), 0, 1.9, 0, bell9);
const bellSw = new THREE.Group(); bellSw.position.set(0, 1.84, 0); bell9.add(bellSw);
M(new THREE.CylinderGeometry(0.16, 0.3, 0.42, 20, 1, true), mat("#e8b82a", { metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide }), 0, -0.26, 0, bellSw); M(new THREE.SphereGeometry(0.16, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat("#e8b82a", { metalness: 0.7, roughness: 0.3 }), 0, -0.05, 0, bellSw);
const clapper = M(new THREE.SphereGeometry(0.06, 10, 8), mat("#6b4428"), 0, -0.48, 0, bellSw);
const rings = Array.from({ length: 3 }, () => M(new THREE.TorusGeometry(0.3, 0.025, 6, 32), new THREE.MeshBasicMaterial({ color: "#ffd84a", transparent: true, opacity: 0, depthWrite: false }), 0, 1.6, 0.05, bell9));
const flag9 = new THREE.Group(); flag9.position.set(-3.05, 0, 9.0); scene.add(flag9); M(new THREE.CylinderGeometry(0.03, 0.035, 3.0, 8), mat("#d9d9d9", { metalness: 0.6, roughness: 0.3 }), 0, 1.5, 0, flag9);
const flTex = canTex(128, 96, (c, w, h) => { c.fillStyle = "#2fa04a"; c.fillRect(0, 0, w, h); c.fillStyle = "#ffd84a"; c.font = "900 40px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("C", w / 2, h / 2 + 2); });
const flagC = M(new THREE.PlaneGeometry(0.62, 0.42), mat("#fff", { map: flTex, side: THREE.DoubleSide }), 0.32, 0.5, 0, flag9);
// ribbon across the school front
const rib9 = new THREE.Group(); rib9.position.set(-4.4, 0, 9.3); scene.add(rib9);
[-1.05, 1.05].forEach((x) => { M(new THREE.CylinderGeometry(0.04, 0.05, 1.0, 10), goldM, x, 0.5, 0, rib9); M(new THREE.SphereGeometry(0.07, 10, 8), goldM, x, 1.03, 0, rib9); });
const ribs9 = [-1, 1].map((k) => { const g = new THREE.Group(); g.position.set(k * 1.05, 0.92, 0); rib9.add(g); M(new THREE.BoxGeometry(1.05, 0.1, 0.02), ribM, -k * 0.525, 0, 0, g); return { g, k }; });
const bow9 = M(new THREE.SphereGeometry(0.12, 12, 10), mat("#b01a2c"), 0, 0.92, 0.02, rib9);
// the field and the pool (left of the school)
const fieldG = new THREE.Group(); fieldG.position.set(-9.0, 0, 11.5); scene.add(fieldG);
const fTex9 = canTex(512, 336, (c, w, h) => { for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? "#5fae48" : "#69b852"; c.fillRect(k * 64, 0, 64, h); }
  c.strokeStyle = "#fff"; c.lineWidth = 6; c.strokeRect(12, 12, w - 24, h - 24); c.beginPath(); c.moveTo(w / 2, 12); c.lineTo(w / 2, h - 12); c.stroke(); c.beginPath(); c.arc(w / 2, h / 2, 50, 0, 7); c.stroke();
  c.strokeRect(12, h / 2 - 70, 60, 140); c.strokeRect(w - 72, h / 2 - 70, 60, 140); });
M(new THREE.BoxGeometry(3.4, 0.04, 2.25), [mat("#5fae48"), mat("#5fae48"), mat("#fff", { map: fTex9 }), mat("#5fae48"), mat("#5fae48"), mat("#5fae48")], 0, 0.03, 0, fieldG);
[-1.62, 1.62].forEach((x) => { const g = new THREE.Group(); g.position.set(x, 0, 0); fieldG.add(g); [-0.4, 0.4].forEach((z) => M(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6), mat("#fff"), 0, 0.3, z, g)); M(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6), mat("#fff"), 0, 0.6, 0, g).rotation.x = Math.PI / 2;
  M(new THREE.PlaneGeometry(0.8, 0.6), mat("#fff", { transparent: true, opacity: 0.35, side: THREE.DoubleSide }), -Math.sign(x) * -0.15, 0.3, 0, g).rotation.y = Math.PI / 2; });
const ball9 = M(new THREE.SphereGeometry(0.1, 14, 10), mat("#fbfaf6"), 0.3, 0.12, 0.2, fieldG);
const poolG = new THREE.Group(); poolG.position.set(-12.0, 0, 11.4); scene.add(poolG);
M(new THREE.BoxGeometry(1.7, 0.16, 2.5), mat("#fbfaf6"), 0, 0.08, 0, poolG);
const water = M(new THREE.BoxGeometry(1.45, 0.04, 2.25), mat("#3fb3e6", { roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.85 }), 0, 0.15, 0, poolG);
const ladder = new THREE.Group(); ladder.position.set(0.72, 0.16, -0.7); poolG.add(ladder); [-0.12, 0.12].forEach((z) => M(new THREE.TorusGeometry(0.12, 0.018, 6, 12, Math.PI), mat("#d9d9d9", { metalness: 0.6 }), 0, 0.1, z, ladder).rotation.y = Math.PI / 2);
const ring9 = M(new THREE.TorusGeometry(0.2, 0.07, 8, 18), mat("#e0384b"), -0.2, 0.2, 0.3, poolG); ring9.rotation.x = Math.PI / 2;
const poolS = sign9(512, 220, (c, w, h) => { c.fillStyle = "#2f7fb8"; c.fillRect(0, 0, w, h); c.strokeStyle = "#fff"; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12);
  c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "900 58px 'Archivo Black'"; c.fillText("KOLAM RENANG", w / 2, 72); c.fillStyle = "#ffe98a"; c.font = "800 40px Poppins"; c.fillText("usul @keijih18", w / 2, 154); });
const poolB = new THREE.Group(); poolB.position.set(0.95, 0, -1.2); poolB.rotation.y = Math.PI + 0.5; poolG.add(poolB);
[-0.5, 0.5].forEach((x) => M(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6), mat("#8a5a3a"), x, 0.7, 0, poolB)); M(new THREE.BoxGeometry(1.15, 0.5, 0.04), mat("#fff", { map: poolS.tex }), 0, 1.2, 0.02, poolB);
// kantin carts with their sellers
const stripe2 = canTex(64, 256, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#fbfaf6" : "#2f6fd1"; c.fillRect(0, i * 32, w, 32); } });
const CARTS = [["PEMPEK", "#ffd84a", "KANTIN PEMPEK", "@tirtaa11_", -6.45, 8.95, "#e2b56a"], ["CILOK", "#e0384b", "CILOK", "@gilangaria18", -7.65, 8.85, "#d9c9a8"],
  ["TAHU BULAT", "#e8742a", "TAHU BULAT", "@turokzz_g", -8.85, 8.75, "#d6a24a"], ["MOCHI + ES", "#ff7eb6", "MOCHI + ES", "@niaap__", -10.05, 8.65, "#fbfaf6"]].map(([lab, col, t1, t2, x, z, food], k) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.PI; scene.add(g);
  M(new THREE.BoxGeometry(1.0, 0.55, 0.55), mat(col), 0, 0.65, 0, g); M(new THREE.BoxGeometry(1.0, 0.35, 0.55), mat("#cfe8f5", { transparent: true, opacity: 0.5 }), 0, 1.1, 0, g);
  M(new THREE.BoxGeometry(1.1, 0.05, 0.65), mat(k % 2 ? "#2f6fd1" : "#e0384b"), 0, 1.3, 0, g); [-0.45, 0.45].forEach((px) => M(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6), mat("#fff", { map: stripe2 }), px, 1.75, 0, g));
  const um = M(new THREE.ConeGeometry(0.85, 0.35, 8), mat(k % 2 ? "#ffd84a" : "#2fa04a"), 0, 2.3, 0, g); um.scale.set(1, 1, 0.75);
  [-0.35, 0.35].forEach((px) => M(new THREE.TorusGeometry(0.2, 0.05, 8, 16), mat("#333"), px, 0.22, 0.3, g));
  const s = sign9(256, 96, (c, w, h) => { c.fillStyle = "#fbfaf6"; c.fillRect(0, 0, w, h); c.fillStyle = "#d8263a"; c.textAlign = "center"; c.textBaseline = "middle"; fit(c, lab, "900 #px 'Archivo Black'", 50, w - 20); c.fillText(lab, w / 2, h / 2 + 2); });
  M(new THREE.BoxGeometry(0.85, 0.3, 0.02), mat("#fff", { map: s.tex }), 0, 0.65, 0.29, g);
  for (let j = 0; j < 6; j++) M(new THREE.SphereGeometry(0.06, 8, 6), mat(food), -0.3 + j * 0.12, 0.98, 0, g).scale.set(k === 0 ? 1.4 : 1, k === 0 ? 0.7 : 1, 1);
  const steam = Array.from({ length: 4 }, () => M(new THREE.SphereGeometry(0.09, 8, 6), mat("#fff", { transparent: true, opacity: 0.6, depthWrite: false }), 0, 1.4, 0, g));
  const seller = person9(1000 + k, 0, -0.55, 0, 1.15, g); seller.visible = true; coat(seller, "#fbfaf6", 0.3).position.y = 0.55;
  tagOn(seller, tag9(t1, t2, col === "#ffd84a" ? "#c98a1a" : col), 2.15, 0.95);
  shadowAll(g); g.visible = false; return { g, seller, steam, k };
});
const ibuK = [["IBU KANTIN", "@desiariyani_1209", -7.05, 8.15], ["IBU KANTIN", "@__ylanne", -8.25, 8.05]].map(([t1, t2, x, z], k) => {
  const c = person9(1010 + k * 3, x, z); coat(c, "#e98fb0", 0.3).position.y = 0.52; tagOn(c, tag9(t1, t2, "#c2185b")); return c; });
const murid9 = Array.from({ length: 12 }, (_, n) => { const c = person9(1100 + n, -10.4 + (n % 6) * 0.85 + (hash(n + 1100) - 0.5) * 0.2, n < 6 ? 7.75 : 7.35, Math.PI + (hash(n + 1101) - 0.5) * 0.8, 0.9);
  M(new THREE.BoxGeometry(0.26, 0.3, 0.12), mat(["#e0384b", "#2f6fd1", "#ffd84a"][n % 3]), 0, 0.7, -0.22, c.userData.body); coat(c, "#fbfaf6", 0.26).position.y = 0.66; return c; });
// the school staff, a row in front of the school, each with a prop and a name tag
const STAFF = [["KEPALA SEKOLAH", "@lia_citra_1922", "#d8263a", "kepsek"], ["GURU OLAHRAGA", "@vivindyzh", "#2fa04a", "or"], ["GURU OLAHRAGA", "@ejaaa.e", "#2fa04a", "or"],
  ["GURU MTK", "@gresssoukotta", "#2f6fd1", "mtk"], ["GURU INGGRIS", "@badqueenbee_", "#8a4fd1", "eng"], ["GURU KIMIA", "@uccinggg22", "#13998f", "kim"],
  ["GURU BP", "@dy.wannn_", "#e8742a", "bp"], ["SATPAM", "@glgiwn_p", "#24324f", "sat"], ["SATPAM", "@seunemo_", "#24324f", "sat"], ["SATPAM", "@kalzzzbokas04", "#24324f", "sat"]];
const staff = STAFF.map(([t1, t2, col, role], k) => {
  const x = -5.95 + k * 0.56, c = person9(1200 + k * 7, x, 8.6); const b = c.userData.body, h = inHand(c, 1);
  if (role === "kepsek") { coat(c, "#24324f"); const s = M(new THREE.BoxGeometry(0.09, 0.6, 0.05), mat("#ffd84a"), 0, 0.62, 0.2, b); s.rotation.z = 0.6;
    const toa = M(new THREE.CylinderGeometry(0.12, 0.05, 0.28, 12, 1, true), mat("#fbfaf6", { side: THREE.DoubleSide }), 0, -0.05, 0.08, h); toa.rotation.x = Math.PI / 2; }
  if (role === "or") { coat(c, "#1f8a3a"); M(new THREE.BoxGeometry(0.06, 0.5, 0.02), mat("#fff"), 0.1, 0.6, 0.2, b); M(new THREE.SphereGeometry(0.035, 8, 6), mat("#ffd84a"), 0, 0.82, 0.2, b); }
  if (role === "mtk") { coat(c, "#5b8fd6"); M(new THREE.BoxGeometry(0.05, 0.62, 0.012), mat("#ffd84a"), 0, -0.1, 0.02, h).rotation.x = 0.3; }
  if (role === "eng") { coat(c, "#8a4fd1"); M(new THREE.BoxGeometry(0.2, 0.26, 0.05), mat("#d8263a"), 0, 0, 0.06, h); }
  if (role === "kim") { coat(c, "#fbfaf6"); M(new THREE.CylinderGeometry(0.035, 0.035, 0.24, 10), mat("#6fe08a", { transparent: true, opacity: 0.8, emissive: "#3fd46a", emissiveIntensity: 0.6 }), 0, 0, 0.06, h); }
  if (role === "bp") { coat(c, "#e8742a"); M(new THREE.BoxGeometry(0.22, 0.28, 0.03), mat("#f2c84b"), 0, 0, 0.06, h); }
  if (role === "sat") { coat(c, "#24324f"); M(new THREE.CylinderGeometry(0.18, 0.2, 0.1, 16), mat("#1b2438"), 0, 1.2, 0, b); M(new THREE.BoxGeometry(0.26, 0.02, 0.14), mat("#1b2438"), 0, 1.16, 0.15, b);
    M(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8), mat("#111"), 0, -0.1, 0.04, h); M(new THREE.BoxGeometry(0.08, 0.06, 0.02), mat("#e8b82a", { metalness: 0.6 }), -0.09, 0.78, 0.2, b); }
  tagOn(c, tag9(t1, t2, col), role === "sat" ? 1.7 : 1.62); return { c, role, k, x };
});
// the giant phone at the podium: Bapak scrolls through all the comments
const CMT = [["lia_citra_1922", "aku mau jadi kepsek 🙋‍♀️", "#d8263a"], ["tirtaa11_", "kantin pempek jadi kan pak?", "#e8742a"], ["vivindyzh", "guru olahraga dong", "#2fa04a"], ["manda__2609", "itu RS gak ada ambulans?", "#2f6fd1"],
  ["wisnuandriansah9", "aku mau jadi maling 😈", "#333"], ["seunemo_", "aku satpam beneran pak", "#24324f"], ["keijih18", "kolam renang sebelah sekolah!", "#2f7fb8"], ["gilangaria18", "aku jualan cilok", "#e0384b"],
  ["gresssoukotta", "guru matematika ✋", "#2f6fd1"], ["niaap__", "mochi + es di kantin", "#ff7eb6"], ["medzeee_", "kepala dapur siap!", "#2fa04a"], ["putralailan", "presiden udah punya istana?", "#8a4fd1"],
  ["dy.wannn_", "guru BP aja", "#e8742a"], ["rioooooooo_papoyyyyy", "nama aku mana pak 😭", "#13998f"]];
const phS = sign9(360, 680, (c, w, h, v) => { c.fillStyle = "#fff"; c.fillRect(0, 0, w, h); const o = (v.o || 0);
  for (let j = -1; j < 9; j++) { const n = ((Math.floor(o / 92) + j) % CMT.length + CMT.length) % CMT.length, y = 70 + j * 92 - (o % 92); const [u, tx, col] = CMT[n];
    c.fillStyle = col; c.beginPath(); c.arc(34, y + 30, 20, 0, 7); c.fill(); c.textAlign = "left"; c.textBaseline = "middle"; c.fillStyle = "#1d1d1f"; fit(c, u, "800 #px Poppins", 22, w - 80, 14); c.fillText(u, 64, y + 16);
    c.fillStyle = "#333"; fit(c, tx, "600 #px Poppins", 22, w - 80, 14); c.fillText(tx, 64, y + 46); c.fillStyle = "#e0384b"; c.font = "800 20px Poppins"; c.textAlign = "right"; c.fillText("❤", w - 14, y + 30); }
  c.fillStyle = "#fff"; c.fillRect(0, 0, w, 58); c.fillStyle = "#1d1d1f"; c.font = "900 30px 'Archivo Black'"; c.textAlign = "center"; c.fillText("Komentar", w / 2, 32); c.fillStyle = "#ddd"; c.fillRect(0, 56, w, 3);
  c.fillStyle = "#f2f2f2"; c.fillRect(0, h - 52, w, 52); c.fillStyle = "#888"; c.font = "600 22px Poppins"; c.textAlign = "left"; c.fillText("Tambahkan komentar…", 20, h - 26); });
const phoneG = new THREE.Group(); phoneG.position.set(1.4, 0.12, -1.6); phoneG.rotation.y = -0.5; scene.add(phoneG);
[-0.3, 0.3].forEach((x) => M(new THREE.BoxGeometry(0.08, 0.5, 0.35), mat("#333"), x, 0.25, 0, phoneG));
M(new THREE.BoxGeometry(1.08, 2.0, 0.09), mat("#1b1b1f", { roughness: 0.3, metalness: 0.4 }), 0, 1.45, 0, phoneG);
const phScreen = M(new THREE.PlaneGeometry(0.96, 1.82), new THREE.MeshBasicMaterial({ map: phS.tex }), 0, 1.45, 0.05, phoneG);
M(new THREE.BoxGeometry(0.22, 0.04, 0.01), mat("#000"), 0, 2.38, 0.05, phoneG); shadowAll(phoneG);
// the president's cat asleep in an ISTANA box beside the podium
const catG = new THREE.Group(); catG.position.set(-1.05, 0.12, -1.25); catG.rotation.y = 0.25; scene.add(catG);
const boxM = mat("#c9955a", { roughness: 0.9 });
M(new THREE.BoxGeometry(0.62, 0.3, 0.46), boxM, 0, 0.15, 0, catG); [-1, 1].forEach((k) => { const f = M(new THREE.BoxGeometry(0.62, 0.02, 0.2), boxM, 0, 0.33, k * 0.3, catG); f.rotation.x = k * 0.9; });
const istS = sign9(256, 96, (c, w, h) => { c.fillStyle = "#c9955a"; c.fillRect(0, 0, w, h); c.fillStyle = "#3a2414"; c.font = "900 56px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("ISTANA", w / 2, h / 2 + 4); });
M(new THREE.PlaneGeometry(0.5, 0.19), mat("#fff", { map: istS.tex, transparent: true }), 0, 0.16, 0.235, catG);
const cat = new THREE.Group(); cat.position.set(0, 0.3, 0); catG.add(cat); const fur = mat("#e8923a"), furD = mat("#c26a1e");
const catBody = M(new THREE.SphereGeometry(0.2, 16, 12), fur, 0, 0.02, 0, cat); catBody.scale.set(1.25, 0.6, 0.95);
const catHead = new THREE.Group(); catHead.position.set(0.2, 0.06, 0.08); cat.add(catHead); M(new THREE.SphereGeometry(0.11, 14, 10), fur, 0, 0, 0, catHead);
[-1, 1].forEach((k) => { M(new THREE.ConeGeometry(0.04, 0.08, 4), furD, k * 0.055, 0.1, 0, catHead); M(new THREE.BoxGeometry(0.035, 0.006, 0.01), mat("#3a2414"), k * 0.04, 0.01, 0.1, catHead); });
M(new THREE.SphereGeometry(0.015, 6, 4), mat("#ff7eb6"), 0, -0.02, 0.11, catHead);
M(new THREE.TorusGeometry(0.16, 0.035, 8, 16, Math.PI * 1.2), fur, -0.08, -0.02, 0.06, cat).rotation.x = Math.PI / 2;
const zS = sign9(128, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "#24324f"; c.font = "900 96px 'Archivo Black'"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("z", w / 2, h / 2); });
const zz = Array.from({ length: 3 }, () => M(new THREE.PlaneGeometry(0.14, 0.14), new THREE.MeshBasicMaterial({ map: zS.tex, transparent: true, depthWrite: false }), 0, 0, 0, catG));
// the ambulance and the new hospital staff
const amb = new THREE.Group(); amb.rotation.y = Math.PI; scene.add(amb);
M(new THREE.BoxGeometry(1.5, 0.8, 0.78), mat("#fbfaf6", { roughness: 0.4 }), -0.15, 0.62, 0, amb); M(new THREE.BoxGeometry(0.5, 0.55, 0.76), mat("#fbfaf6", { roughness: 0.4 }), 0.82, 0.5, 0, amb);
M(new THREE.BoxGeometry(0.06, 0.32, 0.66), mat("#4a7fa8", { roughness: 0.1 }), 1.07, 0.6, 0, amb); M(new THREE.BoxGeometry(2.02, 0.1, 0.8), mat("#d8263a"), 0.08, 0.42, 0, amb);
const crossT = canTex(128, 128, (c, w, h) => { c.fillStyle = "#fbfaf6"; c.fillRect(0, 0, w, h); c.fillStyle = "#d8263a"; c.fillRect(46, 14, 36, 100); c.fillRect(14, 46, 100, 36); });
[-1, 1].forEach((k) => M(new THREE.PlaneGeometry(0.42, 0.42), mat("#fff", { map: crossT }), -0.2, 0.72, k * 0.395, amb).rotation.y = k > 0 ? 0 : Math.PI);
const sirA = [["#ff2a3a", -0.12], ["#2a6bff", 0.12]].map(([c, z]) => M(new THREE.BoxGeometry(0.16, 0.1, 0.2), mat(c, { emissive: c, emissiveIntensity: 0 }), 0.3, 1.07, z, amb));
[[-0.6, 0.39], [-0.6, -0.39], [0.75, 0.39], [0.75, -0.39]].forEach(([x, z]) => M(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 16), mat("#222"), x, 0.17, z, amb).rotation.x = Math.PI / 2);
const ambL = new THREE.PointLight("#ff3040", 0, 6, 1.5); ambL.position.set(0.3, 1.4, 0); amb.add(ambL); shadowAll(amb);
const RS9 = [["DOKTER", "@firzaani440", "#2f6fd1", "#fbfaf6"], ["DOKTER", "@fbluuberryyy", "#2f6fd1", "#fbfaf6"], ["DOKTER", "@dizzzaaa_4", "#2f6fd1", "#fbfaf6"], ["SUSTER", "@mia_nuraeni_", "#c2185b", "#9fd0ee"],
  ["SUSTER", "@okt4_fiona4", "#c2185b", "#9fd0ee"], ["TTK", "@trndby2_", "#13998f", "#9fd39a"], ["DIREKTUR RS", "@asd_dtrrsss", "#24324f", "#24324f"]].map(([t1, t2, col, cc], k) => {
  const c = person9(1300 + k * 5, 1.85 + k * 0.6, 8.75); coat(c, cc); tagOn(c, tag9(t1, t2, col)); return c; });
// the lunch truck for the pupils
const truck = new THREE.Group(); scene.add(truck);
M(new THREE.BoxGeometry(1.5, 0.95, 0.85), mat("#2fa04a"), -0.25, 0.8, 0, truck); M(new THREE.BoxGeometry(0.55, 0.65, 0.82), mat("#ffd84a"), 0.8, 0.6, 0, truck);
M(new THREE.BoxGeometry(0.06, 0.34, 0.7), mat("#4a7fa8", { roughness: 0.1 }), 1.08, 0.72, 0, truck);
const trS = sign9(512, 256, (c, w, h) => { c.fillStyle = "#2fa04a"; c.fillRect(0, 0, w, h); c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "900 66px 'Archivo Black'"; c.fillText("DAPUR", w / 2, 70); c.fillText("MAKAN SIANG", w / 2, 140);
  c.fillStyle = "#ffd84a"; c.font = "800 38px Poppins"; c.fillText("buat murid 🍱", w / 2, 212); });
M(new THREE.PlaneGeometry(1.35, 0.68), mat("#fff", { map: trS.tex }), -0.25, 0.85, -0.43, truck).rotation.y = Math.PI;
[[-0.6, 0.43], [-0.6, -0.43], [0.75, 0.43], [0.75, -0.43]].forEach(([x, z]) => M(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 16), mat("#222"), x, 0.17, z, truck).rotation.x = Math.PI / 2);
shadowAll(truck); truck.visible = false;
const plates9 = murid9.slice(0, 6).map((c) => { const g = inHand(c, 1); M(new THREE.CylinderGeometry(0.13, 0.11, 0.02, 14), mat("#fbfaf6"), 0, -0.02, 0.05, g); M(new THREE.SphereGeometry(0.06, 8, 6), mat("#f2c84b"), 0, 0.02, 0.05, g); g.visible = false; return g; });
// the thief gang: striped shirts, eye masks; Wisnu leads, one wears a rat costume with a tie
const stripeB = canTex(64, 128, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? "#fbfaf6" : "#1d1d1f"; c.fillRect(0, i * 16, w, 16); } });
const thieves = Array.from({ length: 6 }, (_, k) => {
  const x = -6.6 - k * 0.62, c = person9(1400 + k * 3, x, 7.95); const b = c.userData.body, rat = k === 3;
  M(new THREE.CylinderGeometry(0.175, 0.215, 0.52, 12), rat ? mat("#8f8f99") : mat("#fff", { map: stripeB }), 0, 0.6, 0, b);
  if (!rat) { M(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 18, 1, true), mat("#111", { side: THREE.DoubleSide }), 0, 1.06, 0, b); [-1, 1].forEach((s) => M(new THREE.SphereGeometry(0.03, 8, 6), mat("#fff"), s * 0.065, 1.06, 0.19, b)); }
  else { M(new THREE.SphereGeometry(0.2, 16, 12), mat("#8f8f99"), 0, 1.03, 0, b); [-1, 1].forEach((s) => { M(new THREE.SphereGeometry(0.1, 12, 10), mat("#8f8f99"), s * 0.16, 1.24, 0, b).scale.set(1, 1, 0.4); M(new THREE.SphereGeometry(0.06, 10, 8), mat("#ffb3c8"), s * 0.16, 1.24, 0.03, b).scale.set(1, 1, 0.3);
      M(new THREE.SphereGeometry(0.026, 8, 6), mat("#1a1414"), s * 0.065, 1.07, 0.18, b); }); M(new THREE.SphereGeometry(0.035, 8, 6), mat("#ff7eb6"), 0, 1.0, 0.2, b);
    M(new THREE.BoxGeometry(0.07, 0.24, 0.02), mat("#d8263a"), 0, 0.7, 0.22, b); M(new THREE.BoxGeometry(0.1, 0.06, 0.03), mat("#b01a2c"), 0, 0.82, 0.22, b);
    const tail = M(new THREE.TorusGeometry(0.2, 0.02, 6, 16, Math.PI), mat("#ffb3c8"), 0, 0.45, -0.25, b); tail.rotation.y = Math.PI / 2; }
  if (k === 0) tagOn(c, tag9("KETUA MALING", "@wisnuandriansah9", "#d8263a"));
  if (rat) tagOn(c, tag9("TIKUS BERDASI", "@roseity_", "#6b6b75"));
  return { c, k, x };
});
const loot = inHand(thieves[0].c, 1); M(new THREE.CylinderGeometry(0.16, 0.13, 0.025, 16), mat("#fbfaf6"), 0, 0, 0.06, loot); for (let j = 0; j < 4; j++) M(new THREE.SphereGeometry(0.05, 8, 6), mat("#e2b56a"), -0.07 + (j % 2) * 0.1, 0.04, 0.02 + Math.floor(j / 2) * 0.08, loot).scale.set(1.4, 0.7, 1); loot.visible = false;
const runPath = (P, t, t0, v) => { if (t < t0) return null; return along(P, (t - t0) * v); };
const runLegs = (c, t, on, ph = 0) => { const ud = c.userData, s = on ? Math.sin(t * 17 + ph) : 0; ud.legs[0].rotation.x = s * 0.9; ud.legs[1].rotation.x = -s * 0.9; ud.arms[0].rotation.set(-s * 0.9, 0, -0.3); ud.arms[1].rotation.set(s * 0.9, 0, 0.3); ud.body.position.y = on ? Math.abs(s) * 0.06 : 0; };
// people that would stand in the way of the school row
more2.forEach((c, n) => { if (n < 22) c.userData.away = true; });
more.forEach((c) => { if (c.position.x < -1.2) c.userData.away = true; });
newbies.forEach((c) => { const P = c.userData.path; if (P[P.length - 1][0] < -1.2) c.userData.away = true; });
[skG, rib9, bell9, flag9, fieldG, poolG, catG].forEach(shadowAll);

// ---------- camera keyed to the words ----------
const CROWDV = [[-0.9, 3.4, -3.9], [0, 0.9, 3.5]];
const PLOTV = [[-3.6, 3.4, 4.6], [-3.6, 1.3, 9.8]];
const PRESV = [[-1.0, 2.1, 1.6], [0, 1.45, -2.15]];
const SCHV = [[-4.25, 2.5, 3.3], [-4.4, 1.55, 10.0]];
const FIELDV = [[-7.2, 4.8, 6.2], [-9.4, 0.3, 11.5]];
const POOLV = [[-10.6, 3.4, 7.4], [-12.0, 0.4, 11.3]];
const RIBV9 = [[-5.3, 2.0, 4.0], [-5.25, 1.05, 9.2]];
const PHONEV = [[0.8, 2.6, 2.6], [0.75, 1.45, -1.8]];
const staffV = (x) => [[x, 2.3, 3.5], [x, 2.15, 8.6]];
const kantinV = (x) => [[x, 2.2, 3.8], [x, 1.95, 8.7]];
const KANTINW = [[-8.3, 3.4, 2.4], [-8.3, 0.9, 8.6]];
const MANDAV = [[5.7, 1.9, 6.4], [6.1, 1.25, 9.5]];
const AMBV = [[5.5, 2.7, 1.6], [5.4, 1.0, 8.6]];
const DAPURV = [[-6.4, 2.7, 4.5], [-3.0, 0.9, 7.2]];
const MALV = [[-8.1, 2.7, 1.4], [-8.2, 1.0, 7.9]];
const CHASEV = [[-8.6, 5.2, 3.6], [-11.2, 0.6, 7.5]];
const CATV = [[-0.6, 1.9, 1.6], [-0.45, 1.15, -1.7]];
const HIGHV = [[0.6, 6.8, -2.6], [0.4, 0.8, 7.0]];
const nudge = (v, dx, dy, dz) => [[v[0][0] + dx, v[0][1] + dy, v[0][2] + dz], v[1]];
const KEYS = [   // [t, position, target, hold]
  [0, ...nudge(CROWDV, 0, 0.3, 0.6), 1], [T_SEKOLAH0 - 0.6, ...CROWDV, 1],
  [T_SEKOLAH0 - 0.05, ...PLOTV, 1], [T_HITUNG - 0.1, ...nudge(PLOTV, 0, -0.1, 0.5), 1],
  [T_HITUNG + 0.35, ...PRESV, 1], [T_B1 - 0.35, ...nudge(PRESV, 0, 0, -0.3), 1],
  [T_B1 + 0.05, ...nudge(SCHV, 0, 0.3, -0.6), 1], [T_LAP - 0.3, ...SCHV, 1],
  [T_LAP + 0.2, ...FIELDV, 1], [T_KOLAM - 0.1, ...nudge(FIELDV, -0.2, 0, 0.2), 1],
  [T_KOLAM + 0.35, ...POOLV, 1], [T_KANTIN - 0.3, ...nudge(POOLV, 0, -0.2, 0.3), 1],
  [T_KANTIN + 0.15, ...RIBV9, 1], [T_BAPAK - 0.05, ...nudge(RIBV9, 0, 0, 0.3), 1],
  [T_BAPAK + 0.4, ...PHONEV, 1], [T_KEPALA - 0.15, ...nudge(PHONEV, 0, 0, -0.4), 1],
  [T_KEPALA + 0.25, ...staffV(-5.85), 1], [T_OR - 0.1, ...staffV(-5.75), 1],
  [T_OR + 0.3, ...staffV(-5.0), 1], [T_MTK - 0.2, ...staffV(-4.9), 1],
  [T_MTK + 0.2, ...staffV(-4.15), 1], [T_ING - 0.15, ...staffV(-4.1), 1],
  [T_ING + 0.3, ...staffV(-3.3), 1], [T_SATP - 0.15, ...staffV(-3.1), 1],
  [T_SATP + 0.3, [-1.6, 3.7, 4.6], [-1.6, 1.8, 8.6], 1], [T_IBU - 0.1, [-1.5, 3.7, 4.9], [-1.5, 1.8, 8.6], 1],
  [T_IBU + 0.3, ...kantinV(-7.0), 1], [T_TAHU - 0.15, ...kantinV(-7.4), 1],
  [T_TAHU + 0.2, ...kantinV(-9.3), 1], [T_RAME - 0.6, ...kantinV(-9.5), 1],
  [T_RAME - 0.2, ...KANTINW, 1], [T_DOKTER - 0.05, ...nudge(KANTINW, 0, 0, 0.3), 1],
  [T_DOKTER + 0.4, ...MANDAV, 1], [T_NIH - 0.6, ...nudge(MANDAV, 0, 0, 0.2), 1],
  [T_NIH - 0.2, ...AMBV, 1], [T_DAPUR - 0.05, ...nudge(AMBV, 0, 0, 0.3), 1],
  [T_DAPUR + 0.4, ...DAPURV, 1], [T_EH - 0.05, ...nudge(DAPURV, 0, 0, 0.3), 1],
  [T_EH + 0.35, ...MALV, 1], [T_TUH - 0.15, ...nudge(MALV, -0.9, 0.7, -0.8), 1],
  [T_TUH + 0.3, ...CATV, 1], [T_TERUS - 0.05, ...nudge(CATV, 0, 0, -0.3), 1],
  [T_TERUS + 0.6, ...HIGHV, 1], [T_YANG - 0.1, ...nudge(HIGHV, 0, -0.2, 0.4), 1],
  [T_YANG + 0.5, ...CROWDV, 0], [TM.end, ...nudge(CROWDV, 0, 1.0, -1.2), 0], [TM.endT, ...nudge(CROWDV, 0, 1.6, -1.8), 0],
];
function tangent(i, j, c) {
  if (KEYS[i][3]) return 0;
  const a = KEYS[Math.max(0, i - 1)], b = KEYS[Math.min(KEYS.length - 1, i + 1)];
  return b[0] === a[0] ? 0 : (b[j][c] - a[j][c]) / (b[0] - a[0]);
}
const SP = [1, 2].map((j) => [0, 1, 2].map((c) => (t) => {
  if (t <= KEYS[0][0]) return KEYS[0][j][c];
  for (let i = 0; i < KEYS.length - 1; i++) if (t <= KEYS[i + 1][0]) {
    const t0 = KEYS[i][0], t1 = KEYS[i + 1][0], d = t1 - t0, u = (t - t0) / d, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * KEYS[i][j][c] + (u3 - 2 * u2 + u) * d * tangent(i, j, c) + (-2 * u3 + 3 * u2) * KEYS[i + 1][j][c] + (u3 - u2) * d * tangent(i + 1, j, c);
  }
  return KEYS[KEYS.length - 1][j][c];
}));
const inHold = (t) => { for (let i = 0; i < KEYS.length - 1; i++) if (KEYS[i][3] && KEYS[i + 1][3] && t >= KEYS[i][0] && t <= KEYS[i + 1][0]) return Math.min(1, (t - KEYS[i][0]) / 0.25, (KEYS[i + 1][0] - t) / 0.25); return 0; };
function camAt(t) {
  const p = SP[0].map((f) => f(t)), q = SP[1].map((f) => f(t));
  const hk = 1 - 0.65 * inHold(t), hx = hk * (0.03 * Math.sin(t * 0.9) + 0.015 * Math.sin(t * 2.3 + 1)), hy = hk * 0.025 * Math.sin(t * 0.7 + 2);
  return [[p[0] + hx, p[1] + hy, p[2]], q];
}
// ---------- life in front of the lens ----------
scene.add(camera);
const softTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.45, "rgba(255,255,255,.55)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const motes = Array.from({ length: 40 }, (_, i) => {
  const kind = i < 20 ? 0 : i < 32 ? 1 : 2;
  const m = kind === 0 ? new THREE.MeshBasicMaterial({ map: softTex, color: "#fff6e0", transparent: true, opacity: 0.4, depthWrite: false, fog: false })
    : new THREE.MeshStandardMaterial({ color: kind === 1 ? (i % 2 ? "#d8263a" : "#fbfaf6") : (i % 2 ? "#5f9f3c" : "#86b84a"), side: THREE.DoubleSide, roughness: 0.6 });
  const p = new THREE.Mesh(kind === 0 ? new THREE.PlaneGeometry(1, 1) : new THREE.PlaneGeometry(kind === 1 ? 0.05 : 0.06, kind === 1 ? 0.035 : 0.03), m); camera.add(p);
  return { p, kind, i, x: hash(i) * 2 - 1, y: hash(i + 50) * 2 - 1, z: kind === 0 ? 0.8 + hash(i + 9) * 2.4 : 1.3 + hash(i + 9) * 1.6, sp: 0.04 + hash(i + 3) * 0.1, ph: hash(i + 7) * 6.28 };
});
function lifeAt(t) {
  const th = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), hide = t < 2.0;
  motes.forEach((o) => {
    o.p.visible = !hide && (o.kind === 0 || o.i % 3 === 0); if (!o.p.visible) return;
    const z = o.z, hh = z * th, fall = o.kind === 0 ? 0.08 : 0.32, hw = hh * camera.aspect;
    const yy = (((o.y * 0.5 + 0.5) - (t * fall * o.sp * 6) / (2 * hh)) % 1 + 1) % 1;
    const xx = o.x + Math.sin(t * (0.6 + o.sp * 4) + o.ph) * 0.12 + t * 0.03 * (o.i % 2 ? 1 : -1);
    o.p.position.set(((xx % 2 + 3) % 2 - 1) * hw * 1.05, (yy * 2 - 1) * hh * 1.05, -z);
    if (o.kind === 0) { o.p.scale.setScalar((0.05 + hash(o.i + 21) * 0.09) * z); o.p.material.opacity = 0.15 + 0.22 * (0.5 + 0.5 * Math.sin(t * 1.7 + o.ph)); o.p.rotation.set(0, 0, 0); }
    else { o.p.rotation.set(t * (3 + o.sp * 20) + o.ph, t * (2 + o.sp * 10), t * 1.3 + o.ph); o.p.scale.setScalar(0.8); }
  });
}
function breathe(b, t, seed, pop = 1) { const br = 1 + Math.sin(t * 3.1 + seed) * 0.022; b.body.scale.set(1 / Math.sqrt(br), br * pop, 1 / Math.sqrt(br)); if (b.head) b.head.rotation.z = Math.sin(t * 2.3 + seed) * 0.07; }
const backOut = (u) => { const s = 1.9; u = clamp(u) - 1; return 1 + u * u * ((s + 1) * u + s); };
function confettiAt(t, t0, cx, cz, spread, n0, n1) {
  for (let i = n0; i < n1; i++) { const c = conf[i], u = t - t0 - hash(i + 700) * 0.4; if (u < 0 || u > 3.2) continue;
    c.visible = true; c.position.set(cx + (hash(i + 701) - 0.5) * spread + Math.sin(u * 3 + i) * 0.15, 4.4 + hash(i + 702) * 1.5 - u * 1.5, cz + (hash(i + 703) - 0.5) * spread * 0.7);
    c.rotation.set(u * (6 + hash(i) * 6), u * 4 + i, u * 3); }
}
const PODIUM = [0, -2.15];
const citizenIdle = (c, t, ph) => { const ud = c.userData; ud.arms.forEach((a) => a.rotation.set(0, 0, 0)); ud.arms[1].rotation.z = 0.35 + Math.sin(t * 2 + ph) * 0.08; ud.arms[0].rotation.z = -0.35; ud.legs.forEach((l) => (l.rotation.x = 0)); ud.body.rotation.set(0, 0, Math.sin(t * 2.2 + ph) * 0.04); ud.body.position.y = 0; };
const cheerArms = (c, t, ph, on) => { const ud = c.userData; if (!on) return; ud.arms[1].rotation.set(0, 0, 2.6 + Math.sin(t * 9 + ph) * 0.4); ud.arms[0].rotation.set(0, 0, -2.6 - Math.sin(t * 9 + ph) * 0.4); c.position.y = Math.abs(Math.sin(t * 7 + ph)) * 0.12; };
const win = (t, a, b) => t > a && t < b;
function renderAt(t) {
  const [cp, ct] = camAt(t); camera.position.set(...cp); camera.lookAt(...ct);
  moon.visible = false;
  const cnt = Math.round(lerp(FOLLOW0, FOLLOW, sm((t - T_2000 + 0.9) / 1.1)));
  rakyatSign.draw({ num: cnt, hot: t > T_2000 && t < T_2000 + 1.2 && Math.floor(t * 5) % 2 === 0 });
  const cheer = t < T_2000 + 0.9 || win(t, T_DIBUKA - 0.2, T_DIBUKA + 1.0) || win(t, T_MENANG - 0.1, T_MENANG + 0.9) || win(t, T_RESMI - 0.1, T_RESMI + 1.0) || win(t, T_KABUL - 0.1, T_KABUL + 0.8) || t > T_KALIAN;
  const all = crowd.concat(newbies, more);
  all.forEach((c, n) => {
    const ud = c.userData, ph = hash(n + 5) * 6.28, P = ud.path ? ud.path[ud.path.length - 1] : [c.position.x, c.position.z];
    c.visible = !ud.away; if (!c.visible) return;
    c.scale.setScalar(1.15); c.rotation.y = ud.sitFace; ud.arms.forEach((a) => (a.rotation.x = 0));
    const jump = cheer && !ud.seated ? Math.abs(Math.sin(t * 7 + ph)) * 0.18 : 0;
    ud.legs.forEach((l) => (l.rotation.x = ud.seated ? -1.4 : 0)); ud.body.position.y = 0;
    c.position.set(P[0], (ud.seated ? 0.12 : 0) + jump, P[1]);
    ud.arms[1].rotation.z = cheer ? 2.6 + Math.sin(t * 9 + ph) * 0.4 : 0.35 + Math.sin(t * 2 + ph) * 0.08;
    ud.arms[0].rotation.z = cheer && n % 2 ? -2.6 - Math.sin(t * 9 + ph) * 0.4 : -0.35;
    ud.body.rotation.set(0, !cheer ? Math.sin(t * 0.7 + ph) * 0.25 : 0, Math.sin(t * 2.2 + ph) * 0.05);
  });
  more2.forEach((c, n) => { const ud = c.userData, ph = hash(n + 77) * 6.28;
    c.visible = !ud.away; if (!c.visible) return; c.scale.setScalar(1.15); c.rotation.y = ud.sitFace;
    c.position.y = cheer ? Math.abs(Math.sin(t * 7 + ph)) * 0.18 : 0; ud.legs.forEach((l) => (l.rotation.x = 0));
    ud.arms[1].rotation.set(0, 0, cheer ? 2.6 + Math.sin(t * 9 + ph) * 0.4 : 0.35); ud.arms[0].rotation.set(0, 0, cheer && n % 2 ? -2.6 : -0.35); ud.body.rotation.set(0, 0, Math.sin(t * 2.2 + ph) * 0.05); });
  // the set left over from earlier episodes, in its finished state
  queue.forEach((c) => (c.visible = false)); zzz.forEach((z) => (z.visible = false)); Q23.forEach((c) => (c.visible = false)); folders23.forEach((f) => (f.visible = false));
  [slab, walls].forEach((g) => { g.scale.set(1, 1, 1); g.visible = true; }); roof.visible = true; roof.position.y = 0; signG.visible = true; signG.scale.setScalar(1);
  lotBoard.visible = false; rope.forEach((r) => (r.visible = false)); scaffold.visible = false; inside.visible = true; opening.visible = false; scissors.visible = false; puffs.forEach((p) => (p.visible = false));
  bulbs.forEach((m, k) => { m.visible = true; m.material.emissiveIntensity = 1.4 + Math.sin(t * 8 + k * 1.3) * 0.8; });
  lamp.intensity = 6; kitLamp.intensity = 2;
  flames.forEach((f, k) => { f.visible = true; f.scale.set(1, 1 + Math.sin(t * 23 + k * 2) * 0.25, 1); });
  stoves.forEach((s) => { s.fl.forEach((f) => (f.visible = false)); s.food.visible = false; s.pot.rotation.z = 0; });
  splash.forEach((p) => (p.visible = false)); smoke.forEach((p) => (p.visible = false));
  menuBan.draw({ n: 4, by: true }); served.forEach((g) => { g.visible = true; g.scale.setScalar(1); });
  mallet.visible = false; gong.rotation.x = 0; burst.forEach((c) => (c.visible = false));
  cloth.position.set(-0.4, 0.01, 0.06); cloth.rotation.z = 0.5; penyet.visible = false; secTag.visible = true; letter.visible = letterInk.visible = false;
  reporters.forEach((c) => (c.visible = false)); folders.forEach((f) => (f.visible = false)); vp.g.visible = false; proj.visible = false; kamuSign.visible = false;
  desk.visible = false; pile.forEach((b) => (b.visible = false)); bpRoll.visible = false; stack.visible = false; boxG.visible = false; lowG.visible = false; bench.visible = false;
  plots.visible = false; sweat.forEach((d) => (d.visible = false));
  seatTurn.rotation.y = Math.sin(t * 0.9) * 0.2; spotCone.visible = spotDisc.visible = false;
  sirens.forEach((s) => { s.m.material.emissiveIntensity = 0; s.l.intensity = 0; });
  cands.forEach(({ c, cm, k }) => { citizenIdle(c, t, k * 2.1); c.visible = k !== 2; cm.opacity = 0.04; });
  book.visible = false; zioSash.visible = true; bilalHat.visible = true; bilalHat.scale.setScalar(1);
  roleBoards[0].visible = roleBoards[1].visible = true; roleBoards[2].visible = false;
  tarpParts.forEach((m) => (m.visible = false)); waitG.visible = false; under.visible = true;
  digits.forEach(({ m }, k) => { m.scale.setScalar(1); m.position.y = 1.15 + Math.sin(t * 2 + k) * 0.05; m.rotation.y = Math.sin(t * 1.5 + k) * 0.25; });
  speakers.forEach((s, k) => s.scale.setScalar(1 + Math.abs(Math.sin(t * 8 + k)) * 0.06));
  balloons.forEach((g, k) => { g.rotation.z = Math.sin(t * 1.6 + k) * 0.08; });
  tumpeng.scale.setScalar(0.32);
  const vud = newVP.userData; newVP.visible = true; vpPaper.visible = false; vpAyam.scale.set(0.5, 0.55, 1);
  vud.arms[1].rotation.set(-1.2, 0, 0.2); vud.arms[0].rotation.set(0, 0, cheer ? -2.5 : -0.4); vud.body.rotation.set(0, 0, Math.sin(t * 2) * 0.04); newVP.position.y = 0.4 + (cheer ? Math.abs(Math.sin(t * 7)) * 0.1 : 0);
  kasG.visible = false; kcoins.forEach((c) => (c.visible = false)); fcoins.forEach((c) => (c.visible = false));
  mattress.visible = false; plBox.visible = false; bud.visible = false; rsBoard.visible = false; flag.visible = true;
  tower.visible = true; tower.scale.set(1, 1, 1); dust.forEach((p) => (p.visible = false));
  liftCar.position.y = 0.3 + (FL * 4.2) * (0.5 - 0.5 * Math.cos(t * 1.4)); acs.forEach((a) => a.scale.setScalar(1));
  heli.visible = true; heli.position.set(0, FL * 5 + 0.1, 0); heli.rotation.y = 0; rotor.rotation.y = t * 2; ribG.visible = false; topSign.scale.setScalar(1);
  DOCS.forEach(({ c, tag, k }) => { citizenIdle(c, t, k * 3); c.position.y = 0; if (k === 0) c.visible = false; else { c.position.set(1.75, 0, 0.7); c.visible = true; c.scale.setScalar(1.15); } tag.visible = c.visible; });
  mandaF.visible = true; mandaF.scale.setScalar(1.15); citizenIdle(mandaF, t, 1); revStamp.visible = false; puffM.forEach((p) => (p.visible = false));
  if (win(t, T_DOKTER - 0.1, T_NIH + 0.6)) { mandaF.userData.arms[1].rotation.z = 2.4 + Math.sin(t * 9) * 0.3; mandaF.userData.body.rotation.z = Math.sin(t * 5) * 0.08; }
  tears.forEach((d) => (d.visible = false));
  conf.forEach((c) => (c.visible = false));
  // ---- EP 009: the school plot ----
  const ghostOn = t < T_B1 + 0.3; ghost.visible = ghostEdge.visible = ghostRoof.visible = ghostOn; ghostM.opacity = 0.14 + 0.06 * Math.sin(t * 3); ghostEdge.material.dashOffset = -t * 0.4;
  [T_B1, T_B2].forEach((tb, f) => { const u = sm(clamp((t - tb + 0.1) / 0.45)); floors[f].visible = u > 0; floors[f].scale.set(1, Math.max(0.001, u), 1); });
  const ru = backOut(clamp((t - T_B3 + 0.05) / 0.4)); roof9.visible = t > T_B3 - 0.05; roof9.scale.setScalar(Math.max(0.001, ru)); schS.draw(1);
  dust9.forEach((p, k) => { const tb = [T_B1, T_B2, T_B3][k % 3], u = (t - tb + 0.1 - hash(k + 960) * 0.3) / 1.4; p.visible = u > 0 && u < 1; if (!p.visible) return; const a = k / 16 * 6.28;
    p.position.set(Math.cos(a) * (1.4 + u * 1.2), 0.2 + u * 0.7, -0.5 + Math.sin(a) * (0.8 + u)); p.scale.setScalar(0.8 + u * 1.6); p.material.opacity = 0.7 * (1 - u); });
  kidsW.forEach((g, k) => { const u = backOut(clamp((t - T_KELAS + 0.1 - k * 0.06) / 0.3)); g.visible = t > T_KELAS - 0.1 + k * 0.06; g.scale.setScalar(Math.max(0.001, u)); g.position.x += 0; g.rotation.z = Math.sin(t * 3 + k) * 0.15; });
  kelasP.visible = t > T_KELAS - 0.1; kelasP.scale.setScalar(Math.max(0.001, backOut(clamp((t - T_KELAS + 0.1) / 0.3))));
  const ring = (t0) => t > t0 && t < t0 + 1.6 ? Math.sin((t - t0) * 18) * 0.5 * (1 - (t - t0) / 1.6) : 0;
  bellSw.rotation.z = ring(T_SEKOLAH0 + 0.3) + ring(T_DIBUKA) + ring(T_B3) + ring(T_RESMI); clapper.position.x = -bellSw.rotation.z * 0.1;
  rings.forEach((r, k) => { const ts = [T_DIBUKA, T_RESMI].find((x) => t > x && t < x + 1.2); if (ts === undefined) { r.material.opacity = 0; return; } const u = ((t - ts) * 1.4 + k / 3) % 1; r.scale.setScalar(1 + u * 3); r.material.opacity = 0.8 * (1 - u); });
  const fu = sm(clamp((t - T_RESMI + 0.2) / 1.2)); flagC.position.y = 0.5 + fu * 2.2; flagC.rotation.y = Math.sin(t * 4) * 0.25; flagC.visible = t > T_B3;
  const cut = clamp((t - T_RESMI + 0.05) / 0.6); ribs9.forEach(({ g, k }) => (g.rotation.z = k * cut * 1.4)); bow9.visible = cut < 0.05; rib9.visible = win(t, T_B3, T_KEPALA);
  const fp = backOut(clamp((t - T_LAP + 0.15) / 0.4)); fieldG.visible = t > T_LAP - 0.15; fieldG.scale.setScalar(Math.max(0.001, fp)); ball9.position.set(0.3 + Math.sin(t * 1.3) * 0.8, 0.12 + Math.abs(Math.sin(t * 5)) * 0.2, 0.2 + Math.cos(t * 0.9) * 0.4);
  const pp = backOut(clamp((t - T_KOLAM + 0.15) / 0.4)); poolG.visible = t > T_KOLAM - 0.15; poolG.scale.setScalar(Math.max(0.001, pp)); water.position.y = 0.04 + 0.11 * sm(clamp((t - T_KOLAM) / 0.8)); ring9.position.y = water.position.y + 0.05 + Math.sin(t * 2) * 0.02;
  poolB.visible = t > T_KOLAM + 0.2;
  // kantin carts: pempek on "kantin", the rest on their words, the steam
  const cartT = [T_KANTIN - 0.15, T_CILOK - 0.15, T_TAHU - 0.15, T_MOCHI - 0.15];
  CARTS.forEach(({ g, steam, k }) => { const u = backOut(clamp((t - cartT[k]) / 0.35)); g.visible = t > cartT[k]; g.scale.setScalar(Math.max(0.001, u));
    steam.forEach((s, i) => { const age = (t * 0.7 + i / 4) % 1; s.position.set(Math.sin(i * 1.7) * 0.2, 1.45 + age * 0.9, 0); s.scale.setScalar(0.5 + age * 1.5); s.material.opacity = 0.6 * (1 - age); }); });
  ibuK.forEach((c, k) => { pop9(c, t, T_IBU - 0.1 + k * 0.15); citizenIdle(c, t, k); c.position.y = 0; if (t > T_RAME - 0.2 && t < T_EH) cheerArms(c, t, k, true); });
  murid9.forEach((c, n) => { const on = win(t, T_RAME - 0.3 + hash(n + 1110) * 0.4, T_EH - 0.1) || win(t, T_MURID - 0.3, T_EH - 0.1); c.visible = on; if (!on) return; c.scale.setScalar(0.9); citizenIdle(c, t, n);
    if (t > T_MURID - 0.3 && n < 6) { c.position.set(-3.6 + n * 0.42, 0, 6.75); c.rotation.y = Math.PI; } else { c.position.set(-10.4 + (n % 6) * 0.85 + (hash(n + 1100) - 0.5) * 0.2, Math.abs(Math.sin(t * 6 + n)) * 0.08, n < 6 ? 7.75 : 7.35); c.rotation.y = Math.PI + (hash(n + 1101) - 0.5) * 0.8; } });
  plates9.forEach((g) => (g.visible = t > T_MURID - 0.2));
  // the staff row: each pops in on its word; the satpam run after the thieves
  const staffT = [T_KEPALA, T_OR, T_EJA, T_MTK, T_ING, T_KIM, T_BP, T_SATP, T_SATP + 0.12, T_SATP + 0.24];
  staff.forEach(({ c, role, k, x }) => { const u = pop9(c, t, staffT[k] - 0.1); citizenIdle(c, t, k); c.rotation.y = Math.PI; c.position.set(x, 0, 8.6);
    if (role === "kepsek" && win(t, T_KEPALA, T_OR)) { c.userData.arms[1].rotation.set(-1.6, 0, 0.2); }
    if (role === "or" && win(t, staffT[k], staffT[k] + 1.2)) { c.position.y = Math.abs(Math.sin(t * 8 + k)) * 0.15; c.userData.arms[0].rotation.z = -2.6; }
    if (role !== "sat" && role !== "kepsek" && win(t, staffT[k], staffT[k] + 0.8)) c.userData.arms[1].rotation.set(-1.2, 0, 0.3);
    if (role === "sat") { if (win(t, T_SATP, T_SATP + 1.4)) c.userData.arms[1].rotation.set(0, 0, 0.3), c.userData.body.rotation.x = 0;
      const P = [[x, 8.6], [x - 0.3, 7.15], [-24, 7.15]], q = runPath(P, t, T_SATPAM - 0.1 + (k - 7) * 0.12, 5.4);
      if (q) { c.position.set(q.x, 0, q.z); c.rotation.y = q.h; runLegs(c, t, true, k); c.userData.arms[1].rotation.set(-2.6, 0, 0.2); c.visible = q.x > -23; } }
    if (cheer && t > T_KALIAN && role !== "sat") cheerArms(c, t, k, true); });
  // the phone: scrolling fast while Bapak reads, stamped on "kabulin"
  const scr = clamp((t - T_BAPAK) / (T_KABUL - T_BAPAK)); phS.draw({ o: Math.floor(t < T_BAPAK ? 0 : (scr * scr) * 2600 + (t - T_BAPAK) * 40) });
  // the ambulance and the new hospital staff
  const au = sm(clamp((t - T_NIH + 1.0) / 1.2)); amb.visible = t > T_NIH - 1.0; amb.position.set(lerp(13, 7.3, au), 0, 7.75);
  const sOn = t > T_NIH - 1.0 && t < T_DAPUR + 0.4, fl = Math.floor(t * 6) % 2; sirA[0].material.emissiveIntensity = sOn && fl ? 2.5 : 0; sirA[1].material.emissiveIntensity = sOn && !fl ? 2.5 : 0; ambL.intensity = sOn ? 4 : 0; ambL.color.set(fl ? "#ff3040" : "#3060ff");
  RS9.forEach((c, k) => { pop9(c, t, T_NIH - 0.6 + k * 0.1); citizenIdle(c, t, k); c.position.y = 0; if (win(t, T_NIH, T_DAPUR)) cheerArms(c, t, k, true); if (cheer && t > T_KALIAN) cheerArms(c, t, k, true); });
  // the lunch truck
  const tu = sm(clamp((t - T_DAPUR + 0.35) / 1.0)); truck.visible = t > T_DAPUR - 0.35 && t < T_EH + 0.2; truck.position.set(lerp(-14, -3.4, tu), 0, 7.3);
  // the thief gang
  thieves.forEach(({ c, k, x }) => { const t0 = k < 3 ? T_EH - 0.05 + k * 0.22 : T_BANYAK - 0.25 + (k - 3) * 0.15; const u = pop9(c, t, t0); citizenIdle(c, t, k); c.rotation.y = Math.PI; c.position.set(x, 0, 7.95);
    c.userData.body.rotation.y = Math.sin(t * 3 + k) * 0.3;
    if (k === 0 && win(t, T_WISNU, T_PEMPEK2)) { c.userData.arms[1].rotation.set(0, 0, 2.6 + Math.sin(t * 10) * 0.3); }
    const P = [[x, 7.95], [x - 0.3, 7.45], [-24, 7.45]], q = runPath(P, t, T_DIBAWA - 0.1 + k * 0.06, 3.9);
    if (q) { c.position.set(q.x, 0, q.z); c.rotation.y = q.h; runLegs(c, t, true, k * 1.3); c.visible = q.x > -23; }
    if (k === 0) { loot.visible = t > T_PEMPEK2 - 0.1; if (loot.visible) c.userData.arms[1].rotation.set(-2.9, 0, 0.1); } });
  // the cat
  catBody.scale.set(1.25, 0.6 + Math.sin(t * 2.2) * 0.04, 0.95); catHead.rotation.z = Math.sin(t * 0.8) * 0.05;
  zz.forEach((z, k) => { const age = (t * 0.45 + k / 3) % 1; z.position.set(0.25 + age * 0.15, 0.45 + age * 0.5, 0.1); z.scale.setScalar(0.5 + age); z.material.opacity = 1 - age; z.lookAt(camera.position); });
  confettiAt(t, T_DIBUKA - 0.1, -3.9, 9.0, 3.4, 0, 40);
  confettiAt(t, T_MENANG, PODIUM[0], PODIUM[1] + 1.6, 3, 40, 75);
  confettiAt(t, T_RESMI, -4.6, 8.9, 3.4, 75, 115);
  confettiAt(t, T_KABUL, 0.8, -1.0, 2.6, 115, 140);
  // the president: cheers, reads the phone, waves the staff in, facepalms on "tuh kan", points at the vote
  const P = pres; P.g.visible = true; P.g.position.set(PODIUM[0], 0, PODIUM[1]); P.g.rotation.y = 0; walk(P, t, false, 5);
  const lv = +(window.__MOUTH[Math.floor(t * 30)] || 0) / 9; if (mouth) mouth.scale.set(1, 1 + lv * 2.2, 1);
  P.body.rotation.set(0, 0, 0); if (P.head) P.head.rotation.set(0, 0, 0); breathe(P, t, 5);
  P.arms[0].rotation.set(0, 0, -0.9); P.arms[1].rotation.set(0, 0, 0.9 + lv * 0.9); mega.visible = false;
  if (t < T_2000 + 0.9 || win(t, T_MENANG - 0.1, T_B1)) { P.g.position.y = Math.abs(Math.sin(t * 8)) * 0.18; P.arms[1].rotation.z = 2.7 + Math.sin(t * 16) * 0.25; P.arms[0].rotation.z = -2.7 - Math.sin(t * 16) * 0.25; }
  else if (win(t, T_BAPAK - 0.2, T_KABUL - 0.1)) { P.g.rotation.y = -0.75; P.arms[1].rotation.set(-1.3, 0, 0.4); P.arms[0].rotation.set(-0.5, 0, -0.5); if (P.head) P.head.rotation.x = 0.15; P.body.rotation.z = Math.sin(t * 10) * 0.03; }
  else if (win(t, T_KABUL - 0.1, T_KABUL + 0.9)) { P.g.position.y = Math.abs(Math.sin(t * 8)) * 0.14; P.arms[1].rotation.z = 2.7; P.arms[0].rotation.z = -2.7; }
  else if (win(t, T_TUH - 0.1, T_TERUS)) { P.arms[1].rotation.set(-2.5, 0, 0.9); if (P.head) P.head.rotation.x = 0.25; P.body.rotation.z = Math.sin(t * 3) * 0.05; }
  else if (t > T_KALIAN) { P.arms[1].rotation.z = 2.5 + Math.sin(t * 8) * 0.25; P.g.position.y = Math.abs(Math.sin(t * 6)) * 0.06; }
  buntings.forEach(({ f, i }) => (f.rotation.x = Math.sin(t * 5 + i * 0.7) * 0.35));
  umbul.forEach(({ banner, base, i }) => { const p = banner.geometry.attributes.position; for (let k = 0; k < p.count; k++) { const y = base[k * 3 + 1]; p.setZ(k, Math.sin(y * 1.8 - t * 3 + i) * 0.12 * (1.8 - y) * 0.5); } p.needsUpdate = true; });
  bakSteam.forEach((s, i) => { const age = (t * 0.6 + i / 4) % 1; s.position.set(0.45 + Math.sin(i * 1.7) * 0.1, 2.2 + age * 1.0, 0); s.scale.setScalar(0.6 + age * 1.4); s.material.opacity = 0.7 * (1 - age); });
  lifeAt(t);
}

let paintN = 0;
function paintTexts() {
  paintN++;
  gapSign.material.map = signTex([["SELAMAT DATANG", 70, 52, "#fff"], ["DI CITIZENESIA", 50, 120, "#ffd84a"]], { bg: "#d8263a", w: 640, h: 160 }); gapSign.material.needsUpdate = true;
  warSign.material.map = signTex([["WARUNG 24 JAM", 64, 50, "#fff"]], { bg: "#2fa04a", w: 512, h: 100 }); warSign.material.needsUpdate = true;
  bakSign.material.map = signTex([["BAKSO", 70, 50, "#d8263a"]], { bg: "#fbfaf6", w: 400, h: 100 }); bakSign.material.needsUpdate = true;
  rakyatSign.draw({ n: paintN }); lotSign.draw(paintN); chairTag.draw(paintN); rmSign.draw(paintN); menuSign.draw(paintN); menuBan.draw({ n: 4, by: true }); secSign.draw(paintN); vpTag.draw(paintN); kamu.draw(paintN); bpSign.draw(paintN); angSign.draw(paintN); docSign.draw({}); projSign.draw({}); folderSign.draw(paintN); debSign.draw(paintN); waitSign.draw({}); pBan.draw(paintN); digits.forEach((d) => d.s.draw(paintN)); vpTagS.draw(paintN); rsTop.draw(paintN); DOCS.forEach((d) => d.s.draw(paintN)); lowSign.draw(paintN); boxSign.draw(paintN); rs0.draw(paintN); rs1.draw(paintN); rs2.draw(paintN); cands.forEach((c) => c.s.draw(paintN));
  S9.forEach((s) => s.draw({ n: paintN, o: 0 }));
}
paintTexts();
camera.visible = false;   // the episode camera (and the dust in front of it) is not used in the game
const END = TM.endT || TM.end || 75;
export { scene, sun, camera, renderAt, paintTexts, pres, dress, END, PODIUM, first, LOT, KAS, RS, SK, STG, BOX, PARTY, SEAT, gongG, war, bak, POP };
