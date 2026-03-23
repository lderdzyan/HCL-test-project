import { IFilterData, SortKey, createDocument, findByPartitionKey, queryByAttr, updateDocument } from ".";
import { Payment } from "../../entities/payment";
import { IConfig } from "../config";

/*
 * attr1 (string) - personId
 * attr2 (string) - surveyId
 * attr3 (string) - answersId
 * attr4 (number) - createdAt
 */
export async function createPayment(config: IConfig, payment: Payment) {
  const document: Record<string, any> = { ...payment };
  document._pk = payment.id;
  document._sk = SortKey.Payment;
  document.attr1 = payment.personId;
  document.attr2 = payment.surveyId;
  document.attr3 = payment.answerId;
  document.attr4 = payment.createdAt;

  await createDocument(config, document);
}
export async function updatePayment(config: IConfig, payment: Payment, fieldsToUpdate: string[]) {
  const document: Record<string, any> = { ...payment };
  document._pk = payment.id;
  document._sk = SortKey.Payment;

  await updateDocument(config, document, fieldsToUpdate);
}
export async function findById(config: IConfig, id: string): Promise<Payment | undefined> {
  const data = await findByPartitionKey(config, id, SortKey.Payment);

  if (data == null) return undefined;

  return data as Payment;
}
export async function findByAnswerId(config: IConfig, id: string): Promise<Payment | undefined> {
  const filters: IFilterData = {
    expression: '#filterAttr = :filterValue',
    names: { '#filterAttr': 'status' },
    values: { ':filterValue': 'done' }
  }
  const items = await queryByAttr(config, 'attr3', id, SortKey.Payment, '#attr = :attrValue', 'attr3-index', filters);

  if (items.length === 0) return undefined;

  return items[0] as Payment;
}
export async function findAllByAnswerId(config: IConfig, id: string): Promise<Payment[]> {
  const filters: IFilterData = {
    expression: '#filterAttr = :filterValue',
    names: { '#filterAttr': 'status' },
    values: { ':filterValue': 'done' }
  }
  const items = await queryByAttr(config, 'attr3', id, SortKey.Payment, '#attr = :attrValue', 'attr3-index', filters);
  const payments: Payment[] = [];

  for (const item of items) {
    if (item != null) {
      payments.push(item as Payment);
    }
  }

  return payments;
}
export async function findPaymentByPersonId(config: IConfig, id: string): Promise<Payment[]> {
  const items = await queryByAttr(config, 'attr1', id, SortKey.Payment, '#attr = :attrValue', 'attr1-index');

  const payments: Payment[] = [];

  for (const item of items) {
    if (item != null) {
      payments.push(item as Payment);
    }
  }

  return payments;
}
