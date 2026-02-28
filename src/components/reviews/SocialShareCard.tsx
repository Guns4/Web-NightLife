'use client';

import { useState, useRef } from 'react';
import { Share2, Download, Check, Star, MapPin } from 'lucide-react';

interface SocialShareCardProps {
  venueName: string;
  venueAddress: string;
  rating: number;
  comment?: string;
  userName: string;
  isVerified: boolean;
  isAIVerified?: boolean;
  onShare?: () => void;
}

export default function SocialShareCard({
  venueName,
  venueAddress,
  rating,
  comment,
  userName,
  isVerified,
  isAIVerified = false,
  onShare
}: SocialShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  // Generate the shareable image
  const generateImage = async () => {
    setIsGenerating(true);
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size for Instagram Story (9:16 ratio)
      canvas.width = 1080;
      canvas.height = 1920;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.5, '#16213e');
      gradient.addColorStop(1, '#0f3460');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add decorative elements
      ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
      ctx.beginPath();
      ctx.arc(900, 200, 400, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 105, 180, 0.1)';
      ctx.beginPath();
      ctx.arc(200, 1700, 300, 0, Math.PI * 2);
      ctx.fill();

      // Nightlife ID Logo text
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 48px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('NIGHTLIFE.ID', canvas.width / 2, 120);

      // Verified badge
      if (isVerified || isAIVerified) {
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, 200, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px system-ui';
        ctx.fillText('✓', canvas.width / 2, 215);
      }

      // Venue name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 72px system-ui';
      const venueNameLines = wrapText(ctx, venueName, 900);
      let yPos = 400;
      venueNameLines.forEach(line => {
        ctx.fillText(line, canvas.width / 2, yPos);
        yPos += 90;
      });

      // Rating stars
      yPos = 600;
      const starSpacing = 80;
      const starStartX = canvas.width / 2 - (starSpacing * 2);
      for (let i = 0; i < 5; i++) {
        const x = starStartX + i * starSpacing;
        ctx.fillStyle = i < rating ? '#FFD700' : '#4B5563';
        
        // Draw star
        drawStar(ctx, x, yPos, 5, 35, 17);
      }

      // Rating text
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 48px system-ui';
      ctx.fillText(`${rating}/5`, canvas.width / 2, yPos + 100);

      // Comment
      if (comment) {
        ctx.fillStyle = '#E5E7EB';
        ctx.font = '36px system-ui';
        const commentLines = wrapText(ctx, `"${comment}"`, 800);
        yPos = 900;
        commentLines.forEach(line => {
          ctx.fillText(line, canvas.width / 2, yPos);
          yPos += 50;
        });
      }

      // Venue address
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '32px system-ui';
      ctx.fillText(venueAddress, canvas.width / 2, 1300);

      // Verification badges
      const badges: string[] = [];
      if (isVerified) badges.push('📍 GPS Verified');
      if (isAIVerified) badges.push('🧾 Receipt Verified');
      
      if (badges.length > 0) {
        yPos = 1450;
        badges.forEach(badge => {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
          roundRectPolyfill(ctx, canvas.width / 2 - 200, yPos - 40, 400, 60, 30);
          ctx.fill();
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 2;
          roundRectPolyfill(ctx, canvas.width / 2 - 200, yPos - 40, 400, 60, 30);
          ctx.stroke();
          
          ctx.fillStyle = '#10B981';
          ctx.font = '28px system-ui';
          ctx.fillText(badge, canvas.width / 2, yPos);
          yPos += 80;
        });
      }

      // User attribution
      ctx.fillStyle = '#6B7280';
      ctx.font = '24px system-ui';
      ctx.fillText(`Reviewed by ${userName}`, canvas.width / 2, 1750);
      ctx.fillText(new Date().toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }), canvas.width / 2, 1800);

      // Footer
      ctx.fillStyle = '#4B5563';
      ctx.font = '20px system-ui';
      ctx.fillText('Discover more at nightlife.id', canvas.width / 2, 1880);

      setIsGenerated(true);
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to draw a star
  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  };

  // Helper function to wrap text
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  // Polyfill for roundRect (Safari < 16 support)
  const roundRectPolyfill = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // Download the generated image
  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !isGenerated) return;

    const link = document.createElement('a');
    link.download = `nightlife-review-${venueName.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Share Your Experience 📱
        </h3>
        <Share2 className="w-5 h-5 text-gray-400" />
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Generate a beautiful Instagram Story to share your verified venue experience!
      </p>

      {/* Preview Card */}
      <div className="relative aspect-[9/16] bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-xl overflow-hidden mb-4">
        {/* Card Content Preview */}
        <div className="absolute inset-0 flex flex-col items-center p-6 text-center">
          <span className="text-amber-400 font-bold text-lg mt-4">NIGHTLIFE.ID</span>
          
          {(isVerified || isAIVerified) && (
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mt-2">
              <span className="text-white text-sm">✓</span>
            </div>
          )}
          
          <h4 className="text-white font-bold text-xl mt-4 leading-tight">{venueName}</h4>
          
          <div className="flex gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className={`w-5 h-5 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`} 
              />
            ))}
          </div>
          <span className="text-amber-400 font-bold mt-1">{rating}/5</span>
          
          {comment && (
            <p className="text-gray-300 text-xs mt-4 line-clamp-4">"{comment}"</p>
          )}
          
          <div className="flex items-center gap-1 text-gray-400 text-xs mt-4">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[200px]">{venueAddress}</span>
          </div>
          
          <div className="flex gap-2 mt-4">
            {isVerified && (
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                📍 Verified
              </span>
            )}
            {isAIVerified && (
              <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                🧾 Verified
              </span>
            )}
          </div>
          
          <p className="text-gray-500 text-xs mt-auto">
            Reviewed by {userName}
          </p>
        </div>
      </div>

      {/* Hidden canvas for image generation */}
      <canvas 
        ref={canvasRef} 
        className="hidden" 
      />

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={generateImage}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </span>
          ) : isGenerated ? (
            <span className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              Generated!
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Generate Card
            </span>
          )}
        </button>
        
        {isGenerated && (
          <button
            onClick={downloadImage}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Share to Instagram hint */}
      {isGenerated && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
          Download the image and share it to Instagram Stories or TikTok!
        </p>
      )}
    </div>
  );
}
