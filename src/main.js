// CITIZENESIA: THE GAME v0.3, the country of the reels (@citizenesia.official). Follow = you are one of the people; the most-liked comment
// decides what gets built next. You walk the village from the latest episode (Pak Presiden, the Rumah Makan Rakyat, the Kas Negara,
// the hospital, the school), go into the houses, work, and build in the endless land around it. public/data/world.json holds the numbers.
import * as THREE from "three";
import { SKY, clamp } from "./kit.js";
import { baby, walk, sit, grow, LOOK_COLOURS } from "./actors.js";
import { buildNegara, president } from "./negara.js";
import { createTerrain, heightAt, SEA, HOME_R } from "./terrain.js";
import { createBuilder, BLOCKS } from "./build.js";
import { t9n, getLang, setLang } from "./i18n.js";
import { SFX } from "./sfx.js";
import { createHomes, buildInterior, HOUSE_TYPES, typeOf, WALLS, ROOFS } from "./homes.js";

const $ = (id) => document.getElementById(id);
const touch = matchMedia("(pointer: coarse)").matches;
const params = new URLSearchParams(location.search), DEBUG = params.has("debug");
const quality = { low: touch, shadows: !touch };

// admin (the presenter): opening the game at /kymind makes this device the admin's, and it stays admin from then on.
// Everything runs on the player's own device, so admin powers change only that device's game.
let isAdmin = false;
try {
  if (/^\/kymind\/?$/i.test(location.pathname)) { localStorage.setItem("citizenesia.admin", "1"); history.replaceState(null, "", "/" + location.search); }
  isAdmin = localStorage.getItem("citizenesia.admin") === "1";
} catch {}

// ---------- renderer ----------
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: $("gl"), antialias: !touch, powerPreference: "high-performance" }); }
catch (e) {   // no 3D in this browser: say so instead of a blank sky
  document.body.insertAdjacentHTML("beforeend", '<div class="hud card" style="left:50%;top:50%;transform:translate(-50%,-50%);padding:18px 22px;max-width:86vw;text-align:center;font:800 16px/1.4 Poppins">CITIZENESIA needs WebGL (3D). Open it in Chrome, Safari or Firefox with hardware acceleration on.</div>');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1.25 : 1.75));
renderer.shadowMap.enabled = quality.shadows; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.userData.lift = undefined; camera.clearViewOffset(); camera.updateProjectionMatrix(); }
addEventListener("resize", () => { resize(); if (typeof hud === "function" && avatar) hud(); }); resize();

// ---------- the village from the reels, inside an endless land ----------
const negara = buildNegara(quality);
const out = negara.scene, sun = negara.sun;
sun.castShadow = quality.shadows; if (!out.children.includes(sun.target)) out.add(sun.target);
out.fog.far = touch ? 85 : 120;
const terrain = createTerrain(out, touch ? 2 : 3);
const inBox = (b, x, z, m = 0) => x > b.x0 - m && x < b.x1 + m && z > b.z0 - m && z < b.z1 + m;
const noBuild = (x, z) => Math.hypot(x, z + 1) < 15 || (Math.abs(x) < 7 && z > 6 && z < 13) || negara.solids.some((b) => inBox(b, x, z, 0.4));   // the village stays as in the reels
const builder = createBuilder(out, camera, noBuild);
const homes = createHomes(out);

// ---------- save ----------
const KEY = "citizenesia.save.v2", ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => "CZ-" + Array.from({ length: 4 }, () => ABC[Math.floor(Math.random() * ABC.length)]).join("");
let S = { name: "", code: newCode(), look: { cap: null, band: null, glasses: false, stache: false, helmet: false }, coins: 0, free: false, hired: false,
  created: false, adm: { on: true, form: "president", size: 1, body: null, age: 25 }, where: "out", posOut: [negara.spawn.x, negara.spawn.z], blocks: [], homes: [] };
try { const v1 = JSON.parse(localStorage.getItem("citizenesia.save.v1") || "null"); if (v1) Object.assign(S, { name: v1.name || "", look: v1.look || S.look, free: !!v1.free, created: !!v1.created }); } catch {}
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch {}
let dirty = false, resetting = false;
const powers = () => isAdmin && S.adm.on;   // admin mode; "view as a player" turns it off
const round = (v) => Math.round(v * 100) / 100;
function save() {
  if (resetting) return;
  S.blocks = builder.save(); S.homes = homes.list; S.where = "out";
  if (where === "out") S.posOut = [round(player.x), round(player.z)];
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} dirty = false;
}
builder.load(S.blocks); homes.load(S.homes);

// ---------- the numbers (world.json): the people (followers), the latest episode, the account links ----------
let DATA = { day: 9, population: 0, decree: null, links: {} };
const IG = "https://www.instagram.com/citizenesia.official/";
fetch("data/world.json").then((r) => r.json()).then((d) => { DATA = { ...DATA, ...d, links: d.links || {} }; negara.setFollow(DATA.population); hud(); }).catch(() => {});
const fmt = (n) => (n || 0).toLocaleString(t9n("locale"));
const ageYears = () => (powers() ? S.adm.age ?? 25 : 25);
const kindNow = () => (powers() && S.adm.form === "president" ? "president" : "rakyat");
function refreshLevel() { if (avatar && avatar.kind !== kindNow()) makeAvatar(); hud(); }

