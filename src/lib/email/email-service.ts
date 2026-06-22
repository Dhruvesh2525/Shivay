// src/lib/email/email-service.ts

export interface BookingEmailProps {
  to: string;
  bookingId: string;
  courtName: string;
  date: string;
  timeSlot: string;
  pricePaid: number;
}

export interface RefundEmailProps {
  to: string;
  bookingId: string;
  refundAmount: number;
  reason?: string;
}

export interface EmailService {
  sendBookingConfirmation(data: BookingEmailProps): Promise<void>;
  sendBookingCancellation(data: BookingEmailProps): Promise<void>;
  sendRefundApproved(data: RefundEmailProps): Promise<void>;
  sendRefundRejected(data: RefundEmailProps): Promise<void>;
  sendWaitlistAvailable(to: string, courtName: string, date: string, timeSlot: string): Promise<void>;
}
