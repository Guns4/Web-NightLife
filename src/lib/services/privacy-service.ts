/**
 * =====================================================
 * PRIVACY & CONSENT SERVICE
 * AfterHoursID - Sovereign Shield & Global Expansion
 * =====================================================
 */

import { v4 as uuidv4 } from 'uuid';

// =====================================================
// TYPES
// =====================================================

export type ConsentCategory = 'essential' | 'analytics' | 'marketing' | 'personalization';

export interface Consent {
  id: string;
  userId: string;
  category: ConsentCategory;
  granted: boolean;
  timestamp: string;
  ipAddress?: string;
  version: string;
}

export interface PrivacyRequest {
  id: string;
  userId: string;
  type: 'access' | 'deletion' | 'portability' | 'rectification';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: string;
  completedAt?: string;
  data?: any;
}

export interface UserDataExport {
  userId: string;
  generatedAt: string;
  data: {
    profile: any;
    bookings: any[];
    reviews: any[];
    payments: any[];
    settings: any;
  };
}

// =====================================================
// CONSENT MANAGEMENT
// =====================================================

/**
 * Record user consent
 */
export async function recordConsent(
  userId: string,
  category: ConsentCategory,
  granted: boolean,
  ipAddress?: string
): Promise<Consent> {
  const consent: Consent = {
    id: uuidv4(),
    userId,
    category,
    granted,
    timestamp: new Date().toISOString(),
    ipAddress,
    version: '1.0',
  };
  
  // In production, store in database
  console.log('Recording consent:', consent);
  
  return consent;
}

/**
 * Get user consents
 */
export async function getUserConsents(userId: string): Promise<Record<ConsentCategory, boolean>> {
  // In production, fetch from database
  return {
    essential: true, // Always required
    analytics: true,
    marketing: true,
    personalization: true,
  };
}

/**
 * Check if consent is granted
 */
export async function hasConsent(userId: string, category: ConsentCategory): Promise<boolean> {
  if (category === 'essential') return true;
  
  const consents = await getUserConsents(userId);
  return consents[category];
}

// =====================================================
// DATA SUBJECT REQUESTS
// =====================================================

// In-memory store for demo
const privacyRequests: Map<string, PrivacyRequest> = new Map();

/**
 * Submit a data subject request (GDPR/UU PDP)
 */
export async function submitDataRequest(
  userId: string,
  type: PrivacyRequest['type']
): Promise<PrivacyRequest> {
  const request: PrivacyRequest = {
    id: uuidv4(),
    userId,
    type,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };
  
  privacyRequests.set(request.id, request);
  
  // In production, queue for processing
  return request;
}

/**
 * Get request status
 */
export async function getRequestStatus(requestId: string): Promise<PrivacyRequest | null> {
  return privacyRequests.get(requestId) || null;
}

/**
 * Process data export request
 */
export async function processDataExport(userId: string): Promise<UserDataExport> {
  // In production, aggregate data from all services
  const exportData: UserDataExport = {
    userId,
    generatedAt: new Date().toISOString(),
    data: {
      profile: { id: userId, name: 'User', email: 'user@example.com' },
      bookings: [],
      reviews: [],
      payments: [],
      settings: {},
    },
  };
  
  return exportData;
}

/**
 * Process data deletion request
 */
export async function processDataDeletion(userId: string): Promise<void> {
  // In production, delete from all services:
  // - User data
  // - Bookings
  // - Reviews
  // - Payments
  // - Analytics data
  // - Session data
  
  console.log('Processing data deletion for user:', userId);
}

// =====================================================
// COOKIE BANNER & PREFERENCES
// =====================================================

/**
 * Generate cookie consent HTML
 */
export function generateCookieBannerHTML(): string {
  return `
    <div id="cookie-banner" style="
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(18, 18, 26, 0.95);
      backdrop-filter: blur(12px);
      padding: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 9999;
      display: none;
    ">
      <div style="
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      ">
        <p style="
          color: #e2e8f0;
          flex: 1;
          min-width: 280px;
          margin: 0;
        ">
          We use cookies to enhance your experience. 
          <a href="/privacy" style="color: #00f5ff;">Learn more</a>
        </p>
        <div style="display: flex; gap: 0.5rem;">
          <button id="cookie-reject" style="
            padding: 0.75rem 1.5rem;
            background: transparent;
            border: 1px solid #475569;
            color: #94a3b8;
            border-radius: 0.5rem;
            cursor: pointer;
          ">Reject</button>
          <button id="cookie-accept" style="
            padding: 0.75rem 1.5rem;
            background: #00f5ff;
            border: none;
            color: #0a0a0f;
            font-weight: 600;
            border-radius: 0.5rem;
            cursor: pointer;
          ">Accept All</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Check if cookie consent is needed
 */
export function needsCookieConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return !localStorage.getItem('cookie_consent');
}
