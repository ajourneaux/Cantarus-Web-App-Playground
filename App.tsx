
import React, { useState, useCallback, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import GrainyMesh from './components/GrainyMesh';
import Sidebar from './components/Sidebar';
import { GradientPoint, GlobalConfig, ExportConfig } from './types';
import { generateId, DEFAULT_POINTS, DEFAULT_CONFIG, ALLOWED_COLORS } from './utils/color';

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

  const handleExportJSON = useCallback(() => {
    const data = JSON.stringify({ points, config }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `mesh-config-${Date.now()}.json`;
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
    <main className="w-full min-h-screen bg-[#050505] relative overflow-x-hidden md:overflow-hidden flex flex-col md:block">
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

      <div className="relative z-10 md:static">
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
          onExportJSON={handleExportJSON}
          onCopyCSS={handleCopyCSS}
          onGeneratePalette={handleGeneratePalette}
        />
      </div>
    </main>
  );
};

export default App;