// ---------- the player ----------
let where = "out";
let house = null;   // the inside of the house you are in
const room = () => (where === "house" ? house : null);
const scene = () => (room() ? room().scene : out);
const player = new THREE.Vector3(S.posOut[0], 0, S.posOut[1]);
let vy = 0, facing = Math.PI, avatar = null, moving = false;
let yaw = negara.spawn.yaw, pitch = 0.4, dist = 6;
const handle = () => "@" + (S.name || t9n("namePh"));
function makeAvatar() {
  if (avatar) avatar.g.parent?.remove(avatar.g);
  const kind = kindNow(), adm = powers(), k = adm ? S.adm.size : 1, body = adm ? S.adm.body : null;
  avatar = kind === "president" ? { kind, ...president(handle()) } : { kind, ...grow(baby(handle(), { ...S.look, skin: body }), ageYears()) };
  avatar.g.scale.setScalar(0.62 * k);   // the same size as the people in the reels
  scene().add(avatar.g);
}
function ground(x, z, fromY = 99) {
  if (room()) return room().groundAt(x, z);
  return Math.max(heightAt(x, z), builder.groundAt(x, z, fromY));
}
function placeAt(w, x, z, camYaw, face) {
  where = w; player.set(x, 0, z); player.y = ground(x, z); vy = 0; seated = null;
  if (camYaw !== undefined) { yaw = camYaw; facing = face ?? camYaw + Math.PI; }
  if (avatar) scene().add(avatar.g);
  if (w !== "house" && house) { house.dispose(); house = null; }
  if (w === "out") terrain.update(x, z, 9);
  if (building && w !== "out") toggleBuild();
  dirty = true; hud(); labels();
}
function flash(color = "#fff", then) {
  const f = $("flash"); f.style.background = color; f.style.opacity = 1;
  setTimeout(() => { then && then(); setTimeout(() => (f.style.opacity = 0), 60); }, 380);
}

// ---------- input: keys, drag to look around (360°), pinch/wheel zoom, joystick ----------
const keys = new Set();
const typing = (e) => /INPUT|TEXTAREA/.test(e.target.tagName);
addEventListener("keydown", (e) => {
  if (typing(e)) return;
  keys.add(e.code);
  if (e.code === "Space") { e.preventDefault(); jump(); }
  const ai = { KeyE: 0, Enter: 0, KeyR: 1, KeyF: 2, KeyG: 3 }[e.code];
  if (ai !== undefined && curActs[ai]) curActs[ai][1]();
  if (e.code === "KeyB") toggleBuild();
  if (e.code === "KeyX" && building) setTool(tool === "place" ? "del" : "place");
  if (e.code === "Escape") { $("grow").style.display = "none"; $("admin").style.display = "none"; $("menu").style.display = "none"; }
  if (building && /^Digit\d$/.test(e.code)) { const n = (+e.code.slice(5) + 9) % 10; if (BLOCKS[n]) pick(n); }
});
addEventListener("keyup", (e) => keys.delete(e.code));
addEventListener("blur", () => keys.clear());
const canvas = $("gl"), ptrs = new Map(), drag = { id: null, x: 0, y: 0, moved: 0, button: 0 }, ndc = new THREE.Vector2();
let pinch0 = 0, dist0 = 7;
const pinchLen = () => { const [a, b] = [...ptrs.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("pointerdown", (e) => {
  if (touch && !building && joy.id === null && onJoySide(e.clientX) && e.clientY > innerHeight * 0.25) { canvas.setPointerCapture(e.pointerId); startJoy(e, true); return; }
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); canvas.setPointerCapture(e.pointerId);
  if (ptrs.size === 2) { pinch0 = pinchLen(); dist0 = dist; drag.id = null; return; }
  if (drag.id !== null) return;
  Object.assign(drag, { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0, button: e.button });
  aimAt(e);
});
canvas.addEventListener("pointermove", (e) => {
  if (e.pointerId === joy.id) { moveJoy(e); return; }
  if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2) { const l = pinchLen(); if (pinch0 > 0 && l > 0) dist = clamp(dist0 * pinch0 / l, 3, 18); return; }
  if (drag.id === e.pointerId) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
    if (drag.moved > 6) { yaw -= dx * (touch ? 0.008 : 0.006); pitch = clamp(pitch + dy * 0.005, -0.25, 1.4); }
  } else if (!touch) aimAt(e);
});
const ptrUp = (e) => {
  if (e.pointerId === joy.id) { endJoy(); return; }
  ptrs.delete(e.pointerId);
  if (drag.id !== e.pointerId) return;
  if (building && drag.moved <= 6) { aimAt(e); useTool(drag.button === 2 ? "del" : tool); }
  drag.id = null;
};
canvas.addEventListener("pointerup", ptrUp); canvas.addEventListener("pointercancel", ptrUp);
canvas.addEventListener("wheel", (e) => { dist = clamp(dist + e.deltaY * 0.01, 3, 18); }, { passive: true });
const nearGround = () => terrain.groundMeshes().filter((m) => Math.hypot(m.position.x - player.x, m.position.z - player.z) < 50);
function aimAt(e) {
  if (!building) return; ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); builder.aim(ndc, tool === "del", player, nearGround());
  if (pickingHouse() && tool === "place") aimHouse(); else houseGhost.visible = false;
}

