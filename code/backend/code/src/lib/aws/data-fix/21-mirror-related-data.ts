import { isNone, isSome, Option } from 'fp-ts/lib/Option';
import { Application, createApplication, findApplicationByPath } from '../../entities/application';
import { createSurvey, Survey } from '../../entities/survey';
import { createSurveyApplication } from '../../entities/survey-application';

export namespace MirrorApplicationMigration {
  export async function addApplications(pid: string) {
    const applications: Application[] = (await import('../../../assets/applications-v3.json')).default as Application[];

    for (const item of applications) {
      const app: Option<Application> = await findApplicationByPath(item.path!);
      if (isNone(app)) await createApplication(item, pid);
    }

    // create application survey relation for mwi survey json
    const mwiApplicationO: Option<Application> = await findApplicationByPath("/tools/mirrors");
    if (isSome(mwiApplicationO)) {
      const app: Application = mwiApplicationO.value;

      const survey: Survey = await createSurvey({ id: "cma3v29ue000m0cl59b4q5jwb", path: '/survey/mirror.json', name: 'Mirror reflection' }, pid);

      await createSurveyApplication({ applicationId: app.id!, surveyId: survey.id! }, pid);
    }
  }
}
