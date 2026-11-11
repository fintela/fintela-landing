import { readFile } from 'node:fs/promises'
import path from 'node:path'
import * as fontkit from 'fontkit'
import sharp, { type OverlayOptions } from 'sharp'

/**
 * The blog's standard preview images, rendered at build time from a post's
 * frontmatter (see BLOG.md, "Preview images"):
 *
 *   share   1200×630 — what LinkedIn, Slack, X and iMessage show for a shared
 *           link (`og:image`). The post's cover, softened, as the background;
 *           the author's badge (a round portrait in a white ring, their name on
 *           a white tag below it) centred on the left; and to its right the
 *           wordmark, title, rule and subtitle.
 *
 *   avatar  160×160 — the author's face for the bylines on the site, shown
 *           round in front of their name on the `/blog` card and in the post's
 *           header. One per author, not per post.
 *
 * The cover itself is published as authored: on the site the picture stands
 * alone, and the person is in the byline.
 *
 * Portraits live at `content/blog/authors/<author-slug>.png` (a transparent
 * cut-out, head and shoulders); an author without one gets their initials in
 * the badge, and the site sets them in the byline itself. Portraits are
 * rendered monochrome whatever the file holds, so every author reads as part
 * of one set.
 *
 * Text is typeset here, not by a browser or the system's fonts: Inter's glyph
 * outlines are read with fontkit and drawn as SVG paths, which sharp
 * rasterizes. The same build on a laptop and in CI therefore draws the same
 * pixels, with no font install and no headless browser on the build path.
 */

export const SHARE_WIDTH = 1200
export const SHARE_HEIGHT = 630
const SHARE_JPEG_QUALITY = 84
const AVATAR_JPEG_QUALITY = 88

export const AUTHORS_DIR = 'content/blog/authors'

/** `Myrna Ortiz` → `myrna-ortiz`; accents folded, anything else a hyphen. */
export const authorSlug = (name: string): string =>
  name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Where an author's portrait is expected, whether or not it exists. */
export const portraitFile = (root: string, author: string): string =>
  path.resolve(root, AUTHORS_DIR, `${authorSlug(author)}.png`)

// ---- brand ------------------------------------------------------------------

type Weight = 500 | 700 | 800
/** One weight of Inter: the Latin subset plus Latin Extended for names like Ćosić. */
interface Face {
  latin: fontkit.Font
  ext: fontkit.Font
}

interface Raw {
  data: Buffer
  width: number
  height: number
}

interface Brand {
  text: string
  textMuted: string
  gold: string
  goldDeep: string
  ground: string
  faces: Record<Weight, Face>
  wordmark: Raw
}

/**
 * `key: '#hex'` pairs read straight out of src/theme/tokens.ts — the same
 * approach as scripts/og/render.mjs, so the post cards and the site's static
 * cards cannot drift apart in colour.
 */
async function loadTokens(root: string) {
  const source = await readFile(path.resolve(root, 'src/theme/tokens.ts'), 'utf8')
  const read = (name: string) => {
    const match = new RegExp(`\\b${name}:\\s*'([^']+)'`).exec(source)
    if (!match) throw new Error(`blog-preview: token "${name}" not found in src/theme/tokens.ts`)
    return match[1]
  }
  return {
    text: read('text'),
    textMuted: read('textMuted'),
    gold: read('gold'),
    goldDeep: read('goldDeep'),
    ground: read('ground'),
  }
}

/**
 * Static WOFF files from `@fontsource/inter`, not the variable WOFF2 the site
 * itself loads: fontkit 2.0.4 cannot instance a weight from a variable WOFF2
 * (`getVariation` rebuilds it as a plain TTF and throws), and sharp's own text
 * renderer ignores a WOFF2 `fontfile` and silently falls back to a system font.
 */
