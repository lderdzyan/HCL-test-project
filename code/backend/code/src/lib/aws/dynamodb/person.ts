import { SortKey, createDocument, findByPartitionKey, updateDocument } from '.';
import { Person } from '../../entities/person';
import { IConfig } from '../config';

/*
 * attr3 (string) - createdBy
 * attr4 (number) - createdAt
 */
export async function findById(config: IConfig, id: string): Promise<Person | undefined> {
  return _fixAttributes(await findByPartitionKey(config, id, SortKey.Person));
}

export async function createPerson(config: IConfig, person: Person) {
  const document: Record<string, any> = { ...person };
  document._pk = person.id;
  document._sk = SortKey.Person;
  document.attr3 = person.createdBy;
  document.attr4 = person.createdAt;

  await createDocument(config, document);
}

export async function updatePerson(config: IConfig, person: Person, fieldsToUpdate: string[]) {
  const document: Record<string, any> = { ...person };
  document._pk = person.id;
  document._sk = SortKey.Person;

  await updateDocument(config, document, fieldsToUpdate);
}
function _fixAttributes(item?: Record<string, any>): Person | undefined {
  if (item == null) return undefined;

  const data = item as Person;

  if (data.id == null) data.id = item._pk;
  if (data.createdBy == null) data.createdBy = item.attr3;
  if (data.createdAt == null) data.createdAt = item.attr4;

  return data;
}
