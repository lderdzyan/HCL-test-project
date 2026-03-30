import { CheckoutResult, IUserInfo } from "@/components/helpers/makePurchase";
import { apiFetch } from "./fetcher";

export const checkUser = (data: IUserInfo) => {
  return apiFetch<{ userInfo: { stripeSubscriptionId?: string } }>("/api/poc-service/taxafmo/subscribe/user", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const savePaymentResult = (data: CheckoutResult) => {
  return apiFetch("/save-payment-result", {
    method: "POST",
    body: JSON.stringify(data.paymentResult),
  });
};
export const checkPaymentStatus = (data: { id: string }) => {
  return apiFetch<{ status: string }>("/check-payment-status", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

