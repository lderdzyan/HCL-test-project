import { Option, none, map, isSome, isNone } from 'fp-ts/lib/Option';
import * as TO from "fp-ts/TaskOption";
import * as T from "fp-ts/Task";
import { GuideDetails, GuideProfile, createDeletedGuide, deleteGuide, getGuideProfileByPid, updateGuideProfile } from '../entities/guide-profile';
import { FileUpload, getFileUploadById } from '../entities/file-upload';
import { pipe } from 'fp-ts/lib/function';
import { Person } from '../entities/person';

export namespace GuideController {
  export async function getGuideByPid(id: string): Promise<Option<GuideDetails>> {
    return await pipe(
      await getGuideProfileByPid(id),
      TO.fromOption,
      TO.chain((guide: GuideDetails) => pipe(
        getFilePathById(guide.profileImageId),
        TO.match(
          () => guide,
          (fileInfo) => {
            guide.profileImage = fileInfo.path;
            return guide;
          }
        ),
        TO.fromTask
      )),
      TO.chain((guide: GuideDetails) => pipe(
        getFilePathById(guide.welcomeMessageId),
        TO.match(
          () => guide,
          (fileInfo) => {
            guide.welcomeMessage = fileInfo.path;
            guide.welcomeMessageDuration = fileInfo.duration;
            return guide;
          }
        ),
        TO.fromTask
      ))
    )();
  }

  function getFilePathById(fileUploadId?: string): T.Task<Option<{ path: string, duration?: number }>> {
    return () => new Promise(resolve => {
      if (fileUploadId == null) return resolve(none);
      getFileUploadById(fileUploadId).then((fileUpload: Option<FileUpload>) => {
        resolve(pipe(
          fileUpload,
          map((fileUpload: FileUpload) => {
            const type = fileUpload.fileName.split('.').pop();
            return { path: `/${fileUpload.id!}.${type}`, duration: fileUpload.duration }
          }),
        ));
      });
    });
  }

  export async function getFilePathWithoutTask(id?: string) {
    if (id == null) return undefined;
    const fileO: Option<FileUpload> = await getFileUploadById(id);

    if (isSome(fileO)) {
      const file: FileUpload = fileO.value;
      const type = file.fileName.split('.').pop();
      return `/${file.id!}.${type}`
    }

    return undefined;
  }

  export async function updateGuideNames(person: Person) {
    const guideO: Option<GuideDetails> = await getGuideProfileByPid(person.id!);
    if (isSome(guideO)) {
      const guide = guideO.value;
      guide.firstName = person.firstName;
      guide.lastName = person.lastName;
      await updateGuideProfile(guide, person.id!, ['firstName', 'lastName']);
    }
  }

  export async function removeGuide(id: string) {
    const guide: Option<GuideProfile> = await getGuideProfileByPid(id);
    if (isSome(guide)) {
      await createDeletedGuide(guide.value);
      await deleteGuide(id);
    }
  }
}
