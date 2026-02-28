import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();
const execAsync = promisify(exec);

// Cron job for automated database backups
export async function POST(request: Request) {
  const startTime = Date.now();
  
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type = 'full' } = await request.json().catch(() => ({}));
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = process.env.BACKUP_DIR || '/tmp/backups';
    
    // Create PostgreSQL backup
    const pgDumpFile = join(backupDir, `postgresql-${timestamp}.sql`);
    const pgCommand = `pg_dump "${process.env.DATABASE_URL}" > ${pgDumpFile}`;
    
    try {
      await execAsync(pgCommand);
    } catch (pgError) {
      console.error('PostgreSQL backup failed:', pgError);
      // Continue even if PostgreSQL backup fails
    }
    
    // Upload to S3 if configured
    let s3Bucket = process.env.AWS_S3_BUCKET;
    
    if (s3Bucket) {
      
      try {
        await execAsync(`aws s3 cp ${pgDumpFile} s3://${s3Bucket}/backups/postgresql/`);
        console.log('PostgreSQL backup uploaded to S3');
      } catch (s3Error) {
        console.error('S3 upload failed:', s3Error);
      }
    }
    
    // MongoDB backup if configured
    if (process.env.MONGODB_URL) {
      const mongoDumpDir = join(backupDir, `mongo-${timestamp}`);
      const mongoCommand = `mongodump --uri="${process.env.MONGODB_URL}" --out=${mongoDumpDir}`;
      
      try {
        await execAsync(mongoCommand);
        
        // Compress and upload to S3
        const mongoTarFile = join(backupDir, `mongo-${timestamp}.tar.gz`);
        await execAsync(`tar -czf ${mongoTarFile} -C ${backupDir} mongo-${timestamp}`);
        
        if (process.env.AWS_S3_BUCKET) {
          await execAsync(`aws s3 cp ${mongoTarFile} s3://${s3Bucket}/backups/mongodb/`);
        }
        
        // Cleanup
        await execAsync(`rm -rf ${mongoDumpDir} ${mongoTarFile}`);
      } catch (mongoError) {
        console.error('MongoDB backup failed:', mongoError);
      }
    }
    
    // Cleanup old local backups (keep last 7 days)
    try {
      await execAsync(`find ${backupDir} -name "*.sql" -mtime +7 -delete`);
      await execAsync(`find ${backupDir} -name "*.tar.gz" -mtime +7 -delete`);
    } catch (cleanupError) {
      console.error('Cleanup failed:', cleanupError);
    }
    
    // Log backup event
    const duration = Date.now() - startTime;
    await prisma.auditLog.create({
      data: {
        action: 'BACKUP',
        resource: 'database',
        details: JSON.stringify({ type, duration, timestamp }),
        createdAt: new Date(),
      },
    });
    
    return NextResponse.json({
      success: true,
      duration,
      timestamp: new Date().toISOString(),
      message: 'Backup completed successfully',
    });
  } catch (error) {
    console.error('Backup error:', error);
    
    return NextResponse.json(
      { error: 'Backup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    lastBackup: new Date().toISOString(),
  });
}
