import { useMemo } from 'react'
import { generateLayers } from '../lib/geometry'

// תצוגה דו-ממדית של האי - מבט-על או מבט-חזית
export default function Island2D({ params, view = 'top' }) {
  const layers = useMemo(() => generateLayers(params), [params])
  
  if (layers.length === 0) return null
  
  // חישוב גבולות לסקייל
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity
  layers.forEach(layer => {
    layer.forEach(p => {
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    })
  })
  
  const padding = 30
  const width = maxX - minX + padding * 2
  const height = maxY - minY + padding * 2
  
  if (view === 'top') {
    // מבט על - מסתכלים מלמעלה למטה
    const viewBox = `${minX - padding} ${minY - padding} ${width} ${height}`
    
    return (
      <svg viewBox={viewBox} className="w-full h-full">
        {layers.map((layer, idx) => {
          const t = idx / Math.max(layers.length - 1, 1)
          const r = Math.floor(232 - t * 80)
          const g = Math.floor(212 - t * 80)
          const b = Math.floor(184 - t * 100)
          const fill = `rgb(${r},${g},${b})`
          const points = layer.map(p => `${p.x},${p.y}`).join(' ')
          
          return (
            <polygon 
              key={idx}
              points={points}
              fill={fill}
              stroke="#8B6B47"
              strokeWidth="0.5"
              opacity={0.95}
            />
          )
        })}
      </svg>
    )
  }
  
  // מבט חזית - מסתכלים מהצד, רואים את הפרופיל
  // לכל שכבה מציירים מלבן ברוחב הקצוות שלה
  const totalHeight = layers.length * params.thickness
  const viewBoxHeight = totalHeight + padding * 2
  const viewBoxWidth = (maxX - minX) + padding * 2
  
  // מוצאים את ה-X של הקצה השמאלי והימני של כל שכבה (בקירוב)
  function getLayerHorizontalExtent(layer) {
    let lMin = Infinity, lMax = -Infinity
    layer.forEach(p => {
      if (p.x < lMin) lMin = p.x
      if (p.x > lMax) lMax = p.x
    })
    return { min: lMin, max: lMax }
  }
  
  return (
    <svg 
      viewBox={`${minX - padding} 0 ${viewBoxWidth} ${viewBoxHeight}`} 
      className="w-full h-full"
    >
      {layers.map((layer, idx) => {
        const t = idx / Math.max(layers.length - 1, 1)
        const r = Math.floor(232 - t * 80)
        const g = Math.floor(212 - t * 80)
        const b = Math.floor(184 - t * 100)
        const fill = `rgb(${r},${g},${b})`
        
        const ext = getLayerHorizontalExtent(layer)
        const y = padding + (layers.length - 1 - idx) * params.thickness
        
        return (
          <rect 
            key={idx}
            x={ext.min}
            y={y}
            width={ext.max - ext.min}
            height={params.thickness}
            fill={fill}
            stroke="#8B6B47"
            strokeWidth="0.5"
          />
        )
      })}
      
      {/* קו רצפה */}
      <line 
        x1={minX - padding/2} 
        y1={padding + totalHeight + 2} 
        x2={maxX + padding/2}
        y2={padding + totalHeight + 2}
        stroke="#5C5040"
        strokeWidth="1"
        strokeDasharray="4,2"
      />
    </svg>
  )
}