/**
 * METAVERSE COMMERCE
 * Phase 10.9: Digital Merch & Spirits
 * 
 * Features:
 * - Virtual Bar with Real-World Delivery
 * - Buy virtual drink for friend
 * - Real cocktail delivered to table
 * - NFT collectibles
 */

import { createClient } from '@supabase/supabase-js';

// Product types
export type ProductType = 
  | 'virtual_drink'
  | 'digital_merch'
  | 'nft_collectible'
  | 'experience';

// Merchandise item
export interface MerchItem {
  id: string;
  name: string;
  description: string;
  type: ProductType;
  price: number;
  currency: string;
  imageUrl: string;
  digitalUnlock?: string;
  physicalVariant?: string;
}

// Virtual drink purchase
export interface VirtualDrink {
  id: string;
  buyerId: string;
  recipientId?: string;
  recipientTableId?: string;
  venueId: string;
  drinkName: string;
  price: number;
  status: 'purchased' | 'preparing' | 'delivered' | 'consumed';
  virtualSent: boolean;
  physicalDelivery: boolean;
  deliveryCode?: string;
  purchasedAt: number;
  deliveredAt?: number;
}

// Digital merchandise
export interface DigitalMerch {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  availableSizes: string[];
  digitalBonus: string[];
  limitedEdition: boolean;
  stock?: number;
}

// NFT Collection
export interface NFTCollectible {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  animationUrl?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
  totalSupply: number;
  minted: number;
  attributes: Record<string, string>;
}

/**
 * Purchase virtual drink for friend
 */
export async function purchaseVirtualDrink(
  buyerId: string,
  recipientId: string,
  venueId: string,
  tableId: string,
  drinkName: string,
  price: number
): Promise<VirtualDrink> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  const drink: VirtualDrink = {
    id: `vdrink-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    buyerId,
    recipientId,
    recipientTableId: tableId,
    venueId,
    drinkName,
    price,
    status: 'purchased',
    virtualSent: false,
    physicalDelivery: true,
    deliveryCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
    purchasedAt: Date.now(),
  };

  await supabase.from('virtual_drinks').insert({
    id: drink.id,
    buyer_id: buyerId,
    recipient_id: recipientId,
    recipient_table_id: tableId,
    venue_id: venueId,
    drink_name: drinkName,
    price,
    status: 'purchased',
    virtual_sent: false,
    physical_delivery: true,
    delivery_code: drink.deliveryCode,
    purchased_at: drink.purchasedAt,
  });

  // Send notification to recipient
  await supabase.from('notifications').insert({
    user_id: recipientId,
    type: 'virtual_drink_received',
    title: 'You received a drink!',
    message: `${drinkName} has been sent to your table!`,
    data: JSON.stringify({ drinkId: drink.id }),
    created_at: Date.now(),
  });

  // Mark as preparing
  await supabase
    .from('virtual_drinks')
    .update({ status: 'preparing' })
    .eq('id', drink.id);

  // Simulate venue preparation (in production, would integrate with POS)
  setTimeout(async () => {
    await supabase
      .from('virtual_drinks')
      .update({ status: 'delivered', delivered_at: Date.now() })
      .eq('id', drink.id);
  }, 300000); // 5 minutes

  return drink;
}

/**
 * Get available virtual drinks for venue
 */
export async function getVenueVirtualDrinks(venueId: string): Promise<{
  name: string;
  price: number;
  description: string;
  imageUrl: string;
}[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  const result = await supabase
    .from('venue_menu')
    .select('*')
    .eq('venue_id', venueId)
    .eq('available', true)
    .eq('type', 'drink');

  return (result.data || []).map((item: any) => ({
    name: item.name,
    price: item.price,
    description: item.description,
    imageUrl: item.image_url,
  }));
}

/**
 * Purchase digital merchandise
 */
export async function purchaseDigitalMerch(
  userId: string,
  itemId: string,
  size: string
): Promise<{ orderId: string; digitalAccess: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  const orderId = `merch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await supabase.from('merch_orders').insert({
    id: orderId,
    user_id: userId,
    item_id: itemId,
    size,
    status: 'processing',
    created_at: Date.now(),
  });

  // Generate digital access code
  const digitalAccess = `DIGITAL-${Date.now().toString(36).toUpperCase()}`;

  await supabase
    .from('merch_orders')
    .update({ status: 'completed', digital_access: digitalAccess })
    .eq('id', orderId);

  return { orderId, digitalAccess };
}

/**
 * Mint NFT collectible
 */
export async function mintCollectible(
  userId: string,
  collectibleId: string
): Promise<{ tokenId: string; txHash: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  // Check supply
  const itemResult = await supabase
    .from('nft_collectibles')
    .select('*')
    .eq('id', collectibleId);
  const item = itemResult.data?.[0];

  if (!item || item.minted >= item.total_supply) {
    throw new Error('Sold out');
  }

  const tokenId = `NFT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const txHash = `0x${Date.now().toString(16)}${Math.random().toString(36).substr(2, 8)}`;

  // Record mint
  await supabase.from('nft_mints').insert({
    token_id: tokenId,
    collectible_id: collectibleId,
    user_id: userId,
    tx_hash: txHash,
    minted_at: Date.now(),
  });

  // Update supply
  await supabase
    .from('nft_collectibles')
    .update({ minted: item.minted + 1 })
    .eq('id', collectibleId);

  return { tokenId, txHash };
}

/**
 * Get user's digital vault
 */
export async function getUserDigitalVault(userId: string): Promise<{
  virtualDrinks: number;
  digitalMerch: { name: string; digitalAccess: string }[];
  nftCollectibles: { name: string; tokenId: string; rarity: string }[];
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  );

  // Get virtual drinks
  const drinksResult = await supabase
    .from('virtual_drinks')
    .select('*')
    .eq('recipient_id', userId)
    .eq('status', 'delivered');
  const virtualDrinks = drinksResult.data?.length || 0;

  // Get digital merch
  const merchResult = await supabase
    .from('merch_orders')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed');
  const digitalMerch = (merchResult.data || []).map((m: any) => ({
    name: m.item_id,
    digitalAccess: m.digital_access,
  }));

  // Get NFTs
  const nftResult = await supabase
    .from('nft_mints')
    .select('*')
    .eq('user_id', userId);
  const nftCollectibles = (nftResult.data || []).map((n: any) => ({
    name: n.collectible_id,
    tokenId: n.token_id,
    rarity: 'rare',
  }));

  return { virtualDrinks, digitalMerch, nftCollectibles };
}
