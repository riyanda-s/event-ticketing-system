import { Money } from "../value-objects/money.vo";

export class BookingPricingService {
  private static readonly SERVICE_FEE_PERCENTAGE = 0.05; // 5%

  static calculateTotal(
    unitPrice: Money,
    quantity: number,
    applyServiceFee = true,
  ): Money {
    if (quantity <= 0) throw new Error("Quantity must be greater than zero");

    const subtotal = unitPrice.multiply(quantity);
    if (!applyServiceFee) return subtotal;

    const serviceFee = subtotal.multiply(
      BookingPricingService.SERVICE_FEE_PERCENTAGE,
    );
    return subtotal.add(serviceFee);
  }

  static calculateServiceFee(unitPrice: Money, quantity: number): Money {
    const subtotal = unitPrice.multiply(quantity);
    return subtotal.multiply(BookingPricingService.SERVICE_FEE_PERCENTAGE);
  }
}
