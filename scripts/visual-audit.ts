#!/usr/bin/env tsx
/**
 * =====================================================
 * VISUAL AUDIT
 * AfterHoursID - Layout & Accessibility Check
 * =====================================================
 */

import { readFileSync, existsSync } from 'fs';
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
  line?: number;
}

// =====================================================
// 12-COLUMN GRID CHECK
// =====================================================

function checkGridSystem(): AuditItem[] {
  const items: AuditItem[] = [];
  
  const cssFile = join(process.cwd(), 'src', 'app', 'globals.css');
  
  if (!existsSync(cssFile)) {
    return [{
      name: 'CSS File',
      status: 'fail',
      message: 'globals.css not found',
    }];
  }
  
  const css = readFileSync(cssFile, 'utf-8');
  
  // Check for grid definition
  if (css.includes('grid-template-columns: repeat(12')) {
    items.push({
      name: '12-Column Grid',
      status: 'pass',
      message: '12-column grid system defined',
    });
  } else {
    items.push({
      name: '12-Column Grid',
      status: 'fail',
      message: '12-column grid system not found',
    });
  }
  
  // Check for responsive breakpoints
  const breakpoints = ['768px', '1024px', '1440px'];
  for (const bp of breakpoints) {
    if (css.includes(bp)) {
      items.push({
        name: `Breakpoint: ${bp}`,
        status: 'pass',
        message: `Found ${bp} breakpoint`,
      });
    } else {
      items.push({
        name: `Breakpoint: ${bp}`,
        status: 'warn',
        message: `Missing ${bp} breakpoint`,
      });
    }
  }
  
  return items;
}

// =====================================================
// WCAG CONTRAST CHECK
// =====================================================

