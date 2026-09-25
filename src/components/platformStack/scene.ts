/**
 * The platform stack, in WebGL: three plates in 2:1 isometric (a 30° camera
 * at 45°, the projection of illustration and games) —
 *
 *   01 Interface     the Fintela app's home, with three cards lifted off it
 *   02 Engine        servers, a robot arm and a conveyor of data cubes
 *   03 Intelligence  a chip on a circuit board, a neural dome above its die
 *
 * joined by a spine of light: the dome's output climbs to the engine's hub,
 * the robot feeds processed cubes into the same hub, and the hub sends them
 * up to the interface.
 *
 * Lazily imported by PlatformStack.tsx the first time the band nears the
 * viewport, so three.js never reaches the entry bundle or the server render.
 * Pointer: hovering a layer lifts it and ghosts the layers above it so its
 * inside shows; dragging turns the stack; a tap pins a layer on touch. Left
 * alone, it tours the three layers. Under `prefers-reduced-motion` it draws
 * still frames only, on demand.
 */
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  CurvePath,
  CustomBlending,
  CylinderGeometry,
  DirectionalLight,
  DynamicDrawUsage,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  InstancedMesh,
  LineCurve3,
  LineDashedMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  OneFactor,
  OneMinusSrcAlphaFactor,
  OrthographicCamera,
  Path,
  PlaneGeometry,
  PMREMGenerator,
  Points,
  QuadraticBezierCurve3,
  Quaternion,
  Raycaster,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D,
  type Texture,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { palette, soft } from '../../theme/tokens';
import { CALLOUT_SIDE, STACK_LAYERS } from './layers';
import type { StackAnchor } from './layers';
import * as draw from './textures';

export interface StackSceneOptions {
  canvas: HTMLCanvasElement;
  reducedMotion: boolean;
  /** The layer being shown — by the pointer, a callout or the tour — or null. */
  onActiveChange: (layer: number | null) => void;
  /** Callout anchors, top layer first, in CSS px from the canvas's top-left. */
  onAnchors: (anchors: readonly StackAnchor[]) => void;
}

export interface StackScene {
  /** CSS size of the canvas, and the px each side kept clear for callouts. */
  resize(width: number, height: number, reserveX: number): void;
  /** On screen and the tab visible: animate (unless reduced motion). */
  setRunning(running: boolean): void;
  setReducedMotion(reduced: boolean): void;
  /** A callout hovered or focused (null when it lets go). */
  setActive(layer: number | null): void;
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Dimensions (world units; a plate is 10 × 7)
// ---------------------------------------------------------------------------

const W = 10;
const D = 7;
/** Plate thickness, top at local y = 0. */
const T = 0.42;
const CORNER = 0.42;
const BEVEL = 0.06;
/** Top-surface height of each plate at rest, top layer first. */
const REST_Y = [10.1, 5.4, 0] as const;
/** How far above its rest a plate starts its entrance. */
const DROP = 7.5;
const ACTIVE_LIFT = 0.3;
/** Plates above the shown layer rise and fade so its inside is visible. */
const GHOST_LIFT = 1.2;
const GHOST_OPACITY = 0.09;
/** Content height above each plate, for picking. */
const HIT_HEIGHT = [1.0, 2.2, 2.6] as const;
const MAX_YAW = 0.5;
const ELEVATION = Math.asin(0.5);
const AZIMUTH = Math.PI / 4;
const TARGET = new Vector3(0, 5, 0);
const CAMERA_DIR = new Vector3(
  Math.cos(ELEVATION) * Math.sin(AZIMUTH),
  Math.sin(ELEVATION),
  Math.cos(ELEVATION) * Math.cos(AZIMUTH),
);

const MAX_DPR = 2;
/** Backing-store cap: past ~3.2 MP a laptop GPU spends its frame on fill. */
const MAX_PIXELS = 3.2e6;
const MIN_FRAME_MS = (1000 / 60) * 0.75;
const MAX_DT = 1 / 20;
/** Seconds simulated before a reduced-motion still, so it is mid-flow, not empty. */
const STILL_WARMUP = 6;
/** Idle seconds before the tour takes over, and each stop's dwell. */
const TOUR_IDLE = 4.5;
const TOUR: ReadonlyArray<readonly [number | null, number]> = [
  [0, 3.2],
  [1, 3.4],
  [2, 3.6],
  [null, 2.4],
];

type Rgb = readonly [number, number, number];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smoothstep = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};
const ease = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpAngle = (a: number, b: number, t: number) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

/** sRGB triplet in 0..1 — the glow shader writes straight to the sRGB canvas. */
const rgb = (hex: string): Rgb => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

const MARK_RGB = draw.MARK.map(rgb) as readonly Rgb[];

const mulberry32 = (seed: number) => {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

const traceRoundedRect = (path: Path, w: number, d: number, r: number) => {
  const x = -w / 2;
  const y = -d / 2;
  const rr = Math.min(r, w / 2, d / 2);
  path.moveTo(x + rr, y);
  path.lineTo(x + w - rr, y);
  path.absarc(x + w - rr, y + rr, rr, -Math.PI / 2, 0, false);
  path.lineTo(x + w, y + d - rr);
  path.absarc(x + w - rr, y + d - rr, rr, 0, Math.PI / 2, false);
  path.lineTo(x + rr, y + d);
  path.absarc(x + rr, y + d - rr, rr, Math.PI / 2, Math.PI, false);
  path.lineTo(x, y + rr);
  path.absarc(x + rr, y + rr, rr, Math.PI, Math.PI * 1.5, false);
  return path;
};

/** A rounded slab, `w` × `d` in plan, its top face at y = 0. */
const slab = (w: number, d: number, thickness: number, r: number, bevel: number) => {
  const shape = traceRoundedRect(new Shape(), w - bevel * 2, d - bevel * 2, Math.max(0.01, r - bevel)) as Shape;
  const g = new ExtrudeGeometry(shape, {
    depth: thickness - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 10,
  });
  // Extrusion runs +z; turn it to +y (shape y → world −z) and drop the top to 0.
  g.rotateX(-Math.PI / 2);
  g.translate(0, -(thickness - bevel), 0);
  return g;
};

/**
 * The flat top of a slab as its own mesh, UVs spanning the whole rect: image
 * top at the far edge (−z), image left at −x — the app reads right-way-up
 * from the isometric camera.
 */
const topFace = (w: number, d: number, r: number) => {
  const g = new ShapeGeometry(traceRoundedRect(new Shape(), w, d, r) as Shape, 12);
  const pos = g.getAttribute('position');
  const uv = g.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / d + 0.5);
  g.rotateX(-Math.PI / 2);
  return g;
};

/** A thin light strip around a slab's side, coloured along the mark's gradient. */
const edgeStrip = (w: number, d: number, r: number, y: number, radius: number) => {
  const outline = traceRoundedRect(new Path(), w, d, r);
  const pts = outline.getSpacedPoints(220).map((p) => new Vector3(p.x, y, -p.y));
  pts.pop();
  const curve = new CatmullRomCurve3(pts, true, 'catmullrom', 0.1);
  const tubular = 440;
  const radial = 5;
  const g = new TubeGeometry(curve, tubular, radius, radial, true);
  const colors = new Float32Array(g.getAttribute('position').count * 3);
  const stops = [...MARK_RGB, MARK_RGB[0]];
  for (let i = 0; i <= tubular; i++) {
    const f = (i / tubular) * (stops.length - 1);
    const k = Math.min(stops.length - 2, Math.floor(f));
    const c = mixRgb(stops[k], stops[k + 1], f - k);
    const lin = new Color().setRGB(c[0], c[1], c[2], SRGBColorSpace);
    for (let j = 0; j <= radial; j++) {
      const idx = (i * (radial + 1) + j) * 3;
      colors[idx] = lin.r;
      colors[idx + 1] = lin.g;
      colors[idx + 2] = lin.b;
    }
  }
  g.setAttribute('color', new BufferAttribute(colors, 3));
  return g;
};

/** A floor-level polyline with rounded corners, as a tube. */
const pipe = (pts: ReadonlyArray<readonly [number, number]>, y: number, radius: number, bend = 0.2) => {
  const path = new CurvePath<Vector3>();
  const v = pts.map(([x, z]) => new Vector3(x, y, z));
  let cursor = v[0].clone();
  for (let i = 1; i < v.length; i++) {
    const corner = v[i];
    if (i === v.length - 1) {
      path.add(new LineCurve3(cursor, corner));
      break;
    }
    const next = v[i + 1];
    const inDir = corner.clone().sub(v[i - 1]).normalize();
    const outDir = next.clone().sub(corner).normalize();
    const a = corner.clone().addScaledVector(inDir, -bend);
    const b = corner.clone().addScaledVector(outDir, bend);
    path.add(new LineCurve3(cursor, a));
    path.add(new QuadraticBezierCurve3(a, corner, b));
    cursor = b;
  }
  return new TubeGeometry(path, 90, radius, 8, false);
};

