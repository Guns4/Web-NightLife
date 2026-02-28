import { createClient } from "@supabase/supabase-js";
import { generateCorrelationId } from "../utils/correlation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Promos Service Layer
 * Simulates microservice decoupling with correlation IDs
 * In production, this would be a separate service/MongoDB instance
 */

interface Promo {
  id: string;
  venue_id: string;
  title: string;
  description: string | null;
  price_value: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface CreatePromoInput {
  venue_id: string;
  title: string;
  description?: string;
  price_value?: number;
  start_date: string;
  end_date: string;
}

/**
 * Promos Service with Correlation ID support
 */
export class PromosService {
  private supabase;
  private correlationId: string;

  constructor(correlationId?: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.correlationId = correlationId || generateCorrelationId();
  }

  /**
   * Get correlation ID for debugging
   */
  getCorrelationId(): string {
    return this.correlationId;
  }

  /**
   * Get all active promos
   */
  async getActivePromos(): Promise<Promo[]> {
    console.log(`[${this.correlationId}] Fetching active promos`);

    const { data, error } = await this.supabase
      .from("promos")
      .select("*")
      .eq("is_active", true)
      .lte("start_date", new Date().toISOString())
      .gte("end_date", new Date().toISOString());

    if (error) {
      console.error(`[${this.correlationId}] Error fetching promos:`, error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get promo by ID
   */
  async getPromoById(id: string): Promise<Promo | null> {
    console.log(`[${this.correlationId}] Fetching promo: ${id}`);

    const { data, error } = await this.supabase
      .from("promos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`[${this.correlationId}] Error fetching promo:`, error);
      return null;
    }

    return data;
  }

  /**
   * Get promos by venue
   */
  async getPromosByVenue(venueId: string): Promise<Promo[]> {
    console.log(`[${this.correlationId}] Fetching promos for venue: ${venueId}`);

    const { data, error } = await this.supabase
      .from("promos")
      .select("*")
      .eq("venue_id", venueId)
      .eq("is_active", true);

    if (error) {
      console.error(`[${this.correlationId}] Error fetching venue promos:`, error);
      throw error;
    }

    return data || [];
  }

  /**
   * Create a new promo
   */
  async createPromo(input: CreatePromoInput): Promise<Promo> {
    console.log(`[${this.correlationId}] Creating promo: ${input.title}`);

    const { data, error } = await this.supabase
      .from("promos")
      .insert({
        venue_id: input.venue_id,
        title: input.title,
        description: input.description || null,
        price_value: input.price_value || null,
        start_date: input.start_date,
        end_date: input.end_date,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error(`[${this.correlationId}] Error creating promo:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Update a promo
   */
  async updatePromo(id: string, updates: Partial<Promo>): Promise<Promo> {
    console.log(`[${this.correlationId}] Updating promo: ${id}`);

    const { data, error } = await this.supabase
      .from("promos")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`[${this.correlationId}] Error updating promo:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a promo (soft delete)
   */
  async deletePromo(id: string): Promise<void> {
    console.log(`[${this.correlationId}] Deleting promo: ${id}`);

    const { error } = await this.supabase
      .from("promos")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error(`[${this.correlationId}] Error deleting promo:`, error);
      throw error;
    }
  }
}

/**
 * Factory function to create PromosService with correlation ID
 */
export function createPromosService(correlationId?: string): PromosService {
  return new PromosService(correlationId);
}
