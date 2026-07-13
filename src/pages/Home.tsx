import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import { motion } from 'motion/react';
import { Coins, Shield, Clock, Send, Sparkles, HelpCircle } from 'lucide-react';
import { CONTRACT_ADDRESS, ARC_TROAD_ABI } from '../types';

export default function Home() {
  const navigate = useNavigate();

  const { data: lockCounter, isLoading: isCounterLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ARC_TROAD_ABI,
    functionName: 'lockCounter',
  });

  // Calculate standard stats - lockCounter returns bigint, let's convert to string
  const totalLocksCount = lockCounter !== undefined ? lockCounter.toString() : '...';

  return (
    <div className="relative min-h-[80vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Soft floating circles background decorations */}
      <div className="absolute top-1/4 left-1/10 w-72 h-72 rounded-full bg-primary/10 blur-[100px] -z-10 animate-pulse duration-10000" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 rounded-full bg-secondary/5 blur-[120px] -z-10 animate-pulse duration-8000" />

      <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Arc Testnet Live
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none mb-6"
        >
          Pocket Money <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">On-Chain</span>
        </motion.h2>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-xl text-gray-300 max-w-2xl font-medium mb-10 leading-relaxed"
        >
          The friendly dApp for smart parents on **Arc Testnet**. Distribute digital pocket money safely. Send tokens instantly or lock them in smart contracts to unlock on your child's birthday or future milestone.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16"
        >
          <button
            onClick={() => navigate('/send?tab=direct')}
            className="group relative flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-extrabold rounded-2xl hover:scale-[1.03] transition-all duration-300 cursor-pointer shadow-lg shadow-primary/20 active:scale-95 text-lg"
          >
            <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            Send Instantly
          </button>
          <button
            onClick={() => navigate('/send?tab=lock')}
            className="group relative flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-secondary/60 hover:border-secondary hover:bg-secondary/5 text-secondary font-extrabold rounded-2xl hover:scale-[1.03] transition-all duration-300 cursor-pointer active:scale-95 text-lg"
          >
            <Clock className="w-5 h-5" />
            Lock for Later
          </button>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-lg bg-card-bg backdrop-blur-md border border-card-border rounded-3xl p-6 sm:p-8 shadow-xl"
        >
          <h3 className="text-gray-400 text-xs font-extrabold uppercase tracking-widest mb-2">
            Platform Statistics
          </h3>
          <div className="flex flex-col items-center justify-center py-2">
            <span className="text-4xl sm:text-5xl font-black text-white flex items-center gap-2 tracking-tight">
              {isCounterLoading ? (
                <div className="h-10 w-24 bg-white/10 animate-pulse rounded-lg" />
              ) : (
                totalLocksCount
              )}
            </span>
            <span className="text-sm text-secondary font-bold mt-2 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-primary" />
              Total Time-Locks Created
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-4 max-w-xs mx-auto">
            All locks are secured by non-custodial smart contracts on the Arc blockchain.
          </p>
        </motion.div>

        {/* Features Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-16 text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/40 transition-all duration-300"
          >
            <div className="p-3 bg-primary/10 rounded-xl text-primary w-fit mb-4">
              <Send className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Direct Sending</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Instantly transfer USDC or EURC to your kid's wallet address. Fast, safe, and cost-efficient.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-secondary/40 transition-all duration-300"
          >
            <div className="p-3 bg-secondary/10 rounded-xl text-secondary w-fit mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Milestone Time-Locks</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Lock tokens inside a smart contract. Set an exact date and time in the future for children to claim.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/40 transition-all duration-300"
          >
            <div className="p-3 bg-primary/10 rounded-xl text-primary w-fit mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Non-Custodial Claim</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              No central authority or parent can withdraw once locked. Kids connect their wallet and claim directly.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
