export const PRICE_PER_TREE_ZMW = 25;

export const SURVIVAL_THRESHOLD = 0.7;

export const TRANCHES = [
  {
    index: 1,
    label: 'Tranche 1 · Planting verified',
    pct: 0.5,
    milestoneMonths: 0,
    requirement: 'Planting confirmed & geotagged',
    survivalCheck: null,
  },
  {
    index: 2,
    label: 'Tranche 2 · 12-month survival check',
    pct: 0.3,
    milestoneMonths: 12,
    requirement: '≥ 70% survival at 12 months',
    survivalCheck: 12,
  },
  {
    index: 3,
    label: 'Tranche 3 · 24-month survival check',
    pct: 0.2,
    milestoneMonths: 24,
    requirement: '≥ 70% survival at 24 months',
    survivalCheck: 24,
  },
];

export function totalValue(treeCount, pricePerTree = PRICE_PER_TREE_ZMW) {
  return Math.round(treeCount * pricePerTree);
}

export function trancheAmounts(treeCount, pricePerTree = PRICE_PER_TREE_ZMW) {
  const total = totalValue(treeCount, pricePerTree);
  const t1 = Math.round(total * TRANCHES[0].pct);
  const t2 = Math.round(total * TRANCHES[1].pct);
  const t3 = total - t1 - t2;
  return TRANCHES.map((t, i) => ({
    ...t,
    amount: i === 2 ? t3 : i === 1 ? t2 : t1,
  }));
}

export function evaluateTranche(
  tranche,
  { elapsedMonths, survivalAt12, survivalAt24 }
) {
  if (tranche.index === 1) return 'released';
  const survival = tranche.index === 2 ? survivalAt12 : survivalAt24;
  if (elapsedMonths < tranche.milestoneMonths) return 'locked';
  return survival >= SURVIVAL_THRESHOLD * 100 ? 'released' : 'not-met';
}
