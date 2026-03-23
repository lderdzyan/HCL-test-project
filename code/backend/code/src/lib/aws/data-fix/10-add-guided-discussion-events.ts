import { fromNullable, isSome } from "fp-ts/lib/Option";
import { Payment } from "../../entities/payment";
import { IConfig } from "../config";
import { IFilterData, queryByAttr, SortKey } from "../dynamodb";
import { GuidedDiscussionStatus, PaymentStatus } from "../../constants";
import { createEventTracking, EventTracking, EventType, GuidedDiscussionEvents } from "../../entities/event-tracking";
import { currentAt } from "../../entity";
import { PackageController } from "../../controllers/package";
import { findPersonById, getFullName, Person } from "../../entities/person";
import { findAllUsersByPid, UserProfile } from "../../entities/user-profile";
import { GuidedDiscussion } from "../../entities/guided-discussion";
import { GuidedReportCompletionStatus } from "../../report/constants";

export namespace GuidedDiscussionEventsMigration {
  export async function addPaymentEventsForGuidedDiscussion(config: IConfig) {
    await addEventsFromPayments(config);
  }
  export async function addDiscussionEventsForGuidedDiscussion(config: IConfig) {
    await addEventFromGuidedDiscussion(config);
  }

  async function addEventFromGuidedDiscussion(config: IConfig) {
    const discussions: GuidedDiscussion[] = await getAllGuidedDiscussions(config);

    for (const discussion of discussions) {
      if (discussion.guideId != null) {
        await addGuidedDiscussionUserInto(discussion.id!, discussion.guideId,
          GuidedDiscussionEvents.Guide, discussion.createdAt!, discussion.createdOn!, discussion.guideId);
      }
      if (discussion.status !== GuidedDiscussionStatus.CREATED) {
        await createEvent(discussion.id!, discussion.explorerId,
          GuidedDiscussionEvents.FocusAreasStarted, discussion.createdAt!, { createdOn: discussion.createdOn! });
      }
      if (discussion.status === GuidedDiscussionStatus.SCHECHULED) {
        await createEvent(discussion.id!, discussion.explorerId,
          GuidedDiscussionEvents.CompletionStatus, discussion.createdAt!, {
          status: GuidedReportCompletionStatus.Scheduled, createdOn: discussion.createdOn!
        });
      } else if (discussion.status === GuidedDiscussionStatus.STARTED) {
        await createEvent(discussion.id!, discussion.explorerId,
          GuidedDiscussionEvents.CompletionStatus, discussion.createdAt!,
          {
            status: GuidedReportCompletionStatus.InProgress,
            createdOn: discussion.createdOn!
          });
      } else if (discussion.status === GuidedDiscussionStatus.COMPLETED) {
        await createEvent(discussion.id!, discussion.explorerId,
          GuidedDiscussionEvents.CompletionStatus, discussion.createdAt!,
          {
            status: GuidedReportCompletionStatus.Complete,
            createdOn: discussion.createdOn!
          });
      }
    }
  }

  async function addEventsFromPayments(config: IConfig) {
    const allPackages: PackageController.PackageInfo[] = await PackageController.loadAll();
    const payments: Payment[] = await getAllPayments(config);

    console.log(payments.length, 'payments count');
    let i = 0;
    for (const payment of payments) {
      if (payment.packageId != null) {
        const packageInfo = allPackages.find(item => item.id === payment.packageId);
        if (packageInfo != null) {
          await addGuidedDiscussionUserInto(payment.answerId!, payment.personId,
            GuidedDiscussionEvents.Explorer, payment.createdAt!, payment.createdOn!, payment.personId);
          await createEvent(payment.answerId!, payment.personId,
            GuidedDiscussionEvents.PackageInfo,
            payment.createdAt!,
            {
              price: payment.totalAmount!,
              discountAmount: packageInfo.discount!,
              products: packageInfo.products!.map(item => item.shortName),
              createdOn: payment.createdOn!
            });
        }
        console.log(`Done ${++i}`);
      }
    }
  }
  async function getAllGuidedDiscussions(config: IConfig): Promise<GuidedDiscussion[]> {
    const items = await queryByAttr(config, 'attr4', 0, SortKey.GuidedDiscussion, '#attr > :attrValue', 'attr4-index');

    const discussions: GuidedDiscussion[] = [];
    for (const item of items) {
      const fixedData = fromNullable(item as GuidedDiscussion);
      if (isSome(fixedData)) {
        discussions.push(fixedData.value);
      }
    }

    return discussions;
  }

  async function getAllPayments(config: IConfig): Promise<Payment[]> {
    const filters: IFilterData = {
      expression: '#filterAttr = :filterValue',
      names: { '#filterAttr': 'status' },
      values: { ':filterValue': PaymentStatus.Done }
    }
    const items = await queryByAttr(config, 'attr4', 0, SortKey.Payment, '#attr > :attrValue', 'attr4-index', filters);

    const payments: Payment[] = [];
    for (const item of items) {
      const fixedData = fromNullable(item as Payment);
      if (isSome(fixedData)) {
        payments.push(fixedData.value);
      }
    }

    return payments;
  }

  async function createEvent(discussionId: string, pid: string, event: GuidedDiscussionEvents, createdAt: number, customData?: { [key: string]: string | number | string[] }) {
    const eventData = {
      type: EventType.GuidedDiscussionEvent,
      discussionId,
      personId: pid,
      event,
      customKey: `test_${discussionId}_${currentAt()}_${event}`,
      createdAt
    } as EventTracking;
    if (customData != null) {
      const keys: string[] = Object.keys(customData);
      for (const key of keys) eventData[key] = customData[key];
    }
    await createEventTracking(eventData, pid);
  }

  async function addGuidedDiscussionUserInto(discussionId: string, pid: string, event: GuidedDiscussionEvents,
    createdAt: number, createdOn: string, personId: string) {
    const person: Person | undefined = await findPersonById(personId);
    const users: UserProfile[] = await findAllUsersByPid(personId);

    if (person != null && users.length > 0) {
      await createEvent(discussionId, pid, event, createdAt, { createdOn, name: getFullName(person), email: users[0].email! });
    }
  }
}
