import { z } from 'zod';

export const createLeadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  budgetRange: z.enum(['Under $1,000', '$1,000–$3,000', '$3,000–$5,000', '$5,000+']),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const updateLeadSchema = z.object({
  status: z.enum(['new', 'contacted', 'closed']),
});
