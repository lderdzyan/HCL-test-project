import config from '../../config';
import { createEventBridgeScheduler, deleteEventBridgeScheduler } from '../aws/eventBridge';

export namespace SchedulerController {
  export enum SchedulerAction {
    SendEmail,
  }

  export interface ICreateSchedule {
    scheduleName: string;
    scheduleTime: string;
    lambdaArn: string;
    action: SchedulerAction;
    detail?: Record<string, unknown>;
  }
  export async function createSchedule(data: ICreateSchedule): Promise<void> {
    switch (config.deploymenEnv) {
      case 'aws':
        await createEventBridgeScheduler(config.awsConfig!, data);
        break;
      case 'azure':
        throw Error('Not implemented yet.');
    }
  }

  //Deleted scheduled event
  export async function deleteSchedule(scheduleName: string): Promise<void> {
    switch (config.deploymenEnv) {
      case 'aws':
        await deleteEventBridgeScheduler(config.awsConfig!, scheduleName);
        break;
      case 'azure':
        throw Error('Not implemented yet.');
    }
  }

  export async function updateSchedule(
    oldScheduleName: string,
    newScheduleName: string,
    scheduleTime: string,
    lambdaArn: string,
    action: SchedulerAction,
    detail: Record<string, unknown>,
  ): Promise<void> {
    try {
      // Delete the old schedule
      await deleteSchedule(oldScheduleName);

      // Create the new schedule
      await createSchedule({ scheduleName: newScheduleName, scheduleTime, lambdaArn, detail, action });

      console.log(`Schedule updated from ${oldScheduleName} to ${newScheduleName}`);
    } catch (error) {
      console.error('Failed to update schedule:', error);
      throw error;
    }
  }

  export async function sendReminderEmail(scheduleName: string, scheduleTime: string, data: Record<string, unknown>) {
    const lambdaArn = process.env.AWS_EVENT_BRIDGE_LAMBDA_ARN;

    try {
      // Create a schedule
      if (lambdaArn) {
        await createSchedule({
          scheduleName,
          scheduleTime,
          lambdaArn,
          detail: data,
          action: SchedulerAction.SendEmail,
        });
        console.log('Reminder scheduled successfully.');
      }
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
    }
  }
}
