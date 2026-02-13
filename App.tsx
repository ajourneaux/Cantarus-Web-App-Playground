
import React, { useState, useCallback, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import GrainyMesh from './components/GrainyMesh';
import Sidebar from './components/Sidebar';
import { GradientPoint, GlobalConfig, ExportConfig } from './types';
import { generateId, DEFAULT_POINTS, DEFAULT_CONFIG, ALLOWED_COLORS, hexToRgb } from './utils/color';

const ExportHelper = ({ onExportReady }: { onExportReady: (gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) => void }) => {
  const { gl, scene, camera } = useThree();
  const hasCalled = useRef(false);
  
  if (!hasCalled.current) {
    onExportReady(gl, scene, camera);
    hasCalled.current = true;
  }
  return null;
};

const App: React.FC = () => {
  const [points, setPoints] = useState<GradientPoint[]>(DEFAULT_POINTS);
  const [isExporting, setIsExporting] = useState(false);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'LANDSCAPE',
    multiplier: 1
  });
  
  const [config, setConfig] = useState<GlobalConfig>(DEFAULT_CONFIG);

  const threeRef = useRef<{ gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera } | null>(null);
  const MAX_POINTS = 5;

  const handleUpdatePoint = useCallback((id: string, updates: Partial<GradientPoint>) => {
    setPoints(prev => prev.map((p) => {
      if (p.id === id) {
        return { ...p, ...updates };
      }
      return p;
    }));
  }, []);

  const handleAddPoint = useCallback(() => {
    if (points.length >= MAX_POINTS) return;
    const randomColor = ALLOWED_COLORS[Math.floor(Math.random() * ALLOWED_COLORS.length)];
    const newPoint: GradientPoint = {
      id: generateId(),
      position: [0.5, 0.5],
      color: randomColor,
      radius: 0.8,
      intensity: 0.8,
    };
    setPoints(prev => [...prev, newPoint]);
  }, [points.length]);

  const handleRemovePoint = useCallback((id: string) => {
    setPoints(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(p => p.id !== id);
    });
  }, []);

  const handleUpdateConfig = useCallback((updates: Partial<GlobalConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const handleExportPNG = useCallback(() => {
    if (!threeRef.current) return;
    const { gl, scene, camera } = threeRef.current;
    setIsExporting(true);
    
    let baseWidth = 1920;
    let baseHeight = 1080;
    if (exportConfig.format === 'SQUARE') { baseWidth = 1080; baseHeight = 1080; }
    else if (exportConfig.format === 'PORTRAIT') { baseWidth = 1080; baseHeight = 1920; }
    
    const finalWidth = baseWidth * exportConfig.multiplier;
    const finalHeight = baseHeight * exportConfig.multiplier;

    setTimeout(() => {
      const originalSize = new THREE.Vector2();
      gl.getSize(originalSize);
      gl.setSize(finalWidth, finalHeight, false);
      gl.render(scene, camera);
      
      const dataUrl = gl.domElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `cantarus-mesh-${exportConfig.format.toLowerCase()}-${exportConfig.multiplier}x-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      gl.setSize(originalSize.x, originalSize.y, false);
      setIsExporting(false);
    }, 100);
  }, [exportConfig]);

  const handleExportLottie = useCallback(() => {
    const W = 1920;
    const H = 1080;
    const FPS = 30;
    const DURATION_SEC = 10;
    const TOTAL_FRAMES = FPS * DURATION_SEC;

    const bgRgb = hexToRgb(config.backgroundColor);

    const lottie = {
      v: "5.7.1",
      fr: FPS,
      ip: 0,
      op: TOTAL_FRAMES,
      w: W,
      h: H,
      nm: "Cantarus Mesh Export",
      ddd: 0,
      assets: [],
      layers: [] as any[]
    };

    lottie.layers.push({
      ddd: 0,
      ind: 1,
      ty: 1,
      nm: "Background",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [W / 2, H / 2, 0] },
        a: { a: 0, k: [W / 2, H / 2, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      sw: W,
      sh: H,
      sc: config.backgroundColor,
      ip: 0,
      op: TOTAL_FRAMES,
      st: 0
    });

    points.forEach((p, idx) => {
      const pRgb = hexToRgb(p.color);
      const kf = [];
      
      for (let i = 0; i <= TOTAL_FRAMES; i++) {
        const t = (i / FPS) * config.animationSpeed * 0.5;
        let x = p.position[0];
        let y = p.position[1];

        if (config.isDrifting) {
          x += Math.sin(t * (idx + 1) * 0.5) * 0.05;
          y += (Math.cos(t * (idx + 1) * 0.7) - 1.0) * 0.05;
        }

        kf.push({
          t: i,
          s: [x * W, (1 - y) * H, 0],
          i: { x: 0.833, y: 0.833 },
          o: { x: 0.167, y: 0.167 }
        });
      }

      lottie.layers.push({
        ddd: 0,
        ind: idx + 2,
        ty: 4,
        nm: `Point ${idx + 1}`,
        sr: 1,
        ks: {
          o: { a: 0, k: p.intensity * 100 },
          r: { a: 0, k: 0 },
          p: { a: 1, k: kf },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] }
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                d: 1,
                ty: "el",
                s: { a: 0, k: [W * p.radius * 2, W * p.radius * 2] },
                p: { a: 0, k: [0, 0] },
                nm: "Ellipse Path"
              },
              {
                ty: "gf",
                o: { a: 0, k: 100 },
                r: 1,
                g: {
                  p: 2,
                  k: {
                    a: 0,
                    k: [0, pRgb[0], pRgb[1], pRgb[2], 1, pRgb[0], pRgb[1], pRgb[2]]
                  }
                },
                s: { a: 0, k: [0, 0] },
                e: { a: 0, k: [W * p.radius, 0] },
                t: 2,
                nm: "Gradient Fill"
              }
            ]
          }
        ],
        ip: 0,
        op: TOTAL_FRAMES,
        st: 0
      });
    });

    const data = JSON.stringify(lottie, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `cantarus-lottie-${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [points, config]);

  const handleCopyCSS = useCallback(() => {
    const gradients = points.map(p => {
      const x = (p.position[0] * 100).toFixed(1);
      const y = (p.position[1] * 100).toFixed(1);
      return `radial-gradient(at ${x}% ${y}%, ${p.color} 0px, transparent 50%)`;
    }).join(', ');
    const css = `background-color: ${config.backgroundColor};\nbackground-image: ${gradients};`;
    navigator.clipboard.writeText(css);
    alert('CSS Fallback copied to clipboard!');
  }, [points, config.backgroundColor]);

  const handleGeneratePalette = async () => {
    const numToGenerate = 2 + Math.floor(Math.random() * (MAX_POINTS - 1));
    const newPoints: GradientPoint[] = [];
    for (let i = 0; i < numToGenerate; i++) {
      const color = ALLOWED_COLORS[Math.floor(Math.random() * ALLOWED_COLORS.length)];
      newPoints.push({
        id: generateId(),
        position: [Math.random(), Math.random()],
        color: color,
        radius: 0.4 + Math.random() * 0.8,
        intensity: 0.6 + Math.random() * 0.4,
      });
    }
    setPoints(newPoints);
  };

  return (
    <main className="w-full h-auto min-h-screen bg-[#050505] relative overflow-x-hidden md:overflow-hidden flex flex-col md:block">
      <div className="relative h-[80vh] md:h-screen w-full md:fixed md:inset-0 md:z-0 shrink-0">
        <Canvas
          gl={{ 
            preserveDrawingBuffer: true,
            antialias: true,
            alpha: true 
          }}
          camera={{ position: [0, 0, 1], fov: 75 }}
          style={{ width: '100%', height: '100%' }}
        >
          <ExportHelper onExportReady={(gl, scene, camera) => {
            threeRef.current = { gl, scene, camera };
          }} />
          <GrainyMesh 
            points={points} 
            config={config} 
            isExporting={isExporting}
            onUpdatePoint={handleUpdatePoint} 
          />
        </Canvas>
      </div>

      <div className="relative z-10 md:static shrink-0">
        <Sidebar 
          points={points}
          config={config}
          exportConfig={exportConfig}
          onUpdatePoint={handleUpdatePoint}
          onAddPoint={handleAddPoint}
          onRemovePoint={handleRemovePoint}
          onUpdateConfig={handleUpdateConfig}
          onUpdateExportConfig={(updates) => setExportConfig(prev => ({ ...prev, ...updates }))}
          onExportPNG={handleExportPNG}
          onExportJSON={handleExportLottie}
          onCopyCSS={handleCopyCSS}
          onGeneratePalette={handleGeneratePalette}
        />
      </div>
    </main>
  );
};

export default App;
