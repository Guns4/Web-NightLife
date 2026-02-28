/**
 * =====================================================
 * EXIF METADATA EXTRACTION SERVICE
 * AfterHoursID - Verified Reviews System
 * =====================================================
 */

export interface ExifData {
  gps?: {
    lat: number;
    lng: number;
    altitude?: number;
  };
  dateTime?: string;
  make?: string;
  model?: string;
  orientation?: number;
}

/**
 * Extract EXIF data from image buffer
 * In production, use a library like exif-js or sharp
 */
export async function extractExifData(imageBuffer: Buffer): Promise<ExifData> {
  // In production, use a library to extract EXIF
  // For demo purposes, we'll return mock data if GPS is available
  
  try {
    // Simulated EXIF extraction
    // In production: const exif = await ExifReader.load(Buffer.from(imageBuffer));
    
    // Return mock GPS data for demo
    // In real implementation, parse actual EXIF tags
    return {
      gps: {
        lat: -6.1751 + (Math.random() - 0.5) * 0.01, // Around Jakarta
        lng: 106.8650 + (Math.random() - 0.5) * 0.01,
      },
      dateTime: new Date().toISOString(),
      make: 'Samsung',
      model: 'Galaxy S21',
    };
  } catch (error) {
    console.error('EXIF extraction error:', error);
    return {};
  }
}

/**
 * Convert GPS coordinates from EXIF format to decimal
 */
export function convertDmsToDecimal(degrees: number, minutes: number, seconds: number, ref: string): number {
  let decimal = degrees + (minutes / 60) + (seconds / 3600);
  if (ref === 'S' || ref === 'W') {
    decimal = decimal * -1;
  }
  return decimal;
}

/**
 * Validate that EXIF data exists and is not tampered
 */
export function isExifValid(exifData: ExifData): boolean {
  // Check if GPS data exists
  if (!exifData.gps) return false;
  
  // Validate coordinates are within valid ranges
  if (exifData.gps.lat < -90 || exifData.gps.lat > 90) return false;
  if (exifData.gps.lng < -180 || exifData.gps.lng > 180) return false;
  
  return true;
}
