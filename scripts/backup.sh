#!/bin/bash
# =====================================================
# DATABASE BACKUP SCRIPT
# Automated daily backups to S3
# =====================================================

set -e

# Configuration
BACKUP_DIR="/tmp/backups"
S3_BUCKET="${BACKUP_S3_BUCKET:-afterhours-backups}"
DATE=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=30

# PostgreSQL backup
echo "Starting PostgreSQL backup..."
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/postgres-$DATE.sql"
gzip "$BACKUP_DIR/postgres-$DATE.sql"

# Upload to S3
echo "Uploading to S3..."
aws s3 cp "$BACKUP_DIR/postgres-$DATE.sql.gz" "s3://$S3_BUCKET/postgres/"

# Cleanup old backups (older than RETENTION_DAYS)
echo "Cleaning up old backups..."
aws s3 ls "s3://$S3_BUCKET/postgres/" | \
  while read -r line; do
    filename=$(echo "$line" | awk '{print $4}')
    filedate=$(echo "$filename" | grep -oP '\d{8}')
    if [ -n "$filedate" ]; then
      fileage=$(($(date +%s) - $(date -d "$filedate" +%s) / 86400))
      if [ $fileage -gt $RETENTION_DAYS ]; then
        aws s3 rm "s3://$S3_BUCKET/postgres/$filename"
        echo "Deleted: $filename"
      fi
    fi
  done

echo "PostgreSQL backup complete!"

# MongoDB backup (if applicable)
if [ -n "$MONGODB_URL" ]; then
  echo "Starting MongoDB backup..."
  mongodump --uri="$MONGODB_URL" --out="$BACKUP_DIR/mongo-$DATE"
  tar -czf "$BACKUP_DIR/mongo-$DATE.tar.gz" -C "$BACKUP_DIR/mongo-$DATE" .
  rm -rf "$BACKUP_DIR/mongo-$DATE"
  
  aws s3 cp "$BACKUP_DIR/mongo-$DATE.tar.gz" "s3://$S3_BUCKET/mongo/"
  echo "MongoDB backup complete!"
fi

echo "All backups complete!"