// the joystick: it sits in a corner, and it also appears wherever your thumb lands on its half of the screen (left by default,
// right if chosen in the menu); the other half turns the camera
const joy = { id: null, cx: 0, cy: 0, x: 0, y: 0 };
const J = $("joy"), knob = J.querySelector("i");
const onJoySide = (x) => (S.joyRight ? x > innerWidth * 0.55 : x < innerWidth * 0.45);
function startJoy(e, float) {
  if (float) { J.style.left = `${e.clientX - 65}px`; J.style.top = `${e.clientY - 65}px`; J.style.right = J.style.bottom = "auto"; J.classList.add("float"); }
  const r = J.getBoundingClientRect(); Object.assign(joy, { id: e.pointerId, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }); moveJoy(e);
}
function moveJoy(e) {
  let dx = e.clientX - joy.cx, dy = e.clientY - joy.cy; const l = Math.hypot(dx, dy), m = 50;
  if (l > m) { dx *= m / l; dy *= m / l; }
  joy.x = dx / m; joy.y = dy / m; knob.style.transform = `translate(${dx}px,${dy}px)`;
}
function endJoy() { joy.id = null; joy.x = joy.y = 0; knob.style.transform = ""; J.style.left = J.style.top = J.style.right = J.style.bottom = ""; J.classList.remove("float"); }
if (touch) {
  J.style.display = "block";
  J.addEventListener("pointerdown", (e) => { J.setPointerCapture(e.pointerId); startJoy(e, false); });
  J.addEventListener("pointermove", (e) => e.pointerId === joy.id && moveJoy(e));
  const end = (e) => e.pointerId === joy.id && endJoy();
  J.addEventListener("pointerup", end); J.addEventListener("pointercancel", end);
}

// ---------- HUD ----------
let toastT = 0, stampT = 0;
function toast(msg, s = 2.8) { const el = $("toast"); el.textContent = msg; el.classList.add("on"); toastT = s; }
function stamp(txt) { const el = $("stamp"); el.textContent = txt; el.classList.add("on"); stampT = 1.3; }
function hint() {
  if (powers() || where === "house") return "";
  return !S.hired ? "hintKampung" : builder.count() < 3 ? "hintBuild" : "";
}
function hud() {
  $("meName").textContent = handle();
  $("meLv").textContent = powers() ? t9n("admin") : t9n("rakyatLv");
  $("rakyat").textContent = `👥 ${t9n("rakyatHud")}: ${fmt(DATA.population)}`;
  $("adminBtn").textContent = innerWidth <= 480 ? "⚙" : t9n("admin");
  $("meCoins").textContent = S.free || powers() ? "∞" : S.coins;
  $("adminBtn").style.display = isAdmin ? "inline-block" : "none";
  const h = hint(); $("hint").textContent = h ? t9n(h) : "";
  $("hint").style.display = h && !building ? "" : "none";
  $("buildBtn").style.display = where === "out" ? "" : "none";
  if (where === "house") $("hint").textContent = t9n("hintHouse"), $("hint").style.display = "";
  $("jumpBtn").textContent = t9n("jump");
}
function labels() {
  document.documentElement.lang = getLang();
  $("langBtn").textContent = t9n("lang"); $("buildBtn").textContent = building ? t9n("done") : t9n("build");
  $("joyBtn").textContent = t9n(S.joyRight ? "joyLeft" : "joyRight"); $("joyBtn").style.display = touch ? "" : "none";
  $("editBtn").textContent = t9n("edit"); $("resetBtn").textContent = t9n("reset"); $("growBtn").textContent = t9n("grow");
  $("cSub").textContent = t9n("subtitle"); $("cNameL").textContent = t9n("yourName"); $("cName").placeholder = t9n("namePh");
  $("cLookL").textContent = t9n("look"); $("cFreeL").textContent = t9n("freeMode"); $("cGo").textContent = S.created ? "OK" : t9n("play");
  negara.paintTexts(); buildBar(); creatorUI(); hud(); actsSig = null;   // redraw the action buttons
}
$("langBtn").onclick = () => { setLang(getLang() === "id" ? "en" : "id"); labels(); makeAvatar(); };
$("menuBtn").onclick = () => { const m = $("menu"); m.style.display = m.style.display === "flex" ? "none" : "flex"; };
$("joyBtn").onclick = () => { S.joyRight = !S.joyRight; dirty = true; sides(); labels(); };
const sides = () => document.body.classList.toggle("joy-right", !!S.joyRight);
$("editBtn").onclick = () => { $("menu").style.display = "none"; openCreator(); };
$("growBtn").onclick = () => { $("menu").style.display = "none"; openGrow(); };
$("me").onclick = () => openGrow();
$("resetBtn").onclick = () => {
  if (!confirm(t9n("resetAsk"))) return;
  resetting = true; try { localStorage.removeItem(KEY); localStorage.removeItem("citizenesia.save.v1"); } catch {} location.reload();
};
$("jumpBtn").onclick = () => jump();
$("buildBtn").onclick = () => toggleBuild();

// ---------- character creator ----------
function openCreator() { $("creator").style.display = "flex"; creatorUI(); yaw = facing; pitch = 0.25; dist = 4.8; }   // starts facing you; drag to turn, move to walk
function creatorUI() {
  $("cName").value = S.name; $("cFree").checked = S.free;
  const sw = (el, field) => {
    el.innerHTML = `<span class="lk">${t9n(field)}</span>`;
    [null, ...LOOK_COLOURS].forEach((c) => {
      const d = document.createElement("div"); d.className = "c" + (c ? "" : " none") + (S.look[field] === c ? " on" : "");
      if (c) d.style.background = c;
      d.onclick = () => { S.look[field] = c; if (field === "cap" && c) S.look.helmet = false; creatorUI(); makeAvatar(); };
      el.appendChild(d);
    });
  };
  sw($("cCap"), "cap"); sw($("cBand"), "band");
  const tg = $("cTog"); tg.innerHTML = "";
  ["glasses", "stache", "helmet"].forEach((f) => {
    const b = document.createElement("button"); b.className = "tg" + (S.look[f] ? " on" : ""); b.textContent = t9n(f);
    b.onclick = () => { S.look[f] = !S.look[f]; if (f === "helmet" && S.look.helmet) S.look.cap = null; creatorUI(); makeAvatar(); };
    tg.appendChild(b);
  });
}
$("cName").addEventListener("input", (e) => { S.name = e.target.value.replace(/[^a-zA-Z0-9_.]/g, "").slice(0, 30); e.target.value = S.name; makeAvatar(); });
$("cFree").addEventListener("change", (e) => { S.free = e.target.checked; hud(); buildBar(); });
$("cGo").onclick = () => { if (!S.name) S.name = t9n("namePh"); if (!S.created) { yaw = negara.spawn.yaw; facing = yaw + Math.PI; pitch = 0.4; dist = 6; } S.created = true; $("creator").style.display = "none"; refreshLevel(); makeAvatar(); labels(); save(); SFX.pop(); };

