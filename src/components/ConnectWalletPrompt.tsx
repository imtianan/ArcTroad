import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet, ShieldAlert, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface ConnectWalletPromptProps {
  title?: string;
  description?: string;
}

export default function ConnectWalletPrompt({
  title = "Wallet Connection Required",
  description = "Connect your Web3 wallet on Arc Testnet to start managing or claiming pocket money securely on-chain."
}: ConnectWalletPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto text-center p-8 rounded-3xl bg-card-bg backdrop-blur-md border border-card-border shadow-2xl relative overflow-hidden my-12"
    >
      {/* Decorative blurred blob */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="p-4 bg-primary/10 rounded-2xl text-primary mb-6 shadow-inner">
          <Wallet className="w-10 h-10 animate-bounce" />
        </div>

        <h3 className="text-2xl font-black text-white tracking-tight mb-3">
          {title}
        </h3>

        <p className="text-sm text-gray-300 leading-relaxed mb-8 max-w-sm">
          {description}
        </p>

        <div className="flex flex-col items-center justify-center scale-110">
          <ConnectButton
            chainStatus="none"
            showBalance={false}
          />
        </div>

        <div className="mt-8 flex items-center gap-1.5 text-[11px] text-gray-400 font-semibold bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
          <ShieldAlert className="w-3.5 h-3.5 text-secondary" />
          No mock data — all transactions are live on Arc Testnet
        </div>
      </div>
    </motion.div>
  );
}
