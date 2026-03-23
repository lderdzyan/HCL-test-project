import { fromNullable, Option } from 'fp-ts/lib/Option';
import { findUserByIdentity } from '../entities/user-profile';
import { createEmail } from '../entities/email';
import { createMfaProfile, findMfaProfileByPersonId, MfaProfile } from '../entities/mfa-profile';
import * as randomstring from 'randomstring';
import * as TE from 'fp-ts/TaskEither';
import { findDemographicDataByPid } from '../entities/demographic-data';
import { Person } from '../entities/person';
import { AssignmentTargetType, UserType } from '../constants';
import { findAllUsersByPid, UserProfile } from '../entities/user-profile';
import { Application, findApplicationById, loadApplications } from '../entities/application';
import {
  ApplicationUser,
  createApplicationUser,
  createApplicationUserObject,
  findApplicationUserByUserId,
} from '../entities/application-user';
import { IndicatorController } from './wlf-indicator';
import { checkForPendingSurveyReportEffect } from './survey-answer';
import { Effect, pipe } from 'effect';
import { findRoleById, loadRoles, Role } from '../entities/role';
import {
  createRoleAssignedUserObject,
  createUserRole,
  deleteRoleAssigned,
  RoleAssignedUser,
} from '../entities/role-assigned-user';
import * as O from 'fp-ts/Option';
import { SurveyType } from '../entities/survey';
import { WlfBuilderController } from './wlf-builder';
import { createOrgAssignedUserObject, createUserOrganization } from '../entities/org-assigned-user';

export namespace UserController {
  export async function findUserByIdentityOption(email: string): Promise<Option<UserProfile>> {
    return fromNullable((await findUserByIdentity(email)) as UserProfile);
  }

  export async function createMfaAndEmailIfNeeded(personId: string, email: string): Promise<MfaProfile> {
    let mfaProfile = await findMfaProfileByPersonId(personId);

    if (mfaProfile == null) {
      mfaProfile = await createMfaProfile(
        {
          personId,
          secret: randomstring.generate(),
        },
        personId,
      );

      await createEmail(
        {
          emailAddr: email,
          mfaProfileId: mfaProfile.id!,
          active: false,
        },
        personId,
      );
    }

    return mfaProfile;
  }

  export async function getUserAssignees(userId: string) {
    const assignees: ApplicationUser[] | RoleAssignedUser[] = await findApplicationUserByUserId(userId);
    const applicationPaths = await getAssigneesByType(assignees, AssignmentTargetType.Application);
    const roles = await getAssigneesByType(assignees, AssignmentTargetType.Role);
    return {
      [AssignmentTargetType.Application]: applicationPaths,
      [AssignmentTargetType.Role]: roles,
      [AssignmentTargetType.Organization]: [],
    };
  }

  export async function checkUserRole(userId: string, userType: UserType): Promise<boolean> {
    const assignees: ApplicationUser[] | RoleAssignedUser[] = await findApplicationUserByUserId(userId);
    const roles = await getAssigneesByType(assignees, AssignmentTargetType.Role);
    return roles.includes(userType);
  }

  async function getAssigneesByType(
    assignees: Array<ApplicationUser | RoleAssignedUser>,
    type: AssignmentTargetType,
  ): Promise<string[]> {
    const ids = assignees
      .filter((a) => a.assignmentTargetType === type)
      .map((a) => a.id)
      .filter((x): x is string => !!x);

    if (ids.length === 0) return [];

    const fetcher = type === AssignmentTargetType.Application ? findApplicationById : findRoleById;

    const extract = (opt: O.Option<any>): string | undefined => {
      if (O.isSome(opt)) {
        return type === AssignmentTargetType.Application ? opt.value?.path : opt.value?.name;
      }
      return undefined;
    };

    const results = await Promise.all(ids.map((id) => fetcher(id)));

    const values = results.map(extract).filter((s): s is string => !!s);
    return [...new Set(values)];
  }

  export async function getMainInfo(
    user: UserProfile,
    person?: Person,
    userAssignments?: Record<AssignmentTargetType, string[]>,
  ) {
    const demographicData = await findDemographicDataByPid(user.personId);

    return {
      id: user.personId,
      firstName: person?.firstName,
      lastName: person?.lastName,
      username: user.username,
      country: user.country,
      mfaOptout: user.mfaOptout ?? false,
      userTypes: userAssignments?.role ?? ['MS_EXPLORER'],
      msWebAdmin: user.msWebAdmin,
      demographicDate: demographicData?.createdAt,
      isPasswordSet: !!user.pwd,
      countrySetDate: user.countrySetDate,
      mfaOptoutSetDate: user.mfaOptoutSetDate,
      isB2b2c: user.isB2b2c,
      appList: userAssignments?.application,
    };
  }

