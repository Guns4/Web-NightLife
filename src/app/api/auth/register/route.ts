/**
 * =====================================================
 * API AUTH REGISTER
 * Create new user with default role GUEST
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { hashPassword, generateTokenPair, setAuthCookies, type UserRole } from "@/lib/auth/auth-utils";
import prisma from "@/lib/auth/prisma-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, phone } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or phone already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with default role GUEST
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        phone: phone || null,
        fullName: fullName || null,
        displayName: fullName || null,
        role: "USER" as UserRole, // Default role
        isActive: true,
        isVerified: false,
        accounts: {
          create: {
            type: "EMAIL",
            provider: "email",
            providerAccountId: email.toLowerCase(),
            passwordHash: passwordHash,
            isActive: true,
          },
        },
      },
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
        createdAt: true,
      },
    });

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

    // Create a session record
    await prisma.session.create({
      data: {
        sessionToken: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: "ACTIVE",
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
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
