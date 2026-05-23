import { useMemo } from 'react'
import * as THREE from 'three'
import { generateLayers } from '../lib/geometry'

function Layer({ points, zPosition, thickness, color }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].y)
    }
    shape.closePath()
    
    return new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: false
    })
  }, [points, thickness])
  
  return (
    <mesh 
      geometry={geometry} 
      position={[0, zPosition, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial 
        color={color} 
        roughness={0.75} 
        metalness={0.05}
      />
    </mesh>
  )
}

export default function Island3D({ params }) {
  const layers = useMemo(() => generateLayers(params), [params])
  
  const totalHeight = layers.length * params.thickness
  const centerOffset = -totalHeight / 2
  
  return (
    <group>
      {layers.map((layer, idx) => {
        const t = idx / Math.max(layers.length - 1, 1)
        // גוונים בהירים-חמים של עץ
        const r = Math.floor(232 - t * 80)
        const g = Math.floor(212 - t * 80)
        const b = Math.floor(184 - t * 100)
        const color = `rgb(${r}, ${g}, ${b})`
        
        return (
          <Layer
            key={idx}
            points={layer}
            zPosition={centerOffset + idx * params.thickness}
            thickness={params.thickness}
            color={color}
          />
        )
      })}
    </group>
  )
}