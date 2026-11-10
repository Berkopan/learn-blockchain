export type Language = 'en' | 'tr';
export interface Localized { en: string; tr: string }
export const bi = (en: string, tr: string): Localized => ({ en, tr });

export type CategoryId = 'foundations' | 'consensus' | 'coordination' | 'time' | 'networking' | 'storage' | 'scaling' | 'cryptography';
export type Status = 'idle' | 'active' | 'success' | 'warning' | 'error' | 'muted';
export type NodeKind = 'node' | 'block' | 'data' | 'token' | 'gate' | 'clock';
export type Position = [number, number, number];

export interface VisualNode {
  id: string;
  label: string;
  position: Position;
  kind?: NodeKind;
  status?: Status;
  value?: string;
  detail?: Localized;
  scale?: number;
}
export interface VisualLink {
  from: string;
  to: string;
  label?: string;
  status?: Status;
  directed?: boolean;
}
export interface Metric { label: Localized; value: string | number; status?: Status }
export interface Frame {
  title: Localized;
  description: Localized;
  nodes: VisualNode[];
  links: VisualLink[];
  metrics?: Metric[];
  focus?: string[];
  note?: Localized;
}
export interface SimulationTrace { frames: Frame[]; outcome: Localized }
export type ParamValue = number | boolean | string;
export type Params = Record<string, ParamValue>;
interface BaseControl { id: string; label: Localized; description?: Localized }
export interface RangeControl extends BaseControl { kind: 'range'; min: number; max: number; step?: number; default: number; unit?: string }
export interface ToggleControl extends BaseControl { kind: 'toggle'; default: boolean }
export interface SelectControl extends BaseControl { kind: 'select'; options: { value: string; label: Localized }[]; default: string }
export interface TextControl extends BaseControl { kind: 'text'; default: string; maxLength?: number }
export type Control = RangeControl | ToggleControl | SelectControl | TextControl;
export interface Source { title: string; url: string; year?: number }
export interface Challenge { question: Localized; options: Localized[]; correct: number; explanation: Localized }
export interface Lesson {
  id: string;
  title: Localized;
  hook: Localized;
  category: CategoryId;
  kind: 'algorithm' | 'protocol' | 'concept' | 'data-structure';
  level: 1 | 2 | 3;
  minutes: number;
  tags: string[];
  controls: Control[];
  takeaway: Localized;
  model: Localized;
  challenge: Challenge;
  sources: Source[];
  related: string[];
}
export type Simulator = (id: string, params: Params) => SimulationTrace | undefined;
export const defaultsFor = (lesson: Lesson): Params => Object.fromEntries(lesson.controls.map(c => [c.id, c.default]));
