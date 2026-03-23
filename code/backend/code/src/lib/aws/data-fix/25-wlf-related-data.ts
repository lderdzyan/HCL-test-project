import { Application, createApplication } from '../../entities/application';
import { createSurvey, Survey } from '../../entities/survey';
import { createSurveyApplication } from '../../entities/survey-application';

export namespace WlfApplicationMigration {
  export async function addApplications(pid: string) {
    const applications: Application[] = (await import('../../../assets/applications-v4.json')).default as Application[];

    for (const item of applications) {
      await createApplication(item, pid);
    }

    // create application survey relation for wlf survey json
    const app: Application = applications[0];

    const survey: Survey = await createSurvey(
      { id: 'cmck98wlt000607le3nn88vk2', path: '/survey/fulfillment.json', name: 'WorkLife Fulfillment' },
      pid,
    );

    await createSurveyApplication({ applicationId: app.id!, surveyId: survey.id! }, pid);
  }
}