async function loadFace(root: string, weight: Weight): Promise<Face> {
  const file = (subset: string) =>
    path.resolve(root, `node_modules/@fontsource/inter/files/inter-${subset}-${weight}-normal.woff`)
  const open = async (subset: string) => fontkit.create(await readFile(file(subset))) as fontkit.Font
  return { latin: await open('latin'), ext: await open('latin-ext') }
}

const brands = new Map<string, Promise<Brand>>()

/** Fonts, tokens and wordmark, loaded once per process. */
function loadBrand(root: string): Promise<Brand> {
  let brand = brands.get(root)
  if (!brand) {
    brand = (async () => {
      const [tokens, w500, w700, w800, mark] = await Promise.all([
        loadTokens(root),
        loadFace(root, 500),
        loadFace(root, 700),
        loadFace(root, 800),
        readRaw(path.resolve(root, 'public/brand/fintela-wordmark.png')),
      ])
      const trimmed = crop(mark, alphaBox(mark))
      const height = 34
      const wordmark = await resizeRaw(trimmed, Math.round((trimmed.width * height) / trimmed.height), height)
      return { ...tokens, faces: { 500: w500, 700: w700, 800: w800 }, wordmark }
    })()
    brands.set(root, brand)
  }
  return brand
}

// ---- type -------------------------------------------------------------------

interface Line {
  width: number
  /** SVG path data for the line with its left edge at `x` and baseline at `baseline`. */
  draw: (x: number, baseline: number) => string
}

/** Shape one line: each run in the first subset that has its glyphs, kerned. */
function shape(face: Face, text: string, size: number, tracking = 0): Line {
  const runs: { font: fontkit.Font; text: string }[] = []
  for (const ch of text) {
    const cp = ch.codePointAt(0)!
    const font = face.latin.hasGlyphForCodePoint(cp) || !face.ext.hasGlyphForCodePoint(cp) ? face.latin : face.ext
    const last = runs[runs.length - 1]
    if (last?.font === font) last.text += ch
    else runs.push({ font, text: ch })
  }

  const placed: { glyph: fontkit.Glyph; x: number; y: number; k: number }[] = []
  let x = 0
  for (const run of runs) {
    const k = size / run.font.unitsPerEm
    const laid = run.font.layout(run.text)
    laid.glyphs.forEach((glyph, i) => {
      const p = laid.positions[i]
      placed.push({ glyph, x: x + p.xOffset * k, y: p.yOffset * k, k })
      x += p.xAdvance * k + tracking * size
    })
  }
  const width = placed.length ? x - tracking * size : 0
  return {
    width,
    draw: (ox, baseline) =>
      placed
        .map((g) => g.glyph.path.scale(g.k, -g.k).translate(ox + g.x, baseline - g.y).toSVG())
        .join(''),
  }
}

/**
 * Greedy word wrap into at most `maxLines`; the last line ends in an ellipsis
 * when the text did not fit.
 */
function wrap(face: Face, text: string, size: number, tracking: number, maxWidth: number, maxLines: number) {
  const fits = (s: string) => shape(face, s, size, tracking).width <= maxWidth
  const lines: string[] = []
  let current = ''
  for (const word of text.trim().split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word
    if (!current || fits(candidate)) current = candidate
    else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)

  const overflow = lines.length > maxLines
  if (overflow) {
    lines.length = maxLines
    let last = lines[maxLines - 1]
    while (!fits(`${last}…`) && last.includes(' ')) last = last.slice(0, last.lastIndexOf(' '))
    lines[maxLines - 1] = `${last.replace(/[\s,.;:!?–—-]+$/u, '')}…`
  }
  return { lines: lines.map((l) => shape(face, l, size, tracking)), overflow }
}

interface Block {
  height: number
  svg: (x: number, top: number) => string
}

/** Lines stacked at `lineHeight`, each baseline centred in its line box. */
function textBlock(face: Face, lines: Line[], size: number, lineHeight: number, fill: string): Block {
  const font = face.latin
  const k = size / font.unitsPerEm
  const box = size * lineHeight
  const baseline = (box - (font.ascent - font.descent) * k) / 2 + font.ascent * k
  return {
    height: lines.length * box,
    svg: (x, top) =>
      `<path fill="${fill}" d="${lines.map((l, i) => l.draw(x, top + i * box + baseline)).join('')}"/>`,
  }
}

