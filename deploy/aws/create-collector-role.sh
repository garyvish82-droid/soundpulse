#!/usr/bin/env bash
# deploy/aws/create-collector-role.sh
# Creates IAM role for soundpulse-collector Lambda with least-privilege policy.
# Run once before first deploy.

set -euo pipefail

REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_NAME="soundpulse-collector-role"
POLICY_NAME="soundpulse-collector-policy"

echo "→ Creating IAM trust policy..."
cat > /tmp/soundpulse-trust.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF

echo "→ Creating role: ${ROLE_NAME}"
aws iam create-role \
  --role-name "${ROLE_NAME}" \
  --assume-role-policy-document file:///tmp/soundpulse-trust.json \
  --description "SoundPulse collector Lambda — least privilege" \
  --no-cli-pager \
  2>/dev/null || echo "  Role already exists, skipping create."

echo "→ Attaching Lambda basic execution (CloudWatch Logs)..."
aws iam attach-role-policy \
  --role-name "${ROLE_NAME}" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" \
  2>/dev/null || echo "  Already attached."

echo "→ Writing inline policy (SQS + S3 + SSM)..."
cat > /tmp/soundpulse-collector-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SQSSend",
      "Effect": "Allow",
      "Action": ["sqs:SendMessage", "sqs:GetQueueUrl"],
      "Resource": "arn:aws:sqs:${REGION}:${ACCOUNT_ID}:soundpulse-raw-queue"
    },
    {
      "Sid": "S3Archive",
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::soundpulse-raw-archive/*"
    },
    {
      "Sid": "SSMSecrets",
      "Effect": "Allow",
      "Action": ["ssm:GetParametersByPath", "ssm:GetParameter"],
      "Resource": "arn:aws:ssm:${REGION}:${ACCOUNT_ID}:parameter/soundpulse/*"
    },
    {
      "Sid": "KMSDecrypt",
      "Effect": "Allow",
      "Action": ["kms:Decrypt"],
      "Resource": "arn:aws:kms:${REGION}:${ACCOUNT_ID}:alias/aws/ssm"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name "${ROLE_NAME}" \
  --policy-name "${POLICY_NAME}" \
  --policy-document file:///tmp/soundpulse-collector-policy.json \
  --no-cli-pager

echo ""
echo "✅ IAM role ready"
echo "   ARN: arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
