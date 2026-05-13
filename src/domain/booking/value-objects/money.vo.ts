import { ValueObject } from "../../shared/value-object";

interface MoneyProps {
  amount: number;
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  constructor(amount: number, currency: string) {
    if (amount < 0) throw new Error("Money amount cannot be negative");
    if (!currency || currency.trim().length === 0)
      throw new Error("Currency cannot be empty");
    super({ amount, currency });
  }

  get amount(): number {
    return this.props.amount;
  }
  get currency(): string {
    return this.props.currency;
  }

  static of(amount: number, currency: string): Money {
    return new Money(amount, currency);
  }

  static zero(currency: string): Money {
    return new Money(0, currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0)
      throw new Error("Money subtraction result cannot be negative");
    return new Money(result, this.currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) throw new Error("Multiplication factor cannot be negative");
    return new Money(this.amount * factor, this.currency);
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency)
      throw new Error(
        `Currency mismatch: ${this.currency} vs ${other.currency}`,
      );
  }

  toString(): string {
    return `${this.currency} ${this.amount.toLocaleString()}`;
  }
}
