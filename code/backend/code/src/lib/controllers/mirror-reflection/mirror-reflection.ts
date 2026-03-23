import { pipe } from 'fp-ts/lib/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';
import {
  createDeletedMirrorReflection,
  getMirrorReflectionById,
  deleteMirrorReflection as deleteTheRealOne,
} from '../../entities/mirror-reflection/mirror-reflection';
import { getMRAnalyticsInfoFromEvents } from '../../entities/event-tracking';

export namespace MirrorReflectionController {
  export const deleteMirrorReflection = (id: string): TE.TaskEither<Error, void> =>
    pipe(
      getMirrorReflectionById(id),
      TE.chain((maybeReflection) =>
        pipe(
          maybeReflection,
          O.fold(
            () => TE.right<Error, void>(undefined),
            (mirrorReflection) =>
              pipe(
                createDeletedMirrorReflection(mirrorReflection),
                TE.chain(() =>
                  pipe(
                    deleteTheRealOne(id),
                    TE.map(() => undefined),
                  ),
                ),
              ),
          ),
        ),
      ),
    );

  export const getAnalyticsInfo = (pid: string, startOfDate: number, endOfDate: number): TE.TaskEither<Error, any> =>
    pipe(
      getMRAnalyticsInfoFromEvents(pid, startOfDate, endOfDate),
      TE.map((data) => {
        const feelingWordsArray = data.flatMap((item) => item.feelingWords);
        const topicsArray = data.flatMap((item) => item.topics);
        const workLifeArray = data.map((item) => item.workLife);

        return {
          feelingWords: getTopN(countOccurrences(feelingWordsArray), 5),
          topics: getTopN(countOccurrences(topicsArray), 5),
          workLife: getTopN(countOccurrences(workLifeArray), 5),
        };
      }),
    );

  export function countOccurrences(arr: string[]): Record<string, number> {
    return arr.reduce(
      (acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  export function getTopN(counts: Record<string, number>, n: number): { label: string; count: number }[] {
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]) // Sort by desc
      .slice(0, n)
      .map(([label, count]) => ({
        label: label.replace(/_/g, ' '), // Replace _ with space
        count,
      }));
  }
}
