import config from "../../../config";
import { CalendlyEventType, GuidedDiscussionStatus, UserType } from "../../constants";
import { SchedulerController } from "../../controllers/scheduler";
import { UserController } from "../../controllers/user";
import { getCalendlyDataByAnswerId } from "../../entities/calendly-data";
import { getGuidedDiscussionByStatusAndRange, GuidedDiscussion } from "../../entities/guided-discussion";
import { findPersonById, getFullName, Person } from "../../entities/person";
import { currentAt } from "../../entity";
import { formatDateRange } from "../../utils/date-utils";
import { addMinutesToTimeForScheduler } from "../eventBridge";

export namespace AddReminderController {
  export async function findDiscussions() {
    const discussions: GuidedDiscussion[] = await getGuidedDiscussionByStatusAndRange(GuidedDiscussionStatus.SCHECHULED,
      0, currentAt()
    )

    for (const item of discussions) {
      await createReminder(item);
    }
  }

  async function createReminder(guidedDiscussion: GuidedDiscussion) {
    const calendlyData = (await getCalendlyDataByAnswerId(guidedDiscussion.id!))
      .find(item => (item.event! == CalendlyEventType.InviteeCreated));

    const payloadData = JSON.parse(calendlyData?.payload!);
    const guide: Person | undefined = await findPersonById(guidedDiscussion.guideId!);
    const explorerEmail = await UserController.checkUserTypeAndGetEmail(guidedDiscussion.explorerId, UserType.MS_EXPLORER);
    const scheduleTime = addMinutesToTimeForScheduler(guidedDiscussion.startTime!, - (24 * 60));
    await SchedulerController.sendReminderEmail(`${guidedDiscussion.id}-24hour-reminder`, scheduleTime, {
      version: 1,
      to: [explorerEmail],
      subject: 'Reminder',
      template: 'explorer-gd-reminder',
      data: {
        name: guide == null ? '' : getFullName(guide),
        time: formatDateRange(
          payloadData.payload.scheduled_event?.start_time,
          payloadData.payload.scheduled_event?.end_time,
          payloadData.payload.timezone,
        ),
        discussion_link: `${config.host}/tools/mwi/#/survey?surveyId=${guidedDiscussion.id!}&tab=discussion`,
      },
    });
  }
}
