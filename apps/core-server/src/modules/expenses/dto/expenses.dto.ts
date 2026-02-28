import { z } from 'zod';

export const CreateExpenseDtoSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1),
  periodicity: z.enum(['on_advance', 'on_salary', 'monthly']),
});
export type CreateExpenseDto = z.infer<typeof CreateExpenseDtoSchema>;

export const UpdateExpenseDtoSchema = z.object({
  name: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().min(1).optional(),
  periodicity: z.enum(['on_advance', 'on_salary', 'monthly']).optional(),
});
export type UpdateExpenseDto = z.infer<typeof UpdateExpenseDtoSchema>;
