# Monesto

A minimalistic financial assistant application focused on simplicity, clarity, and emotional comfort. Monesto helps users distribute their monthly income based on their financial goals, allowing them to adjust income and expenses month by month and track progress over time.

## Product Concept

Monesto behaves as a supportive assistant, not a financial controller. It's designed for people without financial education who want clear guidance, simple explanations, and confidence and control over their money.

## Key Features

### User Profile

- Monthly income tracking
- Mandatory expenses management

### Financial Goal Selection

Users can choose from:

- Emergency fund
- Mortgage down payment
- Saving
- Investing

### Automatic Calculations

- Recommended savings percentage
- Recommended savings amount
- Clear monthly recommendations

### Monthly Planning

- Monthly plan overview (main screen)
- Progress tracking
- Monthly editing of income and expenses
- History of past months (read-only)

## Core Product Logic

- The app always opens on the current month
- Planning is monthly by default
- Users can:
  - Edit income and expenses for the current month
  - Apply changes to future months
- Past months are read-only
- History is optional and secondary, never forced

## Technology Stack

### Backend

- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Telegram Integration**: Telegraf (Telegram Bot API)
- **Language**: TypeScript

### Frontend

- **Framework**: SvelteKit
- **Styling**: Tailwind CSS
- **Platform**: Telegram Web App

### Infrastructure

- Docker Compose for local development
- PostgreSQL database container

## Project Structure

```
monesto/
├── server/          # NestJS backend application
│   ├── src/
│   │   ├── modules/
│   │   │   ├── bot/         # Telegram bot handlers
│   │   │   ├── month/       # Month planning logic
│   │   │   ├── user/        # User management
│   │   │   └── prisma/      # Database service
│   │   └── main.ts
│   └── prisma/      # Database schema and migrations
│
├── webapp/          # SvelteKit frontend application
│   ├── src/
│   │   ├── lib/
│   │   │   ├── modules/
│   │   │   │   ├── month/   # Month planning UI
│   │   │   │   └── onboarding/  # Onboarding flow
│   │   │   └── shared/      # Shared components and utilities
│   │   └── routes/          # SvelteKit routes
│   └── static/      # Static assets
│
└── design/          # UI design mockups
    ├── incoming.png
    ├── mandatory.png
    ├── plan.png
    ├── recommendation.png
    ├── settings.png
    └── strategy.png
```

## Screens

### Onboarding (3 screens)

Purpose: explain value, not features.

- Screen 1: "We help you understand where your money goes"
- Screen 2: "We suggest how much to save each month"
- Screen 3: "You stay in control — always"

### Income & Expenses Input

- Monthly income input with large editable number
- Mandatory expenses input
- Helper text for guidance

### Financial Goal Selection

Card-based selection with simple icons and one-line explanations.

### Personalized Recommendation

Shows recommended savings percentage and amount with simple explanation.

### Monthly Plan Overview (MAIN SCREEN)

Primary screen showing:

- Total monthly income
- Distribution bar (Needs, Wants, Goal)
- Needs & Bills card
- Spending Money card
- Savings Goal card (highlighted)
- Progress tracking and editing actions

### Settings Screen

Safe control center for editing income, expenses, and financial goals.

### Month Picker / History Screen

Secondary navigation for viewing past months (read-only) and future months (preview).

### Progress Visualization

Simple progress bar toward the goal with encouraging text.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- npm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/ssssed/monesto.git
cd monesto
```

2. Start the database:

```bash
docker-compose up -d
```

3. Install dependencies and setup backend:

```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev
```

4. Install dependencies for frontend:

```bash
cd ../webapp
npm install
```

### Development

Start the backend server:

```bash
cd server
npm run start:dev
```

Start the frontend development server:

```bash
cd webapp
npm run dev
```

### Environment Variables

Create `.env` files in both `server/` and `webapp/` directories with necessary configuration (database URL, Telegram bot token, etc.).

### Production Deployment

The project includes a production-ready Docker Compose configuration that runs all services (database, backend, and frontend) in containers.

1. Create a `.env` file in the project root with production configuration:

```bash
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=finance_app

# Backend Configuration
BACKEND_PORT=3000
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Frontend Configuration
FRONTEND_PORT=3001
PUBLIC_API_URL=http://your-domain.com:3000/api
```

2. Build and start all services:

```bash
docker-compose -f docker-compose.production.yml up -d --build
```

3. Check service status:

```bash
docker-compose -f docker-compose.production.yml ps
```

4. View logs:

```bash
docker-compose -f docker-compose.production.yml logs -f
```

5. Stop all services:

```bash
docker-compose -f docker-compose.production.yml down
```

**Note**: The `PUBLIC_API_URL` should be accessible from the browser. If you're using a reverse proxy (like nginx), configure it to proxy requests to the backend service.

## Database Schema

The application uses Prisma with PostgreSQL. Main models:

- **User**: Telegram user information
- **UserMonth**: Monthly financial plans (income, expenses, strategy)
- **UserMonthSavingsHistory**: History of savings tracking

## License

UNLICENSED