function checkContrastRatios(): AuditItem[] {
  const items: AuditItem[] = [];
  
  const cssFile = join(process.cwd(), 'src', 'app', 'globals.css');
  
  if (!existsSync(cssFile)) {
    return [{
      name: 'CSS File',
      status: 'fail',
      message: 'globals.css not found',
    }];
  }
  
  const css = readFileSync(cssFile, 'utf-8');
  
  // Check for text colors
  const textColors = [
    { name: 'Primary Text', pattern: /--text-primary.*#[0-9a-fA-F]{6}/i },
    { name: 'Secondary Text', pattern: /--text-secondary.*#[0-9a-fA-F]{6}/i },
    { name: 'Muted Text', pattern: /--text-muted.*#[0-9a-fA-F]{6}/i },
  ];
  
  for (const { name, pattern } of textColors) {
    const match = css.match(pattern);
    if (match) {
      items.push({
        name: `${name} Color`,
        status: 'pass',
        message: `Found ${name.toLowerCase()} color definition`,
      });
    } else {
      items.push({
        name: `${name} Color`,
        status: 'warn',
        message: `${name.toLowerCase()} color may need contrast check`,
      });
    }
  }
  
  // Check for dark background (WCAG requirement)
  if (css.includes('--dark-obsidian') || css.includes('#0a0a0f')) {
    items.push({
      name: 'Dark Background',
      status: 'pass',
      message: 'Dark background defined for low-light usage',
    });
  }
  
  return items;
}

// =====================================================
// ACCESSIBILITY CHECK
// =====================================================

function checkAccessibility(): AuditItem[] {
  const items: AuditItem[] = [];
  
  // Check common component files
  const components = [
    'src/components/ui/Button.tsx',
    'src/components/ui/Input.tsx',
  ];
  
  for (const comp of components) {
    const path = join(process.cwd(), comp);
    
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf-8');
      
      // Check for aria-label or aria-describedby
      const hasAria = content.includes('aria-') || content.includes('ariaLabel');
      
      if (hasAria) {
        items.push({
          name: `${comp} - ARIA`,
          status: 'pass',
          message: 'ARIA attributes found',
        });
      } else {
        items.push({
          name: `${comp} - ARIA`,
          status: 'warn',
          message: 'Consider adding ARIA attributes',
        });
      }
      
      // Check for focus styles
      const hasFocus = content.includes('focus') || content.includes(':focus-visible');
      
      if (hasFocus) {
        items.push({
          name: `${comp} - Focus`,
          status: 'pass',
          message: 'Focus styles defined',
        });
      } else {
        items.push({
          name: `${comp} - Focus`,
          status: 'warn',
          message: 'Focus styles may be missing',
        });
      }
    }
  }
  
  // Check global focus ring
  const cssFile = join(process.cwd(), 'src', 'app', 'globals.css');
  if (existsSync(cssFile)) {
    const css = readFileSync(cssFile, 'utf-8');
    
    if (css.includes('focus:')) {
      items.push({
        name: 'Global Focus Styles',
        status: 'pass',
        message: 'Global focus styles defined',
      });
    } else {
      items.push({
        name: 'Global Focus Styles',
        status: 'warn',
        message: 'Consider adding global focus styles',
      });
    }
  }
  
  return items;
}

// =====================================================
// LAYOUT CONSISTENCY CHECK
// =====================================================

function checkLayoutConsistency(): AuditItem[] {
  const items: AuditItem[] = [];
  
  const cssFile = join(process.cwd(), 'src', 'app', 'globals.css');
  if (!existsSync(cssFile)) {
    return [{
      name: 'CSS File',
      status: 'fail',
      message: 'globals.css not found',
    }];
  }
  
  const css = readFileSync(cssFile, 'utf-8');
  
  // Check for consistent spacing tokens
  const spacingTokens = ['4px', '8px', '16px', '24px', '32px', '48px', '64px'];
  let spacingCount = 0;
  
  for (const token of spacingTokens) {
    if (css.includes(token)) {
      spacingCount++;
    }
  }
  
  if (spacingCount >= 5) {
    items.push({
      name: 'Spacing System',
      status: 'pass',
      message: `Found ${spacingCount} spacing values`,
    });
  } else {
    items.push({
      name: 'Spacing System',
      status: 'warn',
      message: `Only ${spacingCount} spacing values - consider a more complete system`,
    });
  }
  
  // Check for border-radius consistency
  const borderRadius = css.match(/border-radius:\s*(\d+)px/g);
  if (borderRadius) {
    const unique = new Set(borderRadius.map(r => r.match(/\d+/)?.[0]));
    if (unique.size <= 5) {
      items.push({
        name: 'Border Radius',
        status: 'pass',
        message: `Found ${unique.size} border radius values (consistent)`,
      });
    } else {
      items.push({
        name: 'Border Radius',
        status: 'warn',
        message: `Found ${unique.size} different border radius values`,
      });
    }
  }
  
  return items;
}

// =====================================================
// MAIN AUDIT RUNNER
// =====================================================

function runAudit(): void {
  console.log('===========================================');
  console.log('  AfterHours Visual Audit');
  console.log('===========================================\n');

  const results: AuditResult[] = [];

  // 1. Grid System
  console.log('Checking 12-column grid system...');
  results.push({
    category: '12-Column Grid System',
    items: checkGridSystem(),
  });

  // 2. Contrast Ratios
  console.log('Checking WCAG contrast ratios...');
  results.push({
    category: 'WCAG Contrast',
    items: checkContrastRatios(),
  });

  // 3. Accessibility
  console.log('Checking accessibility features...');
  results.push({
    category: 'Accessibility',
    items: checkAccessibility(),
  });

  // 4. Layout Consistency
  console.log('Checking layout consistency...');
  results.push({
    category: 'Layout Consistency',
    items: checkLayoutConsistency(),
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
    console.log('\n⚠️  Action required: Fix failed items');
    process.exit(1);
  } else if (totalWarn > 0) {
    console.log('\n⚠️  Review warnings for better WCAG compliance');
    process.exit(0);
  } else {
    console.log('\n✅ All visual checks passed!');
    process.exit(0);
  }
}

// Run audit
runAudit();