// ---- pixels -----------------------------------------------------------------

async function readRaw(file: string): Promise<Raw> {
  const { data, info } = await sharp(file)
    .rotate()
    .toColourspace('srgb')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}

/** Bounding box of the visible pixels. */
function alphaBox(img: Raw) {
  let x0 = img.width
  let y0 = img.height
  let x1 = -1
  let y1 = -1
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (img.data[(y * img.width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  if (x1 < 0) throw new Error('blog-preview: image is fully transparent')
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }
}

function crop(img: Raw, box: { left: number; top: number; width: number; height: number }): Raw {
  const data = Buffer.alloc(box.width * box.height * 4)
  for (let y = 0; y < box.height; y++) {
    const from = ((box.top + y) * img.width + box.left) * 4
    img.data.copy(data, y * box.width * 4, from, from + box.width * 4)
  }
  return { data, width: box.width, height: box.height }
}

async function resizeRaw(img: Raw, width: number, height: number): Promise<Raw> {
  const { data, info } = await sharp(img.data, { raw: { width: img.width, height: img.height, channels: 4 } })
    .resize(width, height, { kernel: 'lanczos3', fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}

function gaussian1d(values: Float32Array, sigma: number): Float32Array {
  const r = Math.max(1, Math.ceil(sigma * 3))
  const kernel = Array.from({ length: 2 * r + 1 }, (_, i) => Math.exp(-((i - r) ** 2) / (2 * sigma * sigma)))
  const sum = kernel.reduce((a, b) => a + b, 0)
  const out = new Float32Array(values.length)
  for (let i = 0; i < values.length; i++) {
    let acc = 0
    for (let j = -r; j <= r; j++) acc += values[Math.min(values.length - 1, Math.max(0, i + j))] * kernel[j + r]
    out[i] = acc / sum
  }
  return out
}

/**
 * The portrait as it is drawn everywhere: trimmed to the subject, monochrome,
 * with a soft fade where the subject runs into the left or right edge of the
 * source (a passport-style photo cropped through the shoulders), scaled to
 * `height`.
 */
async function preparePortrait(file: string, height: number): Promise<Raw> {
  const src = await readRaw(file)
  const img = crop(src, alphaBox(src))
  const { width: w, height: h, data } = img

  const cutL = new Float32Array(h)
  const cutR = new Float32Array(h)
  for (let y = 0; y < h; y++) {
    cutL[y] = data[(y * w) * 4 + 3] > 128 ? 1 : 0
    cutR[y] = data[(y * w + w - 1) * 4 + 3] > 128 ? 1 : 0
  }
  const sigma = 0.0165 * h
  const smoothL = gaussian1d(cutL, sigma)
  const smoothR = gaussian1d(cutR, sigma)
  const feather = Math.max(1, 0.08 * w)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const luma = Math.round(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2])
      data[i] = data[i + 1] = data[i + 2] = luma
      const fadeL = 1 - smoothL[y] * (1 - Math.min(1, x / feather))
      const fadeR = 1 - smoothR[y] * (1 - Math.min(1, (w - 1 - x) / feather))
      data[i + 3] = Math.round(data[i + 3] * fadeL * fadeR)
    }
  }
  return resizeRaw(img, Math.round((w * height) / h), height)
}

/** Horizontal centre of the head: the alpha-weighted mean x of the top 30% of the subject. */
function headCenterX(img: Raw): number {
  const rows = Math.max(1, Math.round(img.height * 0.3))
  let sum = 0
  let weight = 0
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < img.width; x++) {
      const a = img.data[(y * img.width + x) * 4 + 3]
      sum += x * a
      weight += a
    }
  }
  return weight ? sum / weight : img.width / 2
}

interface Placed extends Raw {
  left: number
  top: number
}

