"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle, 
  Shield,
  Bell,
  Lock
} from "lucide-react";

/**
 * Settings Page
 */
export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "Admin User",
    email: "admin@nightlife.com",
    phone: "+62 896-6909-74929",
    whatsapp: "+62 896-6909-74929",
    address: "Jl. Sudirman No. 123, Kota Bandung",
    businessName: "Liguns Entertainment",
  });

  const [verified, setVerified] = useState(false);

  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-syne font-bold text-2xl md:text-3xl text-white">
          Settings
        </h1>
        <p className="text-white/60">Manage your business profile and preferences</p>
      </div>

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-[#C026D3]" />
            <h2 className="font-semibold text-white">Business Profile</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Verification Status */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${verified ? "bg-green-500/20" : "bg-yellow-500/20"}`}>
                <Shield className={`w-5 h-5 ${verified ? "text-green-400" : "text-yellow-400"}`} />
              </div>
              <div>
                <p className="font-medium text-white">Verified Business</p>
                <p className="text-sm text-white/60">
                  {verified ? "Your business is verified" : "Complete verification to get the blue checkmark"}
                </p>
              </div>
            </div>
            <button
              className={`px-4 py-2 rounded-lg font-medium text-sm ${
                verified 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {verified ? "Verified" : "Verify Now"}
            </button>
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={profile.businessName}
              onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#C026D3]"
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#C026D3]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#C026D3]"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              WhatsApp Number (for bookings)
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
              <input
                type="tel"
                value={profile.whatsapp}
                onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#C026D3]"
                placeholder="+62 812-3456-7890"
              />
            </div>
            <p className="text-xs text-white/50 mt-1">
              This number will be shown to customers for direct booking inquiries
            </p>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Business Address
            </label>
            <textarea
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#C026D3] h-24 resize-none"
            />
          </div>
        </div>
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-[#C026D3]" />
            <h2 className="font-semibold text-white">Notifications</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {[
            { label: "New booking notifications", description: "Get notified when someone books via WhatsApp", enabled: true },
            { label: "Review notifications", description: "Get notified of new reviews", enabled: true },
            { label: "Promo performance", description: "Weekly summary of promo performance", enabled: false },
            { label: "Analytics updates", description: "Daily visitor analytics", enabled: true },
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <p className="font-medium text-white">{item.label}</p>
                <p className="text-sm text-white/60">{item.description}</p>
              </div>
              <button
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  item.enabled ? "bg-[#C026D3]" : "bg-white/20"
                }`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  item.enabled ? "left-7" : "left-1"
                }`} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Security */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-[#C026D3]" />
            <h2 className="font-semibold text-white">Security</h2>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-white/60" />
              <div className="text-left">
                <p className="font-medium text-white">Change Password</p>
                <p className="text-sm text-white/60">Update your account password</p>
              </div>
            </div>
          </button>
          
          <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-white/60" />
              <div className="text-left">
                <p className="font-medium text-white">Two-Factor Authentication</p>
                <p className="text-sm text-white/60">Add an extra layer of security</p>
              </div>
            </div>
            <span className="text-sm text-yellow-400">Setup</span>
          </button>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#C026D3] to-[#9333EA] text-white font-semibold"
      >
        Save Changes
      </motion.button>
    </div>
  );
}
