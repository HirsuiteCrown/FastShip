🚀 Vercel Clone - Full Stack Deployment Platform
This is a full-stack self-hosted Vercel-like platform that allows users to deploy their frontend applications (e.g., React, Vue) from a GitHub repository. It spins up a container to build the project, pushes the build to S3, and serves it using a reverse proxy. Logs are collected and stored in ClickHouse using Kafka for real-time observability.

🔧 Features
📦 Build & Deploy frontend projects directly from a GitHub URL.

☁️ S3-based Static Hosting with subdomain routing.

🐳 Fargate Container Launch for isolated builds.

🔍 Logs Collection via Kafka → ClickHouse.

🌐 Reverse Proxy routing using subdomains.

🔐 Environment variable-based secure configurations.

🛠️ Tech Stack

Layer	Technology
Frontend Build	Node.js (build-server)
Reverse Proxy	Express.js + http-proxy
Backend API	Express.js + Prisma + AWS ECS/Fargate
Messaging Queue	Kafka (Aiven)
Logs Storage	ClickHouse
File Storage	AWS S3
Database	PostgreSQL (via Prisma ORM)
CI/CD	Custom ECS Task Launch via API
📁 Project Structure
bash
Copy
Edit
.
├── api-server          # API server for project creation, deployment, and logs
│   └── index.js
├── build-server        # Containerized service for building frontend code
│   └── script.js
├── reverse-proxy       # Handles request routing to S3 bucket
│   └── index.js
├── kafka.pem           # Kafka SSL Certificate
└── README.md
🚀 How It Works
User creates a project using the /project API by providing a GitHub repository URL.

The user then hits /deploy which:

Triggers an ECS Fargate task with the repo, project ID, and deployment ID.

The build-server container:

Clones the repo

Runs npm install && npm run build

Uploads the /dist folder to S3 under __outputs/{PROJECT_ID}/...

Streams all logs to Kafka.

The Kafka consumer (api-server):

Reads logs and stores them in ClickHouse under log_events table.

The reverse-proxy server:

Maps subdomains to S3 paths (e.g., project1.yourdomain.com → s3://.../__outputs/projectId/...)

Appends index.html if root path is accessed.

📦 API Endpoints
POST /project
Create a new project.

json
Copy
Edit
{
  "name": "My App",
  "gitURL": "https://github.com/username/repo"
}
POST /deploy
Deploy the given project by projectId.

json
Copy
Edit
{
  "projectId": "clxyz..."
}
GET /logs/:deploymentId
Fetch build logs for a deployment.

🧪 ClickHouse Schema
sql
Copy
Edit
CREATE TABLE log_events (
  event_id String,
  deployemnt_id String,
  log String,
  timestamp DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY timestamp;
🔐 .env Configuration (Required)

Variable	Description
AWS_ACCESS_KEY_ID	AWS S3 access key
AWS_SECRET_ACCESS_KEY	AWS S3 secret
S3_BUCKET_NAME	S3 bucket for storing builds
ECS_CLUSTER	ECS cluster name
ECS_TASK	Task definition for build-server
CLICKHOUSE_HOST	ClickHouse DB host with port
CLICKHOUSE_USER	Username for ClickHouse
CLICKHOUSE_PASSWORD	Password for ClickHouse
KAFKA_BROKER	Kafka broker from Aiven
KAFKA_USERNAME	Kafka username (e.g., avnadmin)
KAFKA_PASSWORD	Kafka password
🧰 Local Development
Run the API server:

bash
Copy
Edit
node api-server/index.js
Run the Reverse Proxy:

bash
Copy
Edit
node reverse-proxy/index.js
The Build Server will run as a container triggered via ECS (not locally).

🐳 ECS Task Setup (for Build Server)
Ensure your ECS task definition has the following environment variables:

GIT_REPOSITORY_URL

PROJECT_ID

DEPLOYMENT_ID

This task should run node script.js from the build-server.
