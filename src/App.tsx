import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './wagmi';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import SendPage from './pages/Send';
import MyLocks from './pages/MyLocks';

const queryClient = new QueryClient();

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#FF6B6B',
            accentColorForeground: '#FFFFFF',
            borderRadius: 'large',
          })}
          modalSize="compact"
        >
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-dark-bg text-white font-sans selection:bg-primary/30 selection:text-white relative overflow-hidden">
              {/* Background Decorative Elements for Natural Tones */}
              <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-primary opacity-10 rounded-full blur-[80px] pointer-events-none -z-10" />
              <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-secondary opacity-10 rounded-full blur-[100px] pointer-events-none -z-10" />

              <Navbar />
              <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/send" element={<SendPage />} />
                  <Route path="/my-locks" element={<MyLocks />} />
                  <Route path="*" element={<Home />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
