'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface LevelUpCelebrationProps {
  show: boolean;
  newLevel: number;
  onClose: () => void;
}

export function LevelUpCelebration({ show, newLevel, onClose }: LevelUpCelebrationProps) {
  const [particles, setParticles] = useState<Array<{ x: number; y: number; color: string }>>([]);

  useEffect(() => {
    if (show) {
      // Trigger confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FFF', '#000'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FFF', '#000'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Central Celebration Card */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 200, 
              damping: 15,
              delay: 0.2 
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-gradient-to-br from-yellow-900/90 to-black/90 rounded-3xl p-12 border-2 border-yellow-500/50 shadow-[0_0_60px_rgba(245,158,11,0.5)] max-w-md mx-4 text-center"
          >
            {/* Glow Ring */}
            <div className="absolute inset-0 rounded-3xl animate-pulse bg-gradient-to-r from-yellow-500/20 via-yellow-400/20 to-yellow-500/20 blur-xl" />

            {/* Content */}
            <div className="relative z-10">
              {/* Trophy Icon */}
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="text-6xl mb-4"
              >
                🏆
              </motion.div>

              {/* Title */}
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 mb-2"
              >
                LEVEL UP!
              </motion.h2>

              {/* Level Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 mb-4 shadow-[0_0_30px_rgba(245,158,11,0.6)]"
              >
                <span className="text-4xl font-black text-black">{newLevel}</span>
              </motion.div>

              {/* Message */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-white/80 text-lg mb-4"
              >
                Congratulations! You reached <span className="text-yellow-400 font-bold">Level {newLevel}</span>
              </motion.p>

              {/* Stats */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="flex justify-center gap-6 text-sm"
              >
                <div className="text-center">
                  <span className="block text-2xl">⭐</span>
                  <span className="text-white/60">New rewards unlocked!</span>
                </div>
              </motion.div>

              {/* Close Button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.1 }}
                onClick={onClose}
                className="mt-6 px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-colors"
              >
                Continue
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * XP Gained Toast
 */
export function XpGainToast({ amount, show }: { amount: number; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          className="fixed top-24 right-4 z-40 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.5)]"
        >
          +{amount} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LevelUpCelebration;
