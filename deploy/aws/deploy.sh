#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────
#  SoundPulse — AWS Deployment Script
#  Pushes Docker image to ECR, deploys on ECS Fargate (or EC2)
# ──────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="${AWS_ECR_REPO:-soundpulse}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SoundPulse — Deploying to AWS"
echo "  Region : ${AWS_REGION}"
echo "  Account: ${AWS_ACCOUNT_ID}"
echo "  Image  : ${ECR_URI}:${IMAGE_TAG}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Create ECR Repo (if not exists) ───────────────────────────
echo "→ Ensuring ECR repository..."
aws ecr describe-repositories --repository-names "${ECR_REPO}" --region "${AWS_REGION}" \
  2>/dev/null || \
  aws ecr create-repository --repository-name "${ECR_REPO}" --region "${AWS_REGION}"

# ── 2. Authenticate Docker to ECR ────────────────────────────────
echo "→ Authenticating Docker to ECR..."
aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# ── 3. Build Docker Image ─────────────────────────────────────────
echo "→ Building Docker image..."
cd "$(dirname "$0")/../.."
docker build -t "${ECR_REPO}:${IMAGE_TAG}" -f deploy/Dockerfile .

# ── 4. Tag & Push to ECR ─────────────────────────────────────────
echo "→ Pushing to ECR..."
docker tag "${ECR_REPO}:${IMAGE_TAG}" "${ECR_URI}:${IMAGE_TAG}"
docker push "${ECR_URI}:${IMAGE_TAG}"

# ── 5. Store Secrets in AWS Secrets Manager ───────────────────────
echo "→ Storing secrets..."
aws secretsmanager create-secret \
  --name "soundpulse/env" \
  --description "SoundPulse environment variables" \
  --secret-string file://.env \
  --region "${AWS_REGION}" \
  2>/dev/null || \
  aws secretsmanager update-secret \
  --secret-id "soundpulse/env" \
  --secret-string file://.env \
  --region "${AWS_REGION}"

# ── 6. Deploy via ECS Fargate ─────────────────────────────────────
echo "→ Deploying ECS task..."
# Check if cluster exists
aws ecs describe-clusters --clusters soundpulse --region "${AWS_REGION}" \
  --query 'clusters[0].status' --output text 2>/dev/null | grep -q ACTIVE \
  || aws ecs create-cluster --cluster-name soundpulse --region "${AWS_REGION}"

# Register task definition (uses template.yaml values)
aws ecs register-task-definition \
  --family soundpulse \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu "512" --memory "1024" \
  --execution-role-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole" \
  --container-definitions "[{
    \"name\": \"soundpulse\",
    \"image\": \"${ECR_URI}:${IMAGE_TAG}\",
    \"portMappings\": [{\"containerPort\": 8080, \"protocol\": \"tcp\"}],
    \"essential\": true,
    \"logConfiguration\": {
      \"logDriver\": \"awslogs\",
      \"options\": {
        \"awslogs-group\": \"/ecs/soundpulse\",
        \"awslogs-region\": \"${AWS_REGION}\",
        \"awslogs-stream-prefix\": \"ecs\"
      }
    }
  }]" \
  --region "${AWS_REGION}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Deployment complete!"
echo "  Image pushed to: ${ECR_URI}:${IMAGE_TAG}"
echo "  Next steps:"
echo "    1. Create ECS service with your VPC/subnet settings"
echo "    2. Attach an Application Load Balancer on port 8080"
echo "    3. Point your MCP client to: https://your-alb-url/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
