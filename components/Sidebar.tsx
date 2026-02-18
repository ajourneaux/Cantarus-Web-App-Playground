
import React, { useState } from 'react';
import { Plus, Trash2, Download, Code, Share2, Zap, RefreshCw, Layout, Square, Smartphone, RotateCcw, X, Code2, Film, Clock } from 'lucide-react';
import { GradientPoint, GlobalConfig, ExportConfig, ExportFormat, ExportDuration } from '../types';
import { ALLOWED_COLORS, DEFAULT_CONFIG } from '../utils/color';

interface SidebarProps {
  points: GradientPoint[];
  config: GlobalConfig;
  exportConfig: ExportConfig;
  onUpdatePoint: (id: string, updates: Partial<GradientPoint>) => void;
  onAddPoint: () => void;
  onRemovePoint: (id: string) => void;
  onUpdateConfig: (updates: Partial<GlobalConfig>) => void;
  onUpdateExportConfig: (updates: Partial<ExportConfig>) => void;
  onExportPNG: () => void;
  onExportMP4: () => void;
  onExportJSON: () => void;
  onShowCode: () => void;
  onGeneratePalette: () => void;
}

const FrameIcon = () => (
  <svg 
    width="14" 
    height="14" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="opacity-90"
  >
    <rect x="6" y="2" width="12" height="20" rx="0" />
  </svg>
);

