// src/lib/email/resend-adapter.ts
import { EmailService, BookingEmailProps, RefundEmailProps } from './email-service';

export class ResendEmailService implements EmailService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || 're_placeholder_secret_key';
  }

  private async send(payload: { to: string; subject: string; html: string }) {
    if (this.apiKey === 're_placeholder_secret_key') {
      console.warn(`[Email Stub Log] To: ${payload.to} | Subject: ${payload.subject}`);
      return;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          from: 'Shivay Sports Hub <notifications@shivaycricketinghub.com>',
          to: payload.to,
          subject: payload.subject,
          html: payload.html
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to dispatch email.');
      }
    } catch (err) {
      console.error('Email transmission failed:', err);
    }
  }

  async sendBookingConfirmation(data: BookingEmailProps) {
    const html = `
      <div style="background-color: #0A0F0D; color: #F0FDF4; padding: 30px; font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1E3A2B; border-radius: 12px;">
        <h1 style="color: #34D399; margin-bottom: 2px;">SHIVAY</h1>
        <p style="text-transform: uppercase; font-size: 10px; color: #6B8F7E; margin-top: 0; letter-spacing: 1.5px;">The Cricketing Hub</p>
        <h2 style="font-size: 18px; margin-top: 20px;">Booking Confirmed!</h2>
        <p>Hi there, your booking is confirmed. Below are your playing slot details:</p>
        <div style="background-color: #111A16; padding: 15px; border-radius: 8px; border: 1px solid #1E3A2B; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Booking ID:</strong> <span style="font-family: monospace; color: #34D399;">${data.bookingId}</span></p>
          <p style="margin: 5px 0;"><strong>Court:</strong> ${data.courtName}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${data.date}</p>
          <p style="margin: 5px 0;"><strong>Time Slot:</strong> ${data.timeSlot}</p>
          <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₹${data.pricePaid}</p>
        </div>
        <p style="font-size: 11px; color: #6B8F7E; line-height: 1.5;">Address: Shivay Box Cricket and Pickleball, Karai Dam Road, Karai, Gujarat 382330<br/>Phone: +91 99981 68681</p>
      </div>
    `;

    await this.send({
      to: data.to,
      subject: `Booking Confirmed: ${data.bookingId} — Shivay The Cricketing Hub`,
      html
    });
  }

  async sendBookingCancellation(data: BookingEmailProps) {
    const html = `
      <div style="background-color: #0A0F0D; color: #F0FDF4; padding: 30px; font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1E3A2B; border-radius: 12px;">
        <h1 style="color: #34D399; margin-bottom: 2px;">SHIVAY</h1>
        <h2 style="font-size: 18px; color: #EF4444; margin-top: 20px;">Booking Cancelled</h2>
        <p>Your booking with reference ID <strong>${data.bookingId}</strong> has been cancelled.</p>
        <div style="background-color: #111A16; padding: 15px; border-radius: 8px; border: 1px solid #1E3A2B; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Court:</strong> ${data.courtName}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${data.date}</p>
          <p style="margin: 5px 0;"><strong>Time Slot:</strong> ${data.timeSlot}</p>
        </div>
      </div>
    `;

    await this.send({
      to: data.to,
      subject: `Booking Cancelled: ${data.bookingId} — Shivay The Cricketing Hub`,
      html
    });
  }

  async sendRefundApproved(data: RefundEmailProps) {
    const html = `
      <div style="background-color: #0A0F0D; color: #F0FDF4; padding: 30px; font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1E3A2B; border-radius: 12px;">
        <h1 style="color: #34D399; margin-bottom: 2px;">SHIVAY</h1>
        <h2 style="font-size: 18px; color: #34D399; margin-top: 20px;">Refund Approved</h2>
        <p>Your refund claim for booking <strong>${data.bookingId}</strong> has been processed successfully.</p>
        <p><strong>Approved Payout:</strong> ₹${data.refundAmount}</p>
        <p>The balance has been credited to your playing wallet balance and can be used on future reservations.</p>
      </div>
    `;

    await this.send({
      to: data.to,
      subject: `Refund Processed: ${data.bookingId} — Shivay The Cricketing Hub`,
      html
    });
  }

  async sendRefundRejected(data: RefundEmailProps) {
    const html = `
      <div style="background-color: #0A0F0D; color: #F0FDF4; padding: 30px; font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1E3A2B; border-radius: 12px;">
        <h1 style="color: #34D399; margin-bottom: 2px;">SHIVAY</h1>
        <h2 style="font-size: 18px; color: #EF4444; margin-top: 20px;">Refund Request Update</h2>
        <p>Your refund request for booking <strong>${data.bookingId}</strong> has been reviewed and declined by the management.</p>
        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
      </div>
    `;

    await this.send({
      to: data.to,
      subject: `Refund Request Declined: ${data.bookingId} — Shivay The Cricketing Hub`,
      html
    });
  }

  async sendWaitlistAvailable(to: string, courtName: string, date: string, timeSlot: string) {
    const html = `
      <div style="background-color: #0A0F0D; color: #F0FDF4; padding: 30px; font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1E3A2B; border-radius: 12px;">
        <h1 style="color: #34D399; margin-bottom: 2px;">SHIVAY</h1>
        <h2 style="font-size: 18px; color: #34D399; margin-top: 20px;">Waitlist Slot Available!</h2>
        <p>Good news! A previously booked slot you were waitlisted for has become available:</p>
        <div style="background-color: #111A16; padding: 15px; border-radius: 8px; border: 1px solid #1E3A2B; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Court:</strong> ${courtName}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 5px 0;"><strong>Time Slot:</strong> ${timeSlot}</p>
        </div>
        <p>Log into the Shivay app now to secure this booking slot before it is claimed!</p>
      </div>
    `;

    await this.send({
      to,
      subject: `Waitlist Slot Available: ${courtName} — Shivay The Cricketing Hub`,
      html
    });
  }
}