// ---------- how the country works: follow = one of the people, the most-liked comment = tomorrow's story ----------
function openGrow() {
  $("gTitle").textContent = t9n("jTitle"); $("gHow").textContent = t9n("jHow");
  $("gLadder").innerHTML = t9n("jRules").map((l) => `<li>${l}</li>`).join("");
  $("gYou").textContent = `👥 ${t9n("rakyatHud")}: ${fmt(DATA.population)} · ${t9n("jLatest")}`;
  ["gCodeL", "gCode", "gText", "gTT", "gYT", "gSend", "gNote"].forEach((id) => ($(id).style.display = "none"));
  const url = DATA.links.instagram || IG, b = $("gIG"); b.textContent = t9n("jOpenIG"); b.disabled = false;
  b.onclick = () => window.open(url, "_blank", "noopener");
  $("gClose").textContent = t9n("gClose");
  $("grow").style.display = "flex";
}
$("gClose").onclick = () => ($("grow").style.display = "none");
$("grow").onclick = (e) => { if (e.target.id === "grow") $("grow").style.display = "none"; };

// ---------- building (outside only, after birth) ----------
let building = false, tool = "place", pickT = 0;
function toggleBuild() {
  if (!S.created || (where !== "out" && !building)) return;
  building = !building; $("bar").style.display = building ? "flex" : "none"; document.body.classList.toggle("building", building);
  if (!building) { builder.hide(); houseGhost.visible = false; }
  labels();
}
function pick(n) { pickT = n; buildBar(); }
function setTool(t) { tool = t; buildBar(); }
function buildBar() {
  const bar = $("bar"); bar.innerHTML = "";
  BLOCKS.forEach((b, i) => {
    const d = document.createElement("div"); d.className = "sw" + (i === pickT && tool === "place" ? " on" : "");
    d.style.background = b.top ? `linear-gradient(${b.top} 35%, ${b.c} 35%)` : b.c; if (b.glass) d.style.opacity = ".7";
    d.innerHTML = `<b>${(i + 1) % 10}</b>`; d.onclick = () => { pick(i); setTool("place"); }; bar.appendChild(d);
  });
  bar.insertAdjacentHTML("beforeend", '<div class="sep"></div>');
  HOUSE_TYPES.forEach((T) => {
    const b = document.createElement("button"); b.className = "btn yellow tool" + (pickT === T.id && tool === "place" ? " on" : "");
    b.style.cssText = "flex:none;font-size:12px;padding:8px 10px"; b.textContent = `🏠 ${t9n("houseSizes")[T.id]} · ${S.free || powers() ? "∞" : T.price}`;
    b.onclick = () => { pick(T.id); setTool("place"); }; bar.appendChild(b);
  });
  bar.insertAdjacentHTML("beforeend", '<div class="sep"></div>');
  [["place", "btn green"], ["del", "btn red"]].forEach(([k, cls]) => {
    const b = document.createElement("button"); b.className = cls + " tool" + (tool === k ? " on" : ""); b.textContent = t9n(k); b.onclick = () => setTool(k); bar.appendChild(b);
  });
  bar.insertAdjacentHTML("beforeend", `<span class="cost">${S.free ? t9n("free") : t9n("cost")}</span>`);
}
function useTool(kind) {
  if (kind === "del" && sellHouseAt()) return;
  if (kind !== "del" && pickingHouse()) { buyHouse(); return; }
  const c = builder.target; if (!c) { toast(t9n("noBuildHere"), 1.2); return; }
  if (kind === "del") {
    if (c.existing && builder.remove(c.x, c.y, c.z)) { if (!S.free && !powers()) S.coins += 1; dirty = true; SFX.click(); }
  } else {
    const px = Math.floor(player.x), pz = Math.floor(player.z);   // never bury the player
    if (c.x === px && c.z === pz && c.y >= Math.floor(player.y) && c.y < player.y + 1.6) return;
    if (!S.free && !powers() && S.coins < 1) { toast(t9n("broke")); return; }
    if (builder.add(c.x, c.y, c.z, pickT)) { if (!S.free && !powers()) S.coins -= 1; dirty = true; SFX.click(); }
  }
  hud();
}

// ---------- speech bubbles ----------
let bubbleT = 0, bubbleAt = null;
function say(getPos, text, s = 3) { const b = $("bubble"); b.textContent = text; b.style.display = "block"; bubbleT = s; bubbleAt = getPos; }
const overPlayer = () => tmp.copy(player).add(new THREE.Vector3(0, 1.6, 0));

