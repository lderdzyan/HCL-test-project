import { Application, createApplication } from '../../entities/application';

export namespace DashboardAppMigration {
  export async function addApplications(pid: string) {
    const applications: Application[] = (await import('../../../assets/applications-v6.json')).default as Application[];

    for (const item of applications) {
      await createApplication(item, pid);
    }
  }
}
