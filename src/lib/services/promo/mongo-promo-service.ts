/**
 * MongoDB Promo Service
 * Provides flexible, schemaless promo storage with PostgreSQL link
 * Supports: Free Flow Hours, Ladies Night, Event Lineups, Custom Promos
 */

import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'nightlife_promos';

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Get MongoDB client (singleton)
 */
async function getClient(): Promise<MongoClient> {
  if (!client) {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not configured');
    }
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    await client.connect();
  }
  return client;
}

/**
 * Get database instance
 */
async function getDb(): Promise<Db> {
  if (!db) {
    const mongoClient = await getClient();
    db = mongoClient.db(MONGODB_DB);
  }
  return db;
}

// =====================================================
// PROMO TYPES (Flexible Schema)
// =====================================================

export type PromoType = 
  | 'buy1get1' 
  | 'discount' 
  | 'free_flow' 
  | 'ladies_night' 
  | 'event' 
  | 'happy_hour' 
  | 'custom';

export interface FreeFlowPromo {
  type: 'free_flow';
  packageName: string;
  duration: number; // hours
  drinksIncluded: string[];
  price: number;
  terms?: string;
}

export interface LadiesNightPromo {
  type: 'ladies_night';
  title: string;
  ladiesPrice: number;
  menPrice?: number;
  freeDrinks?: number;
  timeStart: string;
  timeEnd: string;
  dressCode?: string;
}

export interface EventPromo {
  type: 'event';
  eventName: string;
  description: string;
  lineup: string[]; // Artist/DJ names
  ticketPrice?: number;
  doorPrice?: number;
  dressCode?: string;
  ageRestriction?: string;
}

export interface HappyHourPromo {
  type: 'happy_hour';
  deals: {
    drinkName: string;
    originalPrice: number;
    discountedPrice: number;
    discountPercent: number;
  }[];
  timeStart: string;
  timeEnd: string;
}

export interface CustomPromo {
  type: 'custom';
  [key: string]: any; // Allow any custom fields
}

export interface Buy1Get1Promo {
  type: 'buy1get1';
  title: string;
  buyQuantity: number;
  getQuantity: number;
  applicableItems: string[];
  minSpend?: number;
  terms?: string;
}

export interface DiscountPromo {
  type: 'discount';
  title: string;
  discountPercent: number;
  discountAmount?: number;
  minSpend?: number;
  maxDiscount?: number;
  applicableItems?: string[];
  code?: string;
  terms?: string;
}

export type FlexiblePromoData = 
  | FreeFlowPromo 
  | LadiesNightPromo 
  | EventPromo 
  | HappyHourPromo
  | Buy1Get1Promo
  | DiscountPromo
  | CustomPromo;

// =====================================================
// MAIN PROMO INTERFACE
// =====================================================

export interface PromoDocument {
  _id: ObjectId;
  
  // PostgreSQL link
  venueId: string;
  
  // Core fields
  title: string;
  description?: string;
  promoType: PromoType;
  promoData: FlexiblePromoData;
  
  // Scheduling
  startDate: Date;
  endDate: Date;
  
  // Status
  isActive: boolean;
  isFeatured: boolean;
  
  // Media
  imageUrl?: string;
  videoUrl?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  
  // Analytics
  views: number;
  claims: number;
  conversions: number;
}

// =====================================================
// PROMO SERVICE CLASS
// =====================================================

export class PromoService {
  private collection: Collection<PromoDocument> | null = null;

  private async getCollection(): Promise<Collection<PromoDocument>> {
    if (!this.collection) {
      const database = await getDb();
      this.collection = database.collection<PromoDocument>('promos');
      
      // Create indexes
      await this.collection.createIndex({ venueId: 1 });
      await this.collection.createIndex({ promoType: 1 });
      await this.collection.createIndex({ isActive: 1 });
      await this.collection.createIndex({ startDate: 1, endDate: 1 });
      await this.collection.createIndex({ _id: 1, venueId: 1 });
    }
    return this.collection;
  }

  /**
   * Create a new promo
   */
  async createPromo(promo: Omit<PromoDocument, '_id' | 'createdAt' | 'updatedAt' | 'views' | 'claims' | 'conversions'>): Promise<PromoDocument> {
    const collection = await this.getCollection();
    
    const newPromo: PromoDocument = {
      ...promo,
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      claims: 0,
      conversions: 0
    };
    
    await collection.insertOne(newPromo);
    return newPromo;
  }

  /**
   * Get promo by ID
   */
  async getPromoById(promoId: string): Promise<PromoDocument | null> {
    const collection = await this.getCollection();
    return collection.findOne({ _id: new ObjectId(promoId) });
  }

