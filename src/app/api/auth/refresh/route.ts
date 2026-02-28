/**
 * =====================================================
 * API AUTH REFRESH
 * Refresh access token using refresh token
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  verifyRefreshToken, 
  generateTokenPair, 
  setAuthCookies, 
  clearAuthCookies,
  getRefreshTokenFromCookie,
  type UserRole 
} from "@/lib/auth/auth-utils";
import prisma from "@/lib/auth/prisma-client";

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = await getRefreshTokenFromCookie();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 401 }
      );
    }

    // Verify the refresh token
    const payload = verifyRefreshToken(refreshToken);
    
    if (!payload) {
      // Clear invalid tokens
      await clearAuthCookies();
      
      // Also mark session as expired/revoked
      await prisma.session.updateMany({
        where: { sessionToken: refreshToken },
        data: { status: "REVOKED" },
      });

      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Check if session exists and is valid
    const session = await prisma.session.findFirst({
      where: { 
        sessionToken: refreshToken,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            fullName: true,
            displayName: true,
            avatarUrl: true,
            role: true,
            isActive: true,
            isVerified: true,
          },
        },
      },
    });

    if (!session || !session.user) {
      await clearAuthCookies();
      return NextResponse.json(
        { error: "Session not found or expired" },
        { status: 401 }
      );
    }

    // Check if user is still active
    if (!session.user.isActive) {
      await clearAuthCookies();
      await prisma.session.updateMany({
        where: { sessionToken: refreshToken },
        data: { status: "REVOKED" },
      });
      return NextResponse.json(
        { error: "User account is deactivated" },
        { status: 403 }
      );
    }

    // Generate new token pair
    const user = session.user;
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role as UserRole,
      isActive: user.isActive,
      isVerified: user.isVerified,
    });

    // Set new cookies
    await setAuthCookies(tokens);

    // Update session with new refresh token
    await prisma.session.update({
      where: { id: session.id },
      data: { 
        sessionToken: tokens.refreshToken,
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
