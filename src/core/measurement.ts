export interface MeasurementSummary {
  median: number;
  minimum: number;
  maximum: number;
  iterations: number;
}

export function summarizeMeasurements(values: readonly number[]): MeasurementSummary {
  if (values.length === 0) {
    throw new Error('At least one measurement is required');
  }
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];

  return {
    median,
    minimum: sorted[0],
    maximum: sorted[sorted.length - 1],
    iterations: sorted.length
  };
}

