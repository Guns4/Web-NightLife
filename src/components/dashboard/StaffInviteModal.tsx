"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, UserPlus, X, Copy, Check, User, Shield } from "lucide-react";

interface StaffInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueId: string;
}

const roleOptions = [
  { value: "manager", label: "Manager", description: "Full access to all features", icon: Shield },
  { value: "marketing", label: "Marketing", description: "Manage promos and analytics", icon: Shield },
  { value: "ops", label: "Operations", description: "Manage reservations and queues", icon: Shield },
  { value: "staff", label: "Staff", description: "Basic access", icon: User },
];

/**
 * Staff Invitation Modal
 */
export default function StaffInviteModal({ isOpen, onClose, venueId }: StaffInviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("manager");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const inviteLink = `https://nightlife.id/invite/${venueId}/${role}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setInviteSent(true);
  };

  const handleClose = () => {
    setEmail("");
    setRole("manager");
    setInviteSent(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md bg-[#0A0A0F] border border-white/10 rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C026D3] to-[#9333EA] flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Invite Team Member</h2>
                  <p className="text-xs text-white/50">Send invitation to join your venue</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {inviteSent ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Invitation Sent!</h3>
                    <p className="text-sm text-white/60">We've sent an invitation to {email}</p>
                  </div>
                  <button onClick={handleClose} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium">
                    Done
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#C026D3]/50"
                      />
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Assign Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      {roleOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setRole(option.value)}
                          className={`p-3 rounded-xl text-left transition-all ${
                            role === option.value
                              ? "bg-[#C026D3]/20 border-[#C026D3]/50"
                              : "bg-white/5 border border-white/10 hover:border-white/20"
                          }`}
                        >
                          <p className={`text-sm font-medium ${role === option.value ? "text-white" : "text-white/70"}`}>
                            {option.label}
                          </p>
                          <p className="text-xs text-white/40 mt-0.5">{option.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Share Link */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Or Share Invite Link</label>
                    <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="flex-1 bg-transparent text-sm text-white/60 outline-none"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button onClick={handleClose} className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handleSendInvite}
                      disabled={!email || isLoading}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-[#C026D3] to-[#9333EA] hover:opacity-90 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Send Invite
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
