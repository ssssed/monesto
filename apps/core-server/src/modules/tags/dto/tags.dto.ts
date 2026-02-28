import { z } from 'zod';

export const CreateTagDtoSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#64748b'),
  alias: z.string().min(1).regex(/^[a-z0-9_]+$/),
});
export type CreateTagDto = z.infer<typeof CreateTagDtoSchema>;

export const UpdateTagDtoSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  alias: z.string().min(1).regex(/^[a-z0-9_]+$/).optional(),
});
export type UpdateTagDto = z.infer<typeof UpdateTagDtoSchema>;
