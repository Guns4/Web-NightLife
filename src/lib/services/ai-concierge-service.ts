/**
 * =====================================================
 * AI PERSONAL CONCIERGE SERVICE
 * AfterHoursID - AI Concierge & Global Scale
 * =====================================================
 */

import { searchVenues } from '@/lib/actions/discovery';

// Placeholder for booking service
async function createBooking(params: any) {
  console.log('Creating booking:', params);
  return { success: true, bookingId: 'booking-' + Date.now() };
}

// Placeholder for venue details
async function getVenueById(venueId: string) {
  console.log('Getting venue:', venueId);
  return { id: venueId, name: 'Sample Venue' };
}

// =====================================================
// TYPES
// =====================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ConversationContext {
  userId?: string;
  phoneNumber?: string;
  venueId?: string;
  bookingDate?: string;
  bookingTime?: string;
  guestCount?: number;
}

export interface ConciergeResponse {
  message: string;
  action?: 'search' | 'booking' | 'confirmation' | 'transfer';
  data?: any;
}

// =====================================================
// FUNCTION DEFINITIONS (for OpenAI Function Calling)
// =====================================================

export const functionDefinitions = [
  {
    name: 'searchVenues',
    description: 'Search for nightlife venues based on user preferences',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (e.g., "romantic rooftop bar")' },
        city: { type: 'string', description: 'City name (e.g., "Jakarta", "Bali")' },
        category: { type: 'string', description: 'Venue category (bar, club, lounge, etc.)' },
        lat: { type: 'number', description: 'Latitude for location-based search' },
        lng: { type: 'number', description: 'Longitude for location-based search' },
        radius: { type: 'number', description: 'Search radius in kilometers' },
        limit: { type: 'number', description: 'Number of results (default 10)' },
      },
    },
  },
  {
    name: 'getVenueDetails',
    description: 'Get detailed information about a specific venue',
    parameters: {
      type: 'object',
      properties: {
        venueId: { type: 'string', description: 'The venue ID' },
      },
      required: ['venueId'],
    },
  },
  {
    name: 'createBooking',
    description: 'Create a table reservation at a venue',
    parameters: {
      type: 'object',
      properties: {
        venueId: { type: 'string', description: 'The venue ID' },
        userId: { type: 'string', description: 'The user ID making the booking' },
        date: { type: 'string', description: 'Booking date (YYYY-MM-DD)' },
        time: { type: 'string', description: 'Booking time (HH:MM)' },
        guests: { type: 'number', description: 'Number of guests' },
        notes: { type: 'string', description: 'Special requests or notes' },
      },
      required: ['venueId', 'userId', 'date', 'time', 'guests'],
    },
  },
  {
    name: 'transferToHuman',
    description: 'Transfer the conversation to a human agent when AI cannot help',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Reason for transfer' },
        summary: { type: 'string', description: 'Conversation summary for the agent' },
      },
      required: ['reason'],
    },
  },
];

// =====================================================
// CONCIERGE SERVICE
// =====================================================

/**
 * Process user message and generate AI response
 */
export async function processConciergeMessage(
  message: string,
  context: ConversationContext,
  history: ChatMessage[]
): Promise<ConciergeResponse> {
  // Build system prompt
  const systemPrompt = buildSystemPrompt(context);
  
  // Prepare messages for API
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10), // Last 10 messages
    { role: 'user', content: message, timestamp: new Date().toISOString() },
  ];
  
  try {
    // Call AI API with function calling
    const response = await callAIWithFunctions(messages);
    
    return response;
  } catch (error) {
    console.error('Concierge error:', error);
    return {
      message: "I'm sorry, something went wrong. Let me connect you with a human agent.",
      action: 'transfer',
    };
  }
}

/**
 * Build system prompt with context
 */
function buildSystemPrompt(context: ConversationContext): string {
  return `You are AfterHoursAI, the personal concierge for AfterHoursID - Indonesia's premier nightlife platform.

Your role is to help users discover and book the best nightlife experiences in Indonesia.

Capabilities:
- Search venues by name, category, location, or preferences
- Get detailed venue information including ratings, photos, and reviews
- Create table reservations or bookings
- Answer questions about nightlife, events, and promotions
- Provide personalized recommendations based on user preferences

Communication Style:
- Friendly, helpful, and conversational
- Use Indonesian casual language (kamu) or formal (anda) based on context
- Keep responses concise and actionable
- Always confirm important details before taking action

Current Context:
${context.venueId ? `- User is interested in a specific venue` : ''}
${context.bookingDate ? `- User is trying to book for ${context.bookingDate}` : ''}
${context.guestCount ? `- User wants to book for ${context.guestCount} guests` : ''}

When to transfer to human:
- Complex payment issues
- Refund requests
- Complaints or serious issues
- Requests outside your capabilities

Always be helpful and try to solve the user's needs first before transferring.`;
}

/**
 * Call AI with function calling
 */