const gearGeometry = (r: number, teeth: number, thickness: number) => {
  const shape = new Shape();
  const ri = r * 0.84;
  const step = (Math.PI * 2) / teeth;
  for (let k = 0; k < teeth; k++) {
    const a = k * step;
    const profile = [
      [ri, a],
      [r, a + step * 0.2],
      [r, a + step * 0.45],
      [ri, a + step * 0.65],
    ] as const;
    profile.forEach(([rad, ang], j) => {
      const x = Math.cos(ang) * rad;
      const y = Math.sin(ang) * rad;
      if (k === 0 && j === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
  }
  shape.closePath();
  const hub = new Path();
  hub.absarc(0, 0, r * 0.18, 0, Math.PI * 2, true);
  shape.holes.push(hub);
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + Math.PI / 4;
    const hole = new Path();
    hole.absarc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.15, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  const g = new ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 1,
    curveSegments: 12,
  });
  g.translate(0, 0, -thickness / 2);
  return g;
};

// ---------------------------------------------------------------------------
// Glow points: one shader for pulses, halos and packets
// ---------------------------------------------------------------------------

const GLOW_VERTEX = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
attribute vec3 aColor;
uniform float uScale;
uniform float uOpacity;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vColor = aColor;
  vAlpha = aAlpha * uOpacity;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = max(aSize * uScale, 1.0);
}`;

const GLOW_FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0 || vAlpha <= 0.0) discard;
  float core = smoothstep(0.34, 0.0, d);
  float halo = pow(1.0 - d, 2.4);
  vec3 col = mix(vColor, vec3(1.0), core * 0.55);
  float a = clamp(halo * 0.7 + core, 0.0, 1.0) * vAlpha;
  gl_FragColor = vec4(col * a, a);
}`;

interface Glow {
  points: Points;
  material: ShaderMaterial;
  put(i: number, x: number, y: number, z: number, color: Rgb, size: number, alpha: number): void;
  flush(count: number): void;
}

/**
 * `additive` for light on the dark board and dome; normal (premultiplied)
 * blending for packets seen against the page's light ground, where an
 * additive glow would vanish into the white.
 */
