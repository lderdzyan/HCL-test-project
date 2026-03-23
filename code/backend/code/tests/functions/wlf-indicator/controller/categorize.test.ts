import { IndicatorController } from '@/lib/controllers/wlf-indicator';

type Area = { exp?: number; imp?: number };
type Categories = {
  growthOpportunities: Array<{ area: string; exp: number; imp: number }>;
  aligned: Array<{ area: string; exp: number; imp: number }>;
  hiddenStrengths: Array<{ area: string; exp: number; imp: number }>;
};

describe('helpers', () => {
  describe('isAligned', () => {
    test.each([
      [{ exp: 3, imp: 3 }, true], // equal -> |Δ| = 0
      [{ exp: 4, imp: 5 }, true], // |Δ| = 1
      [{ exp: 6, imp: 4 }, false], // |Δ| = 2 -> not aligned
      [{ exp: 2, imp: 5 }, false], // |Δ| = 3 -> not aligned
      [{ exp: 3 }, false], // undefined imp
      [{ imp: 3 }, false], // undefined exp
      [{} as Area, false],
    ])('isAligned(%j) -> %s', (a, expected) => {
      expect(IndicatorController.isAligned(a)).toBe(expected);
    });
  });

  describe('isGrowthOpportunity', () => {
    test.each([
      [{ exp: 3, imp: 6 }, true], // exp < imp - 1 (Δ = -3)
      [{ exp: 3, imp: 5 }, true], // Δ = -2
      [{ exp: 3, imp: 4 }, false], // Δ = -1 (borderline -> not growth)
      [{ exp: 3, imp: 3 }, false], // Δ = 0
      [{ exp: 5, imp: 3 }, false], // Δ = +2 (hidden strength instead)
      [{ exp: 3 }, false],
      [{ imp: 3 }, false],
    ])('isGrowthOpportunity(%j) -> %s', (a, expected) => {
      expect(IndicatorController.isGrowthOpportunity(a)).toBe(expected);
    });
  });

  describe('isHiddenStrength', () => {
    test.each([
      [{ exp: 6, imp: 3 }, true], // exp > imp + 1 (Δ = +3)
      [{ exp: 5, imp: 3 }, true], // Δ = +2
      [{ exp: 4, imp: 3 }, false], // Δ = +1 (borderline -> not hidden)
      [{ exp: 3, imp: 3 }, false], // Δ = 0
      [{ exp: 3, imp: 5 }, false], // Δ = -2 (growth instead)
      [{ exp: 3 }, false],
      [{ imp: 3 }, false],
    ])('isHiddenStrength(%j) -> %s', (a, expected) => {
      expect(IndicatorController.isHiddenStrength(a)).toBe(expected);
    });
  });
});

describe('categorize', () => {
  it('returns empty buckets for empty input', () => {
    const result = IndicatorController.exportedForTesting.categorize({});
    expect(result).toEqual<Categories>({
      growthOpportunities: [],
      aligned: [],
      hiddenStrengths: [],
    });
  });

  it('ignores areas that are not "defined" (missing exp or imp)', () => {
    const result = IndicatorController.exportedForTesting.categorize({
      A: { exp: 3 }, // missing imp
      B: { imp: 4 }, // missing exp
      C: {}, // both missing
      D: { exp: 1, imp: 1 }, // valid
    });

    expect(result.aligned).toEqual([{ area: 'D', exp: 1, imp: 1 }]);
    expect(result.growthOpportunities).toHaveLength(0);
    expect(result.hiddenStrengths).toHaveLength(0);
  });

  it('categorizes according to thresholds (no overlaps)', () => {
    const areas: Record<string, Area> = {
      // aligned: |Δ| < 2
      AlignedEqual: { exp: 4, imp: 4 }, // Δ = 0
      AlignedDelta1a: { exp: 3, imp: 4 }, // Δ = -1
      AlignedDelta1b: { exp: 6, imp: 5 }, // Δ = +1

      // growth: exp < imp - 1 (Δ <= -2)
      Growth2: { exp: 3, imp: 5 }, // Δ = -2
      Growth3: { exp: 2, imp: 5 }, // Δ = -3

      // hidden strength: exp > imp + 1 (Δ >= +2)
      Hidden2: { exp: 5, imp: 3 }, // Δ = +2
      Hidden4: { exp: 8, imp: 4 }, // Δ = +4
    };

    const result = IndicatorController.exportedForTesting.categorize(areas);

    expect(result.aligned).toEqual(
      expect.arrayContaining([
        { area: 'AlignedEqual', exp: 4, imp: 4 },
        { area: 'AlignedDelta1a', exp: 3, imp: 4 },
        { area: 'AlignedDelta1b', exp: 6, imp: 5 },
      ]),
    );
    expect(result.aligned).toHaveLength(3);

    expect(result.growthOpportunities).toEqual(
      expect.arrayContaining([
        { area: 'Growth2', exp: 3, imp: 5 },
        { area: 'Growth3', exp: 2, imp: 5 },
      ]),
    );
    expect(result.growthOpportunities).toHaveLength(2);

    expect(result.hiddenStrengths).toEqual(
      expect.arrayContaining([
        { area: 'Hidden2', exp: 5, imp: 3 },
        { area: 'Hidden4', exp: 8, imp: 4 },
      ]),
    );
    expect(result.hiddenStrengths).toHaveLength(2);

    // Sanity: ensure no item is in two buckets (mutual exclusivity by design)
    const allAreas = new Set(
      [...result.aligned, ...result.growthOpportunities, ...result.hiddenStrengths].map((x) => x.area),
    );
    expect(allAreas.size).toBe(7);
  });

  it('handles boundary values exactly at the ±1 difference as aligned', () => {
    const result = IndicatorController.exportedForTesting.categorize({
      DeltaNeg1: { exp: 4, imp: 5 }, // |Δ| = 1 -> aligned
      DeltaPos1: { exp: 5, imp: 4 }, // |Δ| = 1 -> aligned
      DeltaNeg2: { exp: 3, imp: 5 }, // |Δ| = 2 -> growth
      DeltaPos2: { exp: 5, imp: 3 }, // |Δ| = 2 -> hidden
    });

    expect(result.aligned).toEqual(
      expect.arrayContaining([
        { area: 'DeltaNeg1', exp: 4, imp: 5 },
        { area: 'DeltaPos1', exp: 5, imp: 4 },
      ]),
    );
    expect(result.growthOpportunities).toEqual(expect.arrayContaining([{ area: 'DeltaNeg2', exp: 3, imp: 5 }]));
    expect(result.hiddenStrengths).toEqual(expect.arrayContaining([{ area: 'DeltaPos2', exp: 5, imp: 3 }]));
  });

  it('does not mutate the input object', () => {
    const input: Record<string, Area> = {
      A: { exp: 1, imp: 4 },
      B: { exp: 5, imp: 5 },
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    IndicatorController.exportedForTesting.categorize(input);

    expect(input).toEqual(snapshot);
  });
});
