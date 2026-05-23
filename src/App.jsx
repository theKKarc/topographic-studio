import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { FileImage, Box, Plus, Minus, Sliders, X, Layers, Eye, Image } from 'lucide-react'
import Island3D from './components/Island3D'
import Island2D from './components/Island2D'
import ControlsPanel from './components/ControlsPanel'
import { exportSVG, exportSTL } from './lib/exporters'
import { useIsMobile, useIsTablet } from './lib/useMediaQuery'

const DEFAULT_ISLAND = {
  sides: 7,
  size: 300,
  irregularity: 0.35,
  layers: 12,
  offset: 8,
  thickness: 9,
  numPeaks: 1,
  peak1x: 0, peak1y: 0,
  peak2x: 60, peak2y: -40,
  peak3x: -50, peak3y: 50,
  seed: 42
}

const SECOND_ISLAND = {
  ...DEFAULT_ISLAND,
  size: 200,
  layers: 9,
  seed: 127,
  sides: 6
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight 
        position={[200, 300, 200]} 
        intensity={1.0} 
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-150, 150, -100]} intensity={0.4} color="#FFF4E5" />
      <directionalLight position={[0, 100, -200]} intensity={0.25} color="#FFFFFF" />
    </>
  )
}

function ViewLabel({ children }) {
  return (
    <div className="absolute top-3 left-3 bg-white/85 backdrop-blur-sm px-2.5 py-1 rounded text-xs font-semibold text-[color:var(--color-text-secondary)] uppercase tracking-wider border border-[color:var(--color-border)] z-10">
      {children}
    </div>
  )
}

function ViewPanel({ children, title, className = '' }) {
  return (
    <div className={`relative bg-white rounded-xl border border-[color:var(--color-border)] overflow-hidden shadow-sm ${className}`}>
      <ViewLabel>{title}</ViewLabel>
      {children}
    </div>
  )
}

// תצוגת התלת-ממד - מבודדת לרכיב נפרד כי נשתמש בה גם במובייל
function ThreeDView({ islands }) {
  return (
    <Canvas
      camera={{ position: [500, 350, 500], fov: 35 }}
      shadows
      style={{ background: '#FAF6F0' }}
    >
      <Lighting />
      
      {islands.map((island, idx) => {
        let xShift = 0
        for (let i = 0; i < idx; i++) {
          xShift += islands[i].size / 2 + islands[i].size / 2 + 80
        }
        const totalSpan = islands.reduce((sum, isl, i) => 
          sum + isl.size + (i < islands.length - 1 ? 80 : 0), 0
        )
        xShift -= totalSpan / 2 - island.size / 2
        
        return (
          <group key={idx} position={[xShift, 0, 0]}>
            <Island3D params={island} />
          </group>
        )
      })}
      
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05}
        minDistance={100}
        maxDistance={2000}
        maxPolarAngle={Math.PI / 2.1}
        touches={{
          ONE: 2, // ROTATE
          TWO: 1  // DOLLY_PAN
        }}
      />
    </Canvas>
  )
}

// תצוגת ה-2D הכפולה - מבט-על ומבט-חזית
function TwoDViews({ islands, activeIslandIdx, isMobile }) {
  return (
    <div className={`flex-1 grid ${isMobile ? 'grid-cols-1 grid-rows-2' : 'grid-cols-2'} gap-4 min-h-0`}>
      <ViewPanel title="מבט על">
        <div className="w-full h-full p-6 flex items-center justify-center gap-4">
          {islands.map((island, idx) => (
            <div 
              key={idx} 
              className={`flex-1 h-full ${idx === activeIslandIdx ? 'opacity-100' : 'opacity-70'}`}
            >
              <Island2D params={island} view="top" />
            </div>
          ))}
        </div>
      </ViewPanel>
      
      <ViewPanel title="מבט חזית">
        <div className="w-full h-full p-6 flex items-center justify-center gap-4">
          {islands.map((island, idx) => (
            <div 
              key={idx} 
              className={`flex-1 h-full ${idx === activeIslandIdx ? 'opacity-100' : 'opacity-70'}`}
            >
              <Island2D params={island} view="front" />
            </div>
          ))}
        </div>
      </ViewPanel>
    </div>
  )
}

