import { IPaymentGateway, PaymentResult } from "../../application/ports/payment-gateway.interface";

/**
 * Stub implementation of IPaymentGateway using Stripe.
 * Replace the body of `charge` with actual Stripe SDK calls in production.
 */
export class StripePaymentGateway implements IPaymentGateway {
  private readonly apiKey: string;

  constructor(apiKey: string = process.env.STRIPE_API_KEY ?? "") {
    this.apiKey = apiKey;
  }

  async charge(amount: number, currency: string, paymentToken: string): Promise<PaymentResult> {
    // TODO: Replace with real Stripe SDK call
    // const stripe = new Stripe(this.apiKey);
    // const charge = await stripe.charges.create({ amount, currency, source: paymentToken });
    // return { transactionId: charge.id, status: 'success' };

    console.log(`[StripeGateway] Charging ${currency} ${amount} with token ${paymentToken}`);
    return { transactionId: `txn_${Date.now()}`, status: "success" };
  }
}