/** The part of a layer that lands on the canvas (sharp will not composite past an edge). */
function clipTo(layer: Placed, canvasW: number, canvasH: number): OverlayOptions | null {
  const left = Math.max(0, layer.left)
  const top = Math.max(0, layer.top)
  const right = Math.min(canvasW, layer.left + layer.width)
  const bottom = Math.min(canvasH, layer.top + layer.height)
  if (right <= left || bottom <= top) return null
  const img = crop(layer, { left: left - layer.left, top: top - layer.top, width: right - left, height: bottom - top })
  return { input: img.data, raw: { width: img.width, height: img.height, channels: 4 }, left, top }
}

const svgDoc = (width: number, height: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${body}</svg>`

// ---- the author badge -------------------------------------------------------

/** `Myrna Ortiz` → `MO`: first and last word. */
const initials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const pick = words.length > 1 ? [words[0], words[words.length - 1]] : words
  return pick.map((w) => [...w][0]?.toUpperCase() ?? '').join('')
}

/**
 * The portrait's square, unclipped: the cut-out on a soft light ground, head
 * centred, scaled so the subject is `zoom` × `size` tall from just above the
 * hair (1.18 shows head and shoulders; larger crops in towards the face).
 * Without a portrait, the author's initials on the brand's dark ground.
 */
async function avatarSquare(
  brand: Brand,
  author: string,
  portrait: string | undefined,
  size: number,
  zoom: number,
): Promise<Raw> {
  const S = size
  const layers: OverlayOptions[] = []
  let fill: string
  if (portrait) {
    fill = `<linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f7f7"/><stop offset="1" stop-color="${brand.ground}"/></linearGradient>`
    const figure = await preparePortrait(portrait, Math.round(S * zoom))
    const left = Math.round(S / 2 - headCenterX(figure))
    const layer = clipTo({ ...figure, left, top: Math.round(S * 0.07) }, S, S)
    if (layer) layers.push(layer)
  } else {
    fill = `<linearGradient id="d" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2a2a"/><stop offset="1" stop-color="${brand.goldDeep}"/></linearGradient>`
    const face = brand.faces[800]
    const size = Math.round(S * 0.36)
    const letters = shape(face, initials(author), size, -0.01)
    const capHeight = face.latin.capHeight * (size / face.latin.unitsPerEm)
    const svg = svgDoc(S, S, `<path fill="#fff" d="${letters.draw((S - letters.width) / 2, (S + capHeight) / 2)}"/>`)
    layers.push({ input: Buffer.from(svg) })
  }
  const { data, info } = await sharp(Buffer.from(svgDoc(S, S, `<defs>${fill}</defs><rect width="${S}" height="${S}" fill="url(#d)"/>`)))
    .composite(layers)
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}

/** The badge's photo: the square, clipped to a circle `size` px across. */
async function avatarDisc(brand: Brand, author: string, portrait: string | undefined, size: number): Promise<Raw> {
  const square = await avatarSquare(brand, author, portrait, size, 1.18)
  const circle = svgDoc(size, size, `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/>`)
  const { data, info } = await sharp(square.data, { raw: { width: size, height: size, channels: 4 } })
    .composite([{ input: Buffer.from(circle), blend: 'dest-in' }])
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}

interface Badge {
  /** The badge's footprint: ring, circle, gap and name tag. */
  width: number
  height: number
  /** Overlays for a canvas, with the circle centred on `centerX` and the ring's top at `top`. */
  layers: (centerX: number, top: number, canvasW: number, canvasH: number) => Promise<OverlayOptions[]>
}

/**
 * The author, as the share image shows them: a round portrait in a white
 * ring, and their name on a white tag below it. `diameter` is the photo inside
 * the ring; the name is set at `nameSize`, smaller if it would be wider than
 * `maxWidth`.
 */
