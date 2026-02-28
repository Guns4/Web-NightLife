/**
 * =====================================================
 * RECEIPT UPLOAD MODAL
 * Step-by-step scanner animation during upload
 * =====================================================
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, 
  Upload, 
  X, 
  CheckCircle, 
  Loader2,
  QrCode,
  MapPin,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

interface ReceiptUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (receiptUrl: string, gpsLocation: { lat: number; lng: number }) => void;
}

const STEPS = [
  { id: 1, title: "Capture Receipt", icon: Camera, description: "Take a photo of your receipt" },
  { id: 2, title: "Verify Location", icon: MapPin, description: "Confirm you're at the venue" },
  { id: 3, title: "Upload", icon: Upload, description: "Submit for verification" },
];

export default function ReceiptUploadModal({
  isOpen,
  onClose,
  onUploadComplete,
}: ReceiptUploadModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setIsUploading(false);
      setUploadProgress(0);
      setIsScanning(false);
      setReceiptPreview(null);
      setGpsLocation(null);
    }
  }, [isOpen]);

  // Simulate scanning animation
  useEffect(() => {
    if (currentStep === 3 && isUploading) {
      setIsScanning(true);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsScanning(false);
            // Complete the upload
            setTimeout(() => {
              if (gpsLocation) {
                onUploadComplete(receiptPreview || "", gpsLocation);
              }
            }, 500);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [currentStep, isUploading, gpsLocation, receiptPreview, onUploadComplete]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL
      const url = URL.createObjectURL(file);
      setReceiptPreview(url);
      setCurrentStep(2);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setCurrentStep(3);
        },
        (error) => {
          console.error("GPS Error:", error);
          // Allow proceeding without GPS
          setGpsLocation({ lat: 0, lng: 0 });
          setCurrentStep(3);
        }
      );
    } else {
      // GPS not available
      setGpsLocation({ lat: 0, lng: 0 });
      setCurrentStep(3);
    }
  };

  const handleUpload = () => {
    setIsUploading(true);
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Verify Your Visit</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between px-6 py-4 bg-white/5">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                    currentStep > step.id
                      ? "bg-amber-500 border-amber-500"
                      : currentStep === step.id
                      ? "border-amber-500 bg-amber-500/20"
                      : "border-white/20"
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="w-4 h-4 text-black" />
                  ) : (
                    <step.icon className={`w-4 h-4 ${currentStep === step.id ? "text-amber-400" : "text-white/40"}`} />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${currentStep > step.id ? "bg-amber-500" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="p-6">
            {/* Step 1: Capture Receipt */}
            {currentStep === 1 && (
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Take a Photo</h3>
                <p className="text-white/60 text-sm mb-6">
                  Upload a clear photo of your receipt or invoice to verify your purchase
                </p>

                {receiptPreview ? (
                  <div className="mb-6">
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="w-full h-48 object-cover rounded-xl border border-white/10"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-xl hover:bg-amber-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Choose Image
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}

            {/* Step 2: Verify Location */}
            {currentStep === 2 && (
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <MapPin className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Confirm Your Location</h3>
                <p className="text-white/60 text-sm mb-6">
                  We need your location to verify you're actually at the venue
                </p>

                {gpsLocation ? (
                  <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-green-400 text-sm">Location captured!</p>
                    <p className="text-white/50 text-xs mt-1">
                      {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleGetLocation}
                    className="w-full py-3 bg-purple-500/20 border border-purple-500/40 text-purple-400 rounded-xl hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-5 h-5" />
                    Get My Location
                  </button>
                )}
              </div>
            )}

            {/* Step 3: Upload with Scanner Animation */}
            {currentStep === 3 && (
              <div className="text-center">
                {/* Scanner Animation */}
                <div className="relative w-32 h-32 mx-auto mb-4">
                  {/* Receipt Preview */}
                  {receiptPreview && (
                    <img
                      src={receiptPreview}
                      alt="Receipt"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  )}
                  
                  {/* Scanner Line */}
                  <AnimatePresence>
                    {isScanning && (
                      <motion.div
                        initial={{ y: 0 }}
                        animate={{ y: 120 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_20px_rgba(251,191,36,0.8)]"
                      />
                    )}
                  </AnimatePresence>

                  {/* Scanning Frame */}
                  <div className="absolute inset-0 border-2 border-amber-500/30 rounded-xl pointer-events-none">
                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-400 rounded-br-lg" />
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">
                  {isUploading ? "Verifying..." : "Ready to Upload"}
                </h3>
                <p className="text-white/60 text-sm mb-4">
                  {isUploading
                    ? "Analyzing receipt and location data"
                    : "Your review will be marked as Elite Verified"}
                </p>

                {/* Progress Bar */}
                {isUploading && (
                  <div className="mb-4">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
                      />
                    </div>
                    <p className="text-white/40 text-xs mt-2">
                      {Math.round(uploadProgress)}% complete
                    </p>
                  </div>
                )}

                {!isUploading && (
                  <button
                    onClick={handleUpload}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Submit for Verification
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <button
              onClick={currentStep > 1 ? goBack : onClose}
              className="flex items-center gap-2 px-4 py-2 text-white/60 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {currentStep > 1 ? "Back" : "Cancel"}
            </button>

            <div className="text-white/40 text-sm">
              Step {currentStep} of {STEPS.length}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
