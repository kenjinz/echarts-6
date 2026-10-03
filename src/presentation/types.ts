import type { SharingElement } from '../core/types';
export type PresentationMode = 'guided' | 'engineering';
export type CommonControl = 'rows' | 'columns' | 'renderer' | 'seed' |
  'conflictPolicy' | 'viewMode' | 'instanceModel';
export type PanelAction = 'add-row' | 'remove-row' | 'add-column' | 'remove-column' |
  'regenerate' | 'enlarge' | 'restore' | 'remove-all' | 'restore-default';
export type UtilityPanel = 'state' | 'exports' | 'metrics' | 'measurement' | 'events';
export interface ControlPolicy {
  common: readonly CommonControl[];
  sharing: readonly SharingElement[];
  actions: readonly PanelAction[];
  utilities: readonly UtilityPanel[];
}
export interface Variant {
  exampleId: string;
  label: string;
  steps: readonly [string, string] | readonly [string, string, string];
  expected: string;
  limitation: string;
  controls: ControlPolicy;
}
export interface Chapter { id: string; title: string; }
export interface Lesson {
  id: string;
  chapterId: string;
  title: string;
  question: string;
  variants: readonly Variant[];
}
export interface AppendixEntry { exampleId: string; reason: string; }
export type Selection =
  | { mode: 'guided'; lessonId: string; exampleId: string }
  | { mode: 'engineering'; exampleId: string };
export interface Resolution { selection: Selection; notice?: string; }
