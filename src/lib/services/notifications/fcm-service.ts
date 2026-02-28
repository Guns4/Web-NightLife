/**
 * =====================================================
 * FIREBASE CLOUD MESSAGING (FCM) SERVICE
 * Optional: Push notifications for mobile web
 * =====================================================
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// FCM Configuration
const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY;

// =====================================================
// PUSH TOKEN MANAGEMENT
// =====================================================

interface PushToken {
  userId: string;
  token: string;
  deviceType: "web" | "android" | "ios";
}

/**
 * Save push token for a user
 */
export async function savePushToken(input: PushToken) {
  return supabase.from("push_tokens").upsert({
    user_id: input.userId,
    token: input.token,
    device_type: input.deviceType,
    is_active: true,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: "user_id, device_type",
  });
}

/**
 * Remove push token for a user
 */
export async function removePushToken(userId: string, deviceType: string) {
  return supabase
    .from("push_tokens")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("device_type", deviceType);
}

/**
 * Get active push tokens for a user
 */
export async function getActivePushTokens(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("user_id", userId)
    .eq("is_active", true);

  return data?.map((d) => d.token) || [];
}

/**
 * Get all active push tokens (for broadcasting)
 */
export async function getAllActivePushTokens(): Promise<string[]> {
  const { data } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("is_active", true);

  return data?.map((d) => d.token) || [];
}

// =====================================================
// FCM SEND FUNCTIONS
// =====================================================

interface FCMMessage {
  token?: string;
  tokens?: string[];
  notification: {
    title: string;
    body: string;
  };
  data?: Record<string, string>;
  webpush?: {
    notification?: {
      icon?: string;
      badge?: string;
      tag?: string;
      requireInteraction?: boolean;
    };
    fcmOptions?: {
      link?: string;
    };
  };
}

/**
 * Send push notification via FCM HTTP v1 API
 */
export async function sendPushNotification(message: FCMMessage) {
  if (!FCM_SERVER_KEY) {
    console.warn("FCM_SERVER_KEY not configured. Push notifications disabled.");
    return { success: false, error: "FCM not configured" };
  }

  try {
    // Get access token from OAuth2 flow
    const accessToken = await getFCMAccessToken();

    const response = await fetch(
      "https://fcm.googleapis.com/v1/projects/afterhoursid/messages:send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: message.token
            ? { token: message.token, ...message }
            : undefined,
          ...(message.tokens && {
            message: {
              ...message,
              tokens: undefined,
            },
            tokens: message.tokens,
          }),
        }),
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      console.error("FCM send error:", result);
      return { success: false, error: result };
    }

    return { success: true, result };
  } catch (error) {
    console.error("FCM send exception:", error);
    return { success: false, error };
  }
}

/**
 * Send notification to multiple users (batch)
 */
export async function sendBatchPushNotification(
  tokens: string[],
  notification: { title: string; body: string },
  data?: Record<string, string>
) {
  // FCM limit is 500 tokens per batch
  const batches = [];
  for (let i = 0; i < tokens.length; i += 500) {
    batches.push(tokens.slice(i, i + 500));
  }

  const results = await Promise.all(
    batches.map((batchTokens) =>
      sendPushNotification({
        tokens: batchTokens,
        notification,
        data,
      })
    )
  );

  return results;
}

/**
 * Send notification to user across all their devices
 */
export async function notifyUser(
  userId: string,
  notification: { title: string; body: string },
  data?: Record<string, string>
) {
  const tokens = await getActivePushTokens(userId);
  
  if (tokens.length === 0) {
    return { success: false, error: "No push tokens" };
  }

  return sendBatchPushNotification(tokens, notification, data);
}

// =====================================================
// FCM OAUTH2 HELPER
// =====================================================

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getFCMAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }

  // Get service account credentials from env
  const clientEmail = process.env.FCM_CLIENT_EMAIL;
  const privateKey = process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("FCM credentials not configured");
  }

  // Create JWT
  const jwt = createJWT(clientEmail, privateKey);

  // Exchange JWT for access token
  const response = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    }
  );

  const tokenData = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to get FCM access token: ${JSON.stringify(tokenData)}`);
  }

  // Cache token (expires in 1 hour)
  cachedToken = {
    accessToken: tokenData.access_token,
    expiresAt: Date.now() + 3500 * 1000, // 50 minutes
  };

  return cachedToken.accessToken;
}

function createJWT(clientEmail: string, privateKey: string): string {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  // Base64 encode
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  // Create signature (simplified - in production use proper JWT library)
  const signature = `${encodedHeader}.${encodedPayload}`;
  
  // Use crypto to sign (this is a placeholder - in production use firebase-admin or jsonwebtoken)
  // For now, return a placeholder that will fail - actual implementation needs proper JWT signing
  throw new Error("FCM JWT signing requires jsonwebtoken library");
}
