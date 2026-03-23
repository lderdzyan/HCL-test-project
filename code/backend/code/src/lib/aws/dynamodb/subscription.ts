import { SortKey, createDocument } from ".";
import { Subscription } from "../../entities/subscription";
import { IConfig } from "../config";

/*
 * attr1 (string) - email
 * attr2 (string) - country
 * attr4 (number) - createdAt
 */
export async function createdSubscription(config: IConfig, subscription: Subscription) {
  const document: Record<string, any> = { ...subscription };
  document._pk = subscription.id;
  document._sk = SortKey.Subscription;
  document.attr1 = subscription.email;
  document.attr2 = subscription.country;
  document.attr4 = subscription.createdAt;

  await createDocument(config, document);
}
