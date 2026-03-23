import { Option, isNone, isSome } from 'fp-ts/lib/Option';
import config from '../../config';
import { CalendlyEventType, GuidedDiscussionStatus, UserType } from '../constants';
import { checkTimeIsGreater, checkTimePassed, dateTimeToTimestamp, formatDateRange } from '../utils/date-utils';
import { GuidedDiscussionEvents } from '../entities/event-tracking';
import {
  GuidedDiscussion,
  createGuidedDiscussion,
  getGuidedDiscussionByExplorerId,
  getGuidedDiscussionById,
  getGuidedDiscussionByStatusAndRange,
  removeGuidedDiscussionFields,
  updateGuidedDiscussion,
} from '../entities/guided-discussion';
import {
  GuidedDiscussionActions,
  createDiscussionAction,
  getDiscussionActionsById,
  updateDiscussionActions,
} from '../entities/guided-discussion-actions';
import { Person, findPersonById, getFullName } from '../entities/person';
import { UserProfile, findAllUsersByPid } from '../entities/user-profile';
import { publishMessage } from '../publish-message';
import { GuidedReportCompletionStatus } from '../report/constants';
import { EventTrackingController } from './event-tracking';
import { UserController } from './user';
import { SchedulerController } from './scheduler';
import { addMinutesToTimeForScheduler } from '../aws/eventBridge';
import { isValidArray } from '../utils/array-utils';
import { GuideDetails, loadAllGuides } from '../entities/guide-profile';
import { AvailableDates, findAllForGivenRange } from '../entities/available-dates';
import { GuideController } from './guide';
import { getCalendlyDataByAnswerId } from '../entities/calendly-data';
import axios, { AxiosResponse } from 'axios';

export namespace GuidedDiscussionController {
  export interface ISchedulePayload {
    event: CalendlyEventType;
    created_at: string;
    created_by: string;
    updated_at: number;
    payload: {
      event: string;
      scheduled_event?: {
        name: string;
        status: string;
        start_time: string;
        end_time: string;
        location: Record<string, string>;
      };
      cancel_url: string;
      reschedule_url: string;
      name: string;
      rescheduled: boolean;
      status: string;
      email: string;
      timezone: string;
      old_invitee?: string;
      cancellation?: {
        canceled_by: string;
        reason: string;
        canceler_type: string;
        created_at: string;
      };
    };
  }
  export async function calculateStatusChange(id: string, pid: string) {
    const guidedDiscussionO: Option<GuidedDiscussion> = await getGuidedDiscussionById(id);
    let activateSend = false;
    let canReschedule = false;
    if (isSome(guidedDiscussionO)) {
      const guidedDiscussion = guidedDiscussionO.value;
      if (
        [GuidedDiscussionStatus.SCHECHULED, GuidedDiscussionStatus.STARTED, GuidedDiscussionStatus.READY].includes(
          guidedDiscussion.status,
        ) &&
        guidedDiscussion.startTime != null &&
        guidedDiscussion.endTime != null
      ) {
        if ([GuidedDiscussionStatus.SCHECHULED, GuidedDiscussionStatus.READY].includes(guidedDiscussion.status)) {
          if (isValidArray(guidedDiscussion.inventoryItems) && checkTimeIsGreater(guidedDiscussion.startTime, -10)) {
            guidedDiscussion.status = GuidedDiscussionStatus.STARTED;
            await setGuideToInsightAndAction(await getDiscussionActionsById(id), guidedDiscussion.guideId!, pid);
            await EventTrackingController.addGuidedDiscussionEvent(
              guidedDiscussion.id!,
              guidedDiscussion.explorerId,
              GuidedDiscussionEvents.CompletionStatus,
              { status: GuidedReportCompletionStatus.InProgress },
            );
          } else if (guidedDiscussion.guideId == pid && !checkTimeIsGreater(guidedDiscussion.startTime, -60)) {
            canReschedule = true;
          }
        }
        if (
          guidedDiscussion.status == GuidedDiscussionStatus.STARTED &&
          isValidArray(guidedDiscussion.inventoryItems)
        ) {
          if (checkTimeIsGreater(guidedDiscussion.endTime, -10)) {
            activateSend = true;
          }
          if (checkTimePassed(guidedDiscussion.endTime) && isValidArray(guidedDiscussion.inventoryItems)) {
            activateSend = true;
            guidedDiscussion.status = GuidedDiscussionStatus.FINISHED;
          }
        }

        await updateGuidedDiscussion(guidedDiscussion, pid, ['status']);
      }

      return {
        id: guidedDiscussion.id!,
        status: guidedDiscussion.status,
        canSend: activateSend,
        canReschedule,
        startTime: guidedDiscussion.startTime,
        endTime: guidedDiscussion.endTime,
      };
    }
  }

