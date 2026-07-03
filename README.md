# GVSwift

GVSwift — Premium fashion e-commerce platform built with Next.js 15, Supabase, and Prisma ORM.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-gvswift.vercel.app-black?style=for-the-badge)](https://gvswift.vercel.app)

## Tech Stack

![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Sentry](https://img.shields.io/badge/Sentry-362D59?style=for-the-badge&logo=sentry&logoColor=white)

## Features

- Full e-commerce flow: browse → cart → checkout → orders
- Cash on Delivery (COD) across India
- Supabase Auth with email OTP
- Admin dashboard with order management and analytics
- Real-time inventory and order status updates via Inngest
- Transactional emails via Resend
- Rate limiting via Upstash Redis
- Error monitoring via Sentry
- AVIF/WebP image optimization
- Full CSP security headers + HSTS

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL (via Supabase)

### Steps
```bash
git clone https://github.com/veerajyothish/GVSwift.git
cd GVSwift
npm install
cp .env.example .env.local
# Fill in your Supabase + Upstash credentials in .env.local
npm run db:push
npm run dev
```

## Environment Variables

See .env.example for all required variables. Key services: Supabase, Upstash Redis, Resend, Sentry, Inngest.

## Project Structure

```
src/
├── app/          # Next.js App Router pages
├── components/   # Reusable UI components
├── context/      # React context providers
├── lib/          # Utilities, Prisma client, Supabase
└── middleware.ts # Auth, rate limiting, security headers
prisma/           # Database schema and migrations
docs/             # Technical documentation
```

MIT License — © 2026 GVSwift
