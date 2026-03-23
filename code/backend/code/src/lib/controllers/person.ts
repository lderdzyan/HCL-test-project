import { findPersonById, Person, updatePerson } from '../entities/person';
import * as TE from 'fp-ts/TaskEither';
import { Option, fromNullable } from 'fp-ts/lib/Option';
import { EventTracking, EventType, findAllOfTypeByPersonIdWithoutName } from '../entities/event-tracking';
import { publishMessage } from '../publish-message';
import { respond } from '../request';
import { EventActionType } from '../constants';

export namespace PersonController {
  export async function personNamesUpdate(firstName: string, lastName: string, personId: string) {
    const person: Person | undefined = await findPersonById(personId);

    if (!person) return;

    person.firstName = firstName;
    person.lastName = lastName;
    await updatePerson(person, personId, ['firstName', 'lastName']);

    const reportEvents: EventTracking[] = await findAllOfTypeByPersonIdWithoutName(
      personId,
      EventType.PromoCodeUsageEvent,
    );
    if (reportEvents.length > 0) {
      for (const eventData of reportEvents) {
        eventData.firstName = firstName;
        eventData.lastName = lastName;
        await publishMessage(
          'event-tracking',
          respond(
            {
              e: {
                type: EventType.PromoCodeUsageEvent,
                eventTracking: eventData,
                fieldsToUpdate: ['firstName', 'lastName'],
                action: EventActionType.Update,
              },
            },
            { pid: personId },
          ),
        );
      }
    }
  }

  export const getPersonById = (personId: string): TE.TaskEither<Error, Option<Person>> =>
    TE.tryCatch(
      async () => fromNullable(await findPersonById(personId)),
      (error) => error as Error,
    );
}
