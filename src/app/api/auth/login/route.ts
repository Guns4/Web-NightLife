/**
 * =====================================================
 * API AUTH LOGIN
 * Validate credentials and issue JWT
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  verifyPassword, 
  generateTokenPair, 
  setAuthCookies, 
  revokeToken, 
  type UserRole 
} from "@/lib/auth/auth-utils";
import prisma from "@/lib/auth/prisma-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        accounts: {
          where: { type: "EMAIL" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account is deactivated" },
        { status: 401 }
      );
    }

    // Get password hash from accounts
    const emailAccount = user.accounts.find((acc: { type: string }) => acc.type === "EMAIL");
    
    if (!emailAccount || !emailAccount.passwordHash) {
      return NextResponse.json(
        { error: "Invalid login method. Please use social login." },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, emailAccount.passwordHash);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Revoke any existing tokens (optional: implement token rotation)
    // In production, you might want to invalidate old sessions here

    // Generate tokens
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

    // Set HTTP-only cookies
    await setAuthCookies(tokens);

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create a new session record
    await prisma.session.create({
      data: {
        sessionToken: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: "ACTIVE",
      },
    });

    // Determine redirect based on role
    let redirectUrl = "/";
    if (user.role === "SUPER_ADMIN") {
      redirectUrl = "/dashboard/super-admin";
    } else if (user.role === "OWNER") {
      redirectUrl = "/dashboard/owner";
    } else if (user.role === "ADMIN") {
      redirectUrl = "/dashboard/admin";
    } else if (user.role === "USER") {
      redirectUrl = "/dashboard";
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isVerified: user.isVerified,
      },
      redirectUrl,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
