import config from '../../config';
import { Entity, currentAt, currentOn } from '../entity';
import * as AWSPerson from '../aws/dynamodb/person';
import { createId } from '@paralleldrive/cuid2';

/**
 * {@link Entity}
 * @property {string} firstName - person first name
 * @property {string} lastName - person last name
 * @property {string} middleName - person middle name
 * @property {string} nickname - person nickname
 * @property {string} bio - person bio
 * @property {string} image - person profile image file S3 relation
 * @property {string} spokenNameAudio - person spoken name file S3 relation
 */
export interface Person extends Entity {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  nickname?: string;
  bio?: string;
  image?: string;
  spokenNameAudio?: string;
}

export async function findPersonById(id: string): Promise<Person | undefined> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSPerson.findById(config.awsConfig!, id);
  }

  return undefined;
}

export async function createPerson(person: Person, pid: string): Promise<Person> {
  person.id = person.id ?? createId();
  person.createdBy = pid;
  person.createdAt = currentAt();
  person.createdOn = currentOn();
  person.updatedBy = person.createdBy;
  person.updatedAt = person.createdAt;
  person.updatedOn = person.createdOn;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSPerson.createPerson(config.awsConfig!, person);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return person;
}

export async function updatePerson(person: Person, pid: string, fieldsToUpdate: string[]): Promise<Person> {
  if (person.id == null) throw Error('Person must have `id`.');

  person.updatedBy = pid;
  person.updatedOn = currentOn();
  person.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSPerson.updatePerson(config.awsConfig!, person, fieldsToUpdate);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return person;
}
export function getFullName(person: Person): string {
  return (person?.firstName ?? '') + ' ' + (person?.lastName ?? '');
}
