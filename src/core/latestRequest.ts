// src/core/latestRequest.ts
export class LatestRequest {
  private generation = 0;
  begin(): number { return ++this.generation; }
  isCurrent(token: number): boolean { return token === this.generation; }
}
