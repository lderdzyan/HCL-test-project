import { EventTracking, EventType, findAllByCustomKeyStartsWith } from '../entities/event-tracking';
import { ReportData } from '../entities/report-data';
import { WlfEvents } from '../report/constants';
import { WorkLifeReportResult } from './reports';

export async function getWlfInventoryReportItem(reportData: ReportData, itemId: string) {
  const wlfEvents: EventTracking[] = await findAllByCustomKeyStartsWith(itemId, EventType.WlfIndicatorEvent);
  const resultJson = JSON.parse(reportData.result!);
  resultJson[itemId] = createEmptyWlfReportObject();
  for (const wlfEvent of wlfEvents) {
    if (wlfEvent.event === WlfEvents.Started) {
      resultJson[itemId].startedDate = wlfEvent.createdAt ?? 0;
    } else if (wlfEvent.event === WlfEvents.Completed) {
      resultJson[itemId].assessmentCompletionDate = wlfEvent.createdAt ?? 0;
    } else if (wlfEvent.event === WlfEvents.EmailVerified) {
      resultJson[itemId].accountCreatedDate = wlfEvent.createdAt ?? 0;
    } else if (wlfEvent.event === WlfEvents.WarmUpCompleted) {
      resultJson[itemId].warmUpCompletedDate = wlfEvent.createdAt ?? 0;
    } else if (wlfEvent.event === WlfEvents.TargetAreaCompleted) {
      resultJson[itemId].strengthenCompletedDate = wlfEvent.createdAt ?? 0;
    } else if (wlfEvent.event === WlfEvents.TrainingPlanCompleted) {
      resultJson[itemId].trainingCompletedDate = wlfEvent.createdAt ?? 0;
    } else if (wlfEvent.event === WlfEvents.PdfDownloaded) {
      resultJson[itemId].pdfDownloadedDate = wlfEvent.createdAt ?? 0;
    }
    if (resultJson[itemId].email === '') resultJson[itemId].email = wlfEvent.email ?? '';
  }

  return resultJson;
}

function createEmptyWlfReportObject(): WorkLifeReportResult {
  return {
    email: '',
    startedDate: '',
    accountCreatedDate: '',
    assessmentCompletionDate: '',
    warmUpCompletedDate: '',
    strengthenCompletedDate: '',
    trainingCompletedDate: '',
    pdfDownloadedDate: '',
  };
}
