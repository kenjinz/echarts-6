export type WebGLContextName = 'webgl' | 'experimental-webgl' | 'webgl2';

export interface WebGLMetrics {
  requests: Record<WebGLContextName, number>;
  uniqueContexts: number;
  createdContexts: number;
  lost: number;
  restored: number;
}

interface EventTargetLike {
  addEventListener?(type: string, listener: () => void): void;
}

export interface CanvasPrototypeLike {
  getContext(this: EventTargetLike, type: string, ...args: unknown[]): unknown;
}

export interface WebGLInstrumentation {
  snapshot(): WebGLMetrics;
  release(target: object): void;
  restore(): void;
}

const WEBGL_CONTEXTS = new Set<WebGLContextName>([
  'webgl',
  'experimental-webgl',
  'webgl2'
]);

export function installWebGLInstrumentation(
  prototype: CanvasPrototypeLike
): WebGLInstrumentation {
  const original = prototype.getContext;
  const requests: Record<WebGLContextName, number> = {
    webgl: 0,
    'experimental-webgl': 0,
    webgl2: 0
  };
  const contextsByCanvas = new Map<object, Set<object>>();
  const createdContexts = new WeakSet<object>();
  let createdContextCount = 0;
  const observedCanvases = new WeakSet<object>();
  let lost = 0;
  let restored = 0;

  prototype.getContext = function instrumentedGetContext(
    this: EventTargetLike,
    type: string,
    ...args: unknown[]
  ): unknown {
    const context = original.call(this, type, ...args);
    if (WEBGL_CONTEXTS.has(type as WebGLContextName)) {
      requests[type as WebGLContextName] += 1;
      if (typeof context === 'object' && context !== null) {
        const canvas = this as object;
        const contexts = contextsByCanvas.get(canvas) ?? new Set<object>();
        contexts.add(context);
        contextsByCanvas.set(canvas, contexts);
        if (!createdContexts.has(context)) {
          createdContexts.add(context);
          createdContextCount += 1;
        }
      }
      if (typeof this === 'object' && this !== null && !observedCanvases.has(this)) {
        observedCanvases.add(this);
        this.addEventListener?.('webglcontextlost', () => { lost += 1; });
        this.addEventListener?.('webglcontextrestored', () => { restored += 1; });
      }
    }
    return context;
  };

  return {
    snapshot: () => ({
      requests: { ...requests },
      uniqueContexts: [...contextsByCanvas.values()].reduce((sum, contexts) => sum + contexts.size, 0),
      createdContexts: createdContextCount,
      lost,
      restored
    }),
    release: (target) => {
      contextsByCanvas.delete(target);
    },
    restore: () => {
      prototype.getContext = original;
    }
  };
}
