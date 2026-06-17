export interface INotificationService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  sendWhatsApp(to: string, message: string): Promise<void>;
}