  export async function initGuidedDiscussion(discussionId: string, explorerId: string): Promise<GuidedDiscussion> {
    await createDiscussionAction(
      {
        id: discussionId,
        explorerId,
      } as GuidedDiscussionActions,
      explorerId,
    );

    return await createGuidedDiscussion(
      {
        id: discussionId,
        explorerId,
        status: GuidedDiscussionStatus.CREATED,
      },
      explorerId,
    );
  }

  export async function setGuideToInsightAndAction(
    discussionAction: Option<GuidedDiscussionActions>,
    guideId: string,
    pid: string,
  ) {
    if (isSome(discussionAction)) {
      const disc = discussionAction.value;
      disc.guideId = guideId;
      await updateDiscussionActions(disc, pid, ['guideId']);
    }
  }

  export async function rescheduleRequested(guidedDiscussion: GuidedDiscussion, pid: string) {
    guidedDiscussion.rescheduleRequested = true;
    guidedDiscussion.status = GuidedDiscussionStatus.CREATED;

    await updateGuidedDiscussion(guidedDiscussion, pid, ['rescheduleRequested', 'status']);
  }

  export async function rescheduleRequestedEmail(answerId: string, explorerId: string, reason: string, guide: Person) {
    const explorerUsers: UserProfile[] = await findAllUsersByPid(explorerId);
    if (explorerUsers.length > 0) {
      await publishMessage('send-email', {
        version: 1,
        to: [explorerUsers[0].email],
        subject: 'Request to Reschedule Discussion',
        template: 'explorer-gd-reschedule-req',
        data: {
          discussion_link: `${config.host}/tools/mwi/#/survey?surveyId=${answerId}&tab=discussion`,
          reason,
          name: getFullName(guide),
          firstName: guide.firstName,
        },
      });
    }
  }

  export async function createOrCancelCalendlyEvent(discussionId: string, requestData: ISchedulePayload) {
    const guidedDiscussionO: Option<GuidedDiscussion> = await getGuidedDiscussionById(discussionId!);
    if (isNone(guidedDiscussionO)) {
      console.log(`No Guided discussion found with id: ${discussionId}`);
      return;
    }

    const guidedDiscussion = guidedDiscussionO.value;
    await publishMessage('available-dates', { guideId: guidedDiscussion.guideId! });
    if (requestData.event === CalendlyEventType.InviteeCreated) {
      await handleCreatedEvent(guidedDiscussion, requestData);
    } else if (requestData.event === CalendlyEventType.InviteeCanceled) {
      const guideEmail = await UserController.checkUserTypeAndGetEmail(guidedDiscussion.guideId, UserType.MS_GUIDE);
      if (guideEmail != null && !guidedDiscussion.rescheduleRequested) {
        await publishMessage('send-email', {
          version: 1,
          to: [guideEmail],
          subject: 'Your Discussion was Canceled',
          template: 'guide-discussion-canceled',
          data: {
            name: requestData.payload.name,
            reason: requestData.payload.cancellation?.reason,
          },
        });
      }
      // The cancel email should only be sent for cancel events. However, the cancel logic must be executed for both cancel and reschedule scenarios.
      if (!requestData.payload.rescheduled) {
        await eraseInvetoryItems(guidedDiscussion);
        await sendCancelEmail(guidedDiscussion);
      }
      if (guidedDiscussion.autoCancel) {
        await handleAutoCancelEvent(guidedDiscussion);
      } else {
        await handleCancelEvent(guidedDiscussion);
      }
    }
  }
  export async function getGuidesByAvailableDate(startEpoch: number, endEpoch: number): Promise<GuideDetails[]> {
    const availableDates: AvailableDates[] = await findAllForGivenRange(startEpoch, endEpoch);
    // Group guides by guideId
    const groupedGuides: { [key: string]: AvailableDates[] } = availableDates.reduce(
      (acc, availableDate) => {
        if (!acc[availableDate.guideId!]) {
          acc[availableDate.guideId!] = [];
        }
        acc[availableDate.guideId!].push(availableDate);
        return acc;
      },
      {} as { [key: string]: AvailableDates[] },
    );
    const guides = await loadAllGuides();
    // Filter relevant guides and fetch profile image paths concurrently
    const guideDetails = await Promise.all(
      guides
        .filter((guide) => guide.id! in groupedGuides)
        .map(async (guide) => ({
          ...guide,
          profileImage: await GuideController.getFilePathWithoutTask(guide.profileImageId),
          availableTimes: groupedGuides[guide.id!]!.map((item) => ({ startTime: item.startTime })),
        })),
    );

    return guideDetails;
  }

