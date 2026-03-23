import { Option } from 'fp-ts/lib/Option';
import { Application, createApplication, findApplicationById, findApplicationByPath, loadApplications } from '../entities/application';
import { Survey, findSurveyById } from '../entities/survey';
import { SurveyApplication, createSurveyApplication, findSurveysByApplicationId, removeSurveyFromApplication } from '../entities/survey-application';

export namespace ApplicationController {
  export async function saveApplication(application: Application, pid: string) {
    await createApplication(application, pid);
  }

  export async function applications(): Promise<Application[]> {
    return loadApplications();
  }

  export async function getApplication(id: string): Promise<Option<Application>> {
    return findApplicationById(id);
  }

  export async function getApplicationByPath(path: string): Promise<Option<Application>> {
    return findApplicationByPath(path);
  }

  export async function getSurveysForApplication(id: string): Promise<Survey[]> {
    const surveyApplications: SurveyApplication[] = await findSurveysByApplicationId(id);

    const surveys: Survey[] = [];
    for (const item of surveyApplications) {
      const survey: Survey | undefined = await findSurveyById(item.surveyId);
      if (survey != null) surveys.push(survey);
    }

    return surveys;
  }

  export async function addSurvayToApplication(applicationId: string, surveyId: string, pid: string) {
    await createSurveyApplication({ applicationId, surveyId }, pid);
  }

  export async function deleteSurveyFromApplicaton(applicationId: string, surveyId: string) {
    const surveyApplications: SurveyApplication[] = await findSurveysByApplicationId(applicationId);
    const surveyApplication: SurveyApplication | undefined = surveyApplications.find((item: SurveyApplication) => item.surveyId === surveyId);

    if (surveyApplication != null) await removeSurveyFromApplication(surveyApplication.id!);
  }
}
