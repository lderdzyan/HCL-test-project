import { IndicatorController } from '@/lib/controllers/wlf-indicator';

type Area = { exp?: number; imp?: number };
type Categories = {
  growthOpportunities: Array<{ area: string; exp: number; imp: number }>;
  aligned: Array<{ area: string; exp: number; imp: number }>;
  hiddenStrengths: Array<{ area: string; exp: number; imp: number }>;
};
type WorklifeFulfillmentAnswer = { answers: string; surveyId: string };

describe('processResults', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('groups "category-kind" pairs and passes numeric data to categorize', () => {
    const input: WorklifeFulfillmentAnswer = {
      answers: JSON.stringify({
        'growth-exp': '3',
        'growth-imp': '5',
        'teamwork-exp': '6',
        'teamwork-imp': '4',
        'noise-xyz': '999',
      }),
      surveyId: '1234',
    };

    const expectedGrouped: Record<string, Area> = {
      growth: { exp: 3, imp: 5 },
      teamwork: { exp: 6, imp: 4 },
      // noise ignored (categorize cares only about exp/imp)
    };

    const fakeResult: Categories = {
      growthOpportunities: [{ area: 'growth', exp: 3, imp: 5 }],
      aligned: [],
      hiddenStrengths: [{ area: 'teamwork', exp: 6, imp: 4 }],
    };

    const out = IndicatorController.exportedForTesting.processResults(input);

    expect(out).toStrictEqual(fakeResult);
  });

  it('handles empty answers object', () => {
    const input: WorklifeFulfillmentAnswer = { answers: JSON.stringify({}), surveyId: '' };

    const fakeResult: Categories = {
      growthOpportunities: [],
      aligned: [],
      hiddenStrengths: [],
    };

    const out = IndicatorController.exportedForTesting.processResults(input);

    expect(out).toEqual(fakeResult);
  });

  it('converts numeric strings to numbers (aligned only, non-overlapping)', () => {
    const input: WorklifeFulfillmentAnswer = {
      answers: JSON.stringify({
        'alpha-exp': '5.2', // Δ = -0.9 -> aligned only
        'alpha-imp': '6.1',
      }),
      surveyId: '',
    };

    const out = IndicatorController.exportedForTesting.processResults(input);

    expect(out.aligned).toEqual(expect.arrayContaining([{ area: 'alpha', exp: 5.2, imp: 6.1 }]));

    const otherBuckets = new Set([
      ...out.growthOpportunities.map((x) => x.area),
      ...out.hiddenStrengths.map((x) => x.area),
    ]);
    expect(otherBuckets.has('alpha')).toBe(false);
  });

  it('end-to-end: integrates with real Workl.categorize implementation', () => {
    jest.restoreAllMocks();

    const input: WorklifeFulfillmentAnswer = {
      answers: JSON.stringify({
        // growth → exp < imp - 1
        'comm-exp': '3',
        'comm-imp': '5',

        // aligned → |Δ| < 2
        'lead-exp': '6',
        'lead-imp': '5',

        // hidden → exp > imp + 1
        'craft-exp': '7',
        'craft-imp': '4',
      }),
      surveyId: '',
    };

    const result = IndicatorController.exportedForTesting.processResults(input);

    expect(result.growthOpportunities).toEqual(expect.arrayContaining([{ area: 'comm', exp: 3, imp: 5 }]));
    expect(result.aligned).toEqual(expect.arrayContaining([{ area: 'lead', exp: 6, imp: 5 }]));
    expect(result.hiddenStrengths).toEqual(expect.arrayContaining([{ area: 'craft', exp: 7, imp: 4 }]));
  });
});