  export async function checkUserTypeAndGetEmail(personId?: string, userType?: UserType): Promise<string | undefined> {
    if (personId == null || userType == null) return undefined;

    const userDetails = await findAllUsersByPid(personId);
    let responseData: UserProfile | undefined;
    for (const user of userDetails) {
      if (await checkUserRole(user.id!, userType)) {
        responseData = user;
        break;
      }
    }

    return responseData != null ? responseData.email : undefined;
  }

  export const getUsersByPersonId = (personId: string): TE.TaskEither<Error, UserProfile[]> =>
    TE.tryCatch(
      async () => await findAllUsersByPid(personId),
      (error) => error as Error,
    );

  export async function assignUserToApplications(user: UserProfile, userApps: string[]) {
    const applications: Application[] = await loadApplications();

    const userApplications = applications.filter((item: Application) => userApps.includes(item.name!));
    const userAssignee = createInsertItem(user, userApplications);
    for (const ua of userAssignee) {
      await createApplicationUser(ua);
    }
  }

  export async function assignUserToOrganization(user: UserProfile) {
    //TODO need to be changed when the organization will be stored in db.
    const msOrganization = 'cmfuyw24n000104l13nym9kqj';
    const bcOrganization = 'cmfv1rgkj000c04l71260g1y3';
    await createUserOrganization(
      createOrgAssignedUserObject({
        assignmentTargetId: user.isB2b2c ? bcOrganization : msOrganization,
        subjectId: user.id,
      }),
    );
  }

  export async function assignUserToRoles(user: UserProfile, userRoles: UserType[]) {
    const roles: Role[] = await loadRoles();

    const assignRoles = roles.filter((item: Role) => userRoles.includes(item.name!));
    const userAssignee = assignRoles.map((item) =>
      createRoleAssignedUserObject({
        assignmentTargetId: item.id!,
        subjectId: user.id,
      }),
    );
    for (const ua of userAssignee) {
      await createUserRole(ua);
    }
  }

  export async function unassignUserToRoles(user: UserProfile, userRoles: UserType[]) {
    const roles: Role[] = await loadRoles();

    const rolesToUnassign = roles.filter((item: Role) => userRoles.includes(item.name!));
    for (const ua of rolesToUnassign) {
      await deleteRoleAssigned(ua.id!, user.id!);
    }
  }

  export function createInsertItem(user: UserProfile, applications: Application[]): ApplicationUser[] {
    const applicationsId = applications.map((item) => item.id!);

    const items: ApplicationUser[] = [];
    for (const id of applicationsId) {
      items.push(
        createApplicationUserObject({
          assignmentTargetId: id,
          subjectId: user.id,
        }),
      );
    }

    return items;
  }

  export function sendEmailWhileRegistration(userDetail: UserProfile): Effect.Effect<unknown, Error, void> {
    return pipe(
      userDetail.isB2b2c ? checkForPendingSurveyReportEffect(userDetail) : Effect.void,
      Effect.flatMap(() =>
        Effect.all(
          [
            IndicatorController.sendEmailIfNotSent(userDetail.personId),
            WlfBuilderController.sendEmailIfNotSent(userDetail.personId),
          ],
          { discard: true },
        ),
      ),
    );
  }

  export const getProcessingWLFAndWorkbook = (
    pid: string,
  ): Effect.Effect<{ type: SurveyType; id: string }[], Error, never> =>
    pipe(
      Effect.all({
        wlf: IndicatorController.getPendingIndicator(pid),
        wlfTraining: IndicatorController.getPendingIndicatorTrainingPlan(pid),
        builder: WlfBuilderController.getPendingWlfBuilder(pid),
        builderWorkbook: WlfBuilderController.getPendingWlfBuilderWorkbook(pid),
      }),
      Effect.map(({ wlf, wlfTraining, builder, builderWorkbook }) => {
        const toDoSurveys: { type: SurveyType; id: string }[] = [];

        if (O.isSome(wlf)) toDoSurveys.push({ type: SurveyType.WLF, id: pid });
        if (O.isSome(wlfTraining)) toDoSurveys.push({ type: SurveyType.WLF, id: pid });
        if (O.isSome(builder)) toDoSurveys.push({ type: SurveyType.WlfBuilder, id: pid });
        if (O.isSome(builderWorkbook)) toDoSurveys.push({ type: SurveyType.WlfBuilder, id: pid });

        return toDoSurveys;
      }),
    );
}
