import crypto from 'node:crypto';
import prisma from '@/lib/auth/prisma-client';

interface MidtransConfig {
  serverKey: string;
  clientKey: string;
  isProduction: boolean;
}

interface CreatePaymentParams {
  adSlotId: string;
  amount: number;
  currency?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

interface MidtransResponse {
  token: string;
  redirect_url: string;
  transaction_id: string;
  order_id: string;
  status_code: string;
  status_message: string;
}

// Payment status constants
const PaymentStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SETTLED: 'SETTLED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

/**
 * Get Midtrans configuration
 */
function getMidtransConfig(): MidtransConfig {
  return {
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    isProduction: process.env.NODE_ENV === 'production',
  };
}

/**
 * Get Midtrans API base URL
 */
function getMidtransBaseUrl(): string {
  const config = getMidtransConfig();
  return config.isProduction 
    ? 'https://api.midtrans.com' 
    : 'https://api.sandbox.midtrans.com';
}

/**
 * Generate unique order ID
 */
function generateOrderId(prefix: string = 'AD'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Create Midtrans payment token
 */
export async function createPayment(params: CreatePaymentParams): Promise<MidtransResponse> {
  const config = getMidtransConfig();
  const { adSlotId, amount, currency = 'IDR', customerName, customerEmail, customerPhone } = params;
  
  // Generate order ID
  const orderId = generateOrderId('PAY');
  
  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      adSlotId,
      amount,
      currency,
      status: PaymentStatus.PENDING,
      orderId,
      customerName,
      customerEmail,
      customerPhone,
    },
  });
  
  // Prepare Midtrans request
  const midtransRequest = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
      currency: currency,
    },
    customer_details: {
      first_name: customerName.split(' ')[0],
      last_name: customerName.split(' ').slice(1).join(' '),
      email: customerEmail,
      phone: customerPhone,
    },
    item_details: [
      {
        id: adSlotId,
        price: amount,
        quantity: 1,
        name: 'Ad Slot Payment',
      },
    ],
    credit_card: {
      secure: true,
    },
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?order_id=${orderId}`,
      error: `${process.env.NEXT_PUBLIC_APP_URL}/payment/error?order_id=${orderId}`,
      pending: `${process.env.NEXT_PUBLIC_APP_URL}/payment/pending?order_id=${orderId}`,
    },
  };
  
  // Call Midtrans API
  const authString = Buffer.from(config.serverKey + ':').toString('base64');
  
  const response = await fetch(`${getMidtransBaseUrl}/v2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authString}`,
      'Accept': 'application/json',
    },
    body: JSON.stringify(midtransRequest),
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    // Update payment status to failed
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });
    
    throw new Error(result.status_message || 'Failed to create payment token');
  }
  
  // Update payment with transaction ID
  await prisma.payment.update({
    where: { id: payment.id },
    data: { transactionId: result.transaction_id },
  });
  
  return {
    token: result.token,
    redirect_url: result.redirect_url,
    transaction_id: result.transaction_id,
    order_id: result.order_id,
    status_code: result.status_code,
    status_message: result.status_message,
  };
}

/**
 * Verify Midtrans webhook signature
 */
export function verifyMidtransSignature(
  signatureKey: string,
  orderId: string,
  statusCode: string,
  grossAmount: string
): boolean {
  const config = getMidtransConfig();
  
  // Create signature
  const dataToSign = `${orderId}${statusCode}${grossAmount}${config.serverKey}`;
  const signature = crypto
    .createHash('sha512')
    .update(dataToSign)
    .digest('hex');
  
  return signature === signatureKey;
}

/**
 * Process Midtrans webhook notification
 */
export async function processWebhook(payload: {
  order_id: string;
  transaction_id: string;
  transaction_status: string;
  status_code: string;
  gross_amount: string;
  signature_key?: string;
}): Promise<{ success: boolean; message: string }> {
  const { order_id, transaction_status, status_code, gross_amount, signature_key } = payload;
  
  // Verify signature if provided
  if (signature_key) {
    const isValid = verifyMidtransSignature(
      signature_key,
      order_id,
      status_code,
      gross_amount
    );
    
    if (!isValid) {
      return { success: false, message: 'Invalid signature' };
    }
  }
  
  // Find payment by order ID
  const payment = await prisma.payment.findUnique({
    where: { orderId: order_id },
    include: { adSlot: true },
  });
  
  if (!payment) {
    return { success: false, message: 'Payment not found' };
  }
  
  // Map Midtrans status to our status
  let newStatus: string;
  switch (transaction_status) {
    case 'capture':
    case 'settlement':
      newStatus = PaymentStatus.SETTLED;
      break;
    case 'pending':
      newStatus = PaymentStatus.PENDING;
      break;
    case 'deny':
    case 'reject':
      newStatus = PaymentStatus.FAILED;
      break;
    case 'cancel':
      newStatus = PaymentStatus.CANCELLED;
      break;
    case 'expire':
      newStatus = PaymentStatus.EXPIRED;
      break;
    case 'refund':
      newStatus = PaymentStatus.REFUNDED;
      break;
    default:
      newStatus = PaymentStatus.PROCESSING;
  }
  
  // Update payment
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: newStatus,
      webhookPayload: payload,
      settledAt: newStatus === PaymentStatus.SETTLED ? new Date() : undefined,
    },
  });
  
  // If payment is settled, activate the ad slot
  if (newStatus === PaymentStatus.SETTLED) {
    await prisma.adSlot.update({
      where: { id: payment.adSlotId },
      data: {
        isActive: true,
        isPaid: true,
        paidAt: new Date(),
      },
    });
    
    // TODO: Send WhatsApp notification to merchant
    // await sendWhatsAppNotification(payment.adSlot.venueId, ...);
  }
  
  return { 
    success: true, 
    message: `Payment status updated to ${transaction_status}` 
  };
}

/**
 * Get payment status by order ID
 */
export async function getPaymentStatus(orderId: string) {
  const payment = await prisma.payment.findUnique({
    where: { orderId },
    include: {
      adSlot: {
        include: {
          venue: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
      },
    },
  });
  
  if (!payment) {
    return null;
  }
  
  return {
    id: payment.id,
    orderId: payment.orderId,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    createdAt: payment.createdAt,
    settledAt: payment.settledAt,
    adSlot: {
      id: payment.adSlot.id,
      slotType: payment.adSlot.slotType,
      venue: payment.adSlot.venue.name,
    },
  };
}

/**
 * Create Xendit payment (alternative)
 */
export async function createXenditPayment(params: CreatePaymentParams) {
  const { adSlotId, amount, currency = 'IDR', customerEmail, customerPhone } = params;
  
  const orderId = generateOrderId('XEN');
  
  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      adSlotId,
      amount,
      currency,
      status: PaymentStatus.PENDING,
      orderId,
      customerEmail,
      customerPhone,
    },
  });
  
  // Call Xendit API
  const xenditKey = process.env.XENDIT_API_KEY;
  
  const response = await fetch('https://api.xendit.co/v2/invoices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(xenditKey + ':').toString('base64')}`,
    },
    body: JSON.stringify({
      external_id: orderId,
      amount: amount,
      currency: currency,
      customer: {
        email: customerEmail,
        mobile_phone: customerPhone,
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payments`,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?order_id=${orderId}`,
      failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/error?order_id=${orderId}`,
    }),
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });
    
    throw new Error(result.message || 'Failed to create Xendit invoice');
  }
  
  // Update payment with Xendit ID
  await prisma.payment.update({
    where: { id: payment.id },
    data: { transactionId: result.id },
  });
  
  return {
    invoiceUrl: result.invoice_url,
    invoiceId: result.id,
    orderId: result.external_id,
  };
}

export default {
  createPayment,
  processWebhook,
  getPaymentStatus,
  createXenditPayment,
  verifyMidtransSignature,
};
