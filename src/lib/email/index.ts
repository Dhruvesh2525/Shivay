// src/lib/email/index.ts
import { EmailService } from './email-service';
import { ResendEmailService } from './resend-adapter';

// Single configuration point to swap email providers (e.g. to a SendGridEmailService)
export const emailService: EmailService = new ResendEmailService();