  async function handleCancelEvent(guidedDiscussion: GuidedDiscussion) {
    guidedDiscussion.status = GuidedDiscussionStatus.DELETED;

    await removeGuidedDiscussionFields(guidedDiscussion.id!, [
      'startTime',
      'endTime',
      'zoomUrl',
      'cancelUrl',
      'rescheduleUrl',
      'guideId',
      'attr2',
    ]);
    try {
      await EventTrackingController.addGuidedDiscussionEvent(
        guidedDiscussion.id!,
        guidedDiscussion.explorerId,
        GuidedDiscussionEvents.CompletionStatus,
        { status: GuidedReportCompletionStatus.Cancel },
      );
    } catch (error) {
      console.log('error', error);
    }

    await updateGuidedDiscussion(guidedDiscussion, guidedDiscussion.explorerId!, ['status']);
    await SchedulerController.deleteSchedule(`${guidedDiscussion.id}-24hour-reminder`);
  }
  async function handleAutoCancelEvent(guidedDiscussion: GuidedDiscussion) {
    guidedDiscussion.status = GuidedDiscussionStatus.CANCELED;
    guidedDiscussion.autoCancel = false;

    await removeGuidedDiscussionFields(guidedDiscussion.id!, [
      'startTime',
      'endTime',
      'zoomUrl',
      'cancelUrl',
      'rescheduleUrl',
    ]);
    try {
      await EventTrackingController.addGuidedDiscussionEvent(
        guidedDiscussion.id!,
        guidedDiscussion.explorerId,
        GuidedDiscussionEvents.CompletionStatus,
        { status: GuidedReportCompletionStatus.Cancel },
      );
    } catch (error) {
      console.log('error', error);
    }

    await updateGuidedDiscussion(guidedDiscussion, guidedDiscussion.explorerId!, ['status', 'autoCancel']);
    await SchedulerController.deleteSchedule(`${guidedDiscussion.id}-24hour-reminder`);
  }
  export async function handleCreatedEvent(guidedDiscussion: GuidedDiscussion, requestData: ISchedulePayload) {
    const updateFields = ['startTime', 'endTime', 'status', 'cancelUrl', 'rescheduleUrl', 'explorerName', 'guideId'];
    guidedDiscussion.startTime = dateTimeToTimestamp(requestData.payload.scheduled_event?.start_time!);
    guidedDiscussion.endTime = dateTimeToTimestamp(requestData.payload.scheduled_event?.end_time!);
    if (requestData.payload.scheduled_event?.location['join_url'] != null) {
      guidedDiscussion.zoomUrl = requestData.payload.scheduled_event?.location['join_url'];
      updateFields.push('zoomUrl');
    }
    guidedDiscussion.cancelUrl = requestData.payload.cancel_url;
    guidedDiscussion.rescheduleUrl = requestData.payload.reschedule_url;
    guidedDiscussion.explorerName = requestData.payload.name;
    guidedDiscussion.status = isValidArray(guidedDiscussion.inventoryItems)
      ? GuidedDiscussionStatus.READY
      : GuidedDiscussionStatus.SCHECHULED;
    await sendScheduleRescheduleEmailToGuide(guidedDiscussion);
    if (guidedDiscussion.rescheduleRequested) {
      updateFields.push('rescheduleRequested');
      guidedDiscussion.rescheduleRequested = false;
      await sendRescheduleRequestedEmail(
        guidedDiscussion,
        requestData.payload.scheduled_event?.start_time,
        requestData.payload.scheduled_event?.end_time,
        requestData.payload.timezone,
      );
    } else {
      await sendScheduleEmail(
        guidedDiscussion,
        requestData.payload.scheduled_event?.start_time,
        requestData.payload.scheduled_event?.end_time,
        requestData.payload.timezone,
      );
    }
    try {
      await EventTrackingController.addGuidedDiscussionEvent(
        guidedDiscussion.id!,
        guidedDiscussion.explorerId,
        GuidedDiscussionEvents.CompletionStatus,
        { status: GuidedReportCompletionStatus.Scheduled },
      );
    } catch (error) {
      console.log('error', error);
    }

    await updateGuidedDiscussion(guidedDiscussion, guidedDiscussion.explorerId!, updateFields);
  }