  /**
   * Get all promos for a venue
   */
  async getVenuePromos(venueId: string, options?: { activeOnly?: boolean }): Promise<PromoDocument[]> {
    const collection = await this.getCollection();
    
    const query: any = { venueId };
    
    if (options?.activeOnly) {
      query.isActive = true;
      query.startDate = { $lte: new Date() };
      query.endDate = { $gte: new Date() };
    }
    
    return collection.find(query).sort({ startDate: -1 }).toArray();
  }

  /**
   * Get active promos (for discovery)
   */
  async getActivePromos(options?: {
    limit?: number;
    skip?: number;
    city?: string;
    category?: string;
  }): Promise<PromoDocument[]> {
    const collection = await this.getCollection();
    
    const query: any = {
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    };
    
    return collection
      .find(query)
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 20)
      .toArray();
  }

  /**
   * Update promo
   */
  async updatePromo(promoId: string, updates: Partial<PromoDocument>): Promise<PromoDocument | null> {
    const collection = await this.getCollection();
    
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(promoId) },
      { 
        $set: { 
          ...updates, 
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );
    
    return result;
  }

  /**
   * Delete promo
   */
  async deletePromo(promoId: string): Promise<boolean> {
    const collection = await this.getCollection();
    
    const result = await collection.deleteOne({ _id: new ObjectId(promoId) });
    return result.deletedCount === 1;
  }

  /**
   * Increment promo views
   */
  async incrementViews(promoId: string): Promise<void> {
    const collection = await this.getCollection();
    
    await collection.updateOne(
      { _id: new ObjectId(promoId) },
      { $inc: { views: 1 } }
    );
  }

  /**
   * Increment promo claims
   */
  async incrementClaims(promoId: string): Promise<void> {
    const collection = await this.getCollection();
    
    await collection.updateOne(
      { _id: new ObjectId(promoId) },
      { $inc: { claims: 1 } }
    );
  }

  /**
   * Search promos by type
   */
  async searchByType(promoType: PromoType, limit = 20): Promise<PromoDocument[]> {
    const collection = await this.getCollection();
    
    return collection
      .find({ 
        promoType,
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      })
      .limit(limit)
      .toArray();
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(limit = 10): Promise<PromoDocument[]> {
    const collection = await this.getCollection();
    
    return collection
      .find({
        promoType: 'event',
        isActive: true,
        startDate: { $gt: new Date() }
      })
      .sort({ startDate: 1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Get promos expiring soon (for notifications)
   */
  async getExpiringPromos(hoursUntilExpiry = 24): Promise<PromoDocument[]> {
    const collection = await this.getCollection();
    
    const expiryThreshold = new Date(Date.now() + hoursUntilExpiry * 60 * 60 * 1000);
    
    return collection
      .find({
        isActive: true,
        endDate: { $lte: expiryThreshold, $gte: new Date() }
      })
      .toArray();
  }
}

// Export singleton
export const promoService = new PromoService();

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Create a Free Flow promo
 */
export async function createFreeFlowPromo(
  venueId: string,
  data: Omit<FreeFlowPromo, 'type'>,
  options?: {
    title?: string;
    description?: string;
    imageUrl?: string;
    startDate: Date;
    endDate: Date;
  }
): Promise<PromoDocument> {
  return promoService.createPromo({
    venueId,
    title: options?.title || `${data.packageName} Package`,
    description: options?.description,
    promoType: 'free_flow',
    promoData: { type: 'free_flow', ...data },
    isActive: true,
    isFeatured: false,
    imageUrl: options?.imageUrl,
    startDate: options?.startDate || new Date(),
    endDate: options?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}

/**
 * Create a Ladies Night promo
 */
export async function createLadiesNightPromo(
  venueId: string,
  data: Omit<LadiesNightPromo, 'type'>,
  options?: {
    imageUrl?: string;
    startDate: Date;
    endDate: Date;
  }
): Promise<PromoDocument> {
  return promoService.createPromo({
    venueId,
    title: data.title,
    promoType: 'ladies_night',
    promoData: { type: 'ladies_night', ...data },
    isActive: true,
    isFeatured: true,
    imageUrl: options?.imageUrl,
    startDate: options?.startDate || new Date(),
    endDate: options?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
}

/**
 * Create an Event promo
 */
export async function createEventPromo(
  venueId: string,
  data: Omit<EventPromo, 'type'>,
  options?: {
    title?: string;
    description?: string;
    imageUrl?: string;
    startDate: Date;
    endDate: Date;
  }
): Promise<PromoDocument> {
  return promoService.createPromo({
    venueId,
    title: options?.title || data.eventName,
    description: options?.description || data.description,
    promoType: 'event',
    promoData: { type: 'event', ...data },
    isActive: true,
    isFeatured: true,
    imageUrl: options?.imageUrl,
    startDate: options?.startDate ?? new Date(),
    endDate: options?.endDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}
