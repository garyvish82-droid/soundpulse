#!/usr/bin/env bash
# deploy/aws/deploy-collector.sh
# Packages and deploys soundpulse-collector Lambda + EventBridge 15-min cron.
# Usage:
#   First deploy:      ./deploy/aws/deploy-collector.sh create
#   Update code only:  ./deploy/aws/deploy-collector.sh update

set -euo pipefail

MODE="${1:-update}"
REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
FUNCTION_NAME="soundpulse-collector"
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/soundpulse-collector-role"
SQS_QUEUE_URL="https://sqs.${REGION}.amazonaws.com/${ACCOUNT_ID}/soundpulse-raw-queue"
S3_BUCKET="soundpulse-raw-archive"
RUNTIME="python3.12"
HANDLER="handler.handler"
TIMEOUT=120       # SC API + SQS round trips per user; 2 min is safe
MEMORY=256
CRON_RULE="soundpulse-collector-cron"

# Paths — script lives at deploy/aws/, project root is ../../
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BUILD_DIR="/tmp/soundpulse-collector-build"
ZIP_PATH="/tmp/soundpulse-collector.zip"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SoundPulse Collector — Deploy (${MODE})"
echo "  Region:  ${REGION}"
echo "  Account: ${ACCOUNT_ID}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Build package ──────────────────────────────────────────────
echo "→ Building Lambda package..."
rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}"

# Install dependencies into build dir (Lambda needs them bundled)
pip3 install python-dotenv httpx pydantic boto3 --target "${BUILD_DIR}" --quiet --upgrade --platform manylinux2014_x86_64 --implementation cp --python-version 3.12 --only-binary=:all:

# Copy Lambda handler
cp "${ROOT_DIR}/lambdas/collector/handler.py" "${BUILD_DIR}/"

# Copy src/soundcloud package — handler imports from soundcloud.client
cp -r "${ROOT_DIR}/src/soundcloud" "${BUILD_DIR}/soundcloud"

# Remove python-dotenv — not used in Lambda (SSM replaces it)

echo "✓ Package built"

# ── 2. Zip ────────────────────────────────────────────────────────
echo "→ Zipping..."
cd "${BUILD_DIR}"
zip -r "${ZIP_PATH}" . -x "*.pyc" -x "*/__pycache__/*" -x "*.dist-info/*" > /dev/null
echo "✓ Zipped: $(du -sh "${ZIP_PATH}" | cut -f1)"

# ── 3. Deploy Lambda ──────────────────────────────────────────────
if [ "${MODE}" = "create" ]; then
  echo "→ Creating Lambda function: ${FUNCTION_NAME}"
  aws lambda create-function \
    --function-name "${FUNCTION_NAME}" \
    --runtime "${RUNTIME}" \
    --role "${ROLE_ARN}" \
    --handler "${HANDLER}" \
    --zip-file "fileb://${ZIP_PATH}" \
    --timeout "${TIMEOUT}" \
    --memory-size "${MEMORY}" \
    --environment "Variables={SQS_QUEUE_URL=${SQS_QUEUE_URL},S3_BUCKET=${S3_BUCKET}}" \
    --description "SoundPulse: polls SC API every 15 min → SQS + S3" \
    --region "${REGION}" \
    --no-cli-pager

  echo "→ Waiting for Lambda to become active..."
  aws lambda wait function-active \
    --function-name "${FUNCTION_NAME}" \
    --region "${REGION}"

  echo "✓ Lambda created"

  # ── 4. EventBridge rule (create mode only) ────────────────────
  echo "→ Creating EventBridge cron rule: ${CRON_RULE}"
  aws events put-rule \
    --name "${CRON_RULE}" \
    --schedule-expression "rate(15 minutes)" \
    --state ENABLED \
    --description "Fires soundpulse-collector every 15 minutes" \
    --region "${REGION}" \
    --no-cli-pager

  LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}"

  echo "→ Granting EventBridge permission to invoke Lambda..."
  aws lambda add-permission \
    --function-name "${FUNCTION_NAME}" \
    --statement-id "eventbridge-cron-invoke" \
    --action "lambda:InvokeFunction" \
    --principal "events.amazonaws.com" \
    --source-arn "arn:aws:events:${REGION}:${ACCOUNT_ID}:rule/${CRON_RULE}" \
    --region "${REGION}" \
    --no-cli-pager \
    2>/dev/null || echo "  Permission already exists, skipping."

  echo "→ Wiring EventBridge rule → Lambda..."
  aws events put-targets \
    --rule "${CRON_RULE}" \
    --targets "Id=collector-target,Arn=${LAMBDA_ARN}" \
    --region "${REGION}" \
    --no-cli-pager

  echo "✓ EventBridge cron wired"

else
  echo "→ Updating Lambda code: ${FUNCTION_NAME}"
  aws lambda update-function-code \
    --function-name "${FUNCTION_NAME}" \
    --zip-file "fileb://${ZIP_PATH}" \
    --region "${REGION}" \
    --no-cli-pager > /dev/null

  echo "→ Waiting for update to propagate..."
  aws lambda wait function-updated \
    --function-name "${FUNCTION_NAME}" \
    --region "${REGION}"

  echo "✓ Lambda code updated"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Deploy complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Test it:"
echo "  aws lambda invoke \\"
echo "    --function-name ${FUNCTION_NAME} \\"
echo "    --region ${REGION} \\"
echo "    /tmp/collector-out.json && cat /tmp/collector-out.json"