// ---------- everything you can use ----------
let seated = null, napT = -1, workT = -1, sayI = 0;
function work() {
  if (!S.hired) { toast(t9n("reject"), 2.2); SFX.no(); setTimeout(() => { toast(t9n("hired")); SFX.yes(); S.hired = true; dirty = true; hud(); }, 2300); return; }
  if (workT < 0) { workT = 0; $("prog").style.display = "block"; $("progT").textContent = t9n("working"); }
}
const pay = (n, msg) => { const fr = S.free || powers(); if (!fr && S.coins < n) { toast(t9n("broke")); return; } if (!fr) S.coins -= n; dirty = true; SFX.coin(); toast(msg, 2.8); hud(); };
const presLine = () => t9n("presSays")[sayI++ % t9n("presSays").length].replace("{pop}", fmt(DATA.population));
const SPOTS = negara.spots, ACTS = {
  president: () => [["aTalk", () => say(() => tmp.copy(negara.president.g.getWorldPosition(new THREE.Vector3())).add(new THREE.Vector3(0, 1.5, 0)), presLine(), 3.6)]],
  chair: () => [["aSit", () => { seated = SPOTS.chair.seat; toast(t9n("kursiMsg"), 2.6); }]],
  makan: () => [["aMakan", () => pay(2, t9n("makanMsg")[Math.floor(Math.random() * t9n("makanMsg").length)])]],
  gong: () => [["aGong", () => { SFX.gavel(); stamp("GONG!"); }]],
  wapres: () => [["aWapres", () => toast(t9n("wapresMsg"), 3.4)]],
  vote: () => [["aVote", openGrow]],
  kas: () => [["aKas", () => toast(t9n("kasMsg", { n: S.free || powers() ? "∞" : fmt(S.coins) }), 3.6)]],
  rs: () => [["aRs", () => { SFX.pop(); toast(t9n("rsMsg"), 3.4); }]],
  sekolah: () => [["aSekolah", () => { SFX.yes(); toast(t9n("sekolahMsg"), 3.4); }]],
  panggung: () => [["aWork", work], ["aPidato", () => { say(overPlayer, t9n("pidato"), 3); SFX.mic(); }]],
  rakyat: () => [["aRead", () => toast(`👥 ${t9n("rakyatHud")}: ${fmt(DATA.population)} · ${t9n("followRule")}`, 3.4)]],
  warung: () => [["aJajan", () => pay(1, t9n("jajanMsg"))]],
  bakso: () => [["aBakso", () => pay(3, t9n("baksoMsg"))]],
};
const SEATED_ACTS = () => [...(seated.eat ? [["hEat", () => { SFX.eat(); toast(t9n("eatMsg")); }]] : []), ...(seated.tv ? HOUSE_ACTS.tv() : []), ["aStand", () => (seated = null)]];
let curActs = [], actsSig = "";
function findActs() {
  if (seated) return SEATED_ACTS();
  if (napT >= 0 || workT >= 0) return [];
  let best = null, bd = 1;
  if (where === "house") {
    for (const sp of house.spots) { const d = Math.hypot(player.x - sp.x, player.z - sp.z) / sp.r; if (d < bd) { bd = d; best = sp; } }
    if (!best) return [];
    if (best.k === "seat") { const st = best.seat; return [["aSit", () => { seated = { ...st, house: true }; player.x = st.cx; player.z = st.cz; facing = st.facing; }]]; }
    return HOUSE_ACTS[best.k]();
  }
  for (const [k, s] of Object.entries(SPOTS)) { const d = Math.hypot(player.x - s.x, player.z - s.z) / s.r; if (d < bd) { bd = d; best = k; } }
  return best ? ACTS[best]() : [];
}
function renderActs(list) {
  const sig = list.map((a) => a[0]).join("|"); if (sig === actsSig) return; actsSig = sig; curActs = list;
  const box = $("acts"); box.innerHTML = "";
  list.forEach(([k, fn], i) => {
    const b = document.createElement("button"); b.className = "btn yellow";
    b.innerHTML = t9n(k) + (touch ? "" : `<small>${["E", "R", "F", "G"][i]}</small>`);
    b.onclick = () => fn(); box.appendChild(b);
  });
}
function jump() {
  if (building || !avatar) return;
  if (seated) { seated = null; return; }
  if (player.y <= ground(player.x, player.z, player.y) + 0.01) vy = 8.2;
}

