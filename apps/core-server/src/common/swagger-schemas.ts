/**
 * Схемы для Swagger (входы/выходы). Используются в декораторах @ApiBody и @ApiResponse.
 * Массивы required/enum приведены к string[] для совместимости с типами @nestjs/swagger.
 */
export const swaggerSchemas = {
  // --- Auth ---
  LoginBody: {
    type: 'object',
    required: ['login', 'password'] as string[],
    properties: {
      login: { type: 'string', example: 'user@example.com' },
      password: { type: 'string', example: 'secret123' },
    },
  },
  RegisterBody: {
    type: 'object',
    required: ['login', 'password'] as string[],
    properties: {
      login: { type: 'string', example: 'user@example.com' },
      password: { type: 'string', minLength: 6, example: 'secret123' },
      name: { type: 'string', description: 'Опционально' },
    },
  },
  AuthResponse: {
    type: 'object',
    properties: {
      access_token: { type: 'string', description: 'JWT токен (без срока истечения)' },
      user: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          login: { type: 'string' },
        },
      },
    },
  },

  // --- Dashboard ---
  PutLayoutBody: {
    type: 'object',
    required: ['widgets'] as string[],
    properties: {
      widgets: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            widgetType: { type: 'string', example: 'income' },
            position: { type: 'number' },
            order: { type: 'number' },
          },
        },
      },
    },
  },
  LayoutResponse: {
    type: 'object',
    properties: {
      widgets: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            widgetType: { type: 'string' },
            position: { type: 'number' },
            order: { type: 'number' },
          },
        },
      },
    },
  },
  WidgetDataResponse: {
    type: 'object',
    required: ['component', 'data'] as string[],
    properties: {
      component: { type: 'string', description: 'Имя компонента на frontend (IncomeWidget, ExpensesWidget, ...)' },
      data: { type: 'object', description: 'Payload для отрисовки виджета' },
    },
  },

  // --- Accounts ---
  CreateAccountBody: {
    type: 'object',
    required: ['name', 'type', 'currency'] as string[],
    properties: {
      name: { type: 'string', example: 'Tinkoff Savings' },
      type: { type: 'string', enum: ['account', 'asset'] as string[] },
      currency: { type: 'string', example: 'RUB' },
      tagIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
    },
  },
  UpdateAccountBody: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      type: { type: 'string', enum: ['account', 'asset'] as string[] },
      currency: { type: 'string' },
      tagIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
    },
  },

  // --- Tags ---
  CreateTagBody: {
    type: 'object',
    required: ['name', 'alias'] as string[],
    properties: {
      name: { type: 'string', example: 'Сбер' },
      color: { type: 'string', example: '#21a038', description: 'HEX цвет, по умолчанию #64748b' },
      alias: { type: 'string', example: 'sber', description: 'Латиница для иконки на фронте' },
    },
  },
  UpdateTagBody: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      color: { type: 'string' },
      alias: { type: 'string' },
    },
  },
  TagItem: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      color: { type: 'string' },
      alias: { type: 'string' },
    },
  },

  // --- Rules ---
  CreateRuleBody: {
    type: 'object',
    required: ['triggerIncomeTypeId', 'steps'] as string[],
    properties: {
      triggerIncomeTypeId: { type: 'string', format: 'uuid' },
      showOnDashboard: { type: 'boolean', default: false },
      order: { type: 'number', default: 0 },
      steps: {
        type: 'array',
        items: {
          type: 'object',
          required: ['order', 'actionType', 'params'] as string[],
          properties: {
            order: { type: 'number' },
            actionType: { type: 'string', enum: ['take_percent', 'take_fixed', 'transfer', 'convert_and_transfer', 'deduct_expense', 'set_remaining'] as string[] },
            params: { type: 'object' },
          },
        },
      },
    },
  },
  UpdateRuleBody: {
    type: 'object',
    properties: {
      triggerIncomeTypeId: { type: 'string', format: 'uuid' },
      showOnDashboard: { type: 'boolean' },
      order: { type: 'number' },
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            order: { type: 'number' },
            actionType: { type: 'string', enum: ['take_percent', 'take_fixed', 'transfer', 'convert_and_transfer', 'deduct_expense', 'set_remaining'] as string[] },
            params: { type: 'object' },
          },
        },
      },
    },
  },

  // --- Income types ---
  CreateIncomeTypeBody: {
    type: 'object',
    required: ['name'] as string[],
    properties: {
      name: { type: 'string', example: 'Зарплата' },
      hasTax: { type: 'boolean', default: false },
      isRecurring: { type: 'boolean', default: false },
    },
  },
  UpdateIncomeTypeBody: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      hasTax: { type: 'boolean' },
      isRecurring: { type: 'boolean' },
    },
  },

  // --- Incomes ---
  CreateIncomeBody: {
    type: 'object',
    required: ['incomeTypeId', 'amount', 'currency', 'year', 'month'] as string[],
    properties: {
      incomeTypeId: { type: 'string', format: 'uuid' },
      amount: { type: 'number', example: 100000 },
      currency: { type: 'string', example: 'RUB' },
      year: { type: 'number', example: 2025 },
      month: { type: 'number', example: 2, minimum: 1, maximum: 12 },
    },
  },
  UpdateIncomeBody: {
    type: 'object',
    properties: {
      amount: { type: 'number' },
      currency: { type: 'string' },
      year: { type: 'number' },
      month: { type: 'number' },
    },
  },

  // --- Expenses ---
  CreateExpenseBody: {
    type: 'object',
    required: ['name', 'amount', 'currency', 'periodicity'] as string[],
    properties: {
      name: { type: 'string', example: 'Платёж за кредит' },
      amount: { type: 'number', example: 35000 },
      currency: { type: 'string', example: 'RUB' },
      periodicity: { type: 'string', enum: ['on_advance', 'on_salary', 'monthly'] as string[] },
    },
  },
  UpdateExpenseBody: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      amount: { type: 'number' },
      currency: { type: 'string' },
      periodicity: { type: 'string', enum: ['on_advance', 'on_salary', 'monthly'] as string[] },
    },
  },

  // --- Общие ---
  OkResponse: { type: 'object', properties: { ok: { type: 'boolean', example: true } } },
  ErrorResponse: {
    type: 'object',
    properties: {
      statusCode: { type: 'number' },
      message: { type: 'string' },
      error: { type: 'string' },
    },
  },
};
