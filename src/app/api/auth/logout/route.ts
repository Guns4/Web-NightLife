/**
 * =====================================================
 * API AUTH LOGOUT
 * Logout and revoke tokens
 * =====================================================
 */

import { NextResponse } from "next/server";
import { clearAuthCookies, getRefreshTokenFromCookie, revokeToken } from "@/lib/auth/auth-utils";
import prisma from "@/lib/auth/prisma-client";

export async function POST() {
  try {
    // Get refresh token to revoke session
    const refreshToken = await getRefreshTokenFromCookie();

    // Clear authentication cookies
    await clearAuthCookies();

    // If there's a refresh token, mark session as revoked
    if (refreshToken) {
      // Revoke the token
      revokeToken(refreshToken);
      
      // Update session status in database
      await prisma.session.updateMany({
        where: { sessionToken: refreshToken },
        data: { status: "REVOKED" },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
