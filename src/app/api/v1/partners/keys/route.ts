/**
 * =====================================================
 * PARTNER API - KEY MANAGEMENT
 * AfterHoursID - B2B Partner Platform
 * Create, list, and revoke API keys
 * =====================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiKey, getPartnerApiKeys, revokeApiKey, validateScopes, type ApiKeyCreateInput } from '@/lib/services/partners/api-key-service';

// GET /api/v1/partners/keys - List partner API keys
// POST /api/v1/partners/keys - Create new API key
// DELETE /api/v1/partners/keys - Revoke API key

export async function GET(request: NextRequest) {
  try {
    // In production, extract partner ID from JWT
    const partnerId = request.headers.get('x-partner-id') || 'test-partner-id';
    
    const keys = await getPartnerApiKeys(partnerId);
    
    // Mask sensitive data
    const safeKeys = keys.map(key => ({
      id: key.id,
      name: key.name,
      key_prefix: key.key_prefix,
      scopes: key.scopes,
      rate_limit_quota: key.rate_limit_quota,
      is_active: key.is_active,
      last_used_at: key.last_used_at,
      expires_at: key.expires_at,
      created_at: key.created_at,
    }));
    
    return NextResponse.json({
      success: true,
      data: safeKeys,
    });
    
  } catch (error) {
    console.error('[Partner Keys] GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // In production, extract partner ID from JWT
    const partnerId = request.headers.get('x-partner-id') || 'test-partner-id';
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Validate scopes
    if (body.scopes && !validateScopes(body.scopes)) {
      return NextResponse.json(
        { success: false, error: 'Invalid scopes. Valid scopes: read:venues, read:promos, read:events, read:analytics, write:reservations' },
        { status: 400 }
      );
    }
    
    // Create API key
    const input: ApiKeyCreateInput = {
      partner_id: partnerId,
      name: body.name,
      scopes: body.scopes || ['read:venues', 'read:promos'],
      rate_limit_quota: body.rate_limit_quota,
      rate_limit_window: body.rate_limit_window,
      expires_at: body.expires_at ? new Date(body.expires_at) : undefined,
    };
    
    const { apiKey, plainKey } = await createApiKey(input);
    
    // Return plain key only once!
    return NextResponse.json({
      success: true,
      data: {
        api_key: {
          id: apiKey.id,
          name: apiKey.name,
          key_prefix: apiKey.key_prefix,
          scopes: apiKey.scopes,
          rate_limit_quota: apiKey.rate_limit_quota,
          expires_at: apiKey.expires_at,
          created_at: apiKey.created_at,
        },
        // THIS IS THE ONLY TIME THE PLAIN KEY IS SHOWN
        plain_key: plainKey,
      },
    }, { status: 201 });
    
  } catch (error) {
    console.error('[Partner Keys] POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');
    
    if (!keyId) {
      return NextResponse.json(
        { success: false, error: 'API key ID is required' },
        { status: 400 }
      );
    }
    
    const success = await revokeApiKey(keyId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to revoke API key' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    });
    
  } catch (error) {
    console.error('[Partner Keys] DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to revoke API key' },
      { status: 500 }
    );
  }
}
