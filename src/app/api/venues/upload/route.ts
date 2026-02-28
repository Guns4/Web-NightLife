/**
 * =====================================================
 * API VENUES UPLOAD
 * Secure image upload handler with Cloudinary
 * Auto-resizes and watermarks venue photos
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { verifyAccessToken, getAccessTokenFromCookie } from "@/lib/auth/auth-utils";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    let token: string | undefined = request.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) {
      const cookieToken = await getAccessTokenFromCookie();
      token = cookieToken || undefined;
    }

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const payload = verifyAccessToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // 2. Verify user is an owner or admin
    if (!["OWNER", "ADMIN", "SUPER_ADMIN"].includes(payload.role)) {
      return NextResponse.json(
        { error: "Only venue owners can upload images" },
        { status: 403 }
      );
    }

    // 3. Get the form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const venueId = formData.get("venueId") as string | null;
    const imageType = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // 4. If venueId provided, verify ownership
    if (venueId) {
      const venue = await prisma.venue.findFirst({
        where: {
          id: venueId,
          ownerId: payload.userId,
        },
      });

      if (!venue) {
        return NextResponse.json(
          { error: "You don't own this venue" },
          { status: 403 }
        );
      }
    }

    // 5. Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // 6. Configure transformation based on image type
    let transformation: any[] = [];
    const folder = "nightlife";

    switch (imageType) {
      case "cover":
        transformation = [
          { width: 1920, height: 1080, crop: "fill", gravity: "center" },
          { quality: "auto", fetch_format: "auto" },
        ];
        break;
      case "profile":
        transformation = [
          { width: 400, height: 400, crop: "thumb", gravity: "center" },
          { quality: "auto", fetch_format: "auto" },
        ];
        break;
      default:
        transformation = [
          { width: 1200, height: 800, crop: "limit" },
          { quality: "auto:good", fetch_format: "auto" },
        ];
    }

    // Add watermark
    transformation.push({
      overlay: {
        font_family: "Arial",
        font_size: 14,
        font_color: "white",
        text: "NightLife ID",
      },
      opacity: 50,
      gravity: "south_east",
      x: 10,
      y: 10,
    });

    // 7. Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64, {
      folder,
      transformation,
      public_id: `${venueId || "upload"}_${Date.now()}`,
      resource_type: "image",
    });

    // 8. If venueId provided, update venue gallery
    if (venueId && imageType === "gallery") {
      const venue = await prisma.venue.findUnique({
        where: { id: venueId },
        select: { galleryImages: true },
      });

      const currentImages = venue?.galleryImages || [];
      
      await prisma.venue.update({
        where: { id: venueId },
        data: {
          galleryImages: [...currentImages, uploadResult.secure_url],
        },
      });
    }

    return NextResponse.json({
      success: true,
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
