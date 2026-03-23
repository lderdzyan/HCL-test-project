import { IConfig } from '../config';
import { Email } from '../../entities/email';
import { SortKey, scanData, updateDocument } from '../dynamodb';
import { SurveyAnswer } from '../../entities/survey-answer';
import { currentAt, currentOn } from '../../entity';
import { Person } from '../../entities/person';
import { MfaProfile } from '../../entities/mfa-profile';
import { SurveyDemographicData } from '../../entities/demographic-data';
import { Logger } from '../../logger';
import { UserProfile } from '../../entities/user-profile';

export async function migrateData(config: IConfig) {
  const items = await scanData(config);
  const surveyAnswers = items.filter(item => item._sk == SortKey.SurveyAnswer).map(_fixSurveyAnswer);
  const personIdCreated = new Map<string, number>();
  for (const item of surveyAnswers) {
    const answer = item as SurveyAnswer;
    if (answer != null && answer.personId != null && answer.createdAt != null) {
      personIdCreated.set(answer.personId, answer.createdAt);
    }
  }
  const mfaProfiles = items.filter(item => item._sk == SortKey.MfaProfile).map(item => _fixMfaProfile(item, personIdCreated));
  const mfaProfileCreated = new Map<string, { personId: string, created: number }>();
  for (const item of mfaProfiles) {
    const mfaProfile = item as MfaProfile;
    if (mfaProfile != null && mfaProfile.id != null && mfaProfile.personId != null && mfaProfile.createdAt != null) {
      mfaProfileCreated.set(mfaProfile.id, { personId: mfaProfile.personId, created: mfaProfile.createdAt });
    }
  }
  const emailDetails = items.filter(item => item._sk == SortKey.Email).map(item => _fixEmail(item, mfaProfileCreated));
  const personDetails = items.filter(item => item._sk == SortKey.Person).map(item => _fixPerson(item, personIdCreated));
  const demographicDatas = items.filter(item => item._sk == SortKey.DemographicData).map(_fixDemographicData);
  const userDetails = items.filter(item => item._sk == SortKey.UserProfile).map(item => _fixUserDetails(item, personIdCreated));

  Logger.info(`Starting to update Survey Answers, count: ${surveyAnswers.length}.`);
  for (const answer of surveyAnswers) {
    if (answer == null) continue;
    await updateSurveyAnswers(config, answer);
  }
  Logger.info('Done Survey Answers update.');
  Logger.info(`Starting to update Emails, count: ${emailDetails.length}.`);
  for (const email of emailDetails) {
    if (email == null) continue;
    await updateEmailData(config, email);
  }
  Logger.info('Done Emails update.');
  Logger.info(`Starting to update Persons, count: ${personDetails.length}.`);
  for (const person of personDetails) {
    if (person == null) continue;
    await updatePerson(config, person);
  }
  Logger.info('Done Persons update.');
  Logger.info(`Starting to update MfaProfiles, count: ${mfaProfiles.length}.`);
  for (const mfaProfile of mfaProfiles) {
    if (mfaProfile == null) continue;
    await updateMfaProfile(config, mfaProfile);
  }
  Logger.info('Done MfaProfiles update.');
  Logger.info(`Starting to update Demographic Data, count: ${demographicDatas.length}.`);
  for (const data of demographicDatas) {
    if (data == null) continue;
    await updateDemographicData(config, data);
  }
  Logger.info('Done Demographic Data update.');
  Logger.info(`Starting to update User Details, count: ${userDetails.length}.`);
  for (const data of userDetails) {
    if (data == null) continue;
    await updateUserDetails(config, data);
  }
  Logger.info('Done User Details update.');
}
// survey answers
function _fixSurveyAnswer(item: Record<string, any>): SurveyAnswer | undefined {
  const data = item as SurveyAnswer;

  if (data.id != null && data.surveyId != null && data.createdBy != null && data.purchaseDate != null
    && data.createdAt != null && data.createdOn != null) return undefined;

  data.id = item._pk;
  data.surveyId = item.attr1;
  data.personId = item.attr2;
  data.createdBy = item.attr2;
  if (item.attr4 != null) {
    data.purchaseDate = item.attr4;
    data.createdAt = item.attr4;
    data.createdOn = new Date(item.attr4).toISOString().substring(0, 10);
  }

  return data;
}
async function updateSurveyAnswers(config: IConfig, data: SurveyAnswer) {
  const document: Record<string, any> = { ...data };
  document.attr3 = data.createdBy;

  document.updatedBy = data.createdBy;
  document.updatedOn = currentOn();
  document.updatedAt = currentAt();

  const attributesToUpdate = ['surveyId', 'personId', 'createdBy', 'attr3', 'id'];
  if (data.purchaseDate != null) {
    attributesToUpdate.push('createdOn');
    attributesToUpdate.push('purchaseDate');
    attributesToUpdate.push('createdAt');
  }

  await updateDocument(config, document, attributesToUpdate);
}

