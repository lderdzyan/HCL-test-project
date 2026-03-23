import { IConfig } from '.';
import { IConfig as AwsConfig } from './aws/config';
import * as ses from './aws/ses';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import { Logger } from './logger';

export type Template = 'text' | 'moss-survey-report';

export interface IEmailMessage {
  to: string[];
  subject: string;
  template: Template;
  data?: Record<string, string | number>;
}

async function compileTemplate(
  templateName: string,
  data?: Record<string, string | number>,
): Promise<string | undefined> {
  try {
    const templateSource: string = await fs.readFile(`${__dirname}/../../templates/email/${templateName}.hbs`, 'utf8');
    const template = handlebars.compile(templateSource);
    return template(data);
  } catch (error) {
    Logger.error(error, 'Error compiling template.');
    return undefined;
  }
}

export async function sendEmail(config: IConfig, emailMessage: IEmailMessage) {
  let htmlBody: string | undefined = undefined;
  let textBody: string | undefined = undefined;
  if (emailMessage.template !== 'text') {
    htmlBody = await compileTemplate(`${emailMessage.template}-html`, emailMessage.data);
    textBody = await compileTemplate(`${emailMessage.template}-text`, emailMessage.data);
  }
  switch (config.deploymenEnv) {
    case 'aws':
      return sendEmailAws(config.awsConfig!, emailMessage, htmlBody, textBody);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}

async function sendEmailAws(config: AwsConfig, emailMessage: IEmailMessage, htmlBody?: string, textBody?: string) {
  if (htmlBody == null && textBody == null) {
    await ses.sendEmail(config, emailMessage.to[0], emailMessage.subject, emailMessage.data!['message'] as string);
  } else {
    await ses.sendEmailV1(config, emailMessage.to, emailMessage.subject, htmlBody, textBody);
  }
}
