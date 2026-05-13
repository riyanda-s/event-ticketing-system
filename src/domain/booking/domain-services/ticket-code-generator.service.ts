import { TicketCode } from "../value-objects/ticket-code.vo";

export class TicketCodeGeneratorService {
  static generate(bookingId: string, index: number): TicketCode {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const code = `TKT-${timestamp}-${random}-${index}`;
    return TicketCode.create(code);
  }

  static generateBatch(bookingId: string, quantity: number): TicketCode[] {
    return Array.from({ length: quantity }, (_, i) =>
      TicketCodeGeneratorService.generate(bookingId, i + 1),
    );
  }
}
