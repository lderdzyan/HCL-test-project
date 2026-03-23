import { Option, fromNullable } from 'fp-ts/lib/Option';
import { SortKey, queryByAttr, createDocument, findByPartitionKey, updateDocument } from '.';
import { Application } from '../../entities/application';
import { IConfig } from '../config';

/*
 * attr1 (string) - name
 * attr2 (string) - path
 * attr3 (string) - createBy
 * attr4 (number) - createAt
 */
export async function loadApplicationByName(config: IConfig, name: string): Promise<Application | undefined> {
  const applications = await queryByAttr(
    config,
    'attr1',
    name,
    SortKey.Application,
    '#attr = :attrValue',
    'attr1-index',
  );

  if (applications.length === 0) return undefined;

  return applications[0];
}

export async function loadApplicationByPath(config: IConfig, path: string): Promise<Option<Application>> {
  const applications = await queryByAttr(
    config,
    'attr2',
    path,
    SortKey.Application,
    '#attr = :attrValue',
    'attr2-index',
  );

  return fromNullable(applications[0]);
}

export async function createApplication(config: IConfig, application: Application) {
  const document: Record<string, any> = { ...application };
  document._pk = application.id;
  document._sk = SortKey.Application;
  document.attr1 = application.name;
  document.attr2 = application.path;
  document.attr3 = application.createdBy;
  document.attr4 = application.createdAt;

  await createDocument(config, document);
}

export async function loadApplicationById(config: IConfig, id: string): Promise<Option<Application>> {
  return fromNullable(await findByPartitionKey(config, id, SortKey.Application));
}

export async function loadApplications(config: IConfig): Promise<Application[]> {
  const items = await queryByAttr(config, 'attr4', 0, SortKey.Application, '#attr > :attrValue', 'attr4-index');
  const applications: Application[] = [];

  for (const item of items) {
    applications.push(item);
  }

  return applications;
}
export async function updateApplication(config: IConfig, application: Application, fieldsToUpdate: string[]) {
  const document: Record<string, any> = { ...application };
  document._pk = application.id;
  document._sk = SortKey.Application;
  if (application.name != null) {
    document.attr1 = application.name;
    fieldsToUpdate.push('attr1');
  }
  if (application.path != null) {
    document.attr2 = application.path;
    fieldsToUpdate.push('attr2');
  }

  await updateDocument(config, document, fieldsToUpdate);
}
