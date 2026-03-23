import { EventType, findAllOfType, updateEventTracking } from '../../entities/event-tracking';

export namespace GuidedDisucssionEventsDataFix {
  // cli command fixGDEventData
  export async function fixData() {
    const events = await findAllOfType(1759276800000, 1761547014000, EventType.GuidedDiscussionEvent);

    console.log(events.length);
    for (const ev of events) {
      if (ev.customKey?.includes(ev.personId)) {
        ev.customKey = `${ev.discussionId}_${ev.event}`;

        await updateEventTracking(ev, ev.personId!, ['customKey']);
      }
    }
  }
}
