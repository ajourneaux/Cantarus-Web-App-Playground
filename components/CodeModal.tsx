
import React, { useState } from 'react';
import { X, Copy, Check, Layout, Palette, Zap, Code2 } from 'lucide-react';
import { GlobalConfig, GradientPoint } from '../types';

interface CodeModalProps {
  config: GlobalConfig;
  points: GradientPoint[];
  onClose: () => void;
}

const CodeModal: React.FC<CodeModalProps> = ({ config, points, onClose }) => {
  const [activeTab, setActiveTab] = useState<'HTML' | 'CSS' | 'JS'>('HTML');
  const [copied, setCopied] = useState(false);

  // Shader Logic
  const vertexShader = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

  const fragmentShader = `varying vec2 vUv;
uniform float uTime;
uniform float uNoiseStrength;
uniform float uWarp;
uniform float uWarpSize;
uniform int uWarpShape;
uniform vec3 uBackgroundColor;
uniform vec2 uPointPos[6];
uniform vec3 uPointColor[6];
uniform float uPointRadius[6];
uniform float uPointIntensity[6];
uniform int uNumPoints;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n = i.x + i.y * 57.0;
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  mat2 m = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p); p = m * p * 2.02; a *= 0.5;
  }
  return v;
}

vec2 getDistortion(vec2 p, int shape, float size) {
  float t = uTime * 0.5;
  if (shape == 0) {
    vec2 q = vec2(fbm(p * size + t), fbm(p * size + 1.0 + t));
    return vec2(fbm(p * size + q + 0.17 * t), fbm(p * size + q + 0.12 * t));
  }
  return vec2(0.0);
}

void main() {
  vec2 uv = vUv;
  vec3 finalColor = uBackgroundColor;
  for(int i = 0; i < 6; i++) {
    if (i >= uNumPoints) break;
    vec2 pos = uPointPos[i];
    vec2 warpedUv = uv + getDistortion(uv, uWarpShape, uWarpSize) * uWarp;
    float influence = 1.0 - smoothstep(0.0, uPointRadius[i], distance(warpedUv, pos));
    finalColor = mix(finalColor, uPointColor[i], pow(influence, 3.0) * uPointIntensity[i]);
  }
  gl_FragColor = vec4(finalColor + (hash(uv + uTime) - 0.5) * uNoiseStrength, 1.0);
}`;

  // Tab Contents
  const htmlCode = `<!-- Cantarus Mesh Gradient Container -->
<div id="mesh-canvas-container">
  <!-- The WebGL canvas will be injected here -->
</div>

<!-- Fallback for no-js or loading states -->
<noscript>
  <style>
    #mesh-canvas-container { 
      background: ${config.backgroundColor}; 
    }
  </style>
</noscript>`;

  const cssCode = `/* Industrial Mesh Styles */
#mesh-canvas-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  background-color: ${config.backgroundColor};
  /* CSS Radial Fallback (Approximate) */
  background-image: ${points.map(p => `radial-gradient(at ${(p.position[0]*100).toFixed(0)}% ${(p.position[1]*100).toFixed(0)}%, ${p.color} 0%, transparent 70%)`).join(', ')};
  background-blend-mode: screen;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}`;

  const jsCode = `import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const CONFIG = ${JSON.stringify(config, null, 2)};
const POINTS = ${JSON.stringify(points, null, 2)};

const setupMesh = () => {
  const container = document.getElementById('mesh-canvas-container');
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uNoiseStrength: { value: CONFIG.noiseStrength },
      uWarp: { value: CONFIG.warp },
      uWarpSize: { value: CONFIG.warpSize },
      uWarpShape: { value: CONFIG.warpShape },
      uBackgroundColor: { value: new THREE.Color(CONFIG.backgroundColor) },
      uNumPoints: { value: POINTS.length },
      uPointPos: { value: POINTS.map(p => new THREE.Vector2(p.position[0], p.position[1])) },
      uPointColor: { value: POINTS.map(p => new THREE.Color(p.color)) },
      uPointRadius: { value: new Float32Array(POINTS.map(p => p.radius)) },
      uPointIntensity: { value: new Float32Array(POINTS.map(p => p.intensity)) },
    },
    vertexShader: \`${vertexShader}\`,
    fragmentShader: \`${fragmentShader}\`
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  const animate = (t) => {
    material.uniforms.uTime.value = t * 0.001 * CONFIG.animationSpeed;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
};

setupMesh();`;

  const getCode = () => {
    switch (activeTab) {
      case 'CSS': return cssCode;
      case 'JS': return jsCode;
      default: return htmlCode;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#0A0A0A] border border-white/20 flex flex-col shadow-[0_0_50px_rgba(255,255,255,0.05)]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code2 size={18} className="text-white/60" />
            <h2 className="text-xs font-bold uppercase tracking-widest">Cantarus Engine Manifest</h2>
          </div>
          <button onClick={onClose} className="hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-white/5">
          {[
            { id: 'HTML', label: 'Index.html', icon: Layout },
            { id: 'CSS', label: 'Style.css', icon: Palette },
            { id: 'JS', label: 'App.js', icon: Zap }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 p-3 text-[10px] uppercase font-bold tracking-tighter flex items-center justify-center gap-2 border-r border-white/10 transition-colors ${activeTab === tab.id ? 'bg-white text-black' : 'hover:bg-white/10 text-white/60'}`}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto bg-black p-4 relative group">
          <button 
            onClick={handleCopy}
            className="absolute right-6 top-6 p-2 bg-white/10 hover:bg-white hover:text-black border border-white/20 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2 text-[10px] uppercase font-bold z-10"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy Block'}
          </button>
          <pre className="text-[11px] leading-relaxed font-mono text-white/80 whitespace-pre-wrap">
            {getCode()}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex justify-between items-center text-[9px] uppercase tracking-wider text-white/40">
          <div className="flex gap-4">
            <span>Dependency: Three.js (ESM)</span>
            <span>Target: Modern Browser</span>
          </div>
          <span className="hidden md:inline">Standalone implementation provided</span>
        </div>
      </div>
    </div>
  );
};

export default CodeModal;
