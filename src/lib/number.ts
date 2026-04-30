export function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

export function roundNumber(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function currencyTotal(litres: number, unitCost: number): number {
  return roundNumber(litres * unitCost, 2);
}
