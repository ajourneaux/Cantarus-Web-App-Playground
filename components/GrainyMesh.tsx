
import React, { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { GradientPoint, GlobalConfig } from '../types';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
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
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n = i.x + i.y * 57.0;
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = m * p * 2.02;
      a *= 0.5;
    }
    return v;
  }

  vec2 getDistortion(vec2 p, int shape, float size) {
    float t = uTime * 0.15;
    if (shape == 0) {
      vec2 q = vec2(fbm(p * size + t), fbm(p * size + 1.0 + t));
      vec2 r = vec2(fbm(p * size + 1.0 * q + 0.17 * t), fbm(p * size + 1.0 * q + 0.12 * t));
      return vec2(fbm(p * size + r), fbm(p * size + r + 1.5));
    }
    if (shape == 1) {
      float f = fbm(p * size + t);
      float angle = f * 12.56;
      return vec2(cos(angle), sin(angle)) * f;
    }
    if (shape == 2) {
      float bands = max(1.0, floor(size * 4.0));
      float iy = floor(p.y * bands);
      float offset = fbm(vec2(iy * 1.5, t)) * 2.0 - 1.0;
      float jitter = noise(vec2(p.x * 10.0, iy)) * 0.05;
      return vec2(offset + jitter, 0.0);
    }
    if (shape == 3) {
      float bands = max(1.0, floor(size * 4.0));
      float ix = floor(p.x * bands);
      float offset = fbm(vec2(ix * 1.5, t)) * 2.0 - 1.0;
      float jitter = noise(vec2(ix, p.y * 10.0)) * 0.05;
      return vec2(0.0, offset + jitter);
    }
    return vec2(0.0);
  }

  void main() {
    vec2 uv = vUv;
    vec3 finalColor = uBackgroundColor;
    
    for(int i = 0; i < 6; i++) {
      if (i >= uNumPoints) break;
      vec2 pos = uPointPos[i];
      vec3 color = uPointColor[i];
      float radius = uPointRadius[i];
      float intensity = uPointIntensity[i];
      vec2 warpedUv = uv;
      if (uWarp > 0.001) {
        vec2 distortion = getDistortion(uv, uWarpShape, uWarpSize);
        float power = uWarpShape >= 2 ? uWarp * 2.5 : uWarp * 1.5;
        warpedUv += (distortion) * power * radius;
      }
      float dist = distance(warpedUv, pos);
      float influence = 1.0 - smoothstep(0.0, radius, dist);
      influence = pow(influence, 3.0) * intensity;
      finalColor = 1.0 - (1.0 - finalColor) * (1.0 - color * influence);
    }
    float staticGrain = hash(uv);
    float animatedGrain = hash(uv + fract(uTime * 1.37));
    float grain = mix(staticGrain, animatedGrain, 0.5) * uNoiseStrength;
    finalColor += (grain - 0.5 * uNoiseStrength);
    finalColor = clamp(finalColor, 0.0, 1.0);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

interface PointHandleProps {
  point: GradientPoint;
  index: number;
  hovered: boolean;
  active: boolean;
  config: GlobalConfig;
  viewport: { width: number; height: number };
  onPointerOver: () => void;
  onPointerOut: () => void;
  onPointerDown: (e: any) => void;
}

const PointHandle: React.FC<PointHandleProps> = ({ 
  point, index, hovered, active, config, viewport, onPointerOver, onPointerOut, onPointerDown 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const baseSize = 0.065;
  const scaleX = baseSize / viewport.width;
  const scaleY = baseSize / viewport.height;

  useFrame((state) => {
    if (!groupRef.current) return;
    
    let x = point.position[0];
    let y = point.position[1];
    
    if (config.isDrifting && !active && config.animationSpeed > 0) {
      const t = state.clock.getElapsedTime() * config.animationSpeed;
      x += Math.sin(t * (index + 1) * 0.5) * 0.05;
      y += (Math.cos(t * (index + 1) * 0.7) - 1.0) * 0.05;
    }

    groupRef.current.position.set(x - 0.5, y - 0.5, 0.1);
  });

  return (
    <group 
      ref={groupRef}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onPointerDown={onPointerDown}
    >
      <mesh scale={[scaleX, scaleY, 1]}>
        <planeGeometry />
        <meshBasicMaterial 
          color="white" 
          transparent 
          opacity={hovered || active ? 0.9 : 0.4}
          wireframe
        />
      </mesh>
      <mesh scale={[scaleX * 0.9, scaleY * 0.9, 1]}>
        <planeGeometry />
        <meshBasicMaterial 
          color="black" 
          transparent 
          opacity={hovered || active ? 0.5 : 0.2}
        />
      </mesh>
      <Text
        position={[0, -scaleY * 0.8, 0]}
        fontSize={scaleY * 0.5}
        color="white"
        anchorX="center"
        anchorY="top"
        opacity={hovered || active ? 1 : 0.5}
      >
        {`P${index + 1}`}
      </Text>
    </group>
  );
};

interface GrainyMeshProps {
  points: GradientPoint[];
  config: GlobalConfig;
  isExporting: boolean;
  onUpdatePoint: (id: string, updates: Partial<GradientPoint>) => void;
}

const GrainyMesh: React.FC<GrainyMeshProps> = ({ points, config, isExporting, onUpdatePoint }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size, viewport } = useThree();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveringId, setHoveringId] = useState<string | null>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uNoiseStrength: { value: config.noiseStrength },
    uWarp: { value: config.warp },
    uWarpSize: { value: config.warpSize },
    uWarpShape: { value: config.warpShape },
    uBackgroundColor: { value: new THREE.Color(config.backgroundColor) },
    uPointPos: { value: Array(6).fill(0).map(() => new THREE.Vector2()) },
    uPointColor: { value: Array(6).fill(0).map(() => new THREE.Color()) },
    uPointRadius: { value: new Float32Array(6) },
    uPointIntensity: { value: new Float32Array(6) },
    uNumPoints: { value: points.length }
  }), []);

  useFrame((state) => {
    if (!materialRef.current) return;
    if (config.isAnimated) materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();

    materialRef.current.uniforms.uNoiseStrength.value = config.noiseStrength;
    materialRef.current.uniforms.uWarp.value = config.warp;
    materialRef.current.uniforms.uWarpSize.value = config.warpSize;
    materialRef.current.uniforms.uWarpShape.value = config.warpShape;
    materialRef.current.uniforms.uBackgroundColor.value.set(config.backgroundColor);
    materialRef.current.uniforms.uNumPoints.value = points.length;

    points.forEach((p, i) => {
      if (i < 6) {
        let x = p.position[0];
        let y = p.position[1];
        if (config.isDrifting && draggingId !== p.id && config.animationSpeed > 0) {
          const t = state.clock.getElapsedTime() * config.animationSpeed;
          x += Math.sin(t * (i + 1) * 0.5) * 0.05;
          y += (Math.cos(t * (i + 1) * 0.7) - 1.0) * 0.05;
        }
        materialRef.current!.uniforms.uPointPos.value[i].set(x, y);
        materialRef.current!.uniforms.uPointColor.value[i].set(new THREE.Color(p.color));
        materialRef.current!.uniforms.uPointRadius.value[i] = p.radius;
        materialRef.current!.uniforms.uPointIntensity.value[i] = p.intensity;
      }
    });
  });

  return (
    <group
      onPointerMove={(e) => {
        if (draggingId && e.uv) onUpdatePoint(draggingId, { position: [e.uv.x, e.uv.y] });
      }}
      onPointerUp={() => setDraggingId(null)}
    >
      <mesh scale={[viewport.width, viewport.height, 1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
        />
      </mesh>

      {!isExporting && (
        <group scale={[viewport.width, viewport.height, 1]}>
          {points.map((p, i) => (
            <PointHandle 
              key={p.id}
              point={p} 
              index={i} 
              hovered={hoveringId === p.id}
              active={draggingId === p.id}
              config={config}
              viewport={viewport}
              onPointerOver={() => setHoveringId(p.id)}
              onPointerOut={() => setHoveringId(null)}
              onPointerDown={(e) => {
                e.stopPropagation();
                setDraggingId(p.id);
              }}
            />
          ))}
        </group>
      )}
    </group>
  );
};

export default GrainyMesh;
