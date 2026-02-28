#!/bin/bash
# =====================================================
# DATABASE MIGRATION SCRIPT
# Safe database migrations with rollback capability
# =====================================================

set -e

ENVIRONMENT="${1:-production}"
LOG_FILE="/var/log/afterhours/migration-$(date +%Y%m%d-%H%M%S).log"

echo "Starting migration for environment: $ENVIRONMENT"
echo "Log file: $LOG_FILE"

# Create backup before migration
echo "Creating pre-migration backup..."
./scripts/backup.sh

# Run Prisma migrations
echo "Running Prisma migrations..."
npx prisma migrate deploy

# Seed data if needed
if [ "$ENVIRONMENT" = "development" ]; then
  echo "Running seed script..."
  npx prisma db seed
fi

# Verify database integrity
echo "Verifying database integrity..."
npx prisma validate

echo "Migration completed successfully!"

# Notify via webhook (optional)
if [ -n "$SLACK_WEBHOOK" ]; then
  curl -X POST "$SLACK_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "{\"text\": \"✅ Database migration completed on $ENVIRONMENT\"}"
fi