function authorBadge(
  brand: Brand,
  author: string,
  portrait: string | undefined,
  diameter: number,
  nameSize: number,
  maxWidth: number,
): Badge {
  const ring = Math.max(3, Math.round(diameter * 0.028))
  const outer = diameter + 2 * ring
  const face = brand.faces[700]
  let size = nameSize
  let name = shape(face, author, size)
  while (size > 12 && name.width + size * 1.8 > maxWidth) name = shape(face, author, --size)
  const tagH = Math.round(nameSize * 1.95)
  const tagW = Math.round(name.width + size * 1.8)
  const gap = Math.round(nameSize * 0.7)
  return {
    width: Math.max(outer, tagW),
    height: outer + gap + tagH,
    layers: async (cx, top, W, H) => {
      const r = outer / 2
      const cy = top + r
      const tagTop = top + outer + gap
      const tagLeft = cx - tagW / 2
      const font = face.latin
      const k = size / font.unitsPerEm
      const baseline = tagTop + (tagH - (font.ascent + font.descent) * k) / 2 + font.ascent * k
      const soft = Math.max(2, outer * 0.035)
      const drop = Math.max(1, outer * 0.025)
      const svg = svgDoc(
        W,
        H,
        `<defs><filter id="s" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${soft}"/></filter></defs>
        <g fill="rgb(8,12,22)" fill-opacity="0.28" filter="url(#s)" transform="translate(0 ${drop})">
          <circle cx="${cx}" cy="${cy}" r="${r}"/>
          <rect x="${tagLeft}" y="${tagTop}" width="${tagW}" height="${tagH}" rx="${tagH / 2}"/>
        </g>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/>
        <rect x="${tagLeft}" y="${tagTop}" width="${tagW}" height="${tagH}" rx="${tagH / 2}" fill="#fff"/>
        <path fill="${brand.text}" d="${name.draw(cx - name.width / 2, baseline)}"/>`,
      )
      const disc = await avatarDisc(brand, author, portrait, diameter)
      const photo = clipTo({ ...disc, left: Math.round(cx - diameter / 2), top: Math.round(top + ring) }, W, H)
      return [{ input: Buffer.from(svg) }, ...(photo ? [photo] : [])]
    },
  }
}

// ---- renditions -------------------------------------------------------------

/** Pixel size of the byline avatar: 4× a 40 px circle, 2× an 80 px one. */
export const AVATAR_SIZE = 160

/**
 * The author's face for the bylines on the site — the card and the post header
 * show it, round, in front of the name. The same portrait and crop as the
 * share image's badge, head and shoulders, so the face reads at 32–44 px. A
 * square JPEG: the page rounds it.
 */
export async function renderAuthorAvatar(root: string, author: string, portrait: string): Promise<Buffer> {
  const brand = await loadBrand(root)
  const square = await avatarSquare(brand, author, portrait, AVATAR_SIZE, 1.2)
  return sharp(square.data, { raw: { width: square.width, height: square.height, channels: 4 } })
    .flatten({ background: brand.ground })
    .jpeg({ quality: AVATAR_JPEG_QUALITY, mozjpeg: true })
    .toBuffer()
}

export interface ShareInput {
  title: string
  /** `subtitle:` from frontmatter, or the excerpt when there is none. */
  subtitle?: string
  author: string
  /** The post's raster cover, used as the background; absent → the brand ground. */
  background?: string
  /** The author's portrait; absent → their initials in the circle. */
  portrait?: string
}

const PAD = 64
const TOP = 56
/** Left edge of the text column; the badge is centred in the space before it. */
const COL_X = 540

