export { prepareMWIReportData } from './mwi';

import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { Report, ReportType } from '../report-generator';
import { prepareMWIReportData } from './mwi';

export function prepareReportData(report: Report): TE.TaskEither<Error, any> {
  return pipe(
    TE.tryCatch(
      async () => {
        switch (report.type) {
          case ReportType.MWI:
            return await prepareMWIReportData(report.data);
          default:
            throw new Error('prepareReportData: Wrong report type.');
        }
      },
      (reason: unknown) => reason as Error,
    ),
  );
}
