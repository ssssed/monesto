import { z } from 'zod';

export const CreateAccountDtoSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['account', 'asset']),
  currency: z.string().min(1),
  tagIds: z.array(z.string().uuid()).optional(),
});
export type CreateAccountDto = z.infer<typeof CreateAccountDtoSchema>;

export const UpdateAccountDtoSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['account', 'asset']).optional(),
  currency: z.string().min(1).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});
export type UpdateAccountDto = z.infer<typeof UpdateAccountDtoSchema>;