/** The 1200×630 share card. */
export async function renderShareImage(root: string, input: ShareInput): Promise<Buffer> {
  const brand = await loadBrand(root)
  const W = SHARE_WIDTH
  const H = SHARE_HEIGHT
  const colX = COL_X
  const colW = W - colX - PAD

  // Background: the cover, cropped to 1.91:1, calmed a little and thrown out of
  // focus like a shallow depth of field — the badge reads sharp in front, and a
  // cover that carries its own words or axis labels (a chart, an event card)
  // cannot fight the title. No cover → the ground.
  const ground = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f8fb"/><stop offset="1" stop-color="${brand.ground}"/></linearGradient>
    </defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`
  const base = input.background
    ? sharp(input.background)
        .rotate()
        .resize(W, H, { fit: 'cover', position: 'centre' })
        .flatten({ background: brand.ground })
        .modulate({ saturation: 0.92 })
        .blur(6)
    : sharp(Buffer.from(ground))

  // The text panel: the same ground as the site's static cards, faded in over
  // the photo so the badge and the picture share the left side.
  const fade: [number, number][] = [[0, 0], [0.34, 0], [0.43, 0.86], [0.48, 0.92], [1, 0.92]]
  const scrim = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f8fb"/><stop offset="1" stop-color="${brand.ground}"/></linearGradient>
    <linearGradient id="f" x1="0" y1="0" x2="1" y2="0">${fade
      .map(([o, a]) => `<stop offset="${o}" stop-color="#fff" stop-opacity="${a}"/>`)
      .join('')}</linearGradient>
    <mask id="m"><rect width="${W}" height="${H}" fill="url(#f)"/></mask>
    </defs><rect width="${W}" height="${H}" fill="url(#g)" mask="url(#m)"/></svg>`

  // Type: title (largest size that fits in three lines), rule, subtitle. The
  // byline is the badge's name tag.
  const titleFace = brand.faces[800]
  const TITLE_SIZES = [56, 50, 44, 40]
  let titleSize = TITLE_SIZES[0]
  let title = wrap(titleFace, input.title, titleSize, -0.02, colW, 3)
  for (const size of TITLE_SIZES.slice(1)) {
    if (!title.overflow) break
    titleSize = size
    title = wrap(titleFace, input.title, size, -0.02, colW, 3)
  }
  const titleBlock = textBlock(titleFace, title.lines, titleSize, 1.08, brand.text)

  const subFace = brand.faces[500]
  const subSize = 25
  const sub = input.subtitle
    ? textBlock(subFace, wrap(subFace, input.subtitle, subSize, 0, colW, title.lines.length >= 3 ? 2 : 3).lines, subSize, 1.4, brand.textMuted)
    : null

  const RULE_W = 96
  const RULE_H = 6
  const gaps = { afterTitle: 24, afterRule: 24 }
  const stackHeight = titleBlock.height + gaps.afterTitle + RULE_H + (sub ? gaps.afterRule + sub.height : 0)
  const areaTop = TOP + brand.wordmark.height + 32
  const areaBottom = H - TOP
  let y = Math.max(areaTop, Math.round(areaTop + (areaBottom - areaTop - stackHeight) / 2))

  const parts: string[] = []
  parts.push(titleBlock.svg(colX, y))
  y += titleBlock.height + gaps.afterTitle
  parts.push(`<rect x="${colX}" y="${y}" width="${RULE_W}" height="${RULE_H}" rx="${RULE_H / 2}" fill="url(#rule)"/>`)
  y += RULE_H
  if (sub) parts.push(sub.svg(colX, y + gaps.afterRule))

  const type = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${brand.gold}"/><stop offset="1" stop-color="${brand.goldDeep}"/></linearGradient>
    </defs>${parts.join('')}</svg>`

  // The author: badge centred in the space left of the column.
  const badge = authorBadge(brand, input.author, input.portrait, 320, 26, colX - 2 * 48)
  const people = await badge.layers(colX / 2, Math.round((H - badge.height) / 2), W, H)

  return base
    .composite([
      { input: Buffer.from(scrim) },
      ...people,
      { input: Buffer.from(type) },
      {
        input: brand.wordmark.data,
        raw: { width: brand.wordmark.width, height: brand.wordmark.height, channels: 4 },
        left: colX,
        top: TOP,
      },
    ])
    .jpeg({ quality: SHARE_JPEG_QUALITY, mozjpeg: true })
    .toBuffer()
}
