import { SendEmailCommand, SendEmailCommandInput, SESClient } from '@aws-sdk/client-ses';
import { Logger } from '../logger';
import { IConfig } from './config';

export async function sendEmail(config: IConfig, email: string, subject: string, message: string) {
  if (config.emailSender == null) throw Error('MS_SENDER_EMAIL and/or MS_SENDER_ARN not configured.');

  const client = new SESClient({ region: config.region });
  const input: SendEmailCommandInput = {
    Source: config.emailSender.address,
    SourceArn: config.emailSender.arn,
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: subject },
      Body: { Text: { Data: message } },
    },
  };
  try {
    const command = new SendEmailCommand(input);
    const data = await client.send(command);
    Logger.info('Email sent successfully', data);
  } catch (error) {
    Logger.error(error, 'Error sending email.');
  }
}

export async function sendEmailV1(
  config: IConfig,
  to: string | string[],
  subject: string,
  htmlBody?: string,
  textBody?: string,
): Promise<void> {
  if (config.emailSender == null) throw Error('MS_SENDER_EMAIL and/or MS_SENDER_ARN not configured.');

  const client = new SESClient({ region: config.region });
  const toAddresses = to instanceof Array ? to : [to];
  const params: SendEmailCommandInput = {
    Destination: {
      ToAddresses: toAddresses,
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: htmlBody,
        },
        Text: {
          Charset: 'UTF-8',
          Data: textBody,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
    },
    Source: config.emailSender.address,
    SourceArn: config.emailSender.arn,
  };

  try {
    const command = new SendEmailCommand(params);
    const data = await client.send(command);
    Logger.info('Email sent successfully', data);
  } catch (error) {
    Logger.error(error, 'Error sending email.');
  }
}
