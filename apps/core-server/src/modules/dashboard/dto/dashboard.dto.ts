import { z } from 'zod';

export const LayoutItemSchema = z.object({
  id: z.string(),
  widgetType: z.string(),
  position: z.number().optional(),
  order: z.number().optional(),
});
export const PutLayoutDtoSchema = z.object({
  widgets: z.array(LayoutItemSchema),
});
export type PutLayoutDto = z.infer<typeof PutLayoutDtoSchema>;
