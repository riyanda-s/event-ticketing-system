export interface EventSummaryDTO {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  lowestPrice?: { amount: number; currency: string };
}

export interface TicketCategoryDetailDTO {
  id: string;
  name: string;
  price: { amount: number; currency: string };
  quota: number;
  remainingQuota: number;
  salesStart: string;
  salesEnd: string;
  status: string;
  saleStatus: "Available" | "ComingSoon" | "SalesClosed" | "SoldOut" | "Inactive";
}

export interface EventDetailDTO {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  organizerId: string;
  status: string;
  ticketCategories: TicketCategoryDetailDTO[];
}

export interface CategorySalesDTO {
  categoryId: string;
  name: string;
  sold: number;
  revenue: number;
  currency: string;
}

export interface SalesReportDTO {
  eventId: string;
  categorySales: CategorySalesDTO[];
  bookingsByStatus: {
    PendingPayment: number;
    Paid: number;
    Expired: number;
    Refunded: number;
  };
  totalRevenue: { amount: number; currency: string };
}

export interface ParticipantDTO {
  customerId: string;
  ticketCategory: string;
  ticketCode: string;
  checkInStatus: "Active" | "CheckedIn";
}

export interface GetAvailableEventsFilters {
  date?: string;
  location?: string;
}

export interface IEventQueryService {
  getAvailableEvents(filters?: GetAvailableEventsFilters): Promise<EventSummaryDTO[]>;
  getEventDetail(eventId: string, now?: Date): Promise<EventDetailDTO | null>;
  getSalesReport(eventId: string): Promise<SalesReportDTO>;
  getParticipants(eventId: string): Promise<ParticipantDTO[]>;
}
