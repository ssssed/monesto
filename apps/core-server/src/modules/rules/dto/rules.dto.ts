import { z } from 'zod';

const takePercentParams = z.object({ percent: z.number().min(0).max(100) });
const takeFixedParams = z.object({ amount: z.number().positive(), currency: z.string() });
const transferParams = z.object({
  targetAccountId: z.string().uuid(),
  amount: z.number().optional(),
  percent: z.number().min(0).max(100).optional(),
});
const convertAndTransferParams = z.object({
  targetAccountId: z.string().uuid(),
  targetCurrency: z.string(),
  amount: z.number().optional(),
  percent: z.number().min(0).max(100).optional(),
});
const deductExpenseParams = z.object({
  expenseId: z.string().uuid(),
  amount: z.number().optional(),
});

const actionTypes = ['take_percent', 'take_fixed', 'transfer', 'convert_and_transfer', 'deduct_expense', 'set_remaining'] as const;
const StepParamsSchemas: Record<string, z.ZodType<unknown>> = {
  take_percent: takePercentParams,
  take_fixed: takeFixedParams,
  transfer: transferParams,
  convert_and_transfer: convertAndTransferParams,
  deduct_expense: deductExpenseParams,
  set_remaining: z.object({}),
};

export const RuleStepSchema = z.object({
  order: z.number().int().min(0),
  actionType: z.enum(actionTypes),
  params: z.record(z.unknown()),
}).refine(
  (step) => {
    const schema = StepParamsSchemas[step.actionType];
    const result = schema.safeParse(step.params);
    return result.success;
  },
  { message: 'Invalid params for actionType', path: ['params'] },
);

export const CreateRuleDtoSchema = z.object({
  triggerIncomeTypeId: z.string().uuid(),
  showOnDashboard: z.boolean().optional().default(false),
  order: z.number().int().optional().default(0),
  steps: z.array(RuleStepSchema),
});
export type CreateRuleDto = z.infer<typeof CreateRuleDtoSchema>;

export const UpdateRuleDtoSchema = z.object({
  triggerIncomeTypeId: z.string().uuid().optional(),
  showOnDashboard: z.boolean().optional(),
  order: z.number().int().optional(),
  steps: z.array(RuleStepSchema).optional(),
});
export type UpdateRuleDto = z.infer<typeof UpdateRuleDtoSchema>;

export function validateStepParams(actionType: string, params: unknown): unknown {
  const schema = StepParamsSchemas[actionType];
  if (!schema) throw new Error(`Unknown actionType: ${actionType}`);
  return schema.parse(params);
}
