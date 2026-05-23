// אלגוריתמי הגיאומטריה של האי הטופוגרפי

// מחולל מספרים אקראיים עם seed - כך אותו seed תמיד נותן אותה תוצאה
export function mulberry32(seed) {
  return function() {
    seed |= 0
    seed = seed + 0x6D2B79F5 | 0
    let t = seed
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// יצירת פוליגון בסיס עם מספר צלעות ואי-סדירות
export function generateBasePolygon(sides, radius, irregularity, rng) {
  const points = []
  const angleStep = (Math.PI * 2) / sides
  for (let i = 0; i < sides; i++) {
    const angle = i * angleStep - Math.PI / 2
    const r = radius * (1 - irregularity * rng())
    points.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r
    })
  }
  return points
}

// חישוב מרכז שכבה לפי הפסגות
export function computeLayerCenter(peaks, layerRatio) {
  if (peaks.length === 1) {
    return { x: peaks[0].x * layerRatio, y: peaks[0].y * layerRatio }
  }
  let cx = 0, cy = 0
  peaks.forEach(p => { cx += p.x; cy += p.y })
  return {
    x: (cx / peaks.length) * layerRatio,
    y: (cy / peaks.length) * layerRatio
  }
}

// כיווץ פוליגון פנימה (Polygon Offset / Inset)
export function offsetPolygon(points, distance) {
  const result = []
  const n = points.length
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n]
    const curr = points[i]
    const next = points[(i + 1) % n]
    const v1x = curr.x - prev.x, v1y = curr.y - prev.y
    const v2x = next.x - curr.x, v2y = next.y - curr.y
    const len1 = Math.sqrt(v1x*v1x + v1y*v1y) || 1
    const len2 = Math.sqrt(v2x*v2x + v2y*v2y) || 1
    const n1x = -v1y / len1, n1y = v1x / len1
    const n2x = -v2y / len2, n2y = v2x / len2
    const bx = n1x + n2x, by = n1y + n2y
    const bLen = Math.sqrt(bx*bx + by*by) || 1
    const dot = n1x * (bx/bLen) + n1y * (by/bLen)
    const miter = distance / Math.max(dot, 0.3)
    result.push({
      x: curr.x + (bx/bLen) * miter,
      y: curr.y + (by/bLen) * miter
    })
  }
  return result
}

// חישוב שטח פוליגון
export function polygonArea(points) {
  let area = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += points[i].x * points[j].y - points[j].x * points[i].y
  }
  return Math.abs(area) / 2
}

// יצירת כל השכבות של האי
export function generateLayers(params) {
  const rng = mulberry32(params.seed)
  const base = generateBasePolygon(params.sides, params.size / 2, params.irregularity, rng)
  
  const peaks = [{ x: params.peak1x, y: params.peak1y }]
  if (params.numPeaks >= 2) peaks.push({ x: params.peak2x, y: params.peak2y })
  if (params.numPeaks >= 3) peaks.push({ x: params.peak3x, y: params.peak3y })
  
  const layers = [base]
  let current = base
  
  for (let i = 1; i < params.layers; i++) {
    const next = offsetPolygon(current, params.offset)
    if (polygonArea(next) < 30) break
    
    const targetCenter = computeLayerCenter(peaks, i / params.layers)
    const prevCenter = computeLayerCenter(peaks, (i - 1) / params.layers)
    const dx = targetCenter.x - prevCenter.x
    const dy = targetCenter.y - prevCenter.y
    const shifted = next.map(p => ({ x: p.x + dx, y: p.y + dy }))
    
    layers.push(shifted)
    current = shifted
  }
  
  return layers
}