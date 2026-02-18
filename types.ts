
export interface GradientPoint {
  id: string;
  position: [number, number]; // 0 to 1
  color: string;
  radius: number;
  intensity: number;
}

export interface GlobalConfig {
  backgroundColor: string;
  noiseStrength: number;
  animationSpeed: number;
  warp: number; // Global mesh distortion amount
  warpSize: number; // Scale of the warp noise
  warpShape: number; // Type of distortion pattern
  isAnimated: boolean;
  isDrifting: boolean;
}

export type ExportFormat = 'LANDSCAPE' | 'SQUARE' | 'PORTRAIT';
export type ExportDuration = 5 | 10 | 15;

export interface ExportConfig {
  format: ExportFormat;
  duration?: ExportDuration;
}

export interface Uniforms {
  uTime: { value: number };
  uResolution: { value: any }; // THREE.Vector2
  uNoiseStrength: { value: number };
  uWarp: { value: number };
  uWarpSize: { value: number };
  uWarpShape: { value: number };
  uBackgroundColor: { value: any }; // THREE.Color
  uPointPos: { value: any[] }; // THREE.Vector2[]
  uPointColor: { value: any[] }; // THREE.Color[]
  uPointRadius: { value: Float32Array };
  uPointIntensity: { value: Float32Array };
  uNumPoints: { value: number };
}
