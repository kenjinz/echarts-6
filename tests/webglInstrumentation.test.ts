import { describe, expect, it } from 'vitest';

import { installWebGLInstrumentation } from '../src/core/instrumentation';

describe('WebGL instrumentation', () => {
  it('counts requests and unique contexts and restores the original method', () => {
    const webgl = {};
    const webgl2 = {};
    const original = function (this: unknown, type: string): unknown {
      if (type === 'webgl') return webgl;
      if (type === 'webgl2') return webgl2;
      return null;
    };
    const prototype = { getContext: original };
    const instrumentation = installWebGLInstrumentation(prototype);

    prototype.getContext('webgl');
    prototype.getContext('webgl');
    prototype.getContext('webgl2');
    prototype.getContext('2d');

    expect(instrumentation.snapshot()).toEqual({
      requests: { webgl: 2, 'experimental-webgl': 0, webgl2: 1 },
      uniqueContexts: 2,
      createdContexts: 2,
      lost: 0,
      restored: 0
    });

    instrumentation.release(prototype);
    expect(instrumentation.snapshot().uniqueContexts).toBe(0);
    expect(instrumentation.snapshot().createdContexts).toBe(2);

    instrumentation.restore();
    expect(prototype.getContext).toBe(original);
  });
});
