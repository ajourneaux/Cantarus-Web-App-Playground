
import { GradientPoint, GlobalConfig } from '../types';

export const ALLOWED_COLORS = ['#0220E7', '#FFA49B'];

export const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const DEFAULT_POINTS: GradientPoint[] = [
  { id: '1', position: [0.15, 0.25], color: '#0220E7', radius: 1.1, intensity: 1.0 },
  { id: '2', position: [0.85, 0.75], color: '#FFA49B', radius: 1.1, intensity: 1.0 },
  { id: '3', position: [0.5, 0.5], color: '#0220E7', radius: 0.6, intensity: 0.7 },
];

export const DEFAULT_CONFIG: GlobalConfig = {
  backgroundColor: '#171717',
  noiseStrength: 0.22,
  animationSpeed: 0.4,
  warp: 0.35,
  warpSize: 0.45,
  warpShape: 0,
  isAnimated: true,
  isDrifting: true,
};
