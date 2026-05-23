function Slider({ label, value, min, max, step, onChange, unit = '' }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-sm text-[color:var(--color-text-secondary)]">{label}</label>
        <span className="text-sm font-medium text-[color:var(--color-accent)]">
          {value}{unit}
        </span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="border-b border-[color:var(--color-border)] pb-4 mb-4 last:border-0">
      <h3 className="text-xs font-semibold text-[color:var(--color-text-muted)] uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  )
}

export default function ControlsPanel({ params, setParams }) {
  const update = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }
  
  return (
    <div className="h-full overflow-y-auto p-5">
      <h2 className="text-base font-bold text-[color:var(--color-text-primary)] mb-5">
        פרמטרים
      </h2>
      
      <Section title="צורת בסיס">
        <Slider 
          label="מספר צלעות" 
          value={params.sides} 
          min={3} max={14} step={1}
          onChange={(v) => update('sides', v)}
        />
        <Slider 
          label="גודל בסיס" 
          value={params.size} 
          min={100} max={800} step={10}
          unit=" מ״מ"
          onChange={(v) => update('size', v)}
        />
        <Slider 
          label="אי-סדירות" 
          value={params.irregularity.toFixed(2)} 
          min={0} max={0.8} step={0.05}
          onChange={(v) => update('irregularity', v)}
        />
      </Section>
      
      <Section title="שכבות">
        <Slider 
          label="מספר שכבות" 
          value={params.layers} 
          min={4} max={20} step={1}
          onChange={(v) => update('layers', v)}
        />
        <Slider 
          label="מרווח בין שכבות" 
          value={params.offset} 
          min={3} max={25} step={1}
          unit=" מ״מ"
          onChange={(v) => update('offset', v)}
        />
        <div>
          <label className="text-sm text-[color:var(--color-text-secondary)] block mb-1.5">
            עובי לבוד
          </label>
          <select 
            value={params.thickness}
            onChange={(e) => update('thickness', parseInt(e.target.value))}
            className="w-full bg-white border border-[color:var(--color-border-strong)] rounded px-3 py-1.5 text-[color:var(--color-text-primary)] text-sm"
          >
            <option value={6}>6 מ״מ</option>
            <option value={9}>9 מ״מ</option>
            <option value={12}>12 מ״מ</option>
            <option value={15}>15 מ״מ</option>
            <option value={18}>18 מ״מ</option>
          </select>
        </div>
      </Section>
      
      <Section title="פסגות">
        <Slider 
          label="מספר פסגות" 
          value={params.numPeaks} 
          min={1} max={3} step={1}
          onChange={(v) => update('numPeaks', v)}
        />
        
        <Slider 
          label="פסגה 1 — X" 
          value={params.peak1x} 
          min={-150} max={150} step={5}
          onChange={(v) => update('peak1x', v)}
        />
        <Slider 
          label="פסגה 1 — Y" 
          value={params.peak1y} 
          min={-150} max={150} step={5}
          onChange={(v) => update('peak1y', v)}
        />
        
        {params.numPeaks >= 2 && (
          <>
            <Slider 
              label="פסגה 2 — X" 
              value={params.peak2x} 
              min={-150} max={150} step={5}
              onChange={(v) => update('peak2x', v)}
            />
            <Slider 
              label="פסגה 2 — Y" 
              value={params.peak2y} 
              min={-150} max={150} step={5}
              onChange={(v) => update('peak2y', v)}
            />
          </>
        )}
        
        {params.numPeaks >= 3 && (
          <>
            <Slider 
              label="פסגה 3 — X" 
              value={params.peak3x} 
              min={-150} max={150} step={5}
              onChange={(v) => update('peak3x', v)}
            />
            <Slider 
              label="פסגה 3 — Y" 
              value={params.peak3y} 
              min={-150} max={150} step={5}
              onChange={(v) => update('peak3y', v)}
            />
          </>
        )}
      </Section>
      
      <Section title="אקראיות">
        <Slider 
          label="זרע גנרציה" 
          value={params.seed} 
          min={1} max={500} step={1}
          onChange={(v) => update('seed', v)}
        />
        <button 
          onClick={() => update('seed', Math.floor(Math.random() * 500) + 1)}
          className="w-full bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-hover)] text-white font-medium py-2 px-4 rounded transition-colors text-sm"
        >
          🎲 צורה רנדומלית
        </button>
      </Section>
    </div>
  )
}