// כפתור טאב במובייל
function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-2 px-3 transition-colors ${
        active 
          ? 'text-[color:var(--color-accent)] bg-white' 
          : 'text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-secondary)]'
      }`}
    >
      <Icon size={20} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

function App() {
  const [islands, setIslands] = useState([DEFAULT_ISLAND])
  const [activeIslandIdx, setActiveIslandIdx] = useState(0)
  const [mobileTab, setMobileTab] = useState('3d') // '3d', '2d'
  const [showMobileParams, setShowMobileParams] = useState(false)
  
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  
  const activeIsland = islands[activeIslandIdx]
  
  const updateActiveIsland = (updater) => {
    setIslands(prev => prev.map((island, idx) => 
      idx === activeIslandIdx 
        ? (typeof updater === 'function' ? updater(island) : updater)
        : island
    ))
  }
  
  const addIsland = () => {
    if (islands.length < 2) {
      setIslands([...islands, SECOND_ISLAND])
      setActiveIslandIdx(islands.length)
    }
  }
  
  const removeIsland = () => {
    if (islands.length > 1) {
      const newIslands = islands.filter((_, idx) => idx !== activeIslandIdx)
      setIslands(newIslands)
      setActiveIslandIdx(Math.max(0, activeIslandIdx - 1))
    }
  }
  
  const totalHeight = Math.max(...islands.map(i => i.layers * i.thickness))
  const totalLayers = islands.reduce((sum, i) => sum + i.layers, 0)
  
  // פאנל פרמטרים - משותף לכל הרזולוציות
  const ParamsPanel = () => (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-[color:var(--color-border)] p-3">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs font-semibold text-[color:var(--color-text-muted)] uppercase tracking-wider">
            אי פעיל
          </div>
          {isMobile && (
            <button 
              onClick={() => setShowMobileParams(false)}
              className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)]"
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        <div className="flex gap-2 mb-2">
          {islands.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIslandIdx(idx)}
              className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition-colors ${
                idx === activeIslandIdx
                  ? 'bg-[color:var(--color-accent)] text-white'
                  : 'bg-[color:var(--color-surface-soft)] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-border)]'
              }`}
            >
              אי {idx + 1}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {islands.length < 2 && (
            <button
              onClick={addIsland}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded text-xs font-medium border border-dashed border-[color:var(--color-border-strong)] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-soft)]"
            >
              <Plus size={12} />
              הוסף אי
            </button>
          )}
          {islands.length > 1 && (
            <button
              onClick={removeIsland}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded text-xs font-medium border border-[color:var(--color-border-strong)] text-[color:var(--color-text-secondary)] hover:bg-red-50 hover:border-red-300"
            >
              <Minus size={12} />
              הסר אי {activeIslandIdx + 1}
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <ControlsPanel params={activeIsland} setParams={updateActiveIsland} />
      </div>
    </div>
  )
  
  // ----- תצוגת מובייל -----
  if (isMobile) {
    return (
      <div className="w-screen h-screen bg-[color:var(--color-bg)] flex flex-col">
        
        {/* כותרת מובייל */}
        <header className="bg-white border-b border-[color:var(--color-border)] px-4 py-2.5 flex justify-between items-center">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-[color:var(--color-text-primary)] truncate">
              Topographic Studio
            </h1>
            <p className="text-[color:var(--color-text-muted)] text-[10px]">
              {islands.length} {islands.length === 1 ? 'אי' : 'איים'} · {totalHeight}מ״מ
            </p>
          </div>
          
          <button
            onClick={() => setShowMobileParams(true)}
            className="flex-shrink-0 bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-hover)] text-white p-2 rounded"
          >
            <Sliders size={18} />
          </button>
        </header>
        
        {/* אזור התצוגות במובייל */}
        <div className="flex-1 overflow-hidden p-3">
          {mobileTab === '3d' && (
            <ViewPanel title="תלת-ממד" className="w-full h-full">
              <ThreeDView islands={islands} />
            </ViewPanel>
          )}
          
          {mobileTab === '2d' && (
            <div className="w-full h-full flex flex-col gap-3">
              <TwoDViews 
                islands={islands} 
                activeIslandIdx={activeIslandIdx}
                isMobile={true}
              />
            </div>
          )}
        </div>
        
        {/* סרגל ניווט תחתון */}
        <nav className="bg-white border-t border-[color:var(--color-border)] flex">
          <TabButton 
            active={mobileTab === '3d'} 
            onClick={() => setMobileTab('3d')}
            icon={Box}
            label="תלת-ממד"
          />
          <TabButton 
            active={mobileTab === '2d'} 
            onClick={() => setMobileTab('2d')}
            icon={Eye}
            label="מבטים"
          />
          
          {/* כפתורי ייצוא */}
          <button
            onClick={() => exportSVG(islands)}
            className="flex flex-col items-center gap-1 py-2 px-3 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-secondary)]"
          >
            <FileImage size={20} />
            <span className="text-xs font-medium">SVG</span>
          </button>
          <button
            onClick={() => exportSTL(islands)}
            className="flex flex-col items-center gap-1 py-2 px-3 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-secondary)]"
          >
            <Image size={20} />
            <span className="text-xs font-medium">STL</span>
          </button>
        </nav>
        
        {/* פאנל פרמטרים נשלף ממובייל */}
        {showMobileParams && (
          <>
            {/* רקע כהה */}
            <div 
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowMobileParams(false)}
            />
            {/* הפאנל עצמו */}
            <div className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white shadow-2xl z-50 flex flex-col">
              <ParamsPanel />
            </div>
          </>
        )}
      </div>
    )
  }
  
  // ----- תצוגת Desktop / Tablet -----
  return (
    <div className="w-screen h-screen bg-[color:var(--color-bg)] flex flex-col">
      
      <header className="bg-white border-b border-[color:var(--color-border)] px-6 py-3 flex justify-between items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-[color:var(--color-text-primary)]">
            Topographic Studio
          </h1>
          <p className="text-[color:var(--color-text-muted)] text-xs">
            מחולל יצירות טופוגרפיות בשכבות
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-[color:var(--color-text-secondary)] text-xs">
            <span className="text-[color:var(--color-accent)] font-medium">
              {islands.length} {islands.length === 1 ? 'אי' : 'איים'}
            </span>
            <span className="mx-2">·</span>
            <span>{totalLayers} שכבות בסה״כ</span>
            <span className="mx-2">·</span>
            <span className="font-medium">{totalHeight} מ״מ גובה</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => exportSVG(islands)}
              className="flex items-center gap-1.5 bg-white hover:bg-[color:var(--color-surface-soft)] border border-[color:var(--color-border-strong)] text-[color:var(--color-text-primary)] font-medium py-1.5 px-3 rounded text-xs transition-colors"
            >
              <FileImage size={14} />
              ייצא SVG
            </button>
            <button
              onClick={() => exportSTL(islands)}
              className="flex items-center gap-1.5 bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-hover)] text-white font-medium py-1.5 px-3 rounded text-xs transition-colors"
            >
              <Box size={14} />
              ייצא STL
            </button>
          </div>
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          <div className="flex-1 flex justify-center min-h-0">
            <ViewPanel title="תלת-ממד" className="aspect-square h-full">
              <ThreeDView islands={islands} />
            </ViewPanel>
          </div>
          
          <TwoDViews 
            islands={islands} 
            activeIslandIdx={activeIslandIdx}
            isMobile={false}
          />
          
        </div>
        
        <div className="w-80 bg-white rounded-xl border border-[color:var(--color-border)] shadow-sm overflow-hidden flex-shrink-0">
          <ParamsPanel />
        </div>
        
      </div>
    </div>
  )
}

export default App