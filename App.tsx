
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import GrainyMesh from './components/GrainyMesh';
import Sidebar from './components/Sidebar';
import CodeModal from './components/CodeModal';
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
  const [exportProgress, setExportProgress] = useState(0);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'LANDSCAPE',
    multiplier: 1,
    duration: 5
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
    }, 150);
  }, [exportConfig]);

  const handleExportMP4 = useCallback(() => {
    if (!threeRef.current) return;
    const { gl, scene, camera } = threeRef.current;
    
    setIsExporting(true);
    setExportProgress(0.1);

    let baseWidth = 1920;
    let baseHeight = 1080;
    if (exportConfig.format === 'SQUARE') { baseWidth = 1080; baseHeight = 1080; }
    else if (exportConfig.format === 'PORTRAIT') { baseWidth = 1080; baseHeight = 1920; }
    
    const finalWidth = baseWidth * exportConfig.multiplier;
    const finalHeight = baseHeight * exportConfig.multiplier;
    
    const originalSize = new THREE.Vector2();
    gl.getSize(originalSize);
    const originalPixelRatio = gl.getPixelRatio();

    // Reset renderer for capture
    gl.setPixelRatio(1);
    gl.setSize(finalWidth, finalHeight, false);
    
    // Select the most compatible High Quality MIME type
    // We prioritize actual MP4 support if the browser allows it, 
    // otherwise fallback to WebM with H264 which is widely playable.
    const mimeTypes = [
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=h264',
      'video/webm;codecs=vp9',
      'video/webm'
    ];
    
    const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';
    const extension = supportedMimeType.includes('mp4') ? 'mp4' : 'webm';
    
    // 20Mbps is a safe sweet spot for high-quality grain without overwhelming the encoder
    const bitRate = 20000000 * exportConfig.multiplier;
    
    const stream = gl.domElement.captureStream(30);
    const recorder = new MediaRecorder(stream, {
      mimeType: supportedMimeType,
      videoBitsPerSecond: bitRate
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: supportedMimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Use correct extension to ensure players recognize the container
      link.download = `cantarus-motion-${exportConfig.format.toLowerCase()}-${exportConfig.multiplier}x-${Date.now()}.${extension}`;
      link.click();
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100);
      gl.setPixelRatio(originalPixelRatio);
      gl.setSize(originalSize.x, originalSize.y, false);
      setIsExporting(false);
      setExportProgress(0);
    };

    // Wait for canvas to settle at new resolution
    setTimeout(() => {
      recorder.start();
      const durationMs = (exportConfig.duration || 5) * 1000;
      const startTime = Date.now();

      const updateInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / durationMs) * 100, 100);
        setExportProgress(progress);
        
        if (elapsed >= durationMs) {
          clearInterval(updateInterval);
          recorder.stop();
        }
      }, 50);
    }, 500);

  }, [exportConfig]);

  const handleExportJSON = useCallback(() => {
    console.log("JSON export not active.");
  }, []);

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

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCodeModal(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

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

      {isExporting && exportProgress > 0 && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl text-white font-mono">
          <div className="w-80 border border-white/20 p-10 space-y-8 shadow-[0_0_100px_rgba(255,255,255,0.05)] bg-[#0A0A0A]">
            <div className="space-y-3">
              <h3 className="text-[9px] font-bold uppercase tracking-[0.5em] text-center text-white/40">Cantarus Rendering Engine</h3>
              <h4 className="text-sm font-bold uppercase tracking-widest text-center flex items-center justify-center gap-3">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                {exportProgress < 100 ? 'Recording Motion' : 'Saving File'}
              </h4>
            </div>
            
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold inline-block py-1 px-2 uppercase rounded-full text-black bg-white">
                    {exportProgress < 100 ? 'Live' : 'Done'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold inline-block text-white/60">
                    {exportProgress.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-1 text-xs flex bg-white/10">
                <div 
                  style={{ width: `${exportProgress}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-white transition-all duration-300"
                />
              </div>
            </div>
            
            <p className="text-[9px] uppercase tracking-tighter text-white/30 text-center">
              Encoding high-fidelity stream...
            </p>
          </div>
        </div>
      )}

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
          onExportMP4={handleExportMP4}
          onExportJSON={handleExportJSON}
          onShowCode={() => setShowCodeModal(true)}
          onGeneratePalette={handleGeneratePalette}
        />
      </div>

      {showCodeModal && (
        <CodeModal 
          config={config} 
          points={points} 
          onClose={() => setShowCodeModal(false)} 
        />
      )}
    </main>
  );
};

export default App;
