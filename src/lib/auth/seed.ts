/**
 * =====================================================
 * SEED DATA SCRIPT
 * Creates initial admin and venue data
 * Run with: npx tsx src/lib/auth/seed.ts
 * =====================================================
 */

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "./auth-utils";

const prisma = new PrismaClient();

// Default password for all seeded accounts
const DEFAULT_PASSWORD = "NightLife2024!";

interface SeedVenue {
  name: string;
  slug: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}

const VENUES: SeedVenue[] = [
  {
    name: "The Golden Lounge",
    slug: "the-golden-lounge",
    address: "123 Entertainment Blvd",
    city: "Jakarta",
    latitude: -6.1751,
    longitude: 106.8650,
  },
  {
    name: "Neon Nightclub",
    slug: "neon-nightclub",
    address: "456 Party Street",
    city: "Jakarta",
    latitude: -6.2088,
    longitude: 106.8456,
  },
  {
    name: "Velvet Room",
    slug: "velvet-room",
    address: "789 Jazz Avenue",
    city: "Jakarta",
    latitude: -6.1569,
    longitude: 106.8295,
  },
  {
    name: "Skybar Jakarta",
    slug: "skybar-jakarta",
    address: "321 Rooftop Plaza",
    city: "Jakarta",
    latitude: -6.1944,
    longitude: 106.8209,
  },
  {
    name: "Underground Club",
    slug: "underground-club",
    address: "654 Basement Lane",
    city: "Jakarta",
    latitude: -6.1697,
    longitude: 106.8116,
  },
];

async function seed() {
  console.log("🌱 Starting seed...\n");

  try {
    // 1. Create Super Admin (CEO)
    console.log("Creating Super Admin (CEO)...");
    
    const adminPasswordHash = await hashPassword(DEFAULT_PASSWORD);
    
    const superAdmin = await prisma.user.upsert({
      where: { email: "ceo@afterhoursid.com" },
      update: {},
      create: {
        email: "ceo@afterhoursid.com",
        fullName: "Alexandra Chen",
        displayName: "Alex Chen",
        role: "SUPER_ADMIN",
        isActive: true,
        isVerified: true,
        accounts: {
          create: {
            type: "EMAIL",
            provider: "email",
            providerAccountId: "ceo@afterhoursid.com",
            passwordHash: adminPasswordHash,
            isActive: true,
          },
        },
      },
    });
    console.log(`✅ Created Super Admin: ${superAdmin.email} (ID: ${superAdmin.id})`);

    // 2. Create Venue Managers and Venues
    console.log("\nCreating Venue Managers and Venues...\n");

    for (let i = 0; i < VENUES.length; i++) {
      const venueData = VENUES[i];
      const managerEmail = `manager${i + 1}@${venueData.slug}.com`;
      
      // Create venue manager user
      const managerPasswordHash = await hashPassword(DEFAULT_PASSWORD);
      
      const venueManager = await prisma.user.upsert({
        where: { email: managerEmail },
        update: {},
        create: {
          email: managerEmail,
          fullName: `${venueData.name} Manager`,
          displayName: `Manager ${i + 1}`,
          role: "OWNER",
          isActive: true,
          isVerified: true,
          accounts: {
            create: {
              type: "EMAIL",
              provider: "email",
              providerAccountId: managerEmail,
              passwordHash: managerPasswordHash,
              isActive: true,
            },
          },
        },
      });
      
      // Create venue
      const venue = await prisma.venue.upsert({
        where: { slug: venueData.slug },
        update: {},
        create: {
          name: venueData.name,
          slug: venueData.slug,
          ownerId: venueManager.id,
          latitude: venueData.latitude,
          longitude: venueData.longitude,
          isActive: true,
          isVerified: true,
        },
      });

      console.log(`✅ Created Venue: ${venue.name}`);
      console.log(`   Manager: ${managerEmail}`);
      console.log(`   Password: ${DEFAULT_PASSWORD}\n`);
    }

    // 3. Create a test user (GUEST)
    console.log("Creating test user (GUEST)...");
    
    const userPasswordHash = await hashPassword(DEFAULT_PASSWORD);
    
    const testUser = await prisma.user.upsert({
      where: { email: "user@test.com" },
      update: {},
      create: {
        email: "user@test.com",
        fullName: "Test User",
        displayName: "TestUser",
        role: "USER",
        isActive: true,
        isVerified: false,
        accounts: {
          create: {
            type: "EMAIL",
            provider: "email",
            providerAccountId: "user@test.com",
            passwordHash: userPasswordHash,
            isActive: true,
          },
        },
      },
    });
    console.log(`✅ Created Test User: ${testUser.email}`);

    console.log("\n" + "=".repeat(50));
    console.log("🎉 Seed completed successfully!");
    console.log("=".repeat(50));
    console.log("\n📧 Login Credentials:");
    console.log("   Super Admin: ceo@afterhoursid.com");
    console.log("   Venue Manager: manager1@the-golden-lounge.com");
    console.log("   Test User: user@test.com");
    console.log(`   Password: ${DEFAULT_PASSWORD}`);
    console.log("");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seed()
  .then(() => {
    console.log("Seed process finished.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  });
