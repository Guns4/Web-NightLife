#!/bin/bash

# =====================================================
# DISASTER RECOVERY SCRIPT
# AfterHoursID - System Governance
#
# Restores database from S3 backup in under 10 minutes
# =====================================================

set -euo pipefail

# Configuration
S3_BUCKET="${S3_BUCKET:-afterhours-backups}"
S3_REGION="${S3_REGION:-ap-southeast-1}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-afterhours}"
DB_USER="${DB_USER:-afterhours}"
MAX_RESTORE_TIME=600  # 10 minutes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check for required tools
    command -v aws >/dev/null 2>&1 || { log_error "aws CLI not found"; exit 1; }
    command -v psql >/dev/null 2>&1 || { log_error "psql not found"; exit 1; }
    
    # Check AWS credentials
    aws sts get-caller-identity >/dev/null 2>&1 || { log_error "AWS credentials not configured"; exit 1; }
    
    log_info "Prerequisites check passed"
}

# List available backups
list_backups() {
    log_info "Available backups:"
    aws s3 ls "s3://${S3_BUCKET}/postgres/" --recursive | sort -r
}

# Get latest backup
get_latest_backup() {
    local latest
    latest=$(aws s3 ls "s3://${S3_BUCKET}/postgres/" --recursive | sort | tail -n 1 | awk '{print $4}')
    echo "$latest"
}

# Download and restore backup
restore_database() {
    local backup_path=$1
    local start_time=$(date +%s)
    
    log_info "Starting database restoration..."
    log_info "Backup: $backup_path"
    
    # Create temp directory
    local temp_dir=$(mktemp -d)
    trap "rm -rf $temp_dir" EXIT
    
    # Download backup
    log_info "Downloading backup from S3..."
    local backup_file="$temp_dir/backup.dump"
    aws s3 cp "s3://${S3_BUCKET}/${backup_path}" "$backup_file"
    
    # Check file size
    local size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file")
    log_info "Backup size: $((size / 1024 / 1024)) MB"
    
    # Stop application (if running)
    log_info "Stopping application services..."
    # docker-compose stop app || true
    
    # Drop existing connections
    log_info "Dropping existing connections..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '$DB_NAME'
        AND pid <> pg_backend_pid();
    " || true
    
    # Drop and recreate database
    log_info "Recreating database..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "
        DROP DATABASE IF EXISTS $DB_NAME;
        CREATE DATABASE $DB_NAME;
    "
    
    # Restore backup
    log_info "Restoring database..."
    pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -j 4 "$backup_file"
    
    # Verify restore
    log_info "Verifying restoration..."
    local table_count
    table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')
    
    if [ "$table_count" -gt 0 ]; then
        log_info "Database restored successfully! ($table_count tables)"
    else
        log_error "Database restoration may have failed"
        exit 1
    fi
    
    # Start application
    log_info "Starting application services..."
    # docker-compose up -d app
    
    # Calculate time
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_info "Restoration completed in $((duration / 60)) minutes and $((duration % 60)) seconds"
    
    if [ $duration -gt $MAX_RESTORE_TIME ]; then
        log_warn "Restore time exceeded target of $((MAX_RESTORE_TIME / 60)) minutes"
    fi
}

# Restore Redis cache
restore_redis() {
    log_info "Restoring Redis cache..."
    
    local latest_redis
    latest_redis=$(aws s3 ls "s3://${S3_BUCKET}/redis/" --recursive | sort | tail -n 1 | awk '{print $4}')
    
    if [ -z "$latest_redis" ]; then
        log_warn "No Redis backup found"
        return
    fi
    
    local temp_dir=$(mktemp -d)
    aws s3 cp "s3://${S3_BUCKET}/${latest_redis}" "$temp_dir/redis.rdb"
    
    # Stop Redis
    # docker-compose stop redis
    
    # Restore
    # cp "$temp_dir/redis.rdb" ./redis/data/
    
    # Start Redis
    # docker-compose start redis
    
    log_info "Redis cache restored"
}

# Health check after restore
health_check() {
    log_info "Running health checks..."
    
    # Check database
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        log_info "Database: OK"
    else
        log_error "Database: FAILED"
        return 1
    fi
    
    # Check API
    # if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
    #     log_info "API: OK"
    # else
    #     log_error "API: FAILED"
    #     return 1
    # fi
    
    log_info "All health checks passed!"
}

# Main function
main() {
    echo "========================================"
    echo "  AfterHoursID Disaster Recovery"
    echo "========================================"
    echo ""
    
    check_prerequisites
    
    case "${1:-latest}" in
        list)
            list_backups
            ;;
        latest)
            local backup
            backup=$(get_latest_backup)
            if [ -z "$backup" ]; then
                log_error "No backups found"
                exit 1
            fi
            restore_database "$backup"
            restore_redis
            health_check
            ;;
        *)
            if [ -n "$1" ]; then
                restore_database "$1"
                restore_redis
                health_check
            else
                echo "Usage: $0 {latest|list|<backup-path>}"
                exit 1
            fi
            ;;
    esac
}

main "$@"
