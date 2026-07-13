import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet, Send, Key, Coins } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const isLinkActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-card-border bg-[rgba(26,15,0,0.85)] backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo / Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-secondary text-dark-bg transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-primary/20">
            <Coins className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
              Arc<span className="text-secondary bg-primary/20 px-1.5 py-0.5 rounded text-sm font-semibold tracking-normal">Troad</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-medium hidden sm:block tracking-wide">
              Pocket Money On-Chain
            </p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-1 bg-primary/5 p-1 rounded-full border border-card-border/50">
          <Link
            to="/"
            className={`px-4 py-2 rounded-full text-sm font-semibold tracking-medium transition-all duration-300 flex items-center gap-1.5 ${
              isLinkActive('/')
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Coins className="w-4 h-4" />
            Home
          </Link>
          <Link
            to="/send"
            className={`px-4 py-2 rounded-full text-sm font-semibold tracking-medium transition-all duration-300 flex items-center gap-1.5 ${
              isLinkActive('/send')
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Send className="w-4 h-4" />
            Send & Lock
          </Link>
          <Link
            to="/my-locks"
            className={`px-4 py-2 rounded-full text-sm font-semibold tracking-medium transition-all duration-300 flex items-center gap-1.5 ${
              isLinkActive('/my-locks')
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Key className="w-4 h-4" />
            My Locks
          </Link>
        </nav>

        {/* Wallet Connect Button */}
        <div className="flex items-center gap-3">
          <ConnectButton
            chainStatus="none"
            showBalance={false}
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
          />
        </div>
      </div>

      {/* Mobile Nav Bar - Fixed Bottom for better UX */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm bg-gradient-to-r from-dark-bg/95 to-primary/10 backdrop-blur-lg border border-card-border/80 rounded-2xl py-3 px-6 flex items-center justify-around shadow-2xl shadow-primary/10">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 ${
            isLinkActive('/') ? 'text-secondary' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Coins className="w-5 h-5" />
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link
          to="/send"
          className={`flex flex-col items-center gap-1 ${
            isLinkActive('/send') ? 'text-secondary' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Send className="w-5 h-5" />
          <span className="text-[10px] font-bold">Send</span>
        </Link>
        <Link
          to="/my-locks"
          className={`flex flex-col items-center gap-1 ${
            isLinkActive('/my-locks') ? 'text-secondary' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Key className="w-5 h-5" />
          <span className="text-[10px] font-bold">My Locks</span>
        </Link>
      </div>
    </header>
  );
}