async function callAIWithFunctions(messages: any[]): Promise<ConciergeResponse> {
  // In production, this would call OpenAI API
  // For demo, we'll implement a simple rule-based response
  
  const lastMessage = messages[messages.length - 1].content.toLowerCase();
  
  // Rule-based responses for demo
  if (lastMessage.includes('search') || lastMessage.includes('cari') || lastMessage.includes('find')) {
    // Return function call for search
    return {
      message: "I'd be happy to help you find a venue! What type of place are you looking for?",
      action: 'search',
    };
  }
  
  if (lastMessage.includes('book') || lastMessage.includes('reserv') || lastMessage.includes('meja')) {
    return {
      message: "Great! To make a booking, I'll need:\n1. Which venue?\n2. Date\n3. Time\n4. Number of guests",
      action: 'booking',
    };
  }
  
  if (lastMessage.includes('recommend') || lastMessage.includes('saran') || lastMessage.includes('best')) {
    return {
      message: "Here are some top recommendations based on what's trending tonight in Jakarta:",
      action: 'search',
    };
  }
  
  // Default helpful response
  return {
    message: "Hi! I'm your AfterHours concierge. I can help you:\n🔍 Find venues\n📅 Make bookings\n💰 Check promotions\n❓ Answer questions\n\nWhat would you like to do?",
    action: 'search',
  };
}

/**
 * Execute function call from AI
 */
export async function executeFunctionCall(
  functionName: string,
  arguments_: any
): Promise<any> {
  switch (functionName) {
    case 'searchVenues':
      return await searchVenues(arguments_);
    
    case 'getVenueDetails':
      return await getVenueById(arguments_.venueId);
    
    case 'createBooking':
      return await createBooking({
        venueId: arguments_.venueId,
        userId: arguments_.userId,
        date: arguments_.date,
        time: arguments_.time,
        guests: arguments_.guests,
        notes: arguments_.notes,
      });
    
    case 'transferToHuman':
      return { success: true, message: 'Transferring to human agent...' };
    
    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
}

// =====================================================
// WHATSAPP BOT INTEGRATION
// =====================================================

export interface WhatsAppWebhook {
  from: string;
  type: 'text' | 'image' | 'audio';
  text?: { body: string };
  image?: { id: string };
  audio?: { id: string };
}

/**
 * Process incoming WhatsApp message
 */
export async function processWhatsAppMessage(
  webhook: WhatsAppWebhook
): Promise<ConciergeResponse> {
  const phoneNumber = webhook.from;
  const message = webhook.text?.body || '';
  
  // Get or create conversation context
  const context = await getOrCreateContext(phoneNumber);
  
  // Get conversation history
  const history = await getConversationHistory(phoneNumber);
  
  // Process message through concierge
  return await processConciergeMessage(message, context, history);
}

/**
 * Get or create conversation context
 */
async function getOrCreateContext(phoneNumber: string): Promise<ConversationContext> {
  // In production, fetch from database
  return { phoneNumber };
}

/**
 * Get conversation history
 */
async function getConversationHistory(phoneNumber: string): Promise<ChatMessage[]> {
  // In production, fetch from database
  return [];
}

/**
 * Send WhatsApp response
 */
export async function sendWhatsAppMessage(
  phoneNumber: string,
  response: ConciergeResponse
): Promise<void> {
  // In production, use WhatsApp Business API
  console.log(`[WhatsApp] Sending to ${phoneNumber}: ${response.message}`);
}

// =====================================================
// FAQ KNOWLEDGE BASE
// =====================================================

const faqKnowledgeBase = [
  {
    keywords: ['jam', 'buka', 'tutup', 'opening', 'hours'],
    answer: "Most venues in Indonesia open around 17:00 and close at 02:00 or 03:00. Some clubs open later around 21:00.",
  },
  {
    keywords: ['dresscode', 'pakaian', 'attire'],
    answer: "Most upscale venues require smart casual - no slippers, shorts, or singlets. Some clubs have stricter dress codes.",
  },
  {
    keywords: ['harga', 'price', 'budget', 'mahal'],
    answer: "Prices vary by venue. Entry can range from free to Rp 500,000. Drinks typically start at Rp 50,000.",
  },
  {
    keywords: ['book', 'reserv', 'meja', 'table'],
    answer: "You can book through AfterHours! Just tell me which venue, date, time, and how many guests.",
  },
  {
    keywords: ['promo', 'discount', 'promotion', 'murah'],
    answer: "Check our promos section for the latest deals! Venue partners often offer free entry or drink specials.",
  },
];

/**
 * Search FAQ knowledge base
 */
export function searchFAQ(query: string): string | null {
  const lowerQuery = query.toLowerCase();
  
  for (const faq of faqKnowledgeBase) {
    if (faq.keywords.some(k => lowerQuery.includes(k))) {
      return faq.answer;
    }
  }
  
  return null;
}
