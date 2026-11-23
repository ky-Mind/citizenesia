// CITIZENESIA as it stands in the reels (Instagram @citizenesia.official): a small kampung country whose people are its followers, where the
// most-liked comment decides what happens next. The village itself comes from the latest episode (kampung.js); this file adds what the game
// needs on top: what you bump into, the house doors, the places you can use, and Pak Presiden as a form for the admin.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { M, mat } from "./kit.js";
import { baby, grow } from "./actors.js";
import * as K from "./kampung.js";

// the kampung houses (the same list as the village script), each with a door you can walk through
const HOUSES = [[-9, -9, "#f6e6c4", 0.6], [-4, -12.5, "#d9ecd1", 0.15], [4, -12.5, "#f7d9d9", -0.15], [9, -9.5, "#dfe7f6", -0.6],
  [-12.5, -2, "#f3e7b8", 1.2], [12.5, -2.5, "#e9e2f4", -1.2], [-13, 6, "#f6e6c4", 1.9], [13, 6, "#d9ecd1", -1.9]];
const local = (x, z, ry, lx, lz) => ({ x: x + lx * Math.cos(ry) + lz * Math.sin(ry), z: z - lx * Math.sin(ry) + lz * Math.cos(ry) });

export function buildNegara(quality = {}) {
  const scene = K.scene, T0 = K.END + 1;
  K.renderAt(T0);
  scene.updateMatrixWorld(true);

  // what you bump into: every visible mesh standing on the ground with a real footprint (walls, posts, trunks, counters, beds)
  const solids = [], box = new THREE.Box3();
  scene.traverseVisible((o) => {
    if (!o.isMesh || o.isInstancedMesh) return;
    box.setFromObject(o);
    const w = box.max.x - box.min.x, d = box.max.z - box.min.z, h = box.max.y - box.min.y;
    if (box.min.y > 0.4 || h < 0.35 || w * d < 0.06 || w > 9 || d > 9 || w * d > 30) return;
    solids.push({ x0: box.min.x, x1: box.max.x, z0: box.min.z, z1: box.max.z, h: box.max.y });
  });

  const doors = HOUSES.map(([x, z, wall, ry], i) => ({ ...local(x, z, ry, -0.4, 1.3), ry, wall, type: "s", id: "k" + i }));
  // keep the doorways clear of the teras posts in front of them
  const clear = doors.map((d) => ({ x0: d.x - 0.45, x1: d.x + 0.45, z0: d.z - 0.45, z1: d.z + 0.45 }));
  for (let i = solids.length - 1; i >= 0; i--) { const b = solids[i]; if (clear.some((c) => b.x0 < c.x1 && b.x1 > c.x0 && b.z0 < c.z1 && b.z1 > c.z0 && (b.x1 - b.x0) * (b.z1 - b.z0) < 0.1)) solids.splice(i, 1); }

  const wp = (o) => o.getWorldPosition(new THREE.Vector3());
  const chair = wp(K.first), gong = wp(K.gongG), war = wp(K.war), bak = wp(K.bak);
  const spots = {
    president: { x: K.PODIUM[0], z: K.PODIUM[1] + 1.4, r: 1.6 },
    chair: { x: chair.x, z: chair.z, r: 0.7, seat: { cx: chair.x, cz: chair.z, facing: Math.PI } },
    makan: { x: K.LOT.x, z: 2.0, r: 1.6 },   // in front of the open kitchen counter
    gong: { x: gong.x - 0.6, z: gong.z + 0.8, r: 1.3 },
    wapres: { x: K.SEAT[0], z: K.SEAT[1] + 0.9, r: 1.0 },
    vote: { x: K.BOX[0], z: K.BOX[1] + 0.8, r: 0.9 },
    kas: { x: K.KAS[0] + 0.5, z: K.KAS[1] + 1.9, r: 1.3 },
    rs: { x: K.RS[0], z: K.RS[1] - 1.8, r: 2.0 },
    sekolah: { x: K.SK[0], z: K.SK[1] - 1.8, r: 2.0 },
    panggung: { x: K.STG.x + 0.6, z: K.STG.z + 1.6, r: 1.8 },
    rakyat: { x: K.POP.x + 0.4, z: K.POP.z + 1.0, r: 1.4 },
    warung: { x: war.x + 0.9, z: war.z + 1.0, r: 1.6 },
    bakso: { x: bak.x - 0.8, z: bak.z + 0.9, r: 1.4 },
  };

  // phones: the village stands still (one frame, merged into few meshes) and only Pak Presiden moves; computers keep the idle life
  const still = !!quality.low;
  bake(scene, T0, still);
  let t = 0;
  function update(dt, cam) {
    t += dt;
    if (!still) { K.camera.position.copy(cam); K.renderAt(T0 + t); return; }
    const p = K.pres; p.arms[1].rotation.z = 0.9 + Math.sin(t * 2.2) * 0.15; p.body.rotation.z = Math.sin(t * 1.6) * 0.03;
  }
  return { scene, sun: K.sun, solids, doors, spots, update, paintTexts: K.paintTexts, setFollow: K.setFollow, president: K.pres, spawn: { x: 0, z: -10, yaw: Math.PI } };   // at the gapura, looking into the village
}

