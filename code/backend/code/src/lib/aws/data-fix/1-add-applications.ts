import { Option, isNone, isSome } from 'fp-ts/lib/Option';
import { Application, createApplication, findApplicationByPath } from '../../entities/application';
import { createSurveyApplication } from '../../entities/survey-application';
import { Survey, createSurvey } from '../../entities/survey';

export namespace ApplicationMigration {
  export async function addApplications(pid: string) {
    const applications: Application[] = (await import('../../../assets/applications.json')).default as Application[];

    for (const item of applications) {
      const app: Option<Application> = await findApplicationByPath(item.path!);
      if (isNone(app)) await createApplication(item, pid);
    }

    // create application survey relation for mwi survey json
    const mwiApplicationO: Option<Application> = await findApplicationByPath("/tools/mwi");
    if (isSome(mwiApplicationO)) {
      const app: Application = mwiApplicationO.value;

      const survey: Survey = await createSurvey({ id: "qi86gc3pwiz5lw8zjf2gqbcu", path: '/survey/mwi.json', name: 'Meaningful Work Inventory' }, pid);

      await createSurveyApplication({ applicationId: app.id!, surveyId: survey.id! }, pid);
    }
  }
}
