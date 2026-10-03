import { EXAMPLES } from '../app/experimentRegistry';
import { CHAPTERS, LESSONS } from './catalog';
import type { Lesson, PresentationMode, Resolution, Selection } from './types';

function defaultGuided(): Selection {
  return { mode: 'guided', lessonId: LESSONS[0].id, exampleId: LESSONS[0].variants[0].exampleId };
}
export function resolveLocation(search: string): Resolution {
  const params = new URLSearchParams(search);
  const requested = params.get('example');
  if (params.has('lesson')) {
    const lesson = LESSONS.find(l => l.id === params.get('lesson'));
    if (!lesson) return { selection: defaultGuided(), notice: 'Unknown lesson. Opened the first lesson.' };
    const matched = lesson.variants.find(v => v.exampleId === requested);
    return {
      selection: { mode: 'guided', lessonId: lesson.id, exampleId: (matched ?? lesson.variants[0]).exampleId },
      ...(requested !== null && !matched ? { notice: 'That example is not a variant of this lesson. Opened its first variant.' } : {})
    };
  }
  if (params.has('example') || params.get('mode') === 'engineering') {
    const valid = EXAMPLES.some(e => e.id === requested);
    return {
      selection: { mode: 'engineering', exampleId: valid ? requested! : 'M01' },
      ...(requested !== null && !valid ? { notice: 'Unknown example. Opened M01.' } : {})
    };
  }
  return { selection: defaultGuided() };
}
export function selectionSearch(selection: Selection): string {
  const params = new URLSearchParams();
  if (selection.mode === 'guided') params.set('lesson', selection.lessonId);
  params.set('example', selection.exampleId);
  return `?${params}`;
}
export function findLessonForExample(exampleId: string): Lesson | undefined {
  return LESSONS.find(l => l.variants.some(v => v.exampleId === exampleId));
}
export function filterLessons(query: string): readonly Lesson[] {
  const text = query.trim().toLowerCase();
  return LESSONS.filter(l => [l.id, l.title, l.question,
    CHAPTERS.find(c => c.id === l.chapterId)?.title ?? '',
    ...l.variants.flatMap(v => [v.exampleId, v.label])].join(' ').toLowerCase().includes(text));
}
export function adjacentLesson(lessonId: string, delta: -1 | 1): Lesson | undefined {
  const index = LESSONS.findIndex(l => l.id === lessonId);
  return index < 0 ? undefined : LESSONS[index + delta];
}
export function switchMode(selection: Selection, mode: PresentationMode): Resolution {
  if (mode === selection.mode) return { selection };
  if (mode === 'engineering') return { selection: { mode, exampleId: selection.exampleId } };
  const lesson = findLessonForExample(selection.exampleId);
  return lesson
    ? { selection: { mode, lessonId: lesson.id, exampleId: selection.exampleId } }
    : { selection: defaultGuided(), notice: 'This appendix case has no guided lesson. Reset to the first lesson.' };
}
export function selectionForImport(selection: Selection, exampleId: string): Selection {
  const lesson = selection.mode === 'guided' ? LESSONS.find(l => l.id === selection.lessonId) : undefined;
  return lesson?.variants.some(v => v.exampleId === exampleId)
    ? { mode: 'guided', lessonId: lesson.id, exampleId }
    : { mode: 'engineering', exampleId };
}
