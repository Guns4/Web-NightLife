/**
 * =====================================================
 * AUTOMATED WEEKLY ROI REPORT
 * AfterHoursID - Cron Job for Monday 08:00
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDashboardSummary, getROITimeSeries, getBookingHeatmap } from '@/lib/services/roi-dashboard-service';
import { formatCurrency } from '@/lib/services/i18n-service';
import crypto from 'node:crypto';

/**
 * WhatsApp message template for CEO summary
 */
function generateWhatsAppMessage(summary: any, timeSeries: any[]): string {
  const emoji = {
    revenue: '💰',
    users: '👥',
    roi: '📈',
    venue: '🏪',
    warning: '⚠️',
  };
  
  const roi = summary.overallROI.toFixed(1);
  const roiEmoji = parseFloat(roi) > 100 ? '🚀' : parseFloat(roi) > 50 ? '📈' : emoji.warning;
  
  return `*AfterHoursID Weekly Report*
  
${emoji.revenue} Revenue: ${formatCurrency(summary.totalRevenue, 'IDR')}
${emoji.users} New Users: ${summary.totalUsers.toLocaleString()}
${emoji.roi} ROI: ${roiEmoji} ${roi}%

*Top Venues:*
${summary.topVenues.slice(0, 3).map((v: any, i: number) => 
  `${i + 1}. ${v.venueName}: ${formatCurrency(v.revenue, 'IDR')}`
).join('\n')}

*Generated:* ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;
}

/**
 * Generate PDF report data structure
 */
function generatePDFReport(summary: any, timeSeries: any[], heatmap: any[]) {
  return {
    title: 'AfterHoursID Weekly ROI Report',
    generatedAt: new Date().toISOString(),
    period: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    },
    summary: {
      totalRevenue: summary.totalRevenue,
      totalAdSpend: summary.totalAdSpend,
      totalUsers: summary.totalUsers,
      roi: summary.overallROI,
      transactionCount: summary.recentTransactions.length,
    },
    timeSeries,
    topVenues: summary.topVenues,
    heatmap,
    charts: {
      revenue: {
        data: timeSeries.map(d => ({ date: d.timestamp, value: d.revenue })),
        type: 'line',
      },
      roi: {
        data: timeSeries.map(d => ({ date: d.timestamp, value: d.roi })),
        type: 'line',
      },
    },
  };
}

/**
 * Send WhatsApp message via API
 */
async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<boolean> {
  try {
    // In production, use WhatsApp Business API
    const response = await fetch(process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phoneNumber,
        type: 'text',
        text: { body: message },
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return false;
  }
}

/**
 * Save report to storage
 */
async function saveReportToStorage(reportData: any): Promise<string> {
  const reportId = crypto.randomBytes(8).toString('hex');
  
  // In production, save to S3/GCS and store metadata in database
  console.log('Saving report:', reportId, reportData.title);
  
  return reportId;
}

/**
 * Check if it's Monday 08:00 WITA (Indonesia)
 */
function shouldRunReport(): boolean {
  const now = new Date();
  const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  
  const dayOfWeek = jakartaTime.getDay();
  const hour = jakartaTime.getHours();
  
  // Monday is 1, at 08:00 WITA (UTC+8 which is close to WITA)
  return dayOfWeek === 1 && hour >= 8 && hour < 9;
}

/**
 * Main cron handler
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check schedule (optional - for manual testing)
    const searchParams = request.nextUrl.searchParams;
    const forceRun = searchParams.get('force') === 'true';
    
    if (!forceRun && !shouldRunReport()) {
      return NextResponse.json({
        status: 'skipped',
        message: 'Report runs only on Monday 08:00 WITA',
        nextRun: 'Next Monday 08:00 WITA',
      });
    }
    
    // Fetch all data in parallel
    const [summary, timeSeries, heatmap] = await Promise.all([
      getDashboardSummary(),
      getROITimeSeries(7),
      getBookingHeatmap(),
    ]);
    
    // Generate report data
    const pdfReport = generatePDFReport(summary, timeSeries, heatmap);
    const whatsappMessage = generateWhatsAppMessage(summary, timeSeries);
    
    // Save to storage
    const reportId = await saveReportToStorage(pdfReport);
    
    // Send WhatsApp to CEO
    const ceoPhone = process.env.CEO_PHONE_NUMBER || '+6281234567890';
    const whatsappSent = await sendWhatsAppMessage(ceoPhone, whatsappMessage);
    
    // Response
    return NextResponse.json({
      status: 'success',
      reportId,
      summary: {
        totalRevenue: summary.totalRevenue,
        totalUsers: summary.totalUsers,
        roi: summary.overallROI.toFixed(1),
        topVenue: summary.topVenues[0]?.venueName || 'N/A',
      },
      notifications: {
        whatsapp: whatsappSent ? 'sent' : 'failed',
        pdf: 'generated',
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weekly report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET for manual trigger
export async function GET(request: NextRequest) {
  return POST(new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
  }));
}
