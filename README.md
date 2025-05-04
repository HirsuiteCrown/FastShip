# FastShip – Frontend Deployment Platform

This project is a full-stack deployment platform inspired by Vercel. It allows users to deploy their frontend apps from GitHub, tracks build logs, assigns subdomains, and hosts them on AWS S3 via ECS with a robust backend and analytics system.

---

## 📦 Features

- Deploy frontend apps by connecting GitHub
- Real-time build logs with dynamic updates
- Subdomain assignment for each project
- AWS S3 hosting with ECS Fargate deployment
- Project-level analytics using ClickHouse

---

## 🛠️ Tech Stack

- **Backend:** JavaScript(Expressjs, kafkajs)
- **Database:** PostgreSQL with Prisma
- **Validation:** Zod
- **ORM:** Prisma
- **Queue:** Upstash Redis
- **Analytics:** ClickHouse
- **Storage:** AWS S3 (for build artifacts)
- **CI/CD:** GitHub Webhooks + ECS Fargate
- **Infrastructure:** Docker, AWS ECS