const Sidebar: React.FC<SidebarProps> = ({
  points,
  config,
  exportConfig,
  onUpdatePoint,
  onAddPoint,
  onRemovePoint,
  onUpdateConfig,
  onUpdateExportConfig,
  onExportPNG,
  onExportMP4,
  onExportJSON,
  onShowCode,
  onGeneratePalette
}) => {
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);
  const [isVideoMenuOpen, setIsVideoMenuOpen] = useState(false);
  
  const MAX_POINTS = 5;
  const WARP_SHAPES = ["FLOW", "LIQUID", "ROWS", "COLUMNS"];
  const MULTIPLIERS = [1, 2, 3, 4];
  const DURATIONS: ExportDuration[] = [5, 10, 15];
  const FORMATS: { id: ExportFormat; label: string; icon: any }[] = [
    { id: 'LANDSCAPE', label: 'Landscape', icon: Layout },
    { id: 'SQUARE', label: 'Square', icon: Square },
    { id: 'PORTRAIT', label: 'Portrait', icon: Smartphone }
  ];

  const isHighRangeShape = config.warpShape >= 2;
  const currentMaxWarpSize = isHighRangeShape ? 3.0 : 1.0;

  return (
    <div className="w-full md:w-80 md:fixed md:right-0 md:top-0 md:h-full bg-[#050505] border-t md:border-t-0 md:border-l border-white/20 text-white font-mono flex flex-col z-50 shadow-2xl md:overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/20 flex items-center justify-between bg-white/5 shrink-0">
        <h1 className="text-sm font-bold tracking-tighter uppercase flex items-center gap-2">
          <FrameIcon /> Cantarus Mesh Lab
        </h1>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              const newState = !config.isAnimated;
              onUpdateConfig({ isAnimated: newState, isDrifting: newState });
              // If we stop animation, force close the MP4 menu as it's no longer valid
              if (!newState) setIsVideoMenuOpen(false);
            }}
            title={config.isAnimated ? "Freeze Everything" : "Animate Everything"}
            className={`p-1.5 border border-white/20 transition-colors ${config.isAnimated ? 'bg-white text-black' : 'hover:bg-white/10'}`}
          >
            {config.isAnimated ? <Zap size={12} fill="currentColor" /> : <Zap size={12} />}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="md:flex-1 md:overflow-y-auto">
        {/* Global Controls */}
        <div className="p-4 border-b border-white/20 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[10px] uppercase text-white/50 tracking-[0.2em] flex items-center gap-1">
              <Zap size={10} /> Global Controls
            </h2>
            <button 
              onClick={() => onUpdateConfig(DEFAULT_CONFIG)}
              className="p-1 border border-white/20 hover:bg-white hover:text-black transition-colors"
              title="Reset to defaults"
            >
              <RotateCcw size={12} />
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] uppercase">
                <span>Grain Strength</span>
                <span>{(config.noiseStrength * 400).toFixed(0)}%</span>
              </div>
              <input 
                type="range" min="0" max="0.25" step="0.005" 
                value={config.noiseStrength}
                onChange={(e) => onUpdateConfig({ noiseStrength: parseFloat(e.target.value) })}
                className="w-full accent-white bg-white/10 h-1 appearance-none cursor-pointer"
              />
            </div>

            <div className="pt-2 pb-2 space-y-3 border-t border-white/5">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] uppercase">
                  <span>Warp Amount</span>
                  <span>{(config.warp * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" 
                  value={config.warp}
                  onChange={(e) => onUpdateConfig({ warp: parseFloat(e.target.value) })}
                  className="w-full accent-white bg-white/10 h-1 appearance-none cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] uppercase">
                  <span>Warp Size</span>
                  <span>{config.warpSize.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0.01" max={currentMaxWarpSize} step="0.01" 
                  value={Math.min(config.warpSize, currentMaxWarpSize)}
                  onChange={(e) => onUpdateConfig({ warpSize: parseFloat(e.target.value) })}
                  className="w-full accent-white bg-white/10 h-1 appearance-none cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase mb-1">Warp Shape</label>
                <div className="grid grid-cols-2 gap-1">
                  {WARP_SHAPES.map((shape, idx) => (
                    <button
                      key={shape}
                      onClick={() => {
                        const nextMax = idx >= 2 ? 3.0 : 1.0;
                        const updates: Partial<GlobalConfig> = { warpShape: idx };
                        if (config.warpSize > nextMax) updates.warpSize = nextMax;
                        onUpdateConfig(updates);
                      }}
                      className={`text-[8px] p-1 border uppercase transition-colors ${config.warpShape === idx ? 'bg-white text-black border-white' : 'border-white/10 hover:border-white/40'}`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 border-t border-white/5 pt-3">
               <div className="flex justify-between text-[10px] uppercase">
                <span className={!config.isAnimated ? 'opacity-30' : ''}>Animation Speed</span>
                <span className={!config.isAnimated ? 'opacity-30' : ''}>{config.animationSpeed.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={config.animationSpeed}
                onChange={(e) => onUpdateConfig({ animationSpeed: parseFloat(e.target.value) })}
                className={`w-full accent-white bg-white/10 h-1 appearance-none cursor-pointer ${!config.isAnimated && 'opacity-30'}`}
                disabled={!config.isAnimated}
              />
            </div>
          </div>
        </div>

        {/* Points Controls */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[10px] uppercase text-white/50 tracking-[0.2em]">Points ({points.length}/{MAX_POINTS})</h2>
            <div className="flex gap-2">
              <button 
                onClick={onGeneratePalette}
                className="p-1 border border-white/20 hover:bg-white hover:text-black transition-colors"
                title="Randomize Points"
              >
                <RefreshCw size={12} />
              </button>
              <button 
                disabled={points.length >= MAX_POINTS}
                onClick={onAddPoint}
                className="p-1 border border-white/20 hover:bg-white hover:text-black transition-colors disabled:opacity-30"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {points.map((p, idx) => (
              <div key={p.id} className="p-3 border border-white/20 space-y-3 relative group bg-white/5">
                {points.length > 1 && (
                  <button 
                    onClick={() => onRemovePoint(p.id)}
                    className="absolute -right-2 -top-2 bg-black border border-white/20 p-1 md:hidden group-hover:block hover:text-red-500 shadow-lg"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] border border-white/20 px-1">0{idx + 1}</div>
                  </div>
                  <div className="flex gap-1 h-6">
                    {ALLOWED_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => onUpdatePoint(p.id, { color })}
                        className={`flex-1 border transition-all ${p.color.toUpperCase() === color.toUpperCase() ? 'border-white scale-105 z-10' : 'border-white/10 opacity-40 hover:opacity-100'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] uppercase">Pos X</label>
                    <input 
                      type="range" min="0" max="1" step="0.01"
                      value={p.position[0]}
                      onChange={(e) => onUpdatePoint(p.id, { position: [parseFloat(e.target.value), p.position[1]] })}
                      className="w-full accent-white h-1 appearance-none bg-white/10"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] uppercase">Pos Y</label>
                    <input 
                      type="range" min="0" max="1" step="0.01"
                      value={p.position[1]}
                      onChange={(e) => onUpdatePoint(p.id, { position: [p.position[0], parseFloat(e.target.value)] })}
                      className="w-full accent-white h-1 appearance-none bg-white/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] uppercase">Radius</label>
                    <input 
                      type="range" min="0.1" max="1.5" step="0.01"
                      value={p.radius}
                      onChange={(e) => onUpdatePoint(p.id, { radius: parseFloat(e.target.value) })}
                      className="w-full accent-white h-1 appearance-none bg-white/10"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] uppercase">Intensity</label>
                    <input 
                      type="range" min="0" max="1" step="0.01"
                      value={p.intensity}
                      onChange={(e) => onUpdatePoint(p.id, { intensity: parseFloat(e.target.value) })}
                      className="w-full accent-white h-1 appearance-none bg-white/10"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Export Actions */}
      <div className="bg-[#050505] border-t border-white/20 p-4 shrink-0">
        {/* PNG Menu */}
        {isImageMenuOpen && (
          <div className="mb-4 p-4 bg-white text-black border border-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] uppercase font-bold flex items-center gap-1"><Download size={10} /> PNG Settings</h2>
              <button onClick={() => setIsImageMenuOpen(false)}><X size={12} strokeWidth={3} /></button>
            </div>
            <p className="text-[8px] uppercase mb-3 opacity-60">High-Quality Lossless Still</p>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-1">
                {FORMATS.map(f => (
                  <button key={f.id} onClick={() => onUpdateExportConfig({ format: f.id })} className={`flex flex-col items-center justify-center p-2 border transition-all ${exportConfig.format === f.id ? 'bg-black text-white' : 'border-black/20 hover:bg-black/5'}`}>
                    <f.icon size={14} className="mb-1" />
                    <span className="text-[8px] uppercase font-bold">{f.label}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {MULTIPLIERS.map(m => (
                  <button key={m} onClick={() => onUpdateExportConfig({ multiplier: m })} className={`p-1.5 border text-[10px] font-bold transition-all ${exportConfig.multiplier === m ? 'bg-black text-white' : 'border-black/20 hover:bg-black/5'}`}>
                    {m}X
                  </button>
                ))}
              </div>
              <button onClick={() => { onExportPNG(); setIsImageMenuOpen(false); }} className="w-full p-3 bg-black text-white text-[10px] font-bold uppercase active:scale-95 transition-all">
                EXPORT PNG
              </button>
            </div>
          </div>
        )}

        {/* MP4 Menu - Only interactive if animated */}
        {isVideoMenuOpen && config.isAnimated && (
          <div className="mb-4 p-4 bg-white text-black border border-white shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[10px] uppercase font-bold flex items-center gap-1"><Film size={10} /> MP4 Settings</h2>
              <button onClick={() => setIsVideoMenuOpen(false)}><X size={12} strokeWidth={3} /></button>
            </div>
            <p className="text-[8px] uppercase mb-3 opacity-60">ProRes Style High-Bitrate MP4</p>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-1">
                {FORMATS.map(f => (
                  <button key={f.id} onClick={() => onUpdateExportConfig({ format: f.id })} className={`flex flex-col items-center justify-center p-2 border transition-all ${exportConfig.format === f.id ? 'bg-black text-white' : 'border-black/20 hover:bg-black/5'}`}>
                    <f.icon size={14} className="mb-1" />
                    <span className="text-[8px] uppercase font-bold">{f.label}</span>
                  </button>
                ))}
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-bold uppercase flex items-center gap-1 opacity-60">
                  <Clock size={8} /> Duration
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {DURATIONS.map(d => (
                    <button key={d} onClick={() => onUpdateExportConfig({ duration: d })} className={`p-1.5 border text-[10px] font-bold transition-all ${exportConfig.duration === d ? 'bg-black text-white' : 'border-black/20 hover:bg-black/5'}`}>
                      {d}s
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1">
                {MULTIPLIERS.map(m => (
                  <button key={m} onClick={() => onUpdateExportConfig({ multiplier: m })} className={`p-1.5 border text-[10px] font-bold transition-all ${exportConfig.multiplier === m ? 'bg-black text-white' : 'border-black/20 hover:bg-black/5'}`}>
                    {m}X
                  </button>
                ))}
              </div>
              
              <button onClick={() => { onExportMP4(); setIsVideoMenuOpen(false); }} className="w-full p-3 bg-black text-white text-[10px] font-bold uppercase active:scale-95 transition-all">
                RECORD MP4
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={() => { setIsImageMenuOpen(!isImageMenuOpen); setIsVideoMenuOpen(false); }}
            className={`p-2 border text-[10px] uppercase flex flex-col items-center justify-center gap-1 transition-colors ${isImageMenuOpen ? 'bg-white text-black border-white' : 'border-white/20 hover:bg-white hover:text-black'}`}
          >
            <Download size={12} /> PNG
          </button>
          
          <button 
            disabled={!config.isAnimated}
            onClick={() => { setIsVideoMenuOpen(!isVideoMenuOpen); setIsImageMenuOpen(false); }}
            className={`p-2 border text-[10px] uppercase flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-20 disabled:pointer-events-none ${isVideoMenuOpen ? 'bg-white text-black border-white' : 'border-white/20 hover:bg-white hover:text-black'}`}
          >
            <Film size={12} /> MP4
          </button>

          <button onClick={onShowCode} className="p-2 border border-white/20 text-[10px] uppercase flex flex-col items-center justify-center gap-1 hover:bg-white hover:text-black transition-colors">
            <Code2 size={12} /> CODE
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
