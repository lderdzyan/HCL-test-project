import { createId } from '@paralleldrive/cuid2';
import config from '../../config';
import { Entity, currentAt, currentOn } from '../entity';
import * as AWSPayment from '../aws/dynamodb/payment';
import { PaymentStatus } from '../constants';

/**
 * {@link Entity}
 * @property {string} personId - person id (_attr1_)
 * @property {string} surveyId - survey id (_attr2_)
 * @property {string} answersId - survey answer id (_attr3_)
 * @property {string} status
 * @property {string} billCCode - billing country code
 * @property {string} taxCCode - tax country code
 * @property {number} taxAmount - tax amount
 * @property {number} totalAmount - total amount
 * @property {number} amount
 * @property {string} invoiceNumber
 * @property {string} currencyCode
 * @property {number} dedTAmount
 * @property {string} invoiceUrl - invoice url
 * @property {string} message
 * @property {string} packageId
 */
export interface Payment extends Entity {
  personId: string;
  surveyId?: string;
  answerId?: string;
  status?: PaymentStatus;
  billCCode?: string;
  taxCCode?: string;
  taxAmount?: number;
  totalAmount?: number;
  amount?: number;
  invoiceNumber?: string;
  currencyCode?: string;
  dedTAmount?: number;
  invoiceUrl?: string;
  message?: string;
  packageId?: string;
  orderDate?: string;
  orderDateTimestamp?: number;
  stripeId?: string;
  taxamoTransactionId?: string;
  promoCodeId?: string;
}
export async function createPayment(payment: Payment): Promise<Payment> {
  payment.id = payment.id ?? createId();
  payment.createdBy = payment.personId;
  payment.createdAt = currentAt();
  payment.createdOn = currentOn();
  payment.updatedBy = payment.createdBy;
  payment.updatedAt = payment.createdAt;
  payment.updatedOn = payment.createdOn;
  payment.status = PaymentStatus.Pending;

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSPayment.createPayment(config.awsConfig!, payment);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return payment;
}
export async function updatePayment(payment: Payment, fieldsToUpdate: string[]): Promise<Payment> {
  if (payment.id == null) throw Error('SurveyAnswer must have `id`.');

  payment.updatedBy = payment.createdBy;
  payment.updatedOn = currentOn();
  payment.updatedAt = currentAt();

  switch (config.deploymenEnv) {
    case 'aws':
      await AWSPayment.updatePayment(config.awsConfig!, payment, fieldsToUpdate);
      break;
    case 'azure':
      throw Error('Not implemented yet.');
  }

  return payment;
}
export async function findByPaymentId(id: string): Promise<Payment | undefined> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSPayment.findById(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findPaymentByAnswerId(id: string): Promise<Payment | undefined> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSPayment.findByAnswerId(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findAllPaymentByAnswerId(id: string): Promise<Payment[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSPayment.findAllByAnswerId(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
export async function findPaymentByPersonId(id: string): Promise<Payment[]> {
  switch (config.deploymenEnv) {
    case 'aws':
      return AWSPayment.findPaymentByPersonId(config.awsConfig!, id);
    case 'azure':
      throw Error('Not implemented yet.');
  }
}
