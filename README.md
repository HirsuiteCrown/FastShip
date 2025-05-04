# FastShip – Frontend Deployment Platform

This project is a full-stack deployment platform inspired by Vercel. It allows users to deploy their frontend apps from GitHub, tracks build logs, assigns subdomains, and hosts them on AWS S3 via ECS with a robust backend and analytics system.

---

## 📦 Features

- Deploy frontend apps by connecting GitHub
- Real-time build logs with dynamic updates
- Subdomain assignment for each project
- AWS S3 hosting with ECS Fargate deployment
- GitHub webhooks to trigger builds
- Project-level analytics using ClickHouse

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router, Server Actions)
- **Backend:** Hono.js + TypeScript (deployed on Cloudflare Workers)
- **Database:** PostgreSQL with Prisma
- **Auth:** Clerk
- **Validation:** Zod
- **ORM:** Prisma
- **Queue:** Upstash Redis
- **Analytics:** ClickHouse
- **Storage:** AWS S3 (for build artifacts)
- **CI/CD:** GitHub Webhooks + ECS Fargate
- **Infrastructure:** Docker, Terraform, AWS ECS, Cloudflare

---

## 📁 Project Structure

