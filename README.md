# AfterHoursID - Indonesian Nightlife Platform

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)
![License](https://img.shields.io/badge/License-Proprietary-red)

> **Like "Zomato for Nightlife"** - The premier Indonesian nightlife discovery and booking platform.

## 🎯 Overview

AfterHoursID is a comprehensive nightlife platform connecting users with bars, clubs, lounges, and entertainment venues across Indonesia. Features include venue discovery, real-time bookings, verified reviews, gamification, and digital memberships.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js 14)                   │
│   Pages: Landing, Discovery, Venue, Dashboard, Admin        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (Rate Limiting, WAF)           │
│              Nginx with JWT Auth, Compression                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Microservices (Node.js)                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  Auth   │ │ Venue   │ │ Booking │ │ Payment │          │
│  │ Service │ │ Service │ │ Service │ │ Service │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Review  │ │  Promo  │ │ Gamifi- │ │ Notif   │          │
│  │ Service │ │ Service │ │ cation  │ │ Service │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │     Redis       │  │    RabbitMQ     │
│  (Primary DB)   │  │   (Cache/Queue) │  │  (Message Bus)  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom design system
- **State:** Zustand + React Context
- **Maps:** Google Maps JS API
- **Testing:** Playwright (E2E)

### Backend
- **Runtime:** Node.js 20
- **Framework:** Next.js API Routes
- **ORM:** Prisma
- **Database:** PostgreSQL 15 (with PostGIS)
- **Cache:** Redis 7
- **Queue:** RabbitMQ 3
- **Auth:** JWT (RS256) + OAuth2

### Infrastructure
- **Deployment:** Docker + Docker Compose
- **CI/CD:** GitHub Actions (Blue-Green)
- **Nginx:** Reverse proxy with rate limiting
- **Monitoring:** Prometheus + Grafana
- **Logging:** Centralized with correlation IDs

## 📦 Features

### 🔐 Authentication & Authorization
- JWT-based authentication with refresh tokens
- OAuth2 (Google sign-in)
- Role-based access control (30+ permissions)
- Session management with HTTP-only cookies

### 🏪 Venue Management
- Geospatial search with PostGIS
- Real-time availability
- Dynamic pricing
- Rich media galleries

### 📝 Reviews & Verification
- OCR receipt validation
- GPS location cross-check
- Weighted rating system (verified = 3x weight)
- Fraud detection

### 🎫 Bookings & Payments
- Real-time table reservations
- Midtrans/Xendit integration
- Booking confirmation via WhatsApp
- Refund automation

### 🎁 Promotions & Ads
- Tier-based boosting (Basic/Gold/Platinum)
- Self-service ad creation
- Budget management
- Performance analytics

### 🏆 Gamification
- XP points system
- Achievement badges
- Leaderboards
- Referral tracking

### 💳 Digital Membership
- Nightpass subscriptions
- TOTP QR code entry
- Recurring billing

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/afterhoursid/afterhours.git
cd afterhours
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp deploy/.env.example .env
# Edit .env with your values
```

4. **Start database services**
```bash
docker-compose -f deploy/docker-compose.yml up -d postgres redis rabbitmq
```

5. **Run database migrations**
```bash
npx prisma migrate dev
```

6. **Start development server**
```bash
npm run dev
```

7. **Open http://localhost:3000**

### Docker Development

```bash
# Start all services
docker-compose -f deploy/docker-compose.yml up

# Run specific service
docker-compose -f deploy/docker-compose.yml up app
```

## 📁 Project Structure

```
afterhours/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboards
│   └── admin/             # Admin panels
├── src/
│   ├── lib/               # Core libraries
│   │   ├── actions/       # Server actions
│   │   ├── services/      # Business logic
│   │   ├── hooks/         # React hooks
│   │   └── utils/         # Utilities
│   └── components/        # React components
├── prisma/                # Database schema
├── deploy/                # Infrastructure config
│   ├── nginx.conf         # Nginx config
│   └── docker-compose.*   # Docker configs
├── docs/                  # Documentation
│   └── openapi.yaml       # API spec
└── tests/                 # Test files
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `JWT_SECRET` | JWT signing key | Yes |
| `MIDTRANS_SERVER_KEY` | Midtrans server key | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Lint
npm run lint

# Type check
npm run type-check
```

## 📄 API Documentation

- **OpenAPI Spec:** [`docs/openapi.yaml`](docs/openapi.yaml)
- **Postman Collection:** Import from OpenAPI spec
- **Swagger UI:** `/api/docs` (development)

## 🔐 Security

- All endpoints require authentication except public ones
- JWT tokens with 1-hour expiry
- Refresh tokens stored in HTTP-only cookies
- Rate limiting per endpoint
- SQL injection protection via Prisma
- XSS protection via React
- CSRF tokens for state-changing operations

## 📊 Monitoring

- **Health:** `GET /health`
- **Metrics:** `GET /metrics`
- **Grafana:** Port 3000 (development)

## 🚢 Deployment

### Production Build
```bash
npm run build
docker build -t afterhours:latest .
```

### Blue-Green Deployment
See [deploy/README.md](deploy/README.md) for detailed instructions.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

Proprietary - All rights reserved

## 🙏 Acknowledgments

- Vercel for Next.js
- Prisma Team
- Google Maps Platform
- Indonesian nightlife community