// emails
function _fixEmail(item: Record<string, any>, mfaProfiles: Map<string, { personId: string, created: number }>): Email | undefined {
  const data = item as Email;

  if (data.id != null && data.emailAddr != null && data.mfaProfileId != null && data.createdBy != null
    && data.createdAt != null && data.createdOn != null) return undefined;

  data.id = item._pk
  data.emailAddr = item.attr1;
  data.mfaProfileId = item.attr2;

  if (mfaProfiles.has(item.attr2)) {
    data.createdBy = mfaProfiles.get(item.attr2)?.personId;
    data.createdAt = mfaProfiles.get(item.attr2)?.created;
    if (data.createdAt != null) {
      data.createdOn = new Date(data.createdAt).toISOString().substring(0, 10);
    }
  }

  return data;
}
async function updateEmailData(config: IConfig, data: Email) {
  const document: Record<string, any> = { ...data };
  document.id = data.id;

  document.updatedOn = currentOn();
  document.updatedAt = currentAt();
  const attributesToUpdate = ['emailAddr', 'mfaProfileId', 'id'];
  if (data.createdBy != null) {
    document.updatedBy = data.createdBy;
    attributesToUpdate.push('createdOn');
    attributesToUpdate.push('createdBy');
    attributesToUpdate.push('createdAt');
  }

  if (document.updatedBy != null) {
    await updateDocument(config, document, attributesToUpdate);
  }
}

// person
function _fixPerson(item: Record<string, any>, persons: Map<string, number>): Person | undefined {
  const data = item as Person;

  if (data.id != null && data.createdBy != null && data.createdAt != null && data.createdOn != null) return undefined;

  data.id = item._pk
  data.createdBy = item._pk;
  if (persons.has(item._pk)) {
    data.createdAt = persons.get(item._pk);
    if (data.createdAt != null) {
      data.createdOn = new Date(data.createdAt).toISOString().substring(0, 10);
    }
  }

  return data;
}
async function updatePerson(config: IConfig, data: Person) {
  const document: Record<string, any> = { ...data };
  document.attr3 = data.createdBy;

  document.updatedBy = data.createdBy;
  document.updatedOn = currentOn();
  document.updatedAt = currentAt();
  const attributesToUpdate = ['createdBy', 'attr3', 'id'];
  if (data.createdAt != null) {
    document.attr4 = data.createdAt;
    attributesToUpdate.push('createdOn');
    attributesToUpdate.push('attr4');
    attributesToUpdate.push('createdAt');
  }

  await updateDocument(config, document, attributesToUpdate);
}

// mfaProfile
function _fixMfaProfile(item: Record<string, any>, persons: Map<string, number>): MfaProfile | undefined{
  const data = item as MfaProfile;

  if (data.id != null && data.personId != null && data.createdBy != null && data.createdAt != null && data.createdOn != null) return undefined;

  data.id = item._pk
  data.personId = item.attr1;
  data.createdBy = item.attr1;
  if (persons.has(item.attr1)) {
    data.createdAt = persons.get(item.attr1);
    if (data.createdAt != null) {
      data.createdOn = new Date(data.createdAt).toISOString().substring(0, 10);
    }
  }

  return data;
}
async function updateMfaProfile(config: IConfig, data: MfaProfile) {
  const document: Record<string, any> = { ...data };
  document.attr3 = data.createdBy;

  document.updatedBy = data.createdBy;
  document.updatedOn = currentOn();
  document.updatedAt = currentAt();

  const attributesToUpdate = ['createdBy', 'attr3', 'id', 'personId'];
  if (data.createdAt != null) {
    document.attr4 = data.createdAt;
    attributesToUpdate.push('createdOn');
    attributesToUpdate.push('attr4');
    attributesToUpdate.push('createdAt');
  }

  await updateDocument(config, document, attributesToUpdate);
}

// demographic data
function _fixDemographicData(item: Record<string, any>): SurveyDemographicData | undefined {
  const data = item as SurveyDemographicData;

  if (data.id != null && data.personId != null && data.reported != null) return undefined;

  data.id = item._pk
  data.personId = item.pid;
  data.reported = 'no';

  return data;
}
async function updateDemographicData(config: IConfig, data: SurveyDemographicData) {
  const document: Record<string, any> = { ...data };
  document.attr1 = data.personId;
  document.attr2 = data.reported;

  document.updatedBy = data.createdBy;
  document.updatedOn = currentOn();
  document.updatedAt = currentAt();

  await updateDocument(config, document, ['reported', 'personId', 'attr1', 'attr2', 'id']);
}

// user details
function _fixUserDetails(item: Record<string, any>, persons: Map<string, number>): UserProfile | undefined {
  const data = item as UserProfile;

  if (data.id != null && data.username != null && data.personId != null && data.email != null
    && data.createdBy != null && data.createdAt != null && data.createdOn != null) return undefined;

  data.id = item._pk;
  data.username = item.attr1;
  data.personId = item.attr2;
  data.email = item.attr3;
  data.createdBy = item.attr2;

  if (persons.has(item.attr2)) {
    data.createdAt = persons.get(item.attr2);
    if (data.createdAt != null) {
      data.createdOn = new Date(data.createdAt).toISOString().substring(0, 10);
    }
  }

  return data;
}
async function updateUserDetails(config: IConfig, data: UserProfile) {
  const document: Record<string, any> = { ...data };

  document.updatedBy = data.createdBy;
  document.updatedOn = currentOn();
  document.updatedAt = currentAt();

  const attributesToUpdate = ['createdBy', 'username', 'id', 'personId', 'email'];
  if (data.createdAt != null) {
    document.attr4 = data.createdAt;
    attributesToUpdate.push('createdOn');
    attributesToUpdate.push('attr4');
    attributesToUpdate.push('createdAt');
  }

  await updateDocument(config, document, attributesToUpdate);
}
