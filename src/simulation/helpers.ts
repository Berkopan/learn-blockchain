import { bi, type Frame, type Localized, type Params, type Position, type Status, type VisualLink, type VisualNode } from '../types';

export const num = (p: Params, key: string, fallback = 0): number => Number.isFinite(Number(p[key])) ? Number(p[key]) : fallback;
export const bool = (p: Params, key: string): boolean => p[key] === true;
export const str = (p: Params, key: string, fallback = ''): string => p[key] === undefined ? fallback : String(p[key]);
export const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
/** Small deterministic placement hash; deliberately not a cryptographic hash. */
export function hash32(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) { h ^= value.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export const ringPosition = (index: number, count: number, radius = 3.7, y = 0): Position => [Math.cos(index / count * Math.PI * 2 - Math.PI / 2) * radius, y, Math.sin(index / count * Math.PI * 2 - Math.PI / 2) * radius];
export const ringNodes = (count: number, radius = 3.7): VisualNode[] => Array.from({ length: count }, (_, i) => ({ id: `n${i}`, label: String.fromCharCode(65 + i), position: ringPosition(i, count, radius), kind: 'node', status: 'idle' }));
export const lineNodes = (count: number, prefix = 'b', z = 0, spacing = 1.8): VisualNode[] => Array.from({ length: count }, (_, i) => ({ id: `${prefix}${i}`, label: `${i}`, position: [(i - (count - 1) / 2) * spacing, 0, z], kind: 'block', status: 'idle' }));
export const connect = (from: string, to: string, status: Status = 'active', label?: string): VisualLink => ({ from, to, status, label, directed: true });
export const chainLinks = (nodes: VisualNode[], status: Status = 'idle'): VisualLink[] => nodes.slice(1).map((n, i) => connect(nodes[i].id, n.id, status));
export function frame(title: Localized, description: Localized, nodes: VisualNode[], links: VisualLink[] = [], extra: Partial<Frame> = {}): Frame {
  return structuredClone({ title, description, nodes, links, ...extra });
}
export const metric = (en: string, tr: string, value: string | number, status?: Status) => ({ label: bi(en, tr), value, status });