// ---------- houses ----------
let doorCool = 0;
function enterHouse(d) {
  SFX.door(); doorCool = 1;
  const out2 = { x: d.x + Math.sin(d.ry) * 0.9, z: d.z + Math.cos(d.ry) * 0.9 };
  S.posOut = [round(out2.x), round(out2.z)];
  flash("#fff6ea", () => { const h = buildInterior(d, t9n, quality); if (house) house.dispose(); house = h; placeAt("house", h.spawn.x, h.spawn.z, 0); });
}
function leaveHouse() {
  const d = house.door; SFX.door(); doorCool = 1.2; player.z -= 0.4;
  flash("#ffffff", () => placeAt("out", d.x + Math.sin(d.ry) * 1.7, d.z + Math.cos(d.ry) * 1.7, d.ry, d.ry));
}
const HOUSE_ACTS = {
  bed: () => [["hSleep", () => { napT = 0; toast(t9n("sleepMsg"), 2.6); dirty = true; }]],
  fridge: () => [["hFridge", () => { SFX.pop(); toast(t9n("fridgeMsg")); }]],
  stove: () => [["hCook", () => { SFX.eat(); toast(t9n("cookMsg")); }]],
  tv: () => [[house.tvOn ? "hTvOff" : "hTvOn", () => { house.setTv(!house.tvOn); SFX.click(); actsSig = ""; }]],
  light: () => [["hLight", () => { house.setLight(!house.lightOn); SFX.click(); }]],
  pc: () => [["hPc", openGrow]],
  books: () => [["hRead", () => toast(t9n("readMsg"), 3)]],
  exit: () => [],
};
// buying a ready-made house in build mode
let houseTarget = null;
const houseGhost = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.35, depthWrite: false }));
houseGhost.visible = false; out.add(houseGhost);
const pickingHouse = () => typeof pickT === "string";
function aimHouse() {
  const c = builder.target; builder.hide(); houseTarget = null; houseGhost.visible = false;
  if (!c) return;
  const T = typeOf(pickT), half = 0.95 * T.size + 0.1, x = c.x + 0.5, z = c.z + 0.5;
  const ry = Math.round(Math.atan2(player.x - x, player.z - z) / (Math.PI / 2)) * (Math.PI / 2);   // the door faces you
  const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]].map(([a, b]) => [x + a * half, z + b * half]);
  const fits = corners.every(([cx, cz]) => heightAt(cx, cz) > SEA + 0.2 && !noBuild(cx, cz) && Math.abs(heightAt(cx, cz) - heightAt(x, z)) < 1.2)
    && !homes.solids().some((b) => b.x0 < x + half && b.x1 > x - half && b.z0 < z + half && b.z1 > z - half)
    && !builder.save().some(([bx, , bz]) => bx + 1 > x - half && bx < x + half && bz + 1 > z - half && bz < z + half)
    && Math.hypot(player.x - x, player.z - z) > half + 0.6;
  houseGhost.visible = true; houseGhost.scale.set(half * 2, 3 * T.size, half * 2); houseGhost.position.set(x, heightAt(x, z) + 1.5 * T.size, z);
  houseGhost.material.color.set(fits ? "#ffffff" : "#ff5f7f");
  if (fits) houseTarget = { x, z, ry, y: heightAt(x, z), type: T.id };
}
const ray = new THREE.Raycaster();
function sellHouseAt() {
  ray.setFromCamera(ndc, camera); const hit = ray.intersectObjects(homes.group.children, true)[0];
  const h = hit && hit.object.userData.home; if (!h) return false;
  if (h.owner && h.owner !== S.name && !powers()) { toast(t9n("houseNotYours")); return true; }
  homes.remove(h); const price = typeOf(h.type).price; if (!S.free && !powers()) S.coins += price; dirty = true; SFX.coin(); toast(t9n("houseSold", { n: price })); hud(); return true;
}
function buyHouse() {
  if (!houseTarget) { toast(t9n("houseNoRoom"), 1.4); return; }
  const T = typeOf(houseTarget.type), fr = S.free || powers();
  if (!fr && S.coins < T.price) { toast(t9n("broke")); return; }
  const i = Math.floor(Math.random() * 5);
  homes.add({ ...houseTarget, id: Date.now().toString(36), wall: WALLS[i], roof: ROOFS[(i + 2) % 5], owner: S.name });
  if (!fr) S.coins -= T.price; dirty = true; SFX.coin(); toast(t9n("houseBought", { n: fr ? 0 : T.price }), 2.4); houseGhost.visible = false; houseTarget = null; hud();
}

// ---------- admin panel ----------
const PLACES = {
  alun: () => placeAt("out", negara.spawn.x, negara.spawn.z, negara.spawn.yaw), makan: () => placeAt("out", SPOTS.makan.x, SPOTS.makan.z + 1.5, 0),
  rs: () => placeAt("out", SPOTS.rs.x, SPOTS.rs.z - 1.5, Math.PI), sekolah: () => placeAt("out", SPOTS.sekolah.x, SPOTS.sekolah.z - 1.5, Math.PI),
  kas: () => placeAt("out", SPOTS.kas.x, SPOTS.kas.z + 1, 0),
  foreign: () => { for (let r = 150; r < 900; r += 6) for (let a = 0; a < 6.28; a += 0.4) { const x = Math.cos(a) * r, z = Math.sin(a) * r; if (heightAt(x, z) > 0.5) return placeAt("out", x, z, a); } },
};
function openAdmin() {
  const P = $("adminPanel"), A = S.adm, on = A.on;
  const btn = (label, cls, fn) => { const b = document.createElement("button"); b.className = "btn " + cls; b.textContent = label; b.onclick = () => { fn(); SFX.click(); if ($("admin").style.display === "flex") openAdmin(); }; return b; };
  const row = (...bs) => { const r = document.createElement("div"); r.className = "row"; bs.forEach((b) => r.appendChild(b)); return r; };
  const lab = (txt) => { const l = document.createElement("label"); l.textContent = txt; return l; };
  P.innerHTML = `<h2>${t9n("aTitle")}</h2>`;
  P.appendChild(row(btn(t9n("aModeAdmin"), on ? "green" : "off", () => { A.on = true; changed(t9n("aAdminOn")); }), btn(t9n("aModeUser"), on ? "off" : "", () => { A.on = false; changed(t9n("aUserOn")); })));
  P.insertAdjacentHTML("beforeend", `<p>${on ? t9n("aAdminNote") : t9n("aUserNote")}</p>`);
  if (on) {
    P.appendChild(lab(t9n("aForm")));
    P.appendChild(row(...Object.entries(t9n("aForms")).map(([k, v]) => btn(v, A.form === k ? "yellow" : "off", () => { A.form = k; changed(); }))));
    P.appendChild(lab(`${t9n("aSize")} ×${A.size.toFixed(1)}`));
    const rg = document.createElement("input"); rg.type = "range"; rg.min = 0.5; rg.max = 3; rg.step = 0.1; rg.value = A.size;
    rg.oninput = () => { A.size = +rg.value; P.querySelectorAll("label")[1].textContent = `${t9n("aSize")} ×${A.size.toFixed(1)}`; makeAvatar(); dirty = true; }; P.appendChild(rg);
    if (A.form === "rakyat") {
      A.age = A.age ?? 25;
      P.appendChild(lab(`${t9n("aAge")}: ${A.age} ${t9n("aYears")}`));
      const ag = document.createElement("input"); ag.type = "range"; ag.min = 0; ag.max = 80; ag.step = 1; ag.value = A.age;
      ag.oninput = () => { A.age = +ag.value; P.querySelectorAll("label")[2].textContent = `${t9n("aAge")}: ${A.age} ${t9n("aYears")}`; makeAvatar(); hud(); dirty = true; }; P.appendChild(ag);
    }
    P.appendChild(lab(t9n("aBody")));
    const sw = document.createElement("div"); sw.className = "row";
    [null, "#fbfaf6", "#f2c39b", "#c98a5c", "#8a5a3a", ...LOOK_COLOURS.slice(0, 6)].forEach((c) => {
      const d = document.createElement("div"); d.className = "c" + (A.body === c ? " on" : ""); d.style.background = c || "linear-gradient(135deg,#fff 45%,#e2d6c0 55%)";
      d.onclick = () => { A.body = c; changed(); openAdmin(); }; sw.appendChild(d);
    });
    P.appendChild(sw);
    P.appendChild(row(btn(t9n("aLook"), "", () => { $("admin").style.display = "none"; openCreator(); })));
  } else {
    P.appendChild(row(btn(t9n("aFresh"), "red", () => { S.hired = false; S.coins = 0; changed(t9n("aFreshDone")); PLACES.alun(); $("admin").style.display = "none"; })));
  }
  P.appendChild(lab(t9n("aGo")));
  P.appendChild(row(...Object.entries(t9n("aPlaces")).map(([k, v]) => btn(v, "dark", () => { flash("#fff", PLACES[k]); $("admin").style.display = "none"; }))));
  P.appendChild(row(btn(t9n("gClose"), "yellow", () => ($("admin").style.display = "none"))));
  $("admin").style.display = "flex";
}
function changed(msg) {
  dirty = true; makeAvatar();
  hud(); if (msg) toast(msg, 2);
}
$("adminBtn").onclick = () => openAdmin();
$("admin").onclick = (e) => { if (e.target.id === "admin") $("admin").style.display = "none"; };

