interface ITaxamoWindow extends Window {
  Taxamo: {
    options: {
      checkoutSrc: string;
    };
    initialize: Function;
    defaultTransaction: {
      billing_country_code: string;
    };
    Checkout: any;
  };
}

export interface IUserInfo {
  email: string;
  pid: string;
}

declare var window: ITaxamoWindow;

export interface TaxamoPaymentResult {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  plan?: string;
}

export interface TaxamoResponseData {
  message_type: string;
  payment_result: { [key: string]: any };
  success: boolean;
}

export enum CheckoutStatus {
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface CheckoutResult {
  status: CheckoutStatus;
  paymentResult?: TaxamoPaymentResult;
}

export function makePurchase(userInfo: IUserInfo) {
  if (window["Taxamo"]) {
    const Taxamo = window["Taxamo"];

    const { email } = userInfo;

    Taxamo.options.checkoutSrc = "https://p.taxamo.com";

    Taxamo.initialize("public_test_kf4VRs79lBxtA7cir14JKAW1EGIIgk6MAw8WzNy1F-w"); // TODO change


    // public_tes   t_kf4VRs79lBxtA7cir14JKAW1EGIIgk6MAw8   WzNy1F-w  TEST

    const transaction = {
      buyer_email: email,
      billing_country_code: Taxamo.defaultTransaction.billing_country_code,
    };

    const metadata = {
      subscription_mode: true,
      plans: {
        b2c_plan_id: "example_plan",
      },
      finished_message: `Thank you. Your payment was successful`,
      show_summary: true,
      show_buyer_name: true,
      require_buyer_name: true,
      show_certificate_provider_logo: true,
      show_payment_provider_logo: true,
    };

    const checkout = new Taxamo.Checkout(transaction, metadata);

    return new Promise<CheckoutResult>((resolve) => {
      checkout.overlay(function (data: TaxamoResponseData) {
        if (data.message_type !== "window_closed") {
          if (data.success) {
            const fields = Object.fromEntries((data.payment_result.custom_fields ?? []).map(({ key, value }: { [key: string]: string }) => [key, value]));

            document.querySelectorAll("iframe").forEach(function (elem) {
              elem.id.includes("Taxamo") && elem.parentNode!.removeChild(elem);
            });

            resolve({
              status: CheckoutStatus.COMPLETED,
              paymentResult: {
                stripeCustomerId: fields["stripe-customer-id"],
                stripeSubscriptionId: fields["stripe-subscription-id"],
                plan: fields["stripe-original-plan-id"],
              },
            });
            return;
          }

          resolve({
            status: CheckoutStatus.FAILED,
            paymentResult: data.payment_result,
          });
          return;
        }

        resolve({
          status: CheckoutStatus.FAILED,
        });
      });
    });
  }
}

