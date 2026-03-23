import { createRole, Role } from '../../entities/role';

export namespace RoleMigration {
  export async function addRoles(pid: string) {
    const applications: Role[] = (await import('../../../assets/roles.json')).default as Role[];

    for (const item of applications) {
      await createRole(item, pid);
    }
  }
}
