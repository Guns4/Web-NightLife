/**
 * =====================================================
 * API AUTH ME
 * Secure endpoint to fetch current user profile
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, getAccessTokenFromCookie, type UserRole } from "@/lib/auth/auth-utils";
import prisma from "@/lib/auth/prisma-client";

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or header
    let token: string | undefined = request.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) {
      const cookieToken = await getAccessTokenFromCookie();
      token = cookieToken || undefined;
    }

    if (!token) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    // Verify the access token
    const payload = verifyAccessToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        isActive: true,
        isVerified: true,
        emailVerified: true,
        phoneVerified: true,
        dateOfBirth: true,
        gender: true,
        city: true,
        country: true,
        trustScore: true,
        preferences: true,
        settings: true,
        createdAt: true,
        lastLoginAt: true,
        // Include venue info if owner
        venues: {
          select: {
            id: true,
            name: true,
            slug: true,
            isVerified: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is deactivated" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        isActive: user.isActive,
        isVerified: user.isVerified,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        city: user.city,
        country: user.country,
        trustScore: user.trustScore,
        preferences: user.preferences,
        settings: user.settings,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        venues: user.venues,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
