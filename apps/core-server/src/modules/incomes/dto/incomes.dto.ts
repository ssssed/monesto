import { z } from 'zod';

export const CreateIncomeTypeDtoSchema = z.object({
  name: z.string().min(1),
  hasTax: z.boolean().optional().default(false),
  isRecurring: z.boolean().optional().default(false),
});
export type CreateIncomeTypeDto = z.infer<typeof CreateIncomeTypeDtoSchema>;

export const UpdateIncomeTypeDtoSchema = z.object({
  name: z.string().min(1).optional(),
  hasTax: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
});
export type UpdateIncomeTypeDto = z.infer<typeof UpdateIncomeTypeDtoSchema>;

export const CreateIncomeDtoSchema = z.object({
  incomeTypeId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
});
export type CreateIncomeDto = z.infer<typeof CreateIncomeDtoSchema>;

export const UpdateIncomeDtoSchema = z.object({
  amount: z.number().positive().optional(),
  currency: z.string().min(1).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  month: z.number().int().min(1).max(12).optional(),
});
export type UpdateIncomeDto = z.infer<typeof UpdateIncomeDtoSchema>;