const makeGlow = (capacity: number, additive: boolean, scale: { value: number }): Glow => {
  const pos = new Float32Array(capacity * 3);
  const col = new Float32Array(capacity * 3);
  const size = new Float32Array(capacity);
  const alpha = new Float32Array(capacity);
  const geometry = new BufferGeometry();
  const attrs = [
    ['position', new BufferAttribute(pos, 3)],
    ['aColor', new BufferAttribute(col, 3)],
    ['aSize', new BufferAttribute(size, 1)],
    ['aAlpha', new BufferAttribute(alpha, 1)],
  ] as const;
  for (const [name, attr] of attrs) geometry.setAttribute(name, attr.setUsage(DynamicDrawUsage));
  const material = new ShaderMaterial({
    uniforms: { uScale: scale, uOpacity: { value: 1 } },
    vertexShader: GLOW_VERTEX,
    fragmentShader: GLOW_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: CustomBlending,
    blendSrc: OneFactor,
    blendDst: additive ? OneFactor : OneMinusSrcAlphaFactor,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 2;
  return {
    points,
    material,
    put(i, x, y, z, color, s, a) {
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      col[i * 3] = color[0];
      col[i * 3 + 1] = color[1];
      col[i * 3 + 2] = color[2];
      size[i] = s;
      alpha[i] = a;
    },
    flush(count) {
      geometry.setDrawRange(0, count);
      for (const [, attr] of attrs) attr.needsUpdate = true;
    },
  };
};

// ---------------------------------------------------------------------------
// Layers
// ---------------------------------------------------------------------------

interface Rig {
  group: Group;
  /** Local-space callout anchor: the plate's outermost corner on its callout's side. */
  anchor: Vector3;
  /** The side light strip — lit when the layer is shown. */
  strip: MeshBasicMaterial;
  /** Strip opacity at rest (the chip's is always on). */
  stripRest: number;
  tick(t: number, dt: number): void;
}

interface Kit {
  tex(canvas: HTMLCanvasElement): CanvasTexture;
  blob(w: number, d: number, opacity: number, round?: boolean): Mesh;
  glowScale: { value: number };
}

interface Bus {
  /** Send a packet up beam 0 (dome → engine) or 1 (engine → interface). */
  emit(beam: number, color: Rgb): void;
  /** A packet reached the engine's hub from below. */
  hubPulse(strength: number): void;
}

const std = (color: string, roughness: number, metalness: number) =>
  new MeshStandardMaterial({ color, roughness, metalness });

const cornerAnchor = (side: 'left' | 'right') => {
  const k = CORNER * (1 - Math.SQRT1_2);
  const x = W / 2 - k;
  const z = D / 2 - k;
  return side === 'right' ? new Vector3(x, -T / 2, -z) : new Vector3(-x, -T / 2, z);
};

const makeStrip = (group: Group, rest: number) => {
  const material = new MeshBasicMaterial({ vertexColors: true, toneMapped: false, transparent: true, opacity: rest });
  const strip = new Mesh(edgeStrip(W + 0.012, D + 0.012, CORNER, -T / 2, 0.028), material);
  strip.userData.ownOpacity = true;
  group.add(strip);
  return material;
};

/** Plate-texture units (x right, y down; 10 × 7) → plate-local x/z on the inset top face. */
const texX = (x: number) => (x / 10 - 0.5) * (W - BEVEL * 2);
const texZ = (y: number) => (y / 7 - 0.5) * (D - BEVEL * 2);

const buildInterface = (kit: Kit, index: number): Rig => {
  const group = new Group();
  group.add(new Mesh(slab(W, D, T, CORNER, BEVEL), std('#fcfcfc', 0.55, 0)));
  const top = new Mesh(
    topFace(W - BEVEL * 2, D - BEVEL * 2, CORNER - BEVEL),
    new MeshBasicMaterial({ map: kit.tex(draw.drawInterfaceTop()), toneMapped: false }),
  );
  top.position.y = 0.003;
  group.add(top);

  const guideMaterial = new LineDashedMaterial({
    color: '#8d949c',
    dashSize: 0.08,
    gapSize: 0.07,
    transparent: true,
    opacity: 0.85,
  });
  const cardBody = std('#ffffff', 0.5, 0);
  const specs = [
    { slot: draw.INTERFACE_SLOTS.hero, canvas: draw.drawHeroCard(), lift: 0.84, radius: 0.12, phase: 0 },
    { slot: draw.INTERFACE_SLOTS.exposure, canvas: draw.drawExposureCard(), lift: 0.46, radius: 0.1, phase: 1.9 },
    { slot: draw.INTERFACE_SLOTS.equity, canvas: draw.drawEquityCard(), lift: 0.64, radius: 0.1, phase: 3.4 },
  ];
  const cards = specs.map((spec) => {
    const w = (spec.slot.w / 10) * (W - BEVEL * 2);
    const d = (spec.slot.h / 7) * (D - BEVEL * 2);
    const r = Math.min(spec.radius, d / 2 - 0.002);
    const cx = texX(spec.slot.x + spec.slot.w / 2);
    const cz = texZ(spec.slot.y + spec.slot.h / 2);
    const card = new Group();
    card.position.set(cx, spec.lift, cz);
    const face = new Mesh(
      topFace(w - 0.04, d - 0.04, r - 0.02),
      new MeshBasicMaterial({ map: kit.tex(spec.canvas), toneMapped: false }),
    );
    face.position.y = 0.002;
    card.add(new Mesh(slab(w, d, 0.07, r, 0.02), cardBody), face);
    const shadow = kit.blob(w, d, 0.2);
    shadow.position.set(cx + 0.1, 0.006, cz - 0.06);
    // Its opacity follows the card's height, so tick() owns it (times the layer's ghosting).
    shadow.userData.ownOpacity = true;
    // Exploded-view guides: dashed verticals from the slot's corners up to the card's.
    const guideGeometry = new BufferGeometry();
    const guidePos = new Float32Array(8 * 3);
    guideGeometry.setAttribute('position', new BufferAttribute(guidePos, 3));
    const guides = new LineSegments(guideGeometry, guideMaterial);
    guides.frustumCulled = false;
    group.add(card, shadow, guides);
    return { ...spec, card, shadow, guides, guidePos, w, d, cx, cz };
  });

  return {
    group,
    anchor: cornerAnchor(CALLOUT_SIDE[STACK_LAYERS[index]]),
    strip: makeStrip(group, 0),
    stripRest: 0,
    tick(t) {
      for (const c of cards) {
        const y = c.lift + Math.sin(t * 0.8 + c.phase) * 0.05;
        c.card.position.y = y;
        (c.shadow.material as MeshBasicMaterial).opacity = (0.26 - (y - 0.55) * 0.12) * (group.userData.opacity ?? 1);
        const hw = c.w / 2 - 0.12;
        const hd = c.d / 2 - 0.06;
        let k = 0;
        for (const [sx, sz] of [
          [-1, -1],
          [1, -1],
          [1, 1],
          [-1, 1],
        ] as const) {
          const x = c.cx + sx * hw;
          const z = c.cz + sz * hd;
          c.guidePos.set([x, 0.004, z, x, y - 0.07, z], k);
          k += 6;
        }
        c.guides.geometry.getAttribute('position').needsUpdate = true;
        c.guides.computeLineDistances();
      }
    },
  };
};

/** Engine layout, plate-local (x across, z toward the viewer's left). */
const ENGINE = {
  robot: [2.2, 1.75],
  hub: [1.2, 0.6],
  conveyor: { x0: -3.4, x1: 1.1, z: 2.75 },
  racks: { x0: 0.55, x1: 4.0, z: -2.55 },
} as const;

const buildEngine = (kit: Kit, index: number, bus: Bus): Rig => {
  const group = new Group();
  group.add(new Mesh(slab(W, D, T, CORNER, BEVEL), std('#2d2d2d', 0.45, 0.4)));
  const floor = new Mesh(
    topFace(W - BEVEL * 2, D - BEVEL * 2, CORNER - BEVEL),
    new MeshStandardMaterial({ map: kit.tex(draw.drawEngineFloor(ENGINE)), roughness: 0.82, metalness: 0.1 }),
  );
  floor.position.y = 0.003;
  group.add(floor);

  const dark = std('#1c1c1c', 0.4, 0.6);
  const graphite = std('#3a3a3a', 0.45, 0.55);
  const yellow = std(palette.yellow, 0.38, 0.15);
  const steel = std('#a3a8ae', 0.3, 0.85);

  // Server racks along the back-right edge, fronts toward +z.
  const rackXs = [0, 1, 2, 3].map((i) => lerp(ENGINE.racks.x0, ENGINE.racks.x1, i / 3));
  const RW = 1.05;
  const RH = 1.75;
  const RD = 0.85;
  const rackFront = new MeshStandardMaterial({ map: kit.tex(draw.drawRackFront()), roughness: 0.5, metalness: 0.5 });
  const rackSide = new MeshStandardMaterial({ map: kit.tex(draw.drawRackSide()), roughness: 0.5, metalness: 0.5 });
  const rackTop = std('#262626', 0.5, 0.5);
  const rackGeometry = new BoxGeometry(RW, RH, RD);
  for (const x of rackXs) {
    const rack = new Mesh(rackGeometry, [rackSide, rackSide, rackTop, rackTop, rackFront, rackTop]);
    rack.position.set(x, RH / 2, ENGINE.racks.z);
    const shadow = kit.blob(RW + 0.1, RD + 0.1, 0.45);
    shadow.position.set(x, 0.006, ENGINE.racks.z);
    group.add(rack, shadow);
  }
  // LEDs: three per bay, blinking.
  const ledsPerRack = draw.RACK_BAYS * 3;
  const leds = new InstancedMesh(
    new BoxGeometry(0.055, 0.035, 0.012),
    new MeshBasicMaterial({ toneMapped: false }),
    rackXs.length * ledsPerRack,
  );
  const m4 = new Matrix4();
  const bayH = (448 - 30 - 22) / draw.RACK_BAYS / 448;
  rackXs.forEach((x, r) => {
    for (let b = 0; b < draw.RACK_BAYS; b++) {
      const y = RH - ((30 + (b + 0.5) * bayH * 448) / 448) * RH;
      for (let l = 0; l < 3; l++) {
        m4.makeTranslation(x - RW / 2 + 0.14 + l * 0.075, y, ENGINE.racks.z + RD / 2 + 0.007);
        leds.setMatrixAt(r * ledsPerRack + b * 3 + l, m4);
      }
    }
  });
  const ledColors = [new Color('#34d399'), new Color(palette.yellow), new Color('#5aa9e6'), new Color('#303030')];
  const ledRand = mulberry32(5);
  const pickLed = () => {
    const r = ledRand();
    return ledColors[r < 0.55 ? 0 : r < 0.72 ? 1 : r < 0.84 ? 2 : 3];
  };
  for (let i = 0; i < leds.count; i++) leds.setColorAt(i, pickLed());
  group.add(leds);

  // A gantry over the racks: two posts and a yellow beam, a beacon on each post.
  const gantryZ = ENGINE.racks.z;
  const postGeometry = new BoxGeometry(0.12, 2.3, 0.12);
  const beacons: MeshBasicMaterial[] = [];
  for (const x of [ENGINE.racks.x0 - 0.72, ENGINE.racks.x1 + 0.72]) {
    const post = new Mesh(postGeometry, graphite);
    post.position.set(x, 1.15, gantryZ);
    const beaconMaterial = new MeshBasicMaterial({ color: '#34d399', toneMapped: false });
    beacons.push(beaconMaterial);
    const beacon = new Mesh(new SphereGeometry(0.075, 14, 10), beaconMaterial);
    beacon.position.set(x, 2.38, gantryZ);
    const shadow = kit.blob(0.3, 0.3, 0.4, true);
    shadow.position.set(x, 0.006, gantryZ);
    group.add(post, beacon, shadow);
  }
  const beam = new Mesh(new BoxGeometry(ENGINE.racks.x1 - ENGINE.racks.x0 + 1.56, 0.14, 0.16), yellow);
  beam.position.set((ENGINE.racks.x0 + ENGINE.racks.x1) / 2, 2.24, gantryZ);
  group.add(beam);

  // Hub: where processed cubes are sent up to the interface.
  const [hubX, hubZ] = ENGINE.hub;
  const hubBase = new Mesh(new CylinderGeometry(0.5, 0.55, 0.12, 40), dark);
  hubBase.position.set(hubX, 0.06, hubZ);
  const hubPad = new Mesh(new CylinderGeometry(0.34, 0.34, 0.06, 40), graphite);
  hubPad.position.set(hubX, 0.15, hubZ);
  const ringMaterial = new MeshBasicMaterial({ color: palette.yellow, toneMapped: false });
  const ring = new Mesh(new TorusGeometry(0.42, 0.03, 8, 56), ringMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(hubX, 0.125, hubZ);
  const hubShadow = kit.blob(1.2, 1.2, 0.45, true);
  hubShadow.position.set(hubX, 0.006, hubZ);
  group.add(hubBase, hubPad, ring, hubShadow);
  let hubFlash = 0;
  const ringRest = new Color(palette.yellow);
  const ringHot = new Color('#fff4cf');

  // Pipes from two racks to the hub.
  const pipeY = 0.07;
  const pipeA = new Mesh(
    pipe(
      [
        [rackXs[0], ENGINE.racks.z + RD / 2],
        [rackXs[0], 0.05],
        [hubX - 0.4, hubZ - 0.3],
      ],
      pipeY,
      0.055,
    ),
    steel,
  );
  const pipeB = new Mesh(
    pipe(
      [
        [rackXs[2], ENGINE.racks.z + RD / 2],
        [rackXs[2], -0.45],
        [hubX + 0.35, -0.45],
        [hubX + 0.25, hubZ - 0.43],
      ],
      pipeY,
      0.055,
    ),
    graphite,
  );
  group.add(pipeA, pipeB);

  // Gears on a machine wall at the left.
  const wall = new Mesh(new RoundedBoxGeometry(2.3, 1.6, 0.14, 2, 0.04), std('#232323', 0.5, 0.5));
  wall.position.set(-3.1, 0.8, 0.92);
  const wallShadow = kit.blob(2.4, 0.3, 0.45);
  wallShadow.position.set(-3.1, 0.006, 0.95);
  const gearA = new Mesh(gearGeometry(0.6, 14, 0.12), steel);
  gearA.position.set(-3.55, 0.95, 1.08);
  const gearB = new Mesh(gearGeometry(0.38, 9, 0.12), yellow);
  const meshDistance = 0.6 + 0.38 - 0.08;
  gearB.position.set(-3.55 + Math.cos(-0.42) * meshDistance, 0.95 + Math.sin(-0.42) * meshDistance, 1.08);
  const axleGeometry = new CylinderGeometry(0.07, 0.07, 0.2, 16);
  for (const gear of [gearA, gearB]) {
    const axle = new Mesh(axleGeometry, dark);
    axle.rotation.x = Math.PI / 2;
    axle.position.copy(gear.position);
    group.add(axle);
  }
  group.add(wall, wallShadow, gearA, gearB);

  // Conveyor: frame, scrolling belt, yellow rails, end rollers.
  const { x0, x1, z: cz } = ENGINE.conveyor;
  const len = x1 - x0;
  const frame = new Mesh(new BoxGeometry(len, 0.2, 0.72), dark);
  frame.position.set((x0 + x1) / 2, 0.1, cz);
  const beltTexture = kit.tex(draw.drawBelt());
  beltTexture.wrapS = RepeatWrapping;
  beltTexture.repeat.set(len / 0.3, 1);
  const belt = new Mesh(
    new PlaneGeometry(len, 0.6).rotateX(-Math.PI / 2),
    new MeshStandardMaterial({ map: beltTexture, roughness: 0.9, metalness: 0 }),
  );
  belt.position.set((x0 + x1) / 2, 0.203, cz);
  const railGeometry = new BoxGeometry(len, 0.06, 0.05);
  for (const s of [-1, 1]) {
    const rail = new Mesh(railGeometry, yellow);
    rail.position.set((x0 + x1) / 2, 0.23, cz + s * 0.36);
    group.add(rail);
  }
  const rollerGeometry = new CylinderGeometry(0.11, 0.11, 0.74, 20);
  for (const x of [x0, x1]) {
    const roller = new Mesh(rollerGeometry, steel);
    roller.rotation.x = Math.PI / 2;
    roller.position.set(x, 0.11, cz);
    group.add(roller);
  }
  const conveyorShadow = kit.blob(len + 0.3, 0.9, 0.45);
  conveyorShadow.position.set((x0 + x1) / 2, 0.006, cz);
  group.add(frame, belt, conveyorShadow);

  // Data cubes in the mark's three hues.
  const CUBE = 0.26;
  const cubeGeometry = new RoundedBoxGeometry(CUBE, CUBE, CUBE, 2, 0.04);
  const cubeMaterials = draw.MARK.map(
    (hex) => new MeshStandardMaterial({ color: hex, roughness: 0.35, metalness: 0.1, emissive: hex, emissiveIntensity: 0.25 }),
  );
  const CUBES = 5;
  const conveyorCubes = Array.from({ length: CUBES }, (_, i) => {
    const cube = new Mesh(cubeGeometry, cubeMaterials[i % 3]);
    group.add(cube);
    return cube;
  });
  const carried = new Mesh(cubeGeometry, cubeMaterials[0]);
  group.add(carried);

  // Robot arm: yellow links, dark joints, elbow-up two-link IK.
  const SH = 0.58;
  const L1 = 1.08;
  const L2 = 0.98;
  const HAND = 0.25;
  const [baseX, baseZ] = ENGINE.robot;
  const robot = new Group();
  robot.position.set(baseX, 0, baseZ);
  const robotShadow = kit.blob(1.0, 1.0, 0.5, true);
  robotShadow.position.set(baseX, 0.006, baseZ);
  group.add(robot, robotShadow);
  const base = new Mesh(new CylinderGeometry(0.4, 0.46, 0.12, 36), dark);
  base.position.y = 0.06;
  const turret = new Group();
  robot.add(base, turret);
  const turretMesh = new Mesh(new CylinderGeometry(0.27, 0.32, 0.42, 32), yellow);
  turretMesh.position.y = 0.33;
  const shoulder = new Group();
  shoulder.position.y = SH;
  turret.add(turretMesh, shoulder);
  const joint = (r: number, len2: number) => {
    const m = new Mesh(new CylinderGeometry(r, r, len2, 24), dark);
    m.rotation.x = Math.PI / 2;
    return m;
  };
  const upper = new Mesh(new RoundedBoxGeometry(0.2, L1, 0.24, 2, 0.05), yellow);
  upper.position.y = L1 / 2;
  const elbow = new Group();
  elbow.position.y = L1;
  shoulder.add(joint(0.17, 0.4), upper, elbow);
  const fore = new Mesh(new RoundedBoxGeometry(0.16, L2, 0.19, 2, 0.045), yellow);
  fore.position.y = L2 / 2;
  const wrist = new Group();
  wrist.position.y = L2;
  elbow.add(joint(0.13, 0.33), fore, wrist);
  const hand = new Mesh(new RoundedBoxGeometry(0.44, 0.08, 0.15, 2, 0.02), dark);
  hand.position.y = 0.08;
  const fingerGeometry = new BoxGeometry(0.045, 0.2, 0.12);
  const fingers = [-1, 1].map((s) => {
    const f = new Mesh(fingerGeometry, graphite);
    f.position.set(s * 0.2, 0.22, 0);
    wrist.add(f);
    return f;
  });
  wrist.add(joint(0.09, 0.26), hand);

  const polar = (x: number, y: number, z: number) => ({
    yaw: Math.atan2(-(z - baseZ), x - baseX),
    r: Math.hypot(x - baseX, z - baseZ),
    y,
  });
  const cubeY = 0.203 + CUBE / 2;
  const pickX = x1 - 0.22;
  const PICK = polar(pickX, cubeY, cz);
  const ABOVE_PICK = { ...PICK, y: cubeY + 0.55 };
  const PLACE = polar(hubX, 0.18 + CUBE / 2, hubZ);
  const ABOVE_PLACE = { ...PLACE, y: PLACE.y + 0.6 };
  const HOME = { yaw: lerpAngle(PICK.yaw, PLACE.yaw, 0.5), r: 1.25, y: 1.25 };
  type Pose = typeof HOME;
  const KEYS: ReadonlyArray<readonly [number, Pose, number]> = [
    [0.0, HOME, 0],
    [0.16, ABOVE_PICK, 0],
    [0.26, PICK, 0],
    [0.32, PICK, 1],
    [0.42, ABOVE_PICK, 1],
    [0.66, ABOVE_PLACE, 1],
    [0.76, PLACE, 1],
    [0.82, PLACE, 0],
    [0.9, ABOVE_PLACE, 0],
    [1.0, HOME, 0],
  ];
  const PERIOD = 4.4;
  const PICK_AT = 0.3;
  const DROP_AT = 0.8;
  const pose = (phase: number) => {
    let k = 0;
    while (k < KEYS.length - 2 && phase > KEYS[k + 1][0]) k++;
    const [ta, pa, ga] = KEYS[k];
    const [tb, pb, gb] = KEYS[k + 1];
    const f = ease(clamp((phase - ta) / (tb - ta), 0, 1));
    return { yaw: lerpAngle(pa.yaw, pb.yaw, f), r: lerp(pa.r, pb.r, f), y: lerp(pa.y, pb.y, f), grip: lerp(ga, gb, f) };
  };
  const solve = (r: number, gripY: number) => {
    const wx = r;
    const wy = gripY + HAND - SH;
    const d = clamp(Math.hypot(wx, wy), Math.abs(L1 - L2) + 0.01, L1 + L2 - 0.01);
    const phi = Math.atan2(wx, wy);
    const A = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const B = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
    const a1 = phi - A;
    const a2 = Math.PI - B;
    return [a1, a2, Math.PI - a1 - a2] as const;
  };

  const spacing = (len - 0.44) / CUBES;
  const speed = spacing / PERIOD;
  const beltStart = x0 + 0.22;
  let lastCycle = -1;
  let ledClock = 0;
  let beaconClock = 0;

  bus.hubPulse = (strength) => {
    hubFlash = Math.max(hubFlash, strength);
  };

  return {
    group,
    anchor: cornerAnchor(CALLOUT_SIDE[STACK_LAYERS[index]]),
    strip: makeStrip(group, 0),
    stripRest: 0,
    tick(t, dt) {
      gearA.rotation.z = t * 0.7;
      gearB.rotation.z = -t * 0.7 * (14 / 9) + 0.2;
      beltTexture.offset.x = -(speed * t) / 0.3;

      // Cubes ride the belt; one reaches the end each cycle, just as the gripper closes on it.
      const cycle = Math.floor((t - PICK_AT * PERIOD) / PERIOD);
      conveyorCubes.forEach((cube, i) => {
        const s = (((speed * (t - PICK_AT * PERIOD) + i * spacing) % (spacing * CUBES)) + spacing * CUBES) % (spacing * CUBES);
        cube.position.set(beltStart + s, cubeY, cz);
        cube.scale.setScalar(Math.max(0.001, smoothstep(0, 0.35, s)));
      });

      const phase = (((t % PERIOD) + PERIOD) % PERIOD) / PERIOD;
      const p = pose(phase);
      turret.rotation.y = p.yaw;
      const [a1, a2, a3] = solve(p.r, p.y);
      shoulder.rotation.z = -a1;
      elbow.rotation.z = -a2;
      wrist.rotation.z = -a3;
      const gap = lerp(0.21, 0.155, p.grip);
      fingers[0].position.x = -gap;
      fingers[1].position.x = gap;

      // The cube in hand: picked at PICK_AT, set on the hub at DROP_AT, sent up
      // just after. In cycle k the belt cube that wrapped is i = −k mod CUBES.
      const hue = (((-cycle % CUBES) + CUBES) % CUBES) % 3;
      carried.material = cubeMaterials[hue];
      if (phase >= PICK_AT && phase < DROP_AT) {
        carried.visible = true;
        carried.position.set(baseX + p.r * Math.cos(p.yaw), p.y, baseZ - p.r * Math.sin(p.yaw));
        carried.rotation.y = p.yaw;
        carried.scale.setScalar(1);
      } else if (phase >= DROP_AT && phase < 0.97) {
        const f = smoothstep(0.86, 0.97, phase);
        carried.visible = f < 0.999;
        carried.position.set(hubX, PLACE.y - f * 0.08, hubZ);
        carried.scale.setScalar(Math.max(0.001, 1 - f));
      } else {
        carried.visible = false;
      }
      if (phase >= 0.88 && cycle !== lastCycle) {
        lastCycle = cycle;
        hubFlash = 1;
        bus.emit(1, MARK_RGB[hue]);
      }

      hubFlash = Math.max(0, hubFlash - dt * 1.8);
      ringMaterial.color.copy(ringRest).lerp(ringHot, hubFlash);

      ledClock += dt;
      if (ledClock > 0.09) {
        ledClock = 0;
        for (let i = 0; i < 10; i++) leds.setColorAt(Math.floor(ledRand() * leds.count), pickLed());
        if (leds.instanceColor) leds.instanceColor.needsUpdate = true;
      }
      beaconClock += dt;
      const on = Math.sin(beaconClock * 3.2) > 0.2;
      beacons[0].color.set(on ? '#34d399' : '#1e5a44');
      beacons[1].color.set(on ? '#1e5a44' : '#34d399');
    },
  };
};

/** Chip placement on the board, plate-local; the spine rises through its centre. */
const CHIP = { x: ENGINE.hub[0], z: ENGINE.hub[1], die: 1.9, pkg: 2.55 } as const;
const DIE_TOP = 0.32;
/** The neural dome over the die: base height, plan radius, height. */
const DOME = { base: DIE_TOP + 0.1, R: 1.42, H: 1.55 } as const;
/** The dome's output node, where the spine leaves for the engine. */
const APEX_Y = DOME.base + DOME.H + 0.36;

/** BGA-style fan-out: straight out of each pin, a 45° jog away from the centre, then a run. */
const makeTraces = (rand: () => number): draw.Trace[] => {
  const traces: draw.Trace[] = [];
  const pins = 12;
  const pitch = 0.151;
  const sides = [
    { n: [1, 0], t: [0, 1] },
    { n: [-1, 0], t: [0, 1] },
    { n: [0, 1], t: [1, 0] },
    { n: [0, -1], t: [1, 0] },
  ] as const;
  const inBoard = (x: number, z: number) => Math.abs(x) < 4.55 && z > -3.05 && z < 2.95;
  sides.forEach((side, si) => {
    for (let k = 0; k < pins; k++) {
      const o = (k - (pins - 1) / 2) * pitch;
      const start = CHIP.die / 2 + 0.26;
      let x = CHIP.x + side.n[0] * start + side.t[0] * o;
      let z = CHIP.z + side.n[1] * start + side.t[1] * o;
      const pts: Array<[number, number]> = [[x, z]];
      const step = (dn: number, dt: number) => {
        const nx = x + side.n[0] * dn + side.t[0] * dt;
        const nz = z + side.n[1] * dn + side.t[1] * dt;
        if (!inBoard(nx, nz)) return false;
        x = nx;
        z = nz;
        pts.push([x, z]);
        return true;
      };
      step(0.16, 0);
      const spread = o * 1.1;
      if (!step(Math.abs(spread), spread)) continue;
      let room = 0;
      while (inBoard(x + side.n[0] * (room + 0.1), z + side.n[1] * (room + 0.1))) room += 0.1;
      const run = room * (0.3 + rand() * 0.6);
      if (!step(run, 0)) continue;
      if (rand() > 0.5) step(0.22, Math.sign(o || 1) * 0.22);
      traces.push({ points: pts, color: draw.MARK[(k + si) % 3] });
    }
  });
  return traces;
};

const buildIntelligence = (kit: Kit, index: number, bus: Bus): Rig => {
  const group = new Group();
  const rand = mulberry32(21);
  group.add(new Mesh(slab(W, D, T, CORNER, BEVEL), std('#0e0f10', 0.32, 0.55)));
  const traces = makeTraces(rand);
  const boardMaterial = new MeshStandardMaterial({
    map: kit.tex(draw.drawBoard(traces, { x: CHIP.x, z: CHIP.z, size: CHIP.die })),
    emissiveMap: kit.tex(draw.drawBoardGlow(traces)),
    emissive: '#ffffff',
    emissiveIntensity: 0.9,
    roughness: 0.55,
    metalness: 0.25,
  });
  const board = new Mesh(topFace(W - BEVEL * 2, D - BEVEL * 2, CORNER - BEVEL), boardMaterial);
  board.position.y = 0.003;
  group.add(board);

  // Package: substrate, epoxy body, the die face, gull-wing pins.
  const substrate = new Mesh(new BoxGeometry(CHIP.pkg, 0.06, CHIP.pkg), std('#1b1d1e', 0.5, 0.3));
  substrate.position.set(CHIP.x, 0.03, CHIP.z);
  const body = new Mesh(new RoundedBoxGeometry(CHIP.die, 0.26, CHIP.die, 2, 0.03), std('#141516', 0.3, 0.5));
  body.position.set(CHIP.x, 0.06 + 0.13 - 0.003, CHIP.z);
  const dieMaterial = new MeshStandardMaterial({
    map: kit.tex(draw.drawDieTop()),
    emissiveMap: kit.tex(draw.drawDieGlow()),
    emissive: '#ffffff',
    emissiveIntensity: 1.2,
    roughness: 0.3,
    metalness: 0.4,
  });
  const die = new Mesh(new PlaneGeometry(CHIP.die - 0.08, CHIP.die - 0.08).rotateX(-Math.PI / 2), dieMaterial);
  die.position.set(CHIP.x, DIE_TOP + 0.002, CHIP.z);
  const pinsPerSide = 12;
  const pins = new InstancedMesh(new BoxGeometry(0.26, 0.035, 0.06), std('#caa24a', 0.3, 1), pinsPerSide * 4);
  const q = new Quaternion();
  const up = new Vector3(0, 1, 0);
  const m4 = new Matrix4();
  for (let s = 0; s < 4; s++) {
    const angle = (s * Math.PI) / 2;
    q.setFromAxisAngle(up, angle);
    for (let k = 0; k < pinsPerSide; k++) {
      const o = (k - (pinsPerSide - 1) / 2) * 0.151;
      const local = new Vector3(CHIP.die / 2 + 0.12, 0.078, o).applyQuaternion(q);
      m4.compose(new Vector3(CHIP.x + local.x, local.y, CHIP.z + local.z), q, new Vector3(1, 1, 1));
      pins.setMatrixAt(s * pinsPerSide + k, m4);
    }
  }
  const chipShadow = kit.blob(CHIP.pkg + 0.3, CHIP.pkg + 0.3, 0.6);
  chipShadow.position.set(CHIP.x, 0.006, CHIP.z);
  group.add(chipShadow, substrate, body, die, pins);

  // Supporting parts: two small ICs and three capacitors.
  const icMaterial = std('#161718', 0.35, 0.4);
  for (const [x, z, w, d] of [
    [-3.3, -1.7, 0.95, 0.55],
    [3.75, -2.2, 0.7, 0.7],
  ] as const) {
    const ic = new Mesh(new RoundedBoxGeometry(w, 0.12, d, 2, 0.02), icMaterial);
    ic.position.set(x, 0.06, z);
    const shadow = kit.blob(w + 0.2, d + 0.2, 0.5);
    shadow.position.set(x, 0.006, z);
    group.add(shadow, ic);
  }
  const capBody = std('#23303d', 0.4, 0.3);
  const capTop = std('#b7bcc2', 0.3, 0.9);
  for (const [x, z] of [
    [3.85, 1.5],
    [4.25, 1.5],
    [4.05, 1.9],
  ] as const) {
    const cap = new Mesh(new CylinderGeometry(0.15, 0.15, 0.34, 24), [capBody, capTop, capTop]);
    cap.position.set(x, 0.17, z);
    const shadow = kit.blob(0.4, 0.4, 0.5, true);
    shadow.position.set(x, 0.006, z);
    group.add(shadow, cap);
  }

  // Neural dome: five layers of nodes on arcs over the die, wired layer to layer.
  const LAYER_X = [-1.15, -0.69, -0.23, 0.23, 0.69, 1.15];
  const COUNTS = [5, 7, 8, 8, 7, 5];
  const { R, H, base } = DOME;
  const nodes: Array<{ p: Vector3; layer: number; theta: number }> = [];
  LAYER_X.forEach((lx, l) => {
    const rr = R * Math.sqrt(Math.max(0.12, 1 - (lx / (R * 1.08)) ** 2));
    for (let k = 0; k < COUNTS[l]; k++) {
      const theta = lerp(0.3, Math.PI - 0.3, COUNTS[l] === 1 ? 0.5 : k / (COUNTS[l] - 1));
      nodes.push({
        p: new Vector3(CHIP.x + lx, base + (H / R) * rr * Math.sin(theta), CHIP.z + rr * Math.cos(theta)),
        layer: l,
        theta,
      });
    }
  });
  const apex = nodes.length;
  nodes.push({ p: new Vector3(CHIP.x, APEX_Y, CHIP.z), layer: LAYER_X.length, theta: Math.PI / 2 });
  const layerColor = (l: number): Rgb => {
    const f = (l / LAYER_X.length) * 2;
    const k = Math.min(1, Math.floor(f));
    return mixRgb(MARK_RGB[k], MARK_RGB[k + 1], f - k);
  };

  const edges: Array<{ a: number; b: number; len: number }> = [];
  const out: number[][] = nodes.map(() => []);
  const link = (a: number, b: number) => {
    out[a].push(edges.length);
    edges.push({ a, b, len: nodes[a].p.distanceTo(nodes[b].p) });
  };
  for (let l = 0; l < LAYER_X.length - 1; l++) {
    const from = nodes.map((n, i) => ({ n, i })).filter((x) => x.n.layer === l);
    const to = nodes.map((n, i) => ({ n, i })).filter((x) => x.n.layer === l + 1);
    for (const a of from) {
      const nearest = [...to].sort((p, q2) => Math.abs(p.n.theta - a.n.theta) - Math.abs(q2.n.theta - a.n.theta));
      nearest.slice(0, 2).forEach((b) => link(a.i, b.i));
    }
  }
  nodes.forEach((n, i) => {
    if (n.layer === LAYER_X.length - 1 || ((n.layer === 2 || n.layer === 3) && Math.abs(n.theta - Math.PI / 2) < 0.3)) link(i, apex);
  });

  const edgeMesh = new InstancedMesh(
    new CylinderGeometry(1, 1, 1, 5, 1, true),
    new MeshBasicMaterial({ transparent: true, opacity: 0.6, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
    edges.length,
  );
  const dir = new Vector3();
  edges.forEach((e, i) => {
    const a = nodes[e.a].p;
    const b = nodes[e.b].p;
    dir.subVectors(b, a).normalize();
    q.setFromUnitVectors(up, dir);
    m4.compose(a.clone().add(b).multiplyScalar(0.5), q, new Vector3(0.011, e.len, 0.011));
    edgeMesh.setMatrixAt(i, m4);
    const c = mixRgb(layerColor(nodes[e.a].layer), [0, 0, 0], 0.45);
    edgeMesh.setColorAt(i, new Color().setRGB(c[0], c[1], c[2], SRGBColorSpace));
  });
  edgeMesh.renderOrder = 1;

  const nodeMesh = new InstancedMesh(new SphereGeometry(0.062, 16, 12), new MeshBasicMaterial({ toneMapped: false }), nodes.length);
  nodes.forEach((n, i) => {
    m4.makeTranslation(n.p.x, n.p.y, n.p.z);
    nodeMesh.setMatrixAt(i, m4);
  });
  const nodeBase = nodes.map((n) => mixRgb(layerColor(n.layer), [1, 1, 1], 0.35));
  // Colours from the start: adding instanceColor later would switch programs mid-flight.
  nodeBase.forEach((c, i) => nodeMesh.setColorAt(i, new Color().setRGB(c[0], c[1], c[2], SRGBColorSpace)));
  const flash = new Float32Array(nodes.length);
  const nodeColor = new Color();

  // Halos (one per node), pulses on the wires, current on the board, a glow on the die.
  const PULSES = 26;
  const TRACE_PULSES = 16;
  const glow = makeGlow(nodes.length + PULSES + TRACE_PULSES + 1, true, kit.glowScale);
  group.add(edgeMesh, nodeMesh, glow.points);

  const firstLayer = nodes.map((n, i) => (n.layer === 0 ? i : -1)).filter((i) => i >= 0);
  const pulses = Array.from({ length: PULSES }, () => ({ edge: 0, s: 0, speed: 1, color: MARK_RGB[0] }));
  const launch = (p: (typeof pulses)[number], from?: number) => {
    const start = from ?? firstLayer[Math.floor(rand() * firstLayer.length)];
    const choices = out[start];
    if (!choices.length) return launch(p);
    p.edge = choices[Math.floor(rand() * choices.length)];
    p.s = 0;
    p.speed = 1.1 + rand() * 0.8;
    p.color = layerColor(nodes[start].layer);
  };
  pulses.forEach((p) => {
    launch(p);
    p.s = rand() * edges[p.edge].len;
  });

  const tracePulses = Array.from({ length: TRACE_PULSES }, () => ({ trace: 0, s: 0, wait: 0, len: 0 }));
  const traceLen = traces.map((tr) => {
    let l = 0;
    for (let i = 1; i < tr.points.length; i++) {
      l += Math.hypot(tr.points[i][0] - tr.points[i - 1][0], tr.points[i][1] - tr.points[i - 1][1]);
    }
    return l;
  });
  const traceColors = traces.map((tr) => rgb(tr.color));
  const relaunchTrace = (tp: (typeof tracePulses)[number]) => {
    tp.trace = Math.floor(rand() * traces.length);
    tp.s = 0;
    tp.len = traceLen[tp.trace];
    tp.wait = rand() * 1.6;
  };
  tracePulses.forEach((tp) => {
    relaunchTrace(tp);
    tp.s = rand() * tp.len;
    tp.wait = 0;
  });
  const traceAt = (ti: number, s: number): [number, number] => {
    const pts = traces[ti].points;
    let rest = s;
    for (let i = 1; i < pts.length; i++) {
      const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (rest <= seg) {
        const f = seg ? rest / seg : 0;
        return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)];
      }
      rest -= seg;
    }
    const last = pts[pts.length - 1];
    return [last[0], last[1]];
  };
  let lastEmit = -1;
  const dieGlowColor = mixRgb(MARK_RGB[0], MARK_RGB[1], 0.4);

  return {
    group,
    anchor: cornerAnchor(CALLOUT_SIDE[STACK_LAYERS[index]]),
    strip: makeStrip(group, 1),
    stripRest: 1,
    tick(t, dt) {
      boardMaterial.emissiveIntensity = 0.75 + Math.sin(t * 1.3) * 0.2;
      dieMaterial.emissiveIntensity = 1.1 + Math.sin(t * 2.1) * 0.35;

      let g = 0;
      for (const p of pulses) {
        const e = edges[p.edge];
        p.s += p.speed * dt;
        if (p.s >= e.len) {
          flash[e.b] = 1;
          if (e.b === apex) {
            if (t - lastEmit > 0.45) {
              lastEmit = t;
              bus.emit(0, p.color);
            }
            launch(p);
          } else if (rand() < 0.9) {
            launch(p, e.b);
          } else {
            launch(p);
          }
          continue;
        }
        const f = p.s / e.len;
        const a = nodes[e.a].p;
        const b = nodes[e.b].p;
        glow.put(g++, lerp(a.x, b.x, f), lerp(a.y, b.y, f), lerp(a.z, b.z, f), p.color, 0.16, 0.95);
      }
      nodes.forEach((n, i) => {
        flash[i] = Math.max(0, flash[i] - dt * 2.4);
        const c = mixRgb(nodeBase[i], [1, 1, 1], flash[i]);
        nodeMesh.setColorAt(i, nodeColor.setRGB(c[0], c[1], c[2], SRGBColorSpace));
        glow.put(g++, n.p.x, n.p.y, n.p.z, layerColor(n.layer), i === apex ? 0.6 : 0.3 + flash[i] * 0.3, 0.3 + flash[i] * 0.7);
      });
      if (nodeMesh.instanceColor) nodeMesh.instanceColor.needsUpdate = true;
      for (const tp of tracePulses) {
        if (tp.wait > 0) {
          tp.wait -= dt;
          continue;
        }
        tp.s += dt * 1.5;
        if (tp.s >= tp.len) {
          relaunchTrace(tp);
          continue;
        }
        const [x, z] = traceAt(tp.trace, tp.s);
        const fade = smoothstep(0, 0.2, tp.s) * (1 - smoothstep(tp.len - 0.25, tp.len, tp.s));
        glow.put(g++, x, 0.02, z, traceColors[tp.trace], 0.13, fade);
      }
      glow.put(g++, CHIP.x, DIE_TOP + 0.05, CHIP.z, dieGlowColor, 2.3, 0.2 + Math.sin(t * 2.1) * 0.06);
      glow.flush(g);
    },
  };
};

// ---------------------------------------------------------------------------
// The scene
// ---------------------------------------------------------------------------

interface MaterialRecord {
  material: Material;
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
}

/** Every material under a layer, with its resting state, for ghosting. */
const collectMaterials = (root: Object3D) => {
  const seen = new Set<Material>();
  const records: MaterialRecord[] = [];
  const glows: ShaderMaterial[] = [];
  root.traverse((o) => {
    if (o.userData.ownOpacity) return;
    const value = (o as Mesh).material as Material | Material[] | undefined;
    if (!value) return;
    for (const m of Array.isArray(value) ? value : [value]) {
      if (seen.has(m)) continue;
      seen.add(m);
      if (m instanceof ShaderMaterial) glows.push(m);
      else records.push({ material: m, opacity: m.opacity, transparent: m.transparent, depthWrite: m.depthWrite });
    }
  });
  return { records, glows };
};

const loadFonts = () =>
  Promise.race([
    Promise.all([
      document.fonts.load(`700 40px Inter`),
      document.fonts.load(`500 40px Inter`),
      document.fonts.load(`600 40px 'JetBrains Mono'`),
    ]),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]).catch(() => undefined);

export const createStackScene = async (options: StackSceneOptions): Promise<StackScene> => {
  const { canvas } = options;
  await loadFonts();

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(soft.ground, 1);
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();
  scene.environment = environment;
  scene.environmentIntensity = 0.55;
  scene.add(new HemisphereLight('#ffffff', '#cfcfcf', 1.0));
  const key = new DirectionalLight('#ffffff', 1.9);
  key.position.set(-5, 12, 7);
  const fill = new DirectionalLight('#ffffff', 0.4);
  fill.position.set(7, 5, -4);
  scene.add(key, fill);

  const camera = new OrthographicCamera(-1, 1, 1, -1, 1, 200);

  const textures: Texture[] = [];
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  const glowScale = { value: 40 };
  const shadowRect = new CanvasTexture(draw.drawSoftShadow(false));
  const shadowRound = new CanvasTexture(draw.drawSoftShadow(true));
  textures.push(shadowRect, shadowRound);
  const flatPlane = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const kit: Kit = {
    glowScale,
    tex(source) {
      const texture = new CanvasTexture(source);
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = Math.min(8, maxAnisotropy);
      textures.push(texture);
      return texture;
    },
    blob(w, d, opacity, round = false) {
      const mesh = new Mesh(
        flatPlane,
        new MeshBasicMaterial({
          map: round ? shadowRound : shadowRect,
          color: '#000000',
          transparent: true,
          opacity,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      // The texture's core fills its middle 60%; scale so that core is the footprint.
      mesh.scale.set(w / 0.62, 1, d / 0.62);
      mesh.renderOrder = 1;
      return mesh;
    },
  };

  // Beams and packets are wired after the rigs; the rigs only hold the bus.
  const bus: Bus = { emit: () => undefined, hubPulse: () => undefined };

  const stage = new Group();
  scene.add(stage);
  const rigs = [buildInterface(kit, 0), buildEngine(kit, 1, bus), buildIntelligence(kit, 2, bus)];
  rigs.forEach((rig, i) => {
    rig.group.position.y = REST_Y[i];
    stage.add(rig.group);
  });
  const layerMaterials = rigs.map((rig) => collectMaterials(rig.group));

  const ground = kit.blob(W, D, 0.2);
  ground.position.y = REST_Y[2] - T - 0.8;
  stage.add(ground);

  // The spine: dome → engine hub (beam 0), engine hub → interface (beam 1).
  const beamGeometry = new CylinderGeometry(1, 1, 1, 10, 1, true);
  const beams = [
    { lower: 2, upper: 1, y0: APEX_Y },
    { lower: 1, upper: 0, y0: 0.18 },
  ].map((spec) => {
    const material = new MeshBasicMaterial({ color: palette.navy, transparent: true, opacity: 0.3, depthWrite: false });
    const mesh = new Mesh(beamGeometry, material);
    mesh.scale.set(0.018, 1, 0.018);
    const glow = makeGlow(14, false, glowScale);
    stage.add(mesh, glow.points);
    return {
      ...spec,
      mesh,
      material,
      glow,
      packets: [] as Array<{ s: number; color: Rgb }>,
      idle: 0.4,
    };
  });
  bus.emit = (index, color) => {
    const beam = beams[index];
    if (beam.packets.length < 14) beam.packets.push({ s: 0, color });
  };
  const beamRand = mulberry32(77);

  // Picking volumes at the plates' rest positions: lifting a plate never moves
  // its target out from under the pointer, so hover cannot flicker.
  const hitMaterial = new MeshBasicMaterial({ visible: false });
  const hits = rigs.map((_, i) => {
    const h = T + HIT_HEIGHT[i];
    const mesh = new Mesh(new BoxGeometry(W, h, D), hitMaterial);
    mesh.position.y = REST_Y[i] - T + h / 2;
    mesh.userData.layer = i;
    stage.add(mesh);
    return mesh;
  });

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  let reduced = options.reducedMotion;
  let running = false;
  let disposed = false;
  let raf = 0;
  let last = 0;
  let t = 0;
  let cssW = 1;
  let cssH = 1;
  let introAt = -1;

  const layers = rigs.map(() => ({ offset: 0, velocity: 0, opacity: 1, strip: 0, start: 0, applied: 1 }));
  let yaw = 0;
  let yawVelocity = 0;
  let yawTarget = 0;
  let releasedAt = -Infinity;

  const pointer = { down: false, dragging: false, x0: 0, yaw0: 0, id: -1 };
  let calloutActive: number | null = null;
  let hoverActive: number | null = null;
  let pinned: number | null = null;
  let lastInteraction = 0;
  let tourClock = 0;
  let reported: number | null | undefined;

  const userActive = () => calloutActive ?? hoverActive ?? pinned;
  const tourActive = () => {
    let clock = tourClock % TOUR.reduce((s, [, d]) => s + d, 0);
    for (const [layer, dwell] of TOUR) {
      if (clock < dwell) return layer;
      clock -= dwell;
    }
    return null;
  };
  const introDone = () => introAt >= 0 && t - introAt > 1.6;
  const touring = () => !reduced && userActive() === null && introDone() && t - lastInteraction > TOUR_IDLE;
  const active = () => userActive() ?? (touring() ? tourActive() : null);

  const applyOpacity = (i: number, o: number) => {
    const state = layers[i];
    if (Math.abs(state.applied - o) < 0.002) return;
    state.applied = o;
    const ghost = o < 0.995;
    const { records, glows } = layerMaterials[i];
    for (const r of records) {
      r.material.opacity = r.opacity * o;
      const transparent = r.transparent || ghost;
      if (r.material.transparent !== transparent) {
        r.material.transparent = transparent;
        r.material.needsUpdate = true;
      }
      r.material.depthWrite = ghost ? false : r.depthWrite;
    }
    for (const g of glows) g.uniforms.uOpacity.value = o;
  };

  const targetsFor = (i: number, a: number | null) => ({
    offset: a === null ? 0 : i < a ? GHOST_LIFT : i === a ? ACTIVE_LIFT : 0,
    opacity: a !== null && i < a ? GHOST_OPACITY : 1,
    strip: a === i ? 1 : rigs[i].stripRest,
  });

  // -------------------------------------------------------------------------
  // Camera fit
  // -------------------------------------------------------------------------

  let ppu = 40;
  const fit = (reserveX: number) => {
    camera.position.copy(CAMERA_DIR).multiplyScalar(80).add(TARGET);
    camera.lookAt(TARGET);
    camera.updateMatrixWorld();
    const inv = camera.matrixWorldInverse;
    const v = new Vector3();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    const add = (x: number, y: number, z: number) => {
      v.set(x, y, z).applyMatrix4(inv);
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
    };
    const maxLift = [GHOST_LIFT, GHOST_LIFT, ACTIVE_LIFT];
    REST_Y.forEach((y, i) => {
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          add((sx * W) / 2, y - T, (sz * D) / 2);
          add((sx * W) / 2, y + maxLift[i], (sz * D) / 2);
        }
      }
    });
    // The floating hero card is the highest thing on the top plate.
    add(texX(draw.INTERFACE_SLOTS.hero.x), REST_Y[0] + GHOST_LIFT + 0.9, texZ(draw.INTERFACE_SLOTS.hero.y));
    const padX = 8;
    const padTop = 8;
    // Room under the chip for its soft ground shadow, which PlatformStack
    // fades out over the canvas's bottom edge rather than cutting off.
    const padBottom = clamp(cssH * 0.07, 24, 56);
    const availW = Math.max(40, cssW - 2 * (reserveX + padX));
    const availH = Math.max(40, cssH - padTop - padBottom);
    // 4% spare for the drag, which swings the corners outward.
    ppu = Math.min(availW / (maxX - minX), availH / (maxY - minY)) * 0.96;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    camera.left = cx - cssW / 2 / ppu;
    camera.right = cx + cssW / 2 / ppu;
    camera.top = cy + (padTop + availH / 2) / ppu;
    camera.bottom = camera.top - cssH / ppu;
    camera.updateProjectionMatrix();
  };

  // -------------------------------------------------------------------------
  // Frame
  // -------------------------------------------------------------------------

  const anchorsOut: StackAnchor[] = rigs.map(() => ({ x: 0, y: 0, visible: false }));
  const projected = new Vector3();
  const emitAnchors = (force = false) => {
    let changed = force;
    rigs.forEach((rig, i) => {
      projected.copy(rig.anchor);
      rig.group.localToWorld(projected);
      projected.project(camera);
      const x = ((projected.x + 1) / 2) * cssW;
      const y = ((1 - projected.y) / 2) * cssH;
      const visible = introAt >= 0 && rig.group.visible && layers[i].offset < 1.5;
      const prev = anchorsOut[i];
      if (Math.abs(prev.x - x) > 0.25 || Math.abs(prev.y - y) > 0.25 || prev.visible !== visible) {
        anchorsOut[i] = { x, y, visible };
        changed = true;
      }
    });
    if (changed) options.onAnchors(anchorsOut.slice());
  };

  const reportActive = () => {
    const a = active();
    if (a !== reported) {
      reported = a;
      options.onActiveChange(a);
    }
  };

  const updateBeams = (dt: number) => {
    for (const beam of beams) {
      const lower = rigs[beam.lower].group;
      const upper = rigs[beam.upper].group;
      const y0 = lower.position.y + beam.y0;
      const y1 = upper.position.y - T - 0.01;
      const len = Math.max(0.01, y1 - y0);
      const settled = lower.visible && upper.visible ? smoothstep(1.2, 0.2, layers[beam.upper].offset) : 0;
      const fade = settled * layers[beam.lower].opacity;
      beam.mesh.visible = fade > 0.01;
      beam.mesh.position.set(CHIP.x, y0 + len / 2, CHIP.z);
      beam.mesh.scale.y = len;
      beam.material.opacity = 0.3 * fade;
      beam.glow.material.uniforms.uOpacity.value = fade;

      beam.idle -= dt;
      if (beam.idle <= 0) {
        beam.idle = 0.7 + beamRand() * 1.1;
        bus.emit(beams.indexOf(beam), MARK_RGB[Math.floor(beamRand() * 3)]);
      }
      let g = 0;
      beam.packets = beam.packets.filter((p) => {
        p.s += (dt * 2.6) / len;
        if (p.s >= 1) {
          if (beam.lower === 2) bus.hubPulse(0.55);
          return false;
        }
        return true;
      });
      for (const p of beam.packets) {
        const alpha = smoothstep(0, 0.06, p.s) * (1 - smoothstep(0.9, 1, p.s));
        beam.glow.put(g++, CHIP.x, y0 + p.s * len, CHIP.z, p.color, 0.3, alpha);
      }
      beam.glow.flush(g);
    }
  };

  const step = (dt: number, snap: boolean) => {
    t += dt;
    if (!snap && introAt < 0) {
      introAt = t;
      rigs.forEach((_, i) => {
        layers[i].start = t + (rigs.length - 1 - i) * 0.3;
        layers[i].offset = DROP;
        layers[i].velocity = 0;
      });
    }
    if (touring()) tourClock += dt;
    else tourClock = 0;
    const a = active();

    rigs.forEach((rig, i) => {
      const state = layers[i];
      const target = targetsFor(i, a);
      const started = snap || t >= state.start;
      rig.group.visible = started;
      if (snap) {
        state.offset = target.offset;
        state.velocity = 0;
        state.opacity = target.opacity;
        state.strip = target.strip;
      } else if (started) {
        // Slightly under-damped: the entrance lands with a small settle.
        const k = 90;
        const c = 13;
        state.velocity += (k * (target.offset - state.offset) - c * state.velocity) * dt;
        state.offset += state.velocity * dt;
        const blend = 1 - Math.exp(-dt * 9);
        state.opacity += (target.opacity - state.opacity) * blend;
        state.strip += (target.strip - state.strip) * blend;
      }
      rig.group.position.y = REST_Y[i] + state.offset;
      rig.group.userData.opacity = state.opacity;
      applyOpacity(i, state.opacity);
      rig.strip.opacity = state.strip * state.opacity;
      rig.strip.visible = rig.strip.opacity > 0.01;
      rig.tick(t, dt);
    });

    const aiState = layers[2];
    const landed = smoothstep(DROP, 0, aiState.offset);
    (ground.material as MeshBasicMaterial).opacity = 0.2 * (rigs[2].group.visible ? landed : 0);

    if (!pointer.dragging && t - releasedAt > 2.5) yawTarget = 0;
    if (snap) {
      yaw = yawTarget;
      yawVelocity = 0;
    } else {
      yawVelocity += (40 * (yawTarget - yaw) - 11 * yawVelocity) * dt;
      yaw += yawVelocity * dt;
    }
    stage.rotation.y = yaw;
    stage.updateMatrixWorld();

    updateBeams(dt);
    reportActive();
  };

  const render = () => {
    renderer.render(scene, camera);
    emitAnchors();
  };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (!last) last = now;
    const elapsed = now - last;
    if (elapsed < MIN_FRAME_MS) return;
    last = now;
    step(Math.min(elapsed / 1000, MAX_DT), false);
    render();
  };

  let warmed = false;
  const still = () => {
    if (!warmed) {
      warmed = true;
      for (let s = 0; s < STILL_WARMUP * 30; s++) step(1 / 30, true);
      // Shown already: switching reduced motion off later must not replay the entrance.
      if (introAt < 0) introAt = 0;
    }
    step(0, true);
    render();
  };

  const sync = () => {
    const loop = running && !reduced && !disposed;
    if (loop && !raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    } else if (!loop && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (!loop && running && !disposed) still();
  };

  // -------------------------------------------------------------------------
  // Pointer
  // -------------------------------------------------------------------------

  const raycaster = new Raycaster();
  const ndc = new Vector2();

  const pick = (e: PointerEvent): number | null => {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(hits, false)[0];
    return hit ? (hit.object.userData.layer as number) : null;
  };

  const interacted = () => {
    lastInteraction = t;
    if (reduced && running) still();
  };

  const onPointerMove = (e: PointerEvent) => {
    if (pointer.down && e.pointerId === pointer.id) {
      const dx = e.clientX - pointer.x0;
      if (!pointer.dragging && Math.abs(dx) > 6) {
        pointer.dragging = true;
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'grabbing';
      }
      if (pointer.dragging) {
        yawTarget = clamp(pointer.yaw0 + dx * 0.006, -MAX_YAW, MAX_YAW);
        interacted();
        return;
      }
    }
    if (e.pointerType === 'mouse') {
      hoverActive = pick(e);
      canvas.style.cursor = hoverActive === null ? 'grab' : 'pointer';
      interacted();
    }
  };
  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    pointer.down = true;
    pointer.dragging = false;
    pointer.x0 = e.clientX;
    pointer.yaw0 = yawTarget;
    pointer.id = e.pointerId;
    interacted();
  };
  const onPointerUp = (e: PointerEvent) => {
    if (!pointer.down || e.pointerId !== pointer.id) return;
    if (pointer.dragging) {
      releasedAt = t;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      canvas.style.cursor = 'grab';
    } else if (e.pointerType !== 'mouse') {
      const layer = pick(e);
      pinned = layer === pinned ? null : layer;
    }
    pointer.down = false;
    pointer.dragging = false;
    interacted();
  };
  // A cancelled press (the page took the gesture to scroll) is never a tap.
  const onPointerCancel = (e: PointerEvent) => {
    if (e.pointerId !== pointer.id) return;
    if (pointer.dragging) releasedAt = t;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    pointer.down = false;
    pointer.dragging = false;
  };
  const onPointerLeave = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') hoverActive = null;
    interacted();
  };
  // Ghosting a layer flips its materials' `transparent`, which is part of the
  // program key (three's OPAQUE define), so every material has two programs.
  // Build both before the first visible frame — off the main thread where
  // KHR_parallel_shader_compile exists — and draw each once, so neither a
  // hover nor a tour step ever waits on a shader compile. The canvas is still
  // transparent to the visitor at this point (PlatformStack fades it in).
  // A nominal viewport: fitted at the canvas's 1 × 1 placeholder size the
  // frustum would cull nearly everything, and a culled object's program is
  // never used.
  cssW = 1000;
  cssH = 1000;
  fit(0);
  // `has` rather than letting compileAsync ask: `get` logs a warning where it is missing.
  const parallel = renderer.extensions.has('KHR_parallel_shader_compile');
  for (const opacity of [0.5, 1]) {
    rigs.forEach((_, i) => applyOpacity(i, opacity));
    if (parallel) await renderer.compileAsync(scene, camera);
    else renderer.compile(scene, camera);
    renderer.render(scene, camera);
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.style.cursor = 'grab';

  return {
    resize(width, height, reserveX) {
      cssW = Math.max(1, width);
      cssH = Math.max(1, height);
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR, Math.sqrt(MAX_PIXELS / (cssW * cssH)));
      renderer.setPixelRatio(dpr);
      renderer.setSize(cssW, cssH, false);
      fit(reserveX);
      glowScale.value = ppu * dpr;
      // Resizing the drawing buffer blanks it, and a blank opaque canvas shows
      // black — so always repaint: the plain ground until the entrance has
      // begun, the current frame after.
      if (disposed) return;
      if (reduced) still();
      else if (introAt < 0) renderer.clear();
      else {
        render();
        emitAnchors(true);
      }
    },
    setRunning(next) {
      running = next;
      sync();
    },
    setReducedMotion(next) {
      reduced = next;
      sync();
    },
    setActive(layer) {
      calloutActive = layer;
      interacted();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      scene.traverse((o) => {
        const mesh = o as Mesh;
        mesh.geometry?.dispose();
        const value = mesh.material as Material | Material[] | undefined;
        if (value) for (const m of Array.isArray(value) ? value : [value]) m.dispose();
      });
      textures.forEach((texture) => texture.dispose());
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
};
