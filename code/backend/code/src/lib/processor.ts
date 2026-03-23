export const measureTypes: { [key: string]: number } = {
  'never/hardly ever': 1,
  seldom: 2,
  sometimes: 3,
  often: 4,
  'always/almost always': 5,
};
export const reverseMeasureTypes: { [key: string]: number } = {
  'never/hardly ever': 5,
  seldom: 4,
  sometimes: 3,
  often: 2,
  'always/almost always': 1,
};
interface IProcessResult {
  unity: number;
  service: number;
  expressing_full_potential: number;
  integrity_with_self: number;
  reality: number;
  inspiration: number;
  being_doing: number;
  self_other: number;
  wellbeing: number;
}

export const processItems = (items: Record<string, string>): IProcessResult => {
  const jsonKeys: string[] = Object.keys(items);
  const result: Partial<IProcessResult> = {};

  let points: number = 0;
  for (let i = 0; i <= 5; i++) {
    points += processAnswers(items[jsonKeys[i]], measureTypes);
  }
  result.unity = points / 6;

  points = 0;
  for (let i = 6; i <= 9; i++) {
    points += processAnswers(items[jsonKeys[i]], measureTypes);
  }
  result.service = points / 4;

  points = 0;
  for (let i = 10; i <= 13; i++) {
    points += processAnswers(items[jsonKeys[i]], measureTypes);
  }
  result.expressing_full_potential = points / 4;

  points = 0;
  for (let i = 14; i <= 16; i++) {
    points += processAnswers(items[jsonKeys[i]], reverseMeasureTypes);
  }
  result.integrity_with_self = points / 3;

  points = 0;
  for (let i = 17; i <= 19; i++) {
    points += processAnswers(items[jsonKeys[i]], measureTypes);
  }
  result.reality = points / 3;

  points = 0;
  for (let i = 20; i <= 23; i++) {
    points += processAnswers(items[jsonKeys[i]], measureTypes);
  }
  result.inspiration = points / 4;

  points = 0;
  for (let i = 24; i <= 25; i++) {
    points += processAnswers(items[jsonKeys[i]], measureTypes);
  }
  result.being_doing = points / 2;

  points = 0;
  for (let i = 26; i <= 27; i++) {
    points += processAnswers(items[jsonKeys[i]], measureTypes);
  }
  result.self_other = points / 2;

  points = 0;
  for (let i = 28; i <= 29; i++) {
    points += processAnswers(items[jsonKeys[i]], measureTypes);
  }
  points += processAnswers(items[jsonKeys[30]], reverseMeasureTypes);
  result.wellbeing = points / 3;

  return result as IProcessResult;
};

export const processAnswers = (answer: string, measures: { [key: string]: number }) => {
  return measures[answer.toLowerCase()];
};
