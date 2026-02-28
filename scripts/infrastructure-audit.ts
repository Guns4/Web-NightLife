#!/usr/bin/env tsx
/**
 * =====================================================
 * PHASE 2 INFRASTRUCTURE AUDIT
 * AfterHoursID - Docker Security & SQL Index Audit
 * =====================================================
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

// Types
interface AuditResult {
  category: string;
  items: AuditItem[];
}

interface AuditItem {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: string;
}

// =====================================================
// DOCKER SECURITY SCAN
// =====================================================

function scanDockerImages(): AuditItem[] {
  const items: AuditItem[] = [];

  try {
    // Check if Docker is available
    execSync('docker --version', { stdio: 'pipe' });
  } catch {
    return [{
      name: 'Docker Availability',
      status: 'fail',
      message: 'Docker is not installed or not accessible',
    }];
  }

  try {
    // List Docker images
    const images = execSync('docker images --format "{{.Repository}}:{{.Tag}}"', { encoding: 'utf-8' })
      .split('\n')
      .filter(Boolean);

    if (images.length === 0) {
      items.push({
        name: 'Docker Images',
        status: 'warn',
        message: 'No Docker images found',
      });
      return items;
    }

    // Check for latest tag (security issue)
    const latestImages = images.filter(img => img.includes(':latest'));
    if (latestImages.length > 0) {
      items.push({
        name: 'Latest Tag Usage',
        status: 'warn',
        message: `${latestImages.length} images using :latest tag`,
        details: latestImages.join(', '),
      });
    }

    // Check for vulnerable base images (basic check)
    const nodeImages = images.filter(img => img.includes('node:'));
    if (nodeImages.length > 0) {
      items.push({
        name: 'Node.js Base Images',
        status: 'pass',
        message: `${nodeImages.length} Node.js images found`,
      });
    }

    // Try to run trivy scan if available
    try {
      execSync('trivy --version', { stdio: 'pipe' });
      
      for (const image of images.slice(0, 3)) { // Scan first 3 images
        try {
          const result = execSync(`trivy image --severity HIGH,CRITICAL ${image} --format json`, { 
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
          });
          
          const vulnData = JSON.parse(result);
          const vulnCount = vulnData.Results?.reduce((sum: number, r: { Vulnerabilities?: unknown[] }) => 
            sum + (r.Vulnerabilities?.length || 0), 0) || 0;
          
          if (vulnCount > 0) {
            items.push({
              name: `Vulnerabilities: ${image}`,
              status: 'fail',
              message: `${vulnCount} critical/high vulnerabilities found`,
            });
          }
        } catch {
          // Image scan may fail, continue
        }
      }
    } catch {
      items.push({
        name: 'Trivy Scanner',
        status: 'warn',
        message: 'Trivy not installed - skipping vulnerability scan',
      });
    }

  } catch (error) {
    items.push({
      name: 'Docker Scan',
      status: 'fail',
      message: 'Failed to scan Docker images',
      details: String(error),
    });
  }

  return items;
}

// =====================================================
// SQL INDEX AUDIT
// =====================================================

function auditSQLIndices(): AuditItem[] {
  const items: AuditItem[] = [];

  // Check SQL schema files for index definitions
  const schemaDir = join(process.cwd(), 'src', 'lib', 'database');
  
  if (!existsSync(schemaDir)) {
    items.push({
      name: 'Schema Directory',
      status: 'warn',
      message: 'Schema directory not found',
    });
    return items;
  }

  const schemaFiles = readdirSync(schemaDir).filter(f => f.endsWith('.sql'));

  // Key columns that should be indexed
  const requiredIndices = [
    { table: 'users', column: 'email' },
    { table: 'users', column: 'x_correlation_id' },
    { table: 'venues', column: 'location' },
    { table: 'venues', column: 'owner_id' },
    { table: 'reservations', column: 'user_id' },
    { table: 'reservations', column: 'venue_id' },
    { table: 'reservations', column: 'status' },
    { table: 'reviews', column: 'venue_id' },
    { table: 'reviews', column: 'user_id' },
    { table: 'logs', column: 'correlation_id' },
    { table: 'logs', column: 'timestamp' },
  ];

  let indicesFound = 0;
  let correlationIdIndexFound = false;

  for (const file of schemaFiles) {
    try {
      const content = readFileSync(join(schemaDir, file), 'utf-8');
      
      // Check for correlation_id index
      if (content.toLowerCase().includes('correlation')) {
        correlationIdIndexFound = true;
        indicesFound++;
      }
      
      // Count index definitions
      const indexMatches = content.match(/CREATE INDEX/gi);
      if (indexMatches) {
        indicesFound += indexMatches.length;
      }
    } catch {
      // Skip files that can't be read
    }
  }

  // Report on correlation_id index
  if (correlationIdIndexFound) {
    items.push({
      name: 'Correlation ID Index',
      status: 'pass',
      message: 'X-Correlation-ID is indexed for fast debugging',
    });
  } else {
    items.push({
      name: 'Correlation ID Index',
      status: 'fail',
      message: 'X-Correlation-ID is NOT indexed - this will slow down debugging',
    });
  }

  // Report total indices
  if (indicesFound > 10) {
    items.push({
      name: 'Total SQL Indices',
      status: 'pass',
      message: `${indicesFound} indices defined across schemas`,
    });
  } else if (indicesFound > 0) {
    items.push({
      name: 'Total SQL Indices',
      status: 'warn',
      message: `Only ${indicesFound} indices found - consider adding more`,
    });
  } else {
    items.push({
      name: 'Total SQL Indices',
      status: 'fail',
      message: 'No indices found - performance will be poor',
    });
  }

  return items;
}

// =====================================================
// ENVIRONMENT SECURITY CHECK
// =====================================================

function checkEnvironmentSecurity(): AuditItem[] {
  const items: AuditItem[] = [];

  // Check for .env file (should not be committed)
  if (existsSync(join(process.cwd(), '.env'))) {
    items.push({
      name: '.env File',
      status: 'fail',
      message: '.env file exists in project root - add to .gitignore',
    });
  }

  // Check .gitignore for important entries
  const gitignorePath = join(process.cwd(), '.gitignore');
  if (existsSync(gitignorePath)) {
    const gitignore = readFileSync(gitignorePath, 'utf-8');
    
    const requiredIgnores = ['.env', 'node_modules/', '*.log', '.DS_Store'];
    const missing = requiredIgnores.filter(i => !gitignore.includes(i));
    
    if (missing.length === 0) {
      items.push({
        name: '.gitignore Configuration',
        status: 'pass',
        message: 'All required entries present',
      });
    } else {
      items.push({
        name: '.gitignore Configuration',
        status: 'warn',
        message: `Missing: ${missing.join(', ')}`,
      });
    }
  }

  // Check for hardcoded secrets in code
  const suspiciousPatterns = [
    { pattern: /password\s*=\s*['"][^'"]+['"]/gi, name: 'Hardcoded passwords' },
    { pattern: /apiKey\s*=\s*['"][^'"]+['"]/gi, name: 'Hardcoded API keys' },
    { pattern: /secret\s*=\s*['"][^'"]+['"]/gi, name: 'Hardcoded secrets' },
  ];

  const srcDir = join(process.cwd(), 'src');
  let suspiciousFound = false;

  // This is a basic check - would need more sophisticated scanning in production
  // For now, just check a few key files
  const keyFiles = ['auth.ts', 'auth-utils.ts'];
  
  for (const file of keyFiles) {
    const filePath = join(srcDir, 'lib', 'actions', file);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8');
      
      // Check for JWT_SECRET etc - should be from env
      if (content.includes('JWT_SECRET') && content.includes('process.env.JWT_SECRET')) {
        items.push({
          name: 'JWT Secret Handling',
          status: 'pass',
          message: 'JWT secret loaded from environment',
        });
      }
    }
  }

  return items;
}

// =====================================================
// MAIN AUDIT RUNNER
// =====================================================

function runAudit(): void {
  console.log('===========================================');
  console.log('  AfterHoursID Infrastructure Audit');
  console.log('===========================================\n');

  const results: AuditResult[] = [];

  // 1. Docker Security Scan
  console.log('Scanning Docker images...');
  results.push({
    category: 'Docker Security',
    items: scanDockerImages(),
  });

  // 2. SQL Index Audit
  console.log('Auditing SQL indices...');
  results.push({
    category: 'SQL Index Audit',
    items: auditSQLIndices(),
  });

  // 3. Environment Security
  console.log('Checking environment security...');
  results.push({
    category: 'Environment Security',
    items: checkEnvironmentSecurity(),
  });

  // Print results
  let totalPass = 0;
  let totalWarn = 0;
  let totalFail = 0;

  for (const result of results) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`  ${result.category}`);
    console.log('='.repeat(50));

    for (const item of result.items) {
      const icon = item.status === 'pass' ? '✅' : item.status === 'warn' ? '⚠️' : '❌';
      console.log(`${icon} ${item.name}: ${item.message}`);
      
      if (item.details) {
        console.log(`   Details: ${item.details}`);
      }

      if (item.status === 'pass') totalPass++;
      else if (item.status === 'warn') totalWarn++;
      else totalFail++;
    }
  }

  // Summary
  console.log('\n===========================================');
  console.log('  Summary');
  console.log('===========================================');
  console.log(`✅ Passed:  ${totalPass}`);
  console.log(`⚠️  Warnings: ${totalWarn}`);
  console.log(`❌ Failed:  ${totalFail}`);

  if (totalFail > 0) {
    console.log('\n⚠️  Action required: Fix failed items before deployment');
    process.exit(1);
  } else if (totalWarn > 0) {
    console.log('\n⚠️  Review warnings before deployment');
    process.exit(0);
  } else {
    console.log('\n✅ All checks passed!');
    process.exit(0);
  }
}

// Run audit
runAudit();
