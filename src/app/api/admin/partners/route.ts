/**
 * =====================================================
 * ADMIN API - PARTNER MANAGEMENT
 * AfterHoursID - B2B Partner Platform
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock data - in production, use database
const mockPartners = [
  {
    id: 'partner-1',
    name: 'Jakarta Nightlife Guide',
    slug: 'jakarta-nightlife-guide',
    email: 'contact@jakarta.com',
    tier: 'professional',
    status: 'active',
    total_requests: 45000,
    monthly_requests: 12500,
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'partner-2',
    name: 'Surabaya Events',
    slug: 'surabaya-events',
    email: 'hello@surabayaevents.id',
    tier: 'basic',
    status: 'active',
    total_requests: 8500,
    monthly_requests: 2100,
    created_at: '2024-03-20T00:00:00Z',
  },
  {
    id: 'partner-3',
    name: 'Bali Clubbers',
    slug: 'bali-clubbers',
    email: 'info@baliclubbers.com',
    tier: 'enterprise',
    status: 'active',
    total_requests: 125000,
    monthly_requests: 45000,
    created_at: '2023-11-01T00:00:00Z',
  },
  {
    id: 'partner-4',
    name: 'Medan Vibes',
    slug: 'medan-vibes',
    email: 'team@medanvibes.co.id',
    tier: 'basic',
    status: 'pending',
    total_requests: 0,
    monthly_requests: 0,
    created_at: '2024-06-01T00:00:00Z',
  },
];

const mockApiKeys = [
  {
    id: 'key-1',
    name: 'Production Key',
    key_prefix: 'ah_live_x',
    scopes: ['read:venues', 'read:promos', 'read:events'],
    rate_limit_quota: 10000,
    is_active: true,
    last_used_at: '2024-06-15T14:30:00Z',
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'key-2',
    name: 'Development Key',
    key_prefix: 'ah_test_y',
    scopes: ['read:venues'],
    rate_limit_quota: 1000,
    is_active: true,
    created_at: '2024-02-01T00:00:00Z',
  },
];

const mockLogs = [
  { id: 1, endpoint: '/api/v1/partners/discovery', method: 'GET', status_code: 200, response_time_ms: 45, created_at: '2024-06-15T14:30:00Z' },
  { id: 2, endpoint: '/api/v1/partners/discovery', method: 'GET', status_code: 200, response_time_ms: 52, created_at: '2024-06-15T14:29:00Z' },
  { id: 3, endpoint: '/api/v1/partners/promos/realtime', method: 'GET', status_code: 200, response_time_ms: 38, created_at: '2024-06-15T14:28:00Z' },
  { id: 4, endpoint: '/api/v1/partners/discovery', method: 'GET', status_code: 401, response_time_ms: 12, created_at: '2024-06-15T14:27:00Z' },
  { id: 5, endpoint: '/api/v1/partners/promos/realtime', method: 'GET', status_code: 200, response_time_ms: 41, created_at: '2024-06-15T14:26:00Z' },
  { id: 6, endpoint: '/api/v1/partners/discovery', method: 'GET', status_code: 429, response_time_ms: 8, created_at: '2024-06-15T14:25:00Z' },
  { id: 7, endpoint: '/api/v1/partners/discovery', method: 'GET', status_code: 200, response_time_ms: 55, created_at: '2024-06-15T14:24:00Z' },
];

// GET /api/admin/partners - List all partners
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tier = searchParams.get('tier');
    
    let filtered = [...mockPartners];
    
    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }
    
    if (tier) {
      filtered = filtered.filter(p => p.tier === tier);
    }
    
    return NextResponse.json({
      success: true,
      partners: filtered,
      total: filtered.length,
    });
    
  } catch (error) {
    console.error('[Admin Partners] GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch partners' },
      { status: 500 }
    );
  }
}

// POST /api/admin/partners - Create new partner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    // Create partner (mock)
    const newPartner = {
      id: `partner-${Date.now()}`,
      name: body.name,
      slug: body.name.toLowerCase().replace(/\s+/g, '-'),
      email: body.email,
      tier: body.tier || 'basic',
      status: 'pending',
      total_requests: 0,
      monthly_requests: 0,
      created_at: new Date().toISOString(),
    };
    
    return NextResponse.json({
      success: true,
      partner: newPartner,
    }, { status: 201 });
    
  } catch (error) {
    console.error('[Admin Partners] POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create partner' },
      { status: 500 }
    );
  }
}
