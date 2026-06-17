export interface TicketCategoryDTO {
  id: string;
  eventId: string;
  name: string;
  price: { amount: number; currency: string };
  quota: number;
  remainingQuota: number;
  salesStart: string;
  salesEnd: string;
  status: string;
}
