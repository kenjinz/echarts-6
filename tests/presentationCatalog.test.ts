import { expect, it } from 'vitest';
import { EXAMPLES, getExample } from '../src/app/experimentRegistry';
import { CHAPTERS, LESSONS, APPENDIX } from '../src/presentation/catalog';

it('covers every engineering case exactly once across lessons and appendix', () => {
  expect(CHAPTERS).toHaveLength(6);
  expect(LESSONS.map(l => l.id)).toEqual(
    Array.from({ length: 20 }, (_, i) => `D${String(i + 1).padStart(2, '0')}`).filter(id => id !== 'D10')
  );
  const guided = LESSONS.flatMap(l => l.variants.map(v => v.exampleId));
  expect(guided).toHaveLength(54);
  expect(APPENDIX).toHaveLength(8);
  const all = [...guided, ...APPENDIX.map(a => a.exampleId)];
  expect(new Set(all).size).toBe(62);
  expect([...all].sort()).toEqual(EXAMPLES.map(e => e.id).sort());
});

it('has actionable guidance and only declares source-supported sharing controls', () => {
  for (const lesson of LESSONS) {
    expect(CHAPTERS.some(c => c.id === lesson.chapterId)).toBe(true);
    expect(lesson.question.trim().endsWith('?')).toBe(true);
    for (const variant of lesson.variants) {
      const source = getExample(variant.exampleId);
      expect(variant.steps.length).toBeGreaterThanOrEqual(2);
      expect(variant.steps.length).toBeLessThanOrEqual(3);
      for (const text of [variant.label, variant.expected, variant.limitation, ...variant.steps]) {
        expect(text.trim().length).toBeGreaterThan(8);
      }
      for (const element of variant.controls.sharing) {
        expect(source.sharing.some(c => c.element === element)).toBe(true);
      }
      expect(new Set(variant.controls.sharing).size).toBe(variant.controls.sharing.length);
    }
  }
});
