/**
 * =====================================================
 * PRIORITY MODERATION QUEUE
 * Priority-based content moderation
 * =====================================================
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Star, 
  Flag, 
  FileText, 
  Check, 
  X, 
  Clock,
  Award,
  AlertTriangle,
  ChevronRight,
  Eye
} from "lucide-react";

interface ModerationItem {
  id: string;
  type: "elite_review" | "flagged" | "standard";
  priority: 1 | 2 | 3;
  content: {
    id: string;
    type: string;
    userName: string;
    venueName: string;
    rating?: number;
    comment?: string;
    reports?: number;
    reportReasons?: string[];
  };
  submittedAt: string;
}

// Priority levels
const PRIORITY_CONFIG = {
  1: { 
    label: "Elite Verified", 
    color: "amber", 
    icon: Award,
    description: "Struk + GPS verification pending" 
  },
  2: { 
    label: "Flagged", 
    color: "red", 
    icon: Flag,
    description: "Reported by users" 
  },
  3: { 
    label: "Standard", 
    color: "gray", 
    icon: FileText,
    description: "Regular review" 
  },
};

const mockQueue: ModerationItem[] = [
  {
    id: "1",
    type: "elite_review",
    priority: 1,
    content: {
      id: "review-1",
      type: "review",
      userName: "John Doe",
      venueName: "Club Jakarta",
      rating: 5,
      comment: "Amazing night! The music was incredible and the service was top-notch.",
    },
    submittedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "2",
    type: "flagged",
    priority: 2,
    content: {
      id: "review-2",
      type: "review",
      userName: "Anonymous",
      venueName: "Beach Club Bali",
      rating: 1,
      comment: "Terrible experience!",
      reports: 8,
      reportReasons: ["FAKE", "SPAM"],
    },
    submittedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "3",
    type: "standard",
    priority: 3,
    content: {
      id: "review-3",
      type: "review",
      userName: "Jane Smith",
      venueName: "Rooftop Lounge",
      rating: 4,
      comment: "Great atmosphere, prices are a bit high but worth it.",
    },
    submittedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "4",
    type: "elite_review",
    priority: 1,
    content: {
      id: "review-4",
      type: "review",
      userName: "Mike Wilson",
      venueName: "Speakeasy NYC",
      rating: 5,
      comment: "Best hidden gem in the city!",
    },
    submittedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
];

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function ModerationQueue() {
  const [queue, setQueue] = useState<ModerationItem[]>(mockQueue);
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);

  // Group by priority
  const priorityGroups = {
    1: queue.filter((i) => i.priority === 1),
    2: queue.filter((i) => i.priority === 2),
    3: queue.filter((i) => i.priority === 3),
  };

  const handleApprove = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    setSelectedItem(null);
  };

  const handleReject = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    setSelectedItem(null);
  };

  const totalPending = queue.length;

  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Moderation Queue
            </h3>
            <p className="text-white/50 text-sm">
              {totalPending} items pending review
            </p>
          </div>

          {/* Priority Stats */}
          <div className="flex items-center gap-3">
            {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => {
              const priorityKey = priority as unknown as keyof typeof priorityGroups;
              const count = priorityGroups[priorityKey]?.length || 0;
              const Icon = config.icon;
              
              return (
                <div
                  key={priority}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg"
                >
                  <Icon className={`w-4 h-4 text-${config.color}-400`} />
                  <span className="text-white font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Queue Items */}
      <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
        {queue.length === 0 ? (
          <div className="p-8 text-center text-white/40">
            <Check className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <p>All caught up! No items to review.</p>
          </div>
        ) : (
          queue.map((item, index) => {
            const config = PRIORITY_CONFIG[item.priority];
            const Icon = config.icon;
            const isSelected = selectedItem?.id === item.id;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                  isSelected ? "bg-white/10" : ""
                }`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex items-center gap-4">
                  {/* Priority Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-${config.color}-500/20 border border-${config.color}-500/30`}>
                    <Icon className={`w-5 h-5 text-${config.color}-400`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {item.content.venueName}
                      </span>
                      {item.content.rating && (
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= item.content.rating!
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-white/20"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-white/50 text-sm truncate">
                      {item.content.comment}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/40 text-xs">
                        by {item.content.userName}
                      </span>
                      <span className="text-white/30 text-xs">•</span>
                      <span className="text-white/40 text-xs">
                        {formatTime(item.submittedAt)}
                      </span>
                      {item.content.reports && (
                        <>
                          <span className="text-white/30 text-xs">•</span>
                          <span className="text-red-400 text-xs flex items-center gap-1">
                            <Flag className="w-3 h-3" />
                            {item.content.reports} reports
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-white/30" />
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Detail Panel */}
      {selectedItem && (
        <div className="p-4 border-t border-white/10 bg-white/5">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-white font-medium">
                {selectedItem.content.venueName}
              </h4>
              <p className="text-white/50 text-sm">
                {selectedItem.content.userName} • {formatTime(selectedItem.submittedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReject(selectedItem.id)}
                className="px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={() => handleApprove(selectedItem.id)}
                className="px-4 py-2 bg-green-500/20 border border-green-500/40 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Approve
              </button>
            </div>
          </div>
          
          {selectedItem.content.reportReasons && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-xs font-medium mb-1">Report Reasons:</p>
              <div className="flex flex-wrap gap-1">
                {selectedItem.content.reportReasons.map((reason) => (
                  <span
                    key={reason}
                    className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