  async function sendScheduleRescheduleEmailToGuide(
    guidedDiscussion: GuidedDiscussion,
    startTime?: string,
    endTime?: string,
    timezone?: string,
  ) {
    const guideEmail = await UserController.checkUserTypeAndGetEmail(guidedDiscussion.guideId, UserType.MS_GUIDE);
    if (guideEmail != null) {
      if (guidedDiscussion.rescheduleRequested) {
        await publishMessage('send-email', {
          version: 1,
          to: [guideEmail],
          subject: 'Your Discussion was Rescheduled',
          template: 'guide-gd-rescheduled',
          data: {
            name: guidedDiscussion.explorerName,
            discussion_link: `${config.host}/tools/guides/#/discussions`,
          },
        });
      } else {
        await publishMessage('send-email', {
          version: 1,
          to: [guideEmail],
          subject: 'New scheduled discussion',
          template: 'guide-discussion-scheduled',
          data: {
            discussion_link: `${config.host}/tools/guides/#/discussions`,
          },
        });
      }
    }
  }

  async function sendRescheduleRequestedEmail(
    guidedDiscussion: GuidedDiscussion,
    startTime?: string,
    endTime?: string,
    timezone?: string,
  ) {
    const explorerEmail = await UserController.checkUserTypeAndGetEmail(
      guidedDiscussion.explorerId,
      UserType.MS_EXPLORER,
    );
    const guide: Person | undefined = await findPersonById(guidedDiscussion.guideId!);
    if (explorerEmail != null && guide != null) {
      await publishMessage('send-email', {
        version: 1,
        to: [explorerEmail],
        subject: 'Your Guided Discussion is Rescheduled',
        template: 'explorer-gd-rescheduled',
        data: {
          name: getFullName(guide),
          time: formatDateRange(startTime, endTime, timezone),
          discussion_link: `${config.host}/tools/mwi/#/survey?surveyId=${guidedDiscussion.id!}&tab=discussion`,
        },
      });
    }
  }

  async function sendScheduleEmail(
    guidedDiscussion: GuidedDiscussion,
    startTime?: string,
    endTime?: string,
    timezone?: string,
  ) {
    const explorerEmail = await UserController.checkUserTypeAndGetEmail(
      guidedDiscussion.explorerId,
      UserType.MS_EXPLORER,
    );
    const guide: Person | undefined = await findPersonById(guidedDiscussion.guideId!);
    if (explorerEmail != null && guide != null) {
      await publishMessage('send-email', {
        version: 1,
        to: [explorerEmail],
        subject: 'Your Guided Discussion is Scheduled',
        template: 'explorer-discussion-scheduled',
        data: {
          name: getFullName(guide),
          time: formatDateRange(startTime, endTime, timezone),
          discussion_link: `${config.host}/tools/mwi/#/survey?surveyId=${guidedDiscussion.id!}&tab=discussion`,
        },
      });
      const scheduleTime = addMinutesToTimeForScheduler(guidedDiscussion.startTime!, -(24 * 60));
      await SchedulerController.sendReminderEmail(`${guidedDiscussion.id}-24hour-reminder`, scheduleTime, {
        version: 1,
        to: [explorerEmail],
        subject: 'Reminder',
        template: 'explorer-gd-reminder',
        data: {
          name: getFullName(guide),
          time: formatDateRange(startTime, endTime, timezone),
          discussion_link: `${config.host}/tools/mwi/#/survey?surveyId=${guidedDiscussion.id!}&tab=discussion`,
        },
      });
    }
  }

