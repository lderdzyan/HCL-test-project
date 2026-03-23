import {
  CreateScheduleCommand,
  CreateScheduleCommandInput,
  DeleteScheduleCommand,
  DeleteScheduleCommandInput,
  SchedulerClient,
} from '@aws-sdk/client-scheduler';
import { IConfig } from './config';
import { SchedulerController } from '../controllers/scheduler';

export async function createEventBridgeScheduler(config: IConfig, data: SchedulerController.ICreateSchedule) {
  const client = new SchedulerClient({ region: config.region });
  const input: CreateScheduleCommandInput = {
    Name: data.scheduleName,
    GroupName: 'default',
    ScheduleExpression: data.scheduleTime,
    FlexibleTimeWindow: { Mode: 'OFF' }, // Exact trigger time
    ActionAfterCompletion: 'DELETE',
    Target: {
      Arn: data.lambdaArn,
      RoleArn: config.eventBridgeArn,
      Input: JSON.stringify({
        action: data.action,
        eventData: data.detail,
      }),
    },
  };

  try {
    const command = new CreateScheduleCommand(input);
    const response = await client.send(command);
    console.log('Schedule created:', response);
  } catch (error) {
    console.error('Failed to create schedule:', error);
    throw error;
  }
}
export async function deleteEventBridgeScheduler(config: IConfig, scheduleName: string) {
  const client = new SchedulerClient({ region: config.region });
  // Create the input object with the correct type
  const input: DeleteScheduleCommandInput = {
    Name: scheduleName, // The name of the schedule to delete
    GroupName: 'default',
  };

  const params = new DeleteScheduleCommand(input);

  try {
    const result = await client.send(params);
    console.log(`Schedule deleted: ${scheduleName}`, result);
  } catch (error) {
    console.error(`Failed to delete schedule ${scheduleName}:`, error);
  }
}
// Function to add minutes to the current time and return a valid Scheduler expression
export function addMinutesToTimeForScheduler(existingTime: number, minutes: number): string {
  const discussionDate = new Date(existingTime);
  discussionDate.setMinutes(discussionDate.getMinutes() + minutes); // Add the minutes
  discussionDate.setSeconds(0); // Set seconds to 00 (required for Scheduler)

  // Format the date as ISO string without milliseconds
  const formattedDate = discussionDate.toISOString().split('.')[0]; // Remove milliseconds
  return `at(${formattedDate})`; // Wrap in at() expression for Scheduler
}