// ---------- the loop ----------
const clock = new THREE.Clock(); let t = 0, saveT = 0, drownT = 0, foreignShown = false;
const fwd = new THREE.Vector3(), right = new THREE.Vector3(), camT = new THREE.Vector3(), tmp = new THREE.Vector3();
const C_SKY = new THREE.Color(SKY), C_DEEP = new THREE.Color("#5fa9cf"), C_FOG = out.fog.color.clone();
let nearSolids = [];
function blockedXZ(x, z) {
  const r = 0.35, y = player.y;
  const rm = room();
  if (rm) return !rm.walkable(x, z) || rm.solids.some((b) => y < b.h && inBox(b, x, z, r));
  if (negara.solids.some((b) => y < b.h && inBox(b, x, z, r)) || nearSolids.some((b) => y < b.h && inBox(b, x, z, r))) return true;
  if (heightAt(x, z) > y + 0.7) return true;   // too steep
  const top = y + 1.3;
  return [[r, 0], [-r, 0], [0, r], [0, -r]].some(([ox, oz]) => builder.blockedAt(x + ox, z + oz, y + 0.05, top));
}
function tryMove(dx, dz) { if (!blockedXZ(player.x + dx, player.z)) player.x += dx; if (!blockedXZ(player.x, player.z + dz)) player.z += dz; }
function camOK(x, y, z) {
  const rm = room();
  if (rm && rm.wallH && y > rm.wallH + 0.3) return true;   // houses have no roof inside: the camera may look in from above the walls
  if (rm) return rm.walkable(x, z, 0.1) && y < rm.ceilAt(x, z) - 0.3 && y > rm.groundAt(x, z) + 0.25 && !rm.solids.some((b) => y < b.h + 0.2 && inBox(b, x, z, 0.2));
  return y > heightAt(x, z) + 0.35 && !negara.solids.some((b) => y < b.h + 0.3 && inBox(b, x, z, 0.35)) && !builder.has(Math.floor(x), Math.floor(y), Math.floor(z));
}
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05); t += dt;
  const creating = $("creator").style.display === "flex", panel = $("grow").style.display === "flex" || $("admin").style.display === "flex";
  const run = keys.has("ShiftLeft") || keys.has("ShiftRight");
  let mx = (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) - (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0) + joy.x;
  let mz = (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) - (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) + joy.y;
  const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
  const want = ml > 0.08 && !panel && workT < 0;
  if (want && seated) seated = null;
  if (want && napT >= 0) napT = -1;
  moving = want && !seated;
  if (where === "out") { nearSolids = terrain.solidsNear(player.x, player.z).concat(homes.solids()); terrain.update(player.x, player.z, 2); }
  const underwater = where === "out" && player.y < SEA;
  if (moving) {
    fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw)); right.set(-fwd.z, 0, fwd.x);
    const base = 3.6 * (powers() ? 1.5 : 1);   // a walk that suits the small village
    const v = base * (run ? 1.7 : 1) * (underwater ? 0.5 : 1) * dt;
    const dx = (right.x * mx - fwd.x * mz) * v, dz = (right.z * mx - fwd.z * mz) * v;
    tryMove(dx, dz); facing = Math.atan2(dx, dz);
  }
  if (seated) { player.x = seated.cx; player.z = seated.cz; facing = seated.facing; }

  // vertical: fall and jump; the admin walks on the sea
  let g = ground(player.x, player.z, player.y);
  if (powers() && where === "out") g = Math.max(g, SEA);
  { vy -= 25 * dt; player.y += vy * dt; if (player.y <= g) { player.y = g; vy = 0; } if (g > player.y - 0.01 && g - player.y < 0.65) player.y = g; }

  // avatar pose
  avatar.g.position.copy(player);
  avatar.g.rotation.set(0, facing, 0); walk(avatar, t, moving && player.y <= g + 0.01, 1); if (seated) { sit(avatar); avatar.g.position.y += 0.06; }
  if (napT >= 0) { napT += dt; if (napT > 3) { napT = -1; toast(t9n("napWake"), 1.8); SFX.pop(); } }

  // every house has a door: walk in, and back out through the door inside
  doorCool -= dt;
  if (where === "out" && doorCool <= 0) {
    for (const d of [...negara.doors, ...terrain.doorsNear(player.x, player.z), ...homes.doors()])
      if (Math.hypot(player.x - d.x, player.z - d.z) < 1.05) { enterHouse(d); break; }
  }
  if (where === "house" && player.z > house.spawn.z + 0.75 && Math.abs(player.x) < 0.8) leaveHouse();
  // drowning: when your head goes under the sea
  if (where === "out" && !powers() && player.y + 0.9 < SEA) {
    drownT += dt; $("water").style.opacity = Math.min(1, drownT * 1.2);
    if (drownT > 0.6 && drownT - dt <= 0.6) { SFX.glug(); toast(t9n("drown"), 2.4); }
    if (drownT > 2.4) { drownT = 0; $("water").style.opacity = 0; placeAt("out", negara.spawn.x, negara.spawn.z, negara.spawn.yaw); toast(t9n("respawn"), 2.4); }
  } else if (drownT > 0) { drownT = Math.max(0, drownT - dt * 2); $("water").style.opacity = Math.min(1, drownT * 1.2); }
  if (where === "out" && !foreignShown && Math.hypot(player.x, player.z) > HOME_R + 80 && heightAt(player.x, player.z) > SEA + 0.4) { foreignShown = true; toast(t9n("foreign"), 3.4); }
  // working
  if (workT >= 0) {
    workT += dt; $("progI").style.width = `${Math.min(100, workT / 4 * 100)}%`;
    if (workT >= 4) { workT = -1; $("prog").style.display = "none"; S.coins += 10; dirty = true; SFX.coin(); toast(t9n("paid", { n: 10 }), 1.8); hud(); }
  }
  // what can you use here?
  renderActs(creating || panel || building ? [] : findActs());

  // the places move
  if (where === "house") house.update(camera.position);
  else { negara.president.g.visible = !(powers() && S.adm.form === "president");   // the admin is the president
    negara.update(dt, camera.position); sun.position.set(player.x + 9, 22, player.z + 12); sun.target.position.copy(player); }

  // camera: third person, 360° around the player, pulled in when a wall, a block or the ceiling is in the way
  const d = dist * (where === "house" ? 1.35 : 1);
  camT.set(player.x, player.y + (seated ? 0.7 : 0.85) + (avatar.lift || 0) * avatar.g.scale.y * 1.3, player.z);
  const inHouse = where === "house" && !creating, cy = yaw, cp = inHouse ? Math.max(pitch, 0.9) : pitch;
  let k = d;
  for (; k > 1.2; k -= 0.25) if (camOK(camT.x + Math.sin(cy) * Math.cos(cp) * k, camT.y + Math.sin(cp) * k, camT.z + Math.cos(cy) * Math.cos(cp) * k)) break;
  camera.position.set(camT.x + Math.sin(cy) * Math.cos(cp) * k, camT.y + Math.sin(cp) * k, camT.z + Math.cos(cy) * Math.cos(cp) * k);
  camera.lookAt(camT);
  const lift = creating && innerWidth <= 700;   // on a phone the creator sheet covers the bottom: show the character higher up
  if (lift !== camera.userData.lift) { camera.userData.lift = lift; if (lift) camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight * 0.3, innerWidth, innerHeight); else camera.clearViewOffset(); }
  if (where === "out") { const uw = camera.position.y < SEA; out.background.copy(uw ? C_DEEP : C_SKY); out.fog.color.copy(uw ? C_DEEP : C_FOG); out.fog.far = uw ? 22 : touch ? 85 : 120; }

  // bubbles, toasts, autosave
  if (bubbleT > 0) {
    bubbleT -= dt; bubbleAt().project(camera);
    const b = $("bubble"); b.style.left = `${(tmp.x + 1) / 2 * innerWidth}px`; b.style.top = `${(1 - tmp.y) / 2 * innerHeight}px`;
    if (bubbleT <= 0) b.style.display = "none";
  }
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $("toast").classList.remove("on"); }
  if (stampT > 0) { stampT -= dt; if (stampT <= 0) $("stamp").classList.remove("on"); }
  saveT += dt; if (saveT > 3 && S.created) { saveT = 0; if (dirty || moving) save(); }
  renderer.render(scene(), camera);
  requestAnimationFrame(frame);
}

// ---------- start ----------
sides(); makeAvatar(); placeAt("out", player.x, player.z, S.created ? yaw : negara.spawn.yaw); labels();
if (!S.created) openCreator();
addEventListener("pagehide", () => S.created && save());
document.fonts.ready.then(() => labels());
requestAnimationFrame(frame);
if (DEBUG) window.__cz = { player, S, builder, negara, terrain, heightAt, placeAt, refreshLevel, toggleBuild, get where() { return where; },
  get acts() { return curActs.map((a) => a[0]); }, openAdmin, homes, get house() { return house; }, enterHouse, toggleBuild, pick, setTool, aimHouse, buyHouse, get houseTarget() { return houseTarget; }, ndc, get isAdmin() { return isAdmin; }, PLACES, act: (i = 0) => curActs[i] && curActs[i][1](), get DATA() { return DATA; }, get avatar() { return avatar; } };
