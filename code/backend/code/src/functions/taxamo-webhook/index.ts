import { SQSEvent, SQSRecord } from 'aws-lambda';
import { Logger } from '../../lib/logger';
import { Payment, findByPaymentId, updatePayment } from '../../lib/entities/payment';
import { PaymentStatus } from '../../lib/constants';
import { createGuidedDiscussionAndProcessAnswer, updateSurveyAnswerStatus } from '../../lib/controllers/survey-answer';
import { dateTimeToTimestamp } from '../../lib/utils/date-utils';
import { EventTrackingController } from '../../lib/controllers/event-tracking';
import { GuidedDiscussionEvents } from '../../lib/entities/event-tracking';
import { PromoCodeController } from '../../lib/controllers/promo-code';
import { findSurveyById } from '../../lib/entities/survey';
import { IndicatorController } from '../../lib/controllers/wlf-indicator';
import { WlfBuilderController } from '../../lib/controllers/wlf-builder';
import { PromoCode } from '../../lib/entities/promo-service/promo-code';

enum SurveyPaths {
  WLF_BUILDER = '/survey/builder.json',
  MWI = '/survey/mwi.json',
  WLF_INDICATOR = '/survey/indicator.json',
}

export const handler = async (_event: SQSEvent) => {
  Logger.debug(_event.Records);
  for (const record of _event.Records) {
    try {
      await handleRecord(record);
    } catch (e) {
      Logger.error(e);
    }
  }
};

interface ICustomFields {
  key: string;
  value: string;
}
interface ITransactionPayload {
  app_mode: string;
  transaction: {
    amount: number;
    tax_amount: number;
    billing_country_code: string;
    invoice_number: string;
    tax_country_code: string;
    buyer_email: string;
    status: string;
    invoice_image_url: string;
    deducted_tax_amount: number;
    total_amount: number;
    currency_code: string;
    warnings?: string;
    custom_fields: ICustomFields[];
    order_date: string;
    key: string;
    custom_id: string;
  };
  
  ms_order_id: string;
  ms_person_id: string;
}
const paymentObjectKeys: (keyof Payment)[] = [
  'amount',
  'billCCode',
  'currencyCode',
  'dedTAmount',
  'invoiceNumber',
  'invoiceUrl',
  'taxAmount',
  'taxCCode',
  'totalAmount',
  'orderDate',
  'orderDateTimestamp',
  'stripeId',
  'taxamoTransactionId',
];
function findCustomField(fields: ICustomFields[], key: string): string | undefined {
  return fields.find((f) => f.key === key)?.value?.trim();
}
async function handleRecord(record: SQSRecord) {
  const recordBody = JSON.parse(record.body);
  const requestData = JSON.parse(recordBody.Message) as ITransactionPayload;

  try {
    if (requestData.ms_order_id != null) {
      await freePayment(requestData.ms_order_id, requestData.ms_person_id);
      return;
    }

    const transaction = requestData.transaction;
    const orderId = findCustomField(transaction.custom_fields, 'orderId');
    const identity = findCustomField(transaction.custom_fields, 'identity');
    if (!orderId || !identity) return;

    const payment = await findByPaymentId(orderId);
    if (!payment) return;

    const fieldMapping: Partial<Record<keyof Payment, any>> = {
      amount: transaction.amount,
      billCCode: transaction.billing_country_code,
      currencyCode: transaction.currency_code,
      dedTAmount: transaction.deducted_tax_amount,
      invoiceNumber: transaction.invoice_number,
      invoiceUrl: transaction.invoice_image_url,
      taxAmount: transaction.tax_amount,
      taxCCode: transaction.tax_country_code,
      totalAmount: transaction.total_amount,
      orderDate: transaction.order_date,
      orderDateTimestamp: dateTimeToTimestamp(transaction.order_date),
      stripeId: transaction.custom_id,
      taxamoTransactionId: transaction.key,
    };

    for (const [key, value] of Object.entries(fieldMapping)) {
      if (value !== undefined) {
        (payment as any)[key] = value;
      }
    }

    if (transaction.status === 'C') {
      payment.status = PaymentStatus.Done;
    }

    const updateFields = ['status', ...paymentObjectKeys.filter((key) => payment[key] != null)];

    if (transaction.warnings != null) {
      payment.status = PaymentStatus.Failed;
      payment.message = transaction.warnings;
      updateFields.push('message');
    }

    await updatePayment(payment, updateFields);
    await handleSurveyLogic(payment, identity);
  } catch (error) {
    Logger.error(`Error while saving taxamo webhook data`, { error, requestData });
    console.error('error', error);
  }
}

async function handleSurveyLogic(payment: Payment, personId: string) {
  const survey = await findSurveyById(payment.surveyId!);
  if (!survey) return;

  switch (survey.path!) {
    case SurveyPaths.MWI:
      await doMWILogic(payment);
      break;
    case SurveyPaths.WLF_INDICATOR:
      await doWLFLogic(payment);
      break;
    case SurveyPaths.WLF_BUILDER:
      await doWlfBuilderLogic(payment);
      break;
  }

  if (payment.status === PaymentStatus.Done) {
    await applyPromoCode(payment, personId);
  }
}

async function doMWILogic(payment: Payment) {
  await updateSurveyAnswerStatus(payment.answerId!, payment.status ?? PaymentStatus.Pending);
  if (payment.status === PaymentStatus.Done) {
    try {
      await EventTrackingController.addGuidedDiscussionUserInfo(
        payment.answerId!,
        payment.personId,
        GuidedDiscussionEvents.Explorer,
        payment.personId,
      );
      await createGuidedDiscussionAndProcessAnswer(payment);
    } catch (error) {
      Logger.error(`Error while processing survey answers: ${error}`);
    }
  }
}

async function doWLFLogic(payment: Payment) {
  await IndicatorController.processTaxamoWebhook(payment.personId);
}

async function doWlfBuilderLogic(payment: Payment) {
  let promoCode = undefined;
  if (payment.promoCodeId != null) {
    const promo: PromoCode | undefined = await PromoCodeController.loadPromoCodeById(payment.promoCodeId!);
    if (promo != null) promoCode = promo.promoCode;
  }
  await WlfBuilderController.processTaxamoWebhook(payment, promoCode);
}

async function freePayment(orderId: string, personId: string) {
  const payment = await findByPaymentId(orderId);
  if (!payment) return;

  payment.status = PaymentStatus.Done;
  payment.amount = 0;
  payment.totalAmount = 0;
  await updatePayment(payment, ['status', 'amount', 'totalAmount']);

  await handleSurveyLogic(payment, personId);
}

async function applyPromoCode(payment: Payment, personId: string) {
  if (payment.promoCodeId != null) {
    await PromoCodeController.applyPromoCode(payment.promoCodeId, personId, payment.packageId!, payment.amount ?? 0)();
    await EventTrackingController.addPromoReportData(payment, personId)();
  }
}
