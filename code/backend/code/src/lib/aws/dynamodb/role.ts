import { Option, fromNullable } from 'fp-ts/lib/Option';
import { SortKey, queryByAttr, createDocument, findByPartitionKey } from '.';
import { IConfig } from '../config';
import { Role } from '../../entities/role';

/*
 * attr1 (string) - name
 * attr4 (number) - createAt
 */
export async function loadRoleByName(config: IConfig, name: string): Promise<Role | undefined> {
  const roles = await queryByAttr(config, 'attr1', name, SortKey.Role, '#attr = :attrValue', 'attr1-index');

  if (roles.length === 0) return undefined;

  return roles[0];
}

export async function createRole(config: IConfig, role: Role) {
  const document: Record<string, any> = { ...role };
  document._pk = role.id;
  document._sk = SortKey.Role;
  document.attr1 = role.name;
  document.attr4 = role.createdAt;

  await createDocument(config, document);
}

export async function loadRoleById(config: IConfig, id: string): Promise<Option<Role>> {
  return fromNullable(await findByPartitionKey(config, id, SortKey.Role));
}

export async function loadRoles(config: IConfig): Promise<Role[]> {
  const items = await queryByAttr(config, 'attr4', 0, SortKey.Role, '#attr > :attrValue', 'attr4-index');
  const roles: Role[] = [];

  for (const item of items) {
    roles.push(item);
  }

  return roles;
}
