import { describe, expect, it } from 'vitest';

import { EXAMPLES, getExample } from '../src/app/experimentRegistry';

describe('experiment registry', () => {
  it('registers every required example ID exactly once', () => {
    const ids = EXAMPLES.map((example) => example.id);

    expect(ids).toHaveLength(66);
    expect(new Set(ids).size).toBe(66);
    expect(ids).toEqual([
      ...Array.from({ length: 10 }, (_, index) => `M${String(index + 1).padStart(2, '0')}`),
      ...Array.from({ length: 16 }, (_, index) => `C${String(index + 1).padStart(2, '0')}`),
      ...Array.from({ length: 10 }, (_, index) => `S${String(index + 1).padStart(2, '0')}`),
      ...Array.from({ length: 12 }, (_, index) => `P${String(index + 1).padStart(2, '0')}`),
      ...Array.from({ length: 10 }, (_, index) => `G${String(index + 1).padStart(2, '0')}`),
      ...Array.from({ length: 8 }, (_, index) => `R${String(index + 1).padStart(2, '0')}`)
    ]);
  });

  it('starts switchable sharing capabilities in individual scope', () => {
    for (const example of EXAMPLES) {
      for (const capability of example.sharing) {
        if (!capability.fixed && capability.supportedScopes.length > 1) {
          expect(capability.defaultScope, `${example.id}/${capability.element}`).toBe('individual');
        }
      }
    }
  });

  it('limits fixed sharing to compound within-cell coupling', () => {
    const fixed = EXAMPLES.flatMap((example) =>
      example.sharing
        .filter((capability) => capability.fixed)
        .map((capability) => ({ example, capability }))
    );

    expect(fixed.length).toBeGreaterThan(0);
    for (const { example, capability } of fixed) {
      expect(example.profile).toBe('compound');
      expect(['dataZoomX', 'dataZoomY', 'xRange', 'yRange']).toContain(capability.element);
      expect(capability.reason).toMatch(/^Fixed: shared/);
    }
  });

  it('resolves examples by stable ID', () => {
    expect(getExample('S08').title).toMatch(/interaction/i);
    expect(() => getExample('missing')).toThrow('Unknown example: missing');
  });
});
