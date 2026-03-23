import { FileUploadTypes } from "../../constants";
import { GuideController } from "../../controllers/guide";
import { FileUpload, getAllFilesByType, updateFileUplaod } from "../../entities/file-upload";
import { getFileFromStorage } from "../../file-upload";
const { getAudioDurationInSeconds } = require('get-audio-duration')
import * as fs from 'fs';

export namespace AudioFileDurationMigration {
  export async function addAudioFileDuration() {
    const videoFiles: FileUpload[] = await getAllFilesByType(FileUploadTypes.WelcomeMessageAudio);
    const videoFilesWithoutDuration = videoFiles.filter(item => item.duration == null);
    try {
      console.log(videoFiles.length, videoFilesWithoutDuration.length);
      for (const videoFile of videoFilesWithoutDuration) {
        const path = await GuideController.getFilePathWithoutTask(videoFile.id!);
        const file = await getFileFromStorage({ filePath: `uploads${path!}`, filename: videoFile.fileName });

        if (file != null && fs.existsSync(file)) {
          getAudioDurationInSeconds(file).then(async (duration: number) => {
            videoFile.duration = duration;
            await updateFileUplaod(videoFile, videoFile.personId, ['duration']);
          }).catch(async (err: any) => {
            console.log(err);
            videoFile.duration = 0;
            await updateFileUplaod(videoFile, videoFile.personId, ['duration']);
          });
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
}
