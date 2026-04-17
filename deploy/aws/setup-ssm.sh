#!/usr/bin/env bash
# deploy/aws/setup-ssm.sh
# Stores SoundPulse secrets in SSM Parameter Store.
# Run once. Safe to re-run — updates existing params.
#
# Usage: ./deploy/aws/setup-ssm.sh
# You will be prompted for each value — nothing is passed as CLI args.

set -euo pipefail

REGION="us-east-1"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SoundPulse — SSM Parameter Setup"
echo "  Region: ${REGION}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── SC Client ID (not secret — stored as plain String) ────────────
read -rp "SoundCloud client_id: " SC_CLIENT_ID
aws ssm put-parameter \
  --name "/soundpulse/sc_client_id" \
  --value "${SC_CLIENT_ID}" \
  --type "String" \
  --overwrite \
  --region "${REGION}" \
  --no-cli-pager
echo "✓ /soundpulse/sc_client_id stored"

# ── SC OAuth Token (secret — stored as SecureString, encrypted at rest) ───
read -rsp "SoundCloud OAuth access_token (input hidden): " SC_TOKEN
echo ""
aws ssm put-parameter \
  --name "/soundpulse/sc_oauth_token" \
  --value "${SC_TOKEN}" \
  --type "SecureString" \
  --overwrite \
  --region "${REGION}" \
  --no-cli-pager
echo "✓ /soundpulse/sc_oauth_token stored (SecureString)"

# ── Monitored User IDs (comma-separated SC user IDs to track) ────
echo ""
echo "Enter SC user IDs to monitor (comma-separated, e.g. 123456,789012)"
echo "These are the SoundCloud user IDs for your beta users."
read -rp "User IDs: " USER_IDS
aws ssm put-parameter \
  --name "/soundpulse/monitored_user_ids" \
  --value "${USER_IDS}" \
  --type "String" \
  --overwrite \
  --region "${REGION}" \
  --no-cli-pager
echo "✓ /soundpulse/monitored_user_ids stored"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ SSM setup complete"
echo ""
echo "Verify:"
echo "  aws ssm get-parameters-by-path --path /soundpulse/ --region ${REGION} --query 'Parameters[].Name'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
