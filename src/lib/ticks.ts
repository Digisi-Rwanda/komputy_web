/** Nice axis ticks: 0..max with a step of 1/2/2.5/5 × 10^n. */
export function ticks(max: number, count = 4) {
  if (max <= 0) return [0];
  const raw = max / count, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].find((m) => m * mag >= raw)! * mag;
  return Array.from({ length: Math.ceil(max / step - 1e-9) + 1 }, (_, i) => +(i * step).toFixed(10));
}
