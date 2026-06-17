import { INotificationService } from "../../application/ports/notification.interface";

/**
 * Stub implementation of INotificationService.
 * Replace with a real email/WhatsApp SDK in production (e.g. SendGrid, Twilio).
 */
export class EmailNotificationService implements INotificationService {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // TODO: Replace with real email SDK call
    console.log(`[Email] To: ${to} | Subject: ${subject}`);
  }

  async sendWhatsApp(to: string, message: string): Promise<void> {
    // TODO: Replace with real WhatsApp API call
    console.log(`[WhatsApp] To: ${to} | Message: ${message}`);
  }
}