// Pak Presiden, as in the reels: peci, dark blue suit, red sash, glasses (the admin plays him)
export function president(name) {
  const p = K.dress(grow(baby(name || "PRESIDEN", { glasses: true }), 45, { pants: "#22232b" }), { peci: true });
  p.body.children.find((c) => c.userData.part === "torso").material = mat("#24324f", { roughness: 0.7 });
  M(new THREE.BoxGeometry(0.12, 1.15, 0.05), mat("#d8263a"), 0, 1.12, 0.36, p.body).rotation.z = 0.6;
  M(new THREE.BoxGeometry(0.1, 0.12, 0.02), mat("#e8c45a", { metalness: 0.5, roughness: 0.3 }), -0.14, 1.28, 0.42, p.body);
  return p;
}

// The village has about 3,000 separate meshes, too many draw calls for a phone. Everything that stays put (same place, shown, same colour
// at three moments of the idle loop) is merged into one mesh per material look; whatever moves stays as it is.
function bake(scene, T0, still) {
  const shown = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const look = (m) => [m.type, m.color?.getHexString(), m.emissive?.getHexString(), m.emissiveIntensity, m.opacity, m.transparent, m.side, m.map?.uuid,
    m.roughness, m.metalness, m.vertexColors, m.flatShading, m.depthWrite, m.fog].join("|");
  const snap = (t) => { K.renderAt(t); scene.updateMatrixWorld(true); const m = new Map(); scene.traverse((o) => { if (o.isMesh) m.set(o, { w: o.matrixWorld.clone(), v: shown(o), l: Array.isArray(o.material) ? null : look(o.material) }); }); return m; };
  const A = still ? null : snap(T0 + 7.9), B = still ? null : snap(T0 + 2.7), C = snap(T0);
  const pres = new Set(); K.pres.g.traverse((o) => pres.add(o));   // the president always stays his own mesh (he talks, the admin replaces him)
  const groups = new Map();
  for (const [o, a] of C) {
    if (pres.has(o)) continue;
    const b = still ? a : B.get(o), c = still ? a : A.get(o);
    if (!a.v || !b.v || !c.v || !a.l || a.l !== b.l || a.l !== c.l || o.children.length || o.isInstancedMesh || o.isSkinnedMesh) continue;
    if (!a.w.equals(b.w) || !a.w.equals(c.w) || !o.geometry.attributes.position) continue;
    const key = a.l + "|" + !!o.material.map;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  }
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const uv = !!list[0].material.map;
    const geos = list.map((o) => {
      let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      for (const n of Object.keys(g.attributes)) if (n !== "position" && n !== "normal" && !(uv && n === "uv")) g.deleteAttribute(n);
      if (!g.attributes.normal) g.computeVertexNormals();
      if (uv && !g.attributes.uv) return null;
      g.morphAttributes = {}; g.clearGroups(); return g.applyMatrix4(o.matrixWorld);
    });
    if (geos.some((g) => !g)) continue;
    const merged = mergeGeometries(geos, false); if (!merged) continue;
    const mesh = new THREE.Mesh(merged, list[0].material); mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh);
    list.forEach((o) => o.parent.remove(o));
  }
}
