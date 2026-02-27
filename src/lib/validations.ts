import { z } from "zod";

/**
 * Zod Validation Schemas for NightLife Indonesia
 * Prevents injection and ensures data integrity
 */

// Venue validation schema
export const venueSchema = z.object({
  name: z.string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters"),
  category: z.enum(["club", "karaoke", "ktv", "spa"] as const),
  city: z.string()
    .min(2, "City must be at least 2 characters")
    .max(50, "City must be less than 50 characters"),
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  address: z.string()
    .max(200, "Address must be less than 200 characters")
    .optional(),
  price_range: z.number()
    .int()
    .min(1, "Price range must be between 1 and 4")
    .max(4, "Price range must be between 1 and 4")
    .optional(),
  features: z.array(z.string())
    .max(10, "Maximum 10 features allowed")
    .optional(),
  images: z.array(z.string().url("Invalid image URL"))
    .max(10, "Maximum 10 images allowed")
    .optional(),
  price_metadata: z.object({
    minimumCharge: z.number().positive().optional(),
    sofaReservation: z.number().positive().optional(),
    coverCharge: z.number().positive().optional(),
    vipPackage: z.number().positive().optional(),
  }).optional(),
});

// Promo validation schema
export const promoSchema = z.object({
  venue_id: z.string().uuid("Invalid venue ID"),
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  price_value: z.number()
    .positive("Price must be positive")
    .max(100000000, "Price is too high")
    .optional(),
  start_date: z.string().datetime("Invalid start date"),
  end_date: z.string().datetime("Invalid end date"),
  day_of_week: z.array(z.number().int().min(0).max(6))
    .optional(),
}).refine((data) => new Date(data.start_date) < new Date(data.end_date), {
  message: "End date must be after start date",
  path: ["end_date"],
});

// Vibe check validation schema
export const vibeCheckSchema = z.object({
  venue_id: z.string().uuid("Invalid venue ID"),
  rating: z.number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z.string()
    .max(500, "Comment must be less than 500 characters")
    .optional(),
  tag_vibe: z.array(z.string())
    .max(5, "Maximum 5 vibe tags allowed")
    .optional(),
});

// Live vibe status validation schema
export const liveVibeSchema = z.object({
  venue_id: z.string().uuid("Invalid venue ID"),
  status: z.enum(["quiet", "crowded", "full"] as const),
  music_genre: z.string()
    .max(50, "Music genre must be less than 50 characters")
    .optional(),
});

// Filter validation schema
export const filterSchema = z.object({
  query: z.string()
    .max(100, "Search query too long")
    .optional(),
  category: z.enum(["club", "karaoke", "ktv", "spa"] as const)
    .optional(),
  city: z.string()
    .max(50, "City name too long")
    .optional(),
  priceMin: z.number()
    .int()
    .min(1)
    .max(4)
    .optional(),
  priceMax: z.number()
    .int()
    .min(1)
    .max(4)
    .optional(),
  verifiedOnly: z.boolean()
    .optional(),
});

// Type exports for validation
export type VenueInput = z.infer<typeof venueSchema>;
export type PromoInput = z.infer<typeof promoSchema>;
export type VibeCheckInput = z.infer<typeof vibeCheckSchema>;
export type LiveVibeInput = z.infer<typeof liveVibeSchema>;
export type FilterInput = z.infer<typeof filterSchema>;

/**
 * Validation helper - wraps Zod validation with error handling
 */
export async function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: string[] }> {
  try {
    const validData = await schema.parseAsync(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue) => 
        `${issue.path.join(".")}: ${issue.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ["Validation failed"] };
  }
}
