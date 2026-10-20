
# E-Commerce Platform

A full-stack e-commerce application with a customer storefront,
an administrative dashboard, and a secure backend API.

## Project Status

Phase 1: Repository and workspace setup.

## Technology Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Zustand

### Backend
- NestJS
- TypeScript
- REST API
- Prisma ORM

### Database and Infrastructure
- PostgreSQL
- Redis
- Docker
- pnpm workspaces

### Integrations
- Razorpay or Cashfree payments
- Transactional email provider
- Cloudinary or S3-compatible file storage
- Shipping provider integration

## Project Structure

```text
ecommerce-platform/
├── apps/
│   ├── web/
│   ├── admin/
│   └── api/
├── packages/
│   ├── shared-types/
│   └── shared-validation/
├── infrastructure/
├── docs/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .env.example
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js LTS
- pnpm
- Git
- Docker Desktop
- VS Code

## Development Roadmap

1. Repository and workspace configuration.
2. Shared TypeScript configuration.
3. Frontend application setup.
4. Admin dashboard setup.
5. NestJS backend setup.
6. PostgreSQL and Prisma integration.
7. Authentication and authorization.
8. Product catalog and inventory.
9. Cart and wishlist.
10. Checkout, payments, and orders.
11. Admin operations.
12. Shipping, returns, and refunds.
13. Testing and security hardening.
14. Deployment and production verification.

## Security

- Never commit real environment files or secrets.
- Never expose payment gateway secrets in frontend code.
- Validate all input on the backend.
- Verify payment webhooks.
- Enforce server-side authorization.
- Use database migrations for schema changes.

## Development Notes

This project is being built incrementally.
A module should be considered complete only after its
implementation and relevant tests have been verified.



Run the Vite creation command.



Run pnpm install.



Run pnpm --filter web dev and open the local URL


Run pnpm --filter api exec prisma studio  open prisma studio

pnpm --filter admin dev
pnpm --filter web dev
pnpm --filter api start:dev
