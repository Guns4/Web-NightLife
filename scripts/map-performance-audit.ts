#!/usr/bin/env tsx
/**
 * =====================================================
 * MAP PERFORMANCE & QUOTA AUDIT
 * AfterHoursID - Google Maps Optimization
 * =====================================================
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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
// MARKER CLUSTERING CHECK
// =====================================================

function checkMarkerClustering(): AuditItem[] {
  const items: AuditItem[] = [];
  
  const mapComponentPath = join(process.cwd(), 'src', 'components', 'map', 'NeonMap.tsx');
  
  if (!existsSync(mapComponentPath)) {
    return [{
      name: 'Map Component',
      status: 'fail',
      message: 'NeonMap component not found',
    }];
  }
  
  const content = readFileSync(mapComponentPath, 'utf-8');
  
  if (content.includes('Cluster') || content.includes('cluster')) {
    items.push({
      name: 'Marker Clustering',
      status: 'pass',
      message: 'Marker clustering implemented',
    });
  } else {
    items.push({
      name: 'Marker Clustering',
      status: 'warn',
      message: 'No marker clustering - consider for high-density areas',
    });
  }
  
  if (content.includes('useMemo') || content.includes('useCallback')) {
    items.push({
      name: 'Performance Hooks',
      status: 'pass',
      message: 'Performance optimization hooks found',
    });
  }
  
  return items;
}

// =====================================================
// GOOGLE MAPS API QUOTA CHECK
// =====================================================

function checkAPIConfiguration(): AuditItem[] {
  const items: AuditItem[] = [];
  
  const envPath = join(process.cwd(), '.env.local');
  const exampleEnvPath = join(process.cwd(), '.env.example');
  
  if (existsSync(envPath)) {
    const env = readFileSync(envPath, 'utf-8');
    if (env.includes('GOOGLE_MAPS_API_KEY')) {
      items.push({
        name: 'API Key Configuration',
        status: 'pass',
        message: 'Google Maps API key configured',
      });
    }
  } else if (existsSync(exampleEnvPath)) {
    items.push({
      name: 'API Key Configuration',
      status: 'warn',
      message: 'No .env.local - add Google Maps API key',
    });
  } else {
    items.push({
      name: 'API Key Configuration',
      status: 'fail',
      message: 'No API key configuration found',
    });
  }
  
  items.push({
    name: 'API Restrictions',
    status: 'warn',
    message: 'Set HTTP referrer restrictions in Google Cloud Console',
  });
  
  items.push({
    name: 'Usage Alerts',
    status: 'warn',
    message: 'Configure budget alerts in Google Cloud Console',
  });
  
  return items;
}

// =====================================================
// MAP PERFORMANCE CHECKS
// =====================================================

function checkMapPerformance(): AuditItem[] {
  const items: AuditItem[] = [];
  
  const mapComponentPath = join(process.cwd(), 'src', 'components', 'map', 'NeonMap.tsx');
  
  if (!existsSync(mapComponentPath)) {
    return [{
      name: 'Map Component',
      status: 'fail',
      message: 'NeonMap component not found',
    }];
  }
  
  const content = readFileSync(mapComponentPath, 'utf-8');
  
  if (content.includes('lazy') || content.includes('dynamic')) {
    items.push({
      name: 'Lazy Loading',
      status: 'pass',
      message: 'Lazy loading implemented',
    });
  }
  
  if (content.includes('map = null') || content.includes('marker.map = null')) {
    items.push({
      name: 'Marker Cleanup',
      status: 'pass',
      message: 'Marker cleanup on unmount found',
    });
  }
  
  if (content.includes('bounds') || content.includes('viewport')) {
    items.push({
      name: 'Viewport Search',
      status: 'pass',
      message: 'Map bounds change handling implemented',
    });
  }
  
  return items;
}

// =====================================================
// SPATIAL QUERY CHECKS
// =====================================================

function checkSpatialQueries(): AuditItem[] {
  const items: AuditItem[] = [];
  
  const apiPath = join(process.cwd(), 'src', 'app', 'api', 'v1', 'venues', 'nearby', 'route.ts');
  
  if (!existsSync(apiPath)) {
    return [{
      name: 'Spatial API',
      status: 'fail',
      message: 'Nearby venues API not found',
    }];
  }
  
  const content = readFileSync(apiPath, 'utf-8');
  
  if (content.includes('DWithin') || content.includes('radius')) {
    items.push({
      name: 'Spatial Query: ST_DWithin',
      status: 'pass',
      message: 'Radius-based search implemented',
    });
  }
  
  if (content.includes('distance') || content.includes('Distance')) {
    items.push({
      name: 'Spatial Query: Distance',
      status: 'pass',
      message: 'Distance calculation implemented',
    });
  }
  
  if (content.includes('bounds') && content.includes('north')) {
    items.push({
      name: 'Spatial Query: Bounding Box',
      status: 'pass',
      message: 'Bounding box search implemented',
    });
  }
  
  items.push({
    name: 'Spatial Index',
    status: 'warn',
    message: 'Create GIST index on location in production',
  });
  
  return items;
}

// =====================================================
// MAIN
// =====================================================

function runAudit(): void {
  console.log('===========================================');
  console.log('  Map Performance & Quota Audit');
  console.log('===========================================\n');

  const results: AuditResult[] = [];

  console.log('Checking marker clustering...');
  results.push({ category: 'Marker Clustering', items: checkMarkerClustering() });

  console.log('Checking API configuration...');
  results.push({ category: 'Google Maps API Quota', items: checkAPIConfiguration() });

  console.log('Checking performance...');
  results.push({ category: 'Map Performance', items: checkMapPerformance() });

  console.log('Checking spatial queries...');
  results.push({ category: 'PostGIS Spatial Queries', items: checkSpatialQueries() });

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
      if (item.details) console.log(`   Details: ${item.details}`);
      if (item.status === 'pass') totalPass++;
      else if (item.status === 'warn') totalWarn++;
      else totalFail++;
    }
  }

  console.log('\n===========================================');
  console.log('  Summary');
  console.log('===========================================');
  console.log(`✅ Passed:  ${totalPass}`);
  console.log(`⚠️  Warnings: ${totalWarn}`);
  console.log(`❌ Failed:  ${totalFail}`);

  if (totalFail > 0) {
    console.log('\n⚠️  Action required: Fix failed items');
    process.exit(1);
  } else if (totalWarn > 0) {
    console.log('\n⚠️  Review warnings');
    process.exit(0);
  } else {
    console.log('\n✅ All map checks passed!');
    process.exit(0);
  }
}

runAudit();
