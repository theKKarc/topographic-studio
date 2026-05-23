import { generateLayers } from './geometry'

function polygonBounds(points) {
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity
  points.forEach(p => {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  })
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY }
}

function polygonAreaSigned(points) {
  let area = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += points[i].x * points[j].y - points[j].x * points[i].y
  }
  return area / 2
}

function triangulate(points) {
  if (points.length < 3) return []
  const area = polygonAreaSigned(points)
  const pts = area < 0 ? points.slice().reverse() : points.slice()
  const triangles = []
  const indices = pts.map((_, i) => i)
  
  function isConvex(prev, curr, next) {
    const cross = (curr.x - prev.x) * (next.y - curr.y) - (curr.y - prev.y) * (next.x - curr.x)
    return cross > 0
  }
  
  function pointInTriangle(p, a, b, c) {
    const d1 = (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y)
    const d2 = (p.x - c.x) * (b.y - c.y) - (b.x - c.x) * (p.y - c.y)
    const d3 = (p.x - a.x) * (c.y - a.y) - (c.x - a.x) * (p.y - a.y)
    return !(((d1 < 0) || (d2 < 0) || (d3 < 0)) && ((d1 > 0) || (d2 > 0) || (d3 > 0)))
  }
  
  let guard = 0
  while (indices.length > 3 && guard++ < 5000) {
    let earFound = false
    for (let i = 0; i < indices.length; i++) {
      const prevI = indices[(i - 1 + indices.length) % indices.length]
      const currI = indices[i]
      const nextI = indices[(i + 1) % indices.length]
      const a = pts[prevI], b = pts[currI], c = pts[nextI]
      if (!isConvex(a, b, c)) continue
      let containsOther = false
      for (let j = 0; j < indices.length; j++) {
        const k = indices[j]
        if (k === prevI || k === currI || k === nextI) continue
        if (pointInTriangle(pts[k], a, b, c)) { containsOther = true; break }
      }
      if (containsOther) continue
      triangles.push([a, b, c])
      indices.splice(i, 1)
      earFound = true
      break
    }
    if (!earFound) break
  }
  if (indices.length === 3) {
    triangles.push([pts[indices[0]], pts[indices[1]], pts[indices[2]]])
  }
  return triangles
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

export function exportSVG(islands, filename = 'topographic_layers.svg') {
  const allLayers = []
  islands.forEach((island, islandIdx) => {
    const layers = generateLayers(island)
    layers.forEach((layer, layerIdx) => {
      const bounds = polygonBounds(layer)
      allLayers.push({
        islandIdx,
        layerIdx,
        points: layer,
        bounds,
        w: bounds.w,
        h: bounds.h
      })
    })
  })
  
  allLayers.sort((a, b) => (b.w * b.h) - (a.w * a.h))
  
  const padding = 8
  const maxRowWidth = 800
  let currentX = padding
  let currentY = padding
  let rowMaxHeight = 0
  const placed = []
  
  allLayers.forEach(item => {
    if (currentX + item.w + padding > maxRowWidth) {
      currentX = padding
      currentY += rowMaxHeight + padding
      rowMaxHeight = 0
    }
    placed.push({
      ...item,
      placedX: currentX - item.bounds.minX,
      placedY: currentY - item.bounds.minY
    })
    currentX += item.w + padding
    if (item.h > rowMaxHeight) rowMaxHeight = item.h
  })
  
  const totalW = maxRowWidth
  const totalH = currentY + rowMaxHeight + padding
  
  let svg = '<?xml version="1.0" encoding="UTF-8"?>\n'
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}mm" height="${totalH}mm" viewBox="0 0 ${totalW} ${totalH}">\n`
  svg += `<rect x="0" y="0" width="${totalW}" height="${totalH}" fill="white"/>\n`
  
  placed.forEach(item => {
    const points = item.points.map(p => 
      `${(p.x + item.placedX).toFixed(2)},${(p.y + item.placedY).toFixed(2)}`
    ).join(' ')
    svg += `<polygon points="${points}" fill="none" stroke="red" stroke-width="0.15"/>\n`
    
    const labelX = item.placedX + item.bounds.minX + item.w / 2
    const labelY = item.placedY + item.bounds.minY + item.h / 2
    const label = `${item.islandIdx + 1}-L${item.layerIdx + 1}`
    svg += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="6" fill="black">${label}</text>\n`
  })
  
  svg += '</svg>'
  downloadFile(svg, filename, 'image/svg+xml')
}

export function exportSTL(islands, filename = 'topographic_model.stl') {
  const triangles = []
  const islandSpacing = 50
  let xOffset = 0
  
  islands.forEach((island, islandIdx) => {
    const layers = generateLayers(island)
    if (layers.length === 0) return
    
    const bounds = polygonBounds(layers[0])
    const islandStartX = xOffset - bounds.minX
    
    layers.forEach((layer, layerIdx) => {
      const zBottom = layerIdx * island.thickness
      const zTop = zBottom + island.thickness
      
      const shiftedLayer = layer.map(p => ({ 
        x: p.x + islandStartX, 
        y: p.y, 
        z: 0 
      }))
      
      const topTris = triangulate(shiftedLayer)
      topTris.forEach(tri => {
        triangles.push([
          { x: tri[0].x, y: tri[0].y, z: zTop },
          { x: tri[1].x, y: tri[1].y, z: zTop },
          { x: tri[2].x, y: tri[2].y, z: zTop }
        ])
        triangles.push([
          { x: tri[0].x, y: tri[0].y, z: zBottom },
          { x: tri[2].x, y: tri[2].y, z: zBottom },
          { x: tri[1].x, y: tri[1].y, z: zBottom }
        ])
      })
      
      const area = polygonAreaSigned(shiftedLayer)
      const ordered = area < 0 ? shiftedLayer.slice().reverse() : shiftedLayer.slice()
      const n = ordered.length
      for (let i = 0; i < n; i++) {
        const a = ordered[i]
        const b = ordered[(i + 1) % n]
        triangles.push([
          { x: a.x, y: a.y, z: zBottom },
          { x: b.x, y: b.y, z: zBottom },
          { x: b.x, y: b.y, z: zTop }
        ])
        triangles.push([
          { x: a.x, y: a.y, z: zBottom },
          { x: b.x, y: b.y, z: zTop },
          { x: a.x, y: a.y, z: zTop }
        ])
      }
    })
    
    xOffset += bounds.w + islandSpacing
  })
  
  let stl = 'solid topographic_islands\n'
  triangles.forEach(tri => {
    const ux = tri[1].x - tri[0].x, uy = tri[1].y - tri[0].y, uz = tri[1].z - tri[0].z
    const vx = tri[2].x - tri[0].x, vy = tri[2].y - tri[0].y, vz = tri[2].z - tri[0].z
    let nx = uy * vz - uz * vy
    let ny = uz * vx - ux * vz
    let nz = ux * vy - uy * vx
    const len = Math.sqrt(nx*nx + ny*ny + nz*nz)
    if (len > 0) { nx /= len; ny /= len; nz /= len }
    
    stl += `  facet normal ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}\n`
    stl += '    outer loop\n'
    tri.forEach(v => {
      stl += `      vertex ${v.x.toFixed(4)} ${v.y.toFixed(4)} ${v.z.toFixed(4)}\n`
    })
    stl += '    endloop\n  endfacet\n'
  })
  stl += 'endsolid topographic_islands\n'
  
  downloadFile(stl, filename, 'application/sla')
}