  async function sendCancelEmail(guidedDiscussion: GuidedDiscussion) {
    const explorerEmail = await UserController.checkUserTypeAndGetEmail(
      guidedDiscussion.explorerId,
      UserType.MS_EXPLORER,
    );
    const guide: Person | undefined = await findPersonById(guidedDiscussion.guideId!);
    if (explorerEmail != null && guide != null) {
      await publishMessage('send-email', {
        version: 1,
        to: [explorerEmail],
        subject: 'Your Guided Discussion is Canceled',
        template: 'explorer-discussion-cancel',
        data: {
          name: getFullName(guide),
          discussion_link: `${config.host}/tools/mwi/#/survey?surveyId=${guidedDiscussion.id!}&tab=discussion`,
        },
      });
    }
  }

  export async function getIncompletesByExpolrerId(explorerId: string): Promise<string[]> {
    const discussions: GuidedDiscussion[] = (
      await getGuidedDiscussionByExplorerId(explorerId, GuidedDiscussionStatus.SCHECHULED)
    ).filter((item: GuidedDiscussion) => !isValidArray(item.inventoryItems));

    return discussions.map((item) => item.id!);
  }

  export async function getCanceledByExpolrerId(explorerId: string): Promise<string[]> {
    const discussions: GuidedDiscussion[] = (
      await getGuidedDiscussionByExplorerId(explorerId, GuidedDiscussionStatus.CANCELED)
    ).filter((item: GuidedDiscussion) => item.guideId != null);

    return discussions.map((item) => item.id!);
  }
  // Get all guided discussion which has empty focus areas
  export async function loadAllDiscussionForLambda(): Promise<GuidedDiscussion[]> {
    //Need to get all the guided Discussion
    const now = new Date().getTime();
    // need to load all the discussion with scheduled status in 24-36.5 time range.
    const startTime = now + 24 * 60 * 60 * 1000; // 24 hours later
    const endTime = now + 36.5 * 60 * 60 * 1000; // 36.5 hours later
    const guidedDiscussion: GuidedDiscussion[] = await getGuidedDiscussionByStatusAndRange(
      GuidedDiscussionStatus.SCHECHULED,
      startTime,
      endTime,
    );

    // need to filted all those which do not have focus areas
    const needAction = guidedDiscussion.filter((item) => !isValidArray(item.inventoryItems));

    const timeIn36Hours = now + 36.5 * 60 * 60 * 1000;
    const timeIn25Hours = now + 25.5 * 60 * 60 * 1000;
    const timeIn24Hours = now + 24.5 * 60 * 60 * 1000;
    const halfHour = 30 * 60 * 1000;

    //need to filter those which need to be emailed in 36 hours
    const needToEmail36 = needAction.filter(
      (item) => item.startTime! < timeIn36Hours && item.startTime! > timeIn36Hours - halfHour,
    );
    console.log(needToEmail36, timeIn36Hours, '36');
    for (const discussion of needToEmail36) {
      await sendEmailForFocusAreasReminder(discussion);
    }

    //need to filter those which need to be emailed in 25 hours
    const needToEmail25 = needAction.filter(
      (item) => item.startTime! < timeIn25Hours && item.startTime! > timeIn25Hours - halfHour,
    );
    console.log(needToEmail25, timeIn25Hours, '25');
    for (const discussion of needToEmail25) {
      await sendEmailToSetFocusAreas(discussion);
    }

    //need to filter those which need to be canceled
    const needCancelation = needAction.filter((item) => item.startTime! < timeIn24Hours);
    console.log(needCancelation, 'cancel');
    for (const discussion of needCancelation) {
      await cancelUncompleteDiscussion(discussion);
    }
    return [];
  }

  async function sendEmailForFocusAreasReminder(guidedDiscussion: GuidedDiscussion) {
    const explorerEmail = await UserController.checkUserTypeAndGetEmail(
      guidedDiscussion.explorerId,
      UserType.MS_EXPLORER,
    );
    if (explorerEmail != null) {
      await publishMessage('send-email', {
        version: 1,
        to: [explorerEmail],
        subject: 'Reminder: Prepare for your guided discussion',
        template: 'explorer-has-not-selected-focus-areas',
        data: {
          discussion_link: `${config.host}/tools/mwi/#/survey?surveyId=${guidedDiscussion.id!}&tab=discussion`,
        },
      });
    }
  }

  async function sendEmailToSetFocusAreas(guidedDiscussion: GuidedDiscussion) {
    const calendlyData = (await getCalendlyDataByAnswerId(guidedDiscussion.id!)).find(
      (item) => item.event! == CalendlyEventType.InviteeCreated,
    );

    const payloadData = JSON.parse(calendlyData?.payload!);
    const explorerEmail = await UserController.checkUserTypeAndGetEmail(
      guidedDiscussion.explorerId,
      UserType.MS_EXPLORER,
    );
    if (explorerEmail != null) {
      await publishMessage('send-email', {
        version: 1,
        to: [explorerEmail],
        subject: 'Reminder: Prepare for your guided discussion',
        template: 'explorer-focus-area-reminder',
        data: {
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

  async function cancelUncompleteDiscussion(guidedDiscussion: GuidedDiscussion) {
    guidedDiscussion.autoCancel = true;
    await updateGuidedDiscussion(guidedDiscussion, guidedDiscussion.explorerId!, ['autoCancel']);
    if (guidedDiscussion.calendlyData != null) await makeCancelRequestToCalendly(guidedDiscussion);
  }
  interface ApiResponse {
    data: any;
  }
  interface RequestBody {
    reason: string;
  }
  async function makeCancelRequestToCalendly(guidedDiscussion: GuidedDiscussion) {
    try {
      const calendlyData = JSON.parse(guidedDiscussion.calendlyData!);
      const data: RequestBody = {
        reason: 'Explorer did not set focus areas',
      };

      // Make the POST request
      const response: AxiosResponse<ApiResponse> = await axios.post(`${calendlyData.event.uri}/cancellation`, data, {
        headers: {
          Authorization: `Bearer ${process.env.CALENDLY_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      const resp: any = response.data;
      //TODO need to do something with response.
    } catch (error: any) {
      console.error('Error making API call:', error.message);
      throw new Error(`Failed to cancel guided discussion automatically.`);
    }
  }
  async function eraseInvetoryItems(guidedDiscussion: GuidedDiscussion) {
    if (isValidArray(guidedDiscussion.inventoryItems)) {
      await removeGuidedDiscussionFields(guidedDiscussion.id!, ['inventoryItems']);
    }
  }
  export async function sentCompletedEmailToGuide(guidedDiscussion: GuidedDiscussion) {
    const calendlyData = (await getCalendlyDataByAnswerId(guidedDiscussion.id!)).find(
      (item) => item.event! == CalendlyEventType.InviteeCreated,
    );

    const payloadData = JSON.parse(calendlyData?.payload!);
    const guideEmail = await UserController.checkUserTypeAndGetEmail(guidedDiscussion.guideId, UserType.MS_GUIDE);
    if (guideEmail != null) {
      await publishMessage('send-email', {
        version: 1,
        to: [guideEmail],
        subject: 'New focus areas are ready!',
        template: 'guide-focus-areas-complete',
        data: {
          time: formatDateRange(
            payloadData.payload.scheduled_event?.start_time,
            payloadData.payload.scheduled_event?.end_time,
            payloadData.payload.timezone,
          ),
          name: guidedDiscussion.explorerName,
          discussion_link: `${config.host}/tools/guides/#/discussions`,
        },
      });
    }
  }
}
