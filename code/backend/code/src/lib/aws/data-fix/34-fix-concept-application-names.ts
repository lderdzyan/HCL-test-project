import { findApplicationById, updateApplication } from '../../entities/application';
import { findSurveyById, updateSurvey } from '../../entities/survey';
import { isSome } from 'fp-ts/lib/Option';

export namespace FixConceptApplicationNames {
  export async function renameApplications() {
    // cli command migrate renameConceptAppNaming

    // mom -> builder
    const builderApplication = await findApplicationById('cmdfs3g5z000007l17s5g5qvu');

    if (isSome(builderApplication)) {
      builderApplication.value.name = 'worklife-fulfillment-builder';
      await updateApplication(builderApplication.value, builderApplication.value.createdBy!, ['name']);
    }

    const builderSurvey = await findSurveyById('cmdfst7us000007jrbkv2hxjh');

    if (builderSurvey != null) {
      builderSurvey.path = '/survey/builder.json';
      builderSurvey.name = 'Worklife Fulfillment Builder';
      await updateSurvey(builderSurvey, builderSurvey.createdBy!, ['path', 'name']);
    }

    //wlf -> indicator
    const indicatorApplication = await findApplicationById('cmck95v2h000107lefqcahgof');

    if (isSome(indicatorApplication)) {
      indicatorApplication.value.name = 'worklife-fulfillment-indicator';
      await updateApplication(indicatorApplication.value, indicatorApplication.value.createdBy!, ['name']);
    }

    const indicatorSurvey = await findSurveyById('cmck98wlt000607le3nn88vk2');

    if (indicatorSurvey != null) {
      indicatorSurvey.path = '/survey/indicator.json';
      indicatorSurvey.name = 'Worklife Fulfillment Indicator';
      await updateSurvey(indicatorSurvey, indicatorSurvey.createdBy!, ['path', 'name']);
    }
  }
}
