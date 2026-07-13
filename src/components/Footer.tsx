import React from 'react';
import { ExternalLink, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-card-border/30 bg-[rgba(26,15,0,0.4)] py-6 px-4 mt-auto mb-20 md:mb-0">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <p className="text-sm text-gray-400 font-medium">
            ArcTroad — Digital Pocket Money on Arc Testnet
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Safely distribute funds to children with instant sending or time-locked smart contracts.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-1.5">
          <span className="text-xs text-gray-400 flex items-center justify-center sm:justify-end gap-1 font-semibold">
            Built with <Heart className="w-3.5 h-3.5 fill-primary text-primary animate-pulse" /> by{' '}
            <a
              href="https://x.com/Imtianan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-primary underline decoration-dotted transition-colors duration-200 flex items-center gap-0.5"
            >
              Imtianan <ExternalLink className="w-3 h-3" />
            </a>
          </span>
          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
            Powered by{' '}
            <a
              href="https://testnet.arcscan.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors duration-200 underline"
            >
              Arc Testnet
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
