// tests/latestRequest.test.ts
import { expect, it } from 'vitest';
import { LatestRequest } from '../src/core/latestRequest';
it('invalidates a delayed request without invalidating its successor', async () => {
  const guard = new LatestRequest();
  const first = guard.begin();
  let release!: () => void;
  const delayed = new Promise<void>(resolve => { release = resolve; });
  const committed: number[] = [];
  const pending = delayed.then(() => { if (guard.isCurrent(first)) committed.push(first); });
  const second = guard.begin();
  if (guard.isCurrent(second)) committed.push(second);
  release();
  await pending;
  expect(committed).toEqual([second]);
});
