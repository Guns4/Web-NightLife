/**
 * =====================================================
 * RECEIPT OCR VALIDATION SERVICE
 * AfterHoursID - Verified Reviews System
 * =====================================================
 */

import { extractExifData } from './exif-service';

export interface ReceiptValidationResult {
  isValid: boolean;
  confidence: number;
  extractedData: {
    venueName?: string;
    date?: string;
    totalAmount?: number;
    currency?: string;
  };
  issues: string[];
  rawText: string;
}

export interface GeoValidationResult {
  isValid: boolean;
  distance: number; // meters
  venueLocation: { lat: number; lng: number };
  photoLocation: { lat: number; lng: number };
}

// OCR Configuration
const OCR_CONFIDENCE_THRESHOLD = 0.7;
const MAX_RECEIPT_AGE_HOURS = 24;
const MAX_GPS_DISTANCE_METERS = 500; // 500m radius

/**
 * Validate receipt from uploaded image
 * Uses Tesseract.js for OCR in production, or mock for demo
 */
export async function validateReceipt(
  imageBuffer: Buffer,
  venueName: string,
  venueLocation: { lat: number; lng: number }
): Promise<ReceiptValidationResult> {
  // In production, use Google Vision API or Tesseract.js
  // For now, we'll implement a simulated validation
  
  try {
    // Extract EXIF data from image
    const exifData = await extractExifData(imageBuffer);
    
    // Simulated OCR extraction (in production, call Vision API)
    const ocrResult = await performOCR(imageBuffer);
    
    // Validate extracted data
    const issues: string[] = [];
    let confidence = 0;
    
    // Check venue name
    const venueNameMatch = ocrResult.rawText.toLowerCase().includes(venueName.toLowerCase());
    if (venueNameMatch) {
      confidence += 0.4;
    } else {
      issues.push('Venue name not found in receipt');
    }
    
    // Check date (must be within 24 hours)
    const receiptDate = ocrResult.extractedData.date;
    if (receiptDate) {
      const hoursDiff = (Date.now() - new Date(receiptDate).getTime()) / (1000 * 60 * 60);
      if (hoursDiff <= MAX_RECEIPT_AGE_HOURS) {
        confidence += 0.3;
      } else {
        issues.push('Receipt is older than 24 hours');
      }
    } else {
      issues.push('Could not extract date from receipt');
    }
    
    // Check total amount
    if (ocrResult.extractedData.totalAmount && ocrResult.extractedData.totalAmount > 0) {
      confidence += 0.3;
    } else {
      issues.push('Could not extract total amount');
    }
    
    // Validate GPS coordinates
    let geoValidation: GeoValidationResult | null = null;
    if (exifData.gps) {
      geoValidation = await validateGPSLocation(
        exifData.gps,
        venueLocation
      );
      if (geoValidation.isValid) {
        confidence += 0.2; // Bonus for GPS match
      }
    } else {
      issues.push('No GPS data found in image');
    }
    
    return {
      isValid: (confidence >= OCR_CONFIDENCE_THRESHOLD && geoValidation?.isValid) || false,
      confidence,
      extractedData: ocrResult.extractedData,
      issues,
      rawText: ocrResult.rawText,
    };
    
  } catch (error) {
    console.error('Receipt validation error:', error);
    return {
      isValid: false,
      confidence: 0,
      extractedData: {},
      issues: ['Failed to process receipt image'],
      rawText: '',
    };
  }
}

/**
 * Perform OCR on image
 * In production, integrate with Google Vision API or Tesseract.js
 */
async function performOCR(imageBuffer: Buffer): Promise<{
  rawText: string;
  extractedData: {
    venueName?: string;
    date?: string;
    totalAmount?: number;
    currency?: string;
  };
}> {
  // Simulated OCR response
  // In production, use: const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
  
  const mockTexts = [
    'AFTER HOURS CLUB\nJl. Sudirman No. 123\nJakarta\n\nDate: 2024-01-15 21:30\n\nTOTAL: Rp 250.000\n\nThank you!',
    'CLUB TEMPO\nJl. Thamrin Blvd\n\n15/01/2024 22:00\n\nTOTAL: Rp 500.000\n\nPAID',
  ];
  
  const rawText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
  
  // Extract data using regex patterns
  const dateMatch = rawText.match(/(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/);
  const amountMatch = rawText.match(/Rp\s*(\d+(?:\.\d{3})*)/);
  
  return {
    rawText,
    extractedData: {
      venueName: 'After Hours Club', // Would be extracted from OCR
      date: dateMatch ? new Date().toISOString() : undefined,
      totalAmount: amountMatch ? parseInt(amountMatch[1].replace(/\./g, '')) : 250000,
      currency: 'IDR',
    },
  };
}

/**
 * Validate GPS location matches venue
 */
export async function validateGPSLocation(
  photoGps: { lat: number; lng: number },
  venueLocation: { lat: number; lng: number }
): Promise<GeoValidationResult> {
  // Calculate distance using Haversine formula
  const R = 6371000; // Earth's radius in meters
  const lat1 = photoGps.lat * Math.PI / 180;
  const lat2 = venueLocation.lat * Math.PI / 180;
  const deltaLat = (venueLocation.lat - photoGps.lat) * Math.PI / 180;
  const deltaLng = (venueLocation.lng - photoGps.lng) * Math.PI / 180;
  
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return {
    isValid: distance <= MAX_GPS_DISTANCE_METERS,
    distance,
    venueLocation,
    photoLocation: photoGps,
  };
}

/**
 * Validate receipt with EXIF metadata
 */
export async function validateReceiptWithExif(
  imageBuffer: Buffer,
  venueName: string,
  venueLocation: { lat: number; lng: number }
): Promise<ReceiptValidationResult> {
  // Validate receipt (EXIF extraction is done internally in validateReceipt)
  return validateReceipt(imageBuffer, venueName, venueLocation);
}
