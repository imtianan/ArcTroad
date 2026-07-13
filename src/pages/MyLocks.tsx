import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { motion, AnimatePresence } from 'motion/react';
import { Key, ShieldCheck, Lock as LockIcon, Unlock, CheckSquare, Calendar, RefreshCw, ExternalLink, Timer, AlertCircle, Coins, Loader2 } from 'lucide-react';
import { CONTRACT_ADDRESS, ARC_TROAD_ABI, TOKEN_LIST, Lock } from '../types';
import ConnectWalletPrompt from '../components/ConnectWalletPrompt';

export default function MyLocks() {
  const { address: connectedAddress, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [claimingLockId, setClaimingLockId] = useState<bigint | null>(null);
  const [claimTxHash, setClaimTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [claimingSuccessId, setClaimingSuccessId] = useState<bigint | null>(null);

  // Dynamic seconds counter for real-time countdown
  const [nowSeconds, setNowSeconds] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setNowSeconds(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { writeContract } = useWriteContract();

  // Read Parent Locks
  const {
    data: parentLockIds,
    isLoading: isParentLoading,
    refetch: refetchParentLocks
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ARC_TROAD_ABI,
    functionName: 'getParentLocks',
    args: connectedAddress ? [connectedAddress] : undefined,
    query: {
      enabled: !!connectedAddress && activeTab === 'sent',
    }
  });

  // Read Child Locks
  const {
    data: childLockIds,
    isLoading: isChildLoading,
    refetch: refetchChildLocks
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ARC_TROAD_ABI,
    functionName: 'getChildLocks',
    args: connectedAddress ? [connectedAddress] : undefined,
    query: {
      enabled: !!connectedAddress && activeTab === 'received',
    }
  });

  // Decide current list of IDs
  const currentLockIds = activeTab === 'sent' ? parentLockIds : childLockIds;
  const isIdsLoading = activeTab === 'sent' ? isParentLoading : isChildLoading;

  // Read full details of each lock in batch using Multicall
  const {
    data: locksData,
    isLoading: isLocksDetailLoading,
    refetch: refetchLocks
  } = (useReadContracts as any)({
    contracts: (currentLockIds || []).map((id) => ({
      address: CONTRACT_ADDRESS,
      abi: ARC_TROAD_ABI,
      functionName: 'getLock',
      args: [id],
    })),
    query: {
      enabled: !!currentLockIds && currentLockIds.length > 0,
    }
  });

  // Wait for claim confirmation
  const { isSuccess: isClaimConfirmed, isError: isClaimFailed } = useWaitForTransactionReceipt({
    hash: claimTxHash,
  });

  useEffect(() => {
    if (isClaimConfirmed && claimingLockId !== null) {
      setClaimingSuccessId(claimingLockId);
      setClaimingLockId(null);
      setClaimTxHash(undefined);
      
      // Clear success notification after 5 seconds
      setTimeout(() => {
        setClaimingSuccessId(null);
      }, 5000);

      // Reload data
      refetchParentLocks();
      refetchChildLocks();
      refetchLocks();
    }
    if (isClaimFailed) {
      setClaimingLockId(null);
      setClaimTxHash(undefined);
    }
  }, [isClaimConfirmed, isClaimFailed]);

  // Refresh lists helper
  const handleRefresh = () => {
    refetchParentLocks();
    refetchChildLocks();
    refetchLocks();
  };

  // Safe Lock parsing
  const parseLockResult = (result: any): Lock | null => {
    if (!result) return null;
    
    // Check if result is an object with required properties
    if (typeof result === 'object' && 'id' in result) {
      return {
        id: BigInt(result.id),
        parent: String(result.parent),
        child: String(result.child),
        amount: BigInt(result.amount),
        token: String(result.token),
        unlockTime: BigInt(result.unlockTime),
        claimed: Boolean(result.claimed),
        createdAt: BigInt(result.createdAt),
      };
    }

    // Check if result is an array
    if (Array.isArray(result) && result.length >= 8) {
      return {
        id: BigInt(result[0]),
        parent: String(result[1]),
        child: String(result[2]),
        amount: BigInt(result[3]),
        token: String(result[4]),
        unlockTime: BigInt(result[5]),
        claimed: Boolean(result[6]),
        createdAt: BigInt(result[7]),
      };
    }

    return null;
  };

  // Claim handler
  const handleClaimLock = (lockId: bigint) => {
    setClaimingLockId(lockId);
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: ARC_TROAD_ABI,
        functionName: 'claimLock',
        args: [lockId],
      }, {
        onSuccess: (hash) => {
          setClaimTxHash(hash);
        },
        onError: (err: any) => {
          alert(err.shortMessage || err.message || 'Claim transaction rejected.');
          setClaimingLockId(null);
        }
      });
    } catch (e) {
      setClaimingLockId(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="py-12">
        <ConnectWalletPrompt
          title="Connect Wallet to View Locks"
          description="Authenticate your wallet to inspect your locked smart contracts, countdowns, and claimable balances."
        />
      </div>
    );
  }

  // Filter valid locks from data results
  const loadedLocks: Lock[] = [];
  if (locksData) {
    locksData.forEach((item) => {
      if (item.status === 'success' && item.result) {
        const parsed = parseLockResult(item.result);
        if (parsed) loadedLocks.push(parsed);
      }
    });
  }

  // Sort locks by createdAt descending
  loadedLocks.sort((a, b) => Number(b.createdAt - a.createdAt));

  // Loading combined state
  const isPageLoading = isIdsLoading || (currentLockIds && currentLockIds.length > 0 && isLocksDetailLoading);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 relative">
      {/* Decorative Blur Bubble */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[100px] -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Key className="text-secondary w-8 h-8" />
            Milestone Smart Locks
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Monitor pending time-locks, countdown milestones, and claim released pocket money.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-secondary/30 transition-all text-xs font-bold text-gray-300 hover:text-white cursor-pointer active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Locks
        </button>
      </div>

      {/* Custom Tabs */}
      <div className="flex border-b border-card-border/40 gap-6 mb-8">
        <button
          onClick={() => setActiveTab('sent')}
          className={`pb-4 px-2 font-extrabold text-sm relative transition-colors duration-300 cursor-pointer ${
            activeTab === 'sent' ? 'text-secondary' : 'text-gray-400 hover:text-white'
          }`}
        >
          Sent (as Parent)
          {activeTab === 'sent' && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={`pb-4 px-2 font-extrabold text-sm relative transition-colors duration-300 cursor-pointer ${
            activeTab === 'received' ? 'text-secondary' : 'text-gray-400 hover:text-white'
          }`}
        >
          Received (as Child)
          {activeTab === 'received' && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary" />
          )}
        </button>
      </div>

      {/* Success Banner */}
      {claimingSuccessId !== null && (
        <div className="mb-6 p-4 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-bold flex items-center gap-2 animate-bounce">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          Successfully claimed Lock #{claimingSuccessId.toString()}! The tokens are now in your wallet.
        </div>
      )}

      {/* Main Locks Render */}
      {isPageLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card-bg border border-card-border/50 rounded-2xl p-6 space-y-4 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-6 w-20 bg-white/10 rounded-lg" />
                <div className="h-6 w-16 bg-white/10 rounded-lg" />
              </div>
              <div className="h-10 w-32 bg-white/10 rounded-lg" />
              <div className="h-6 w-full bg-white/10 rounded-lg" />
              <div className="h-12 w-full bg-white/10 rounded-lg pt-4" />
            </div>
          ))}
        </div>
      ) : loadedLocks.length === 0 ? (
        <div className="text-center py-16 bg-card-bg border border-card-border/40 rounded-3xl p-8 max-w-md mx-auto">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary w-fit mx-auto mb-4">
            <LockIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Locks Found</h3>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            {activeTab === 'sent'
              ? "You haven't locked any pocket money for your kids yet."
              : "No time-locked pocket money contracts are registered to your address."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {loadedLocks.map((lock) => {
              const tokenDetails = TOKEN_LIST.find((tk) => tk.address.toLowerCase() === lock.token.toLowerCase()) || {
                symbol: 'Unknown',
                decimals: 6,
                color: '#FFFFFF'
              };

              const amountFormatted = Number(formatUnits(lock.amount, tokenDetails.decimals)).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6
              });

              const unlockDate = new Date(Number(lock.unlockTime) * 1000);
              const formattedDate = unlockDate.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) + ' ' + unlockDate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
              });

              const diffSeconds = Number(lock.unlockTime) - nowSeconds;
              const isTimeMilestonePassed = diffSeconds <= 0;

              // Compute remaining time strings
              let countdownStr = '';
              if (!isTimeMilestonePassed) {
                const days = Math.floor(diffSeconds / (3600 * 24));
                const hours = Math.floor((diffSeconds % (3600 * 24)) / 3600);
                const minutes = Math.floor((diffSeconds % 3600) / 60);
                const seconds = diffSeconds % 60;

                if (days > 0) {
                  countdownStr = `${days}d ${hours}h ${minutes}m`;
                } else if (hours > 0) {
                  countdownStr = `${hours}h ${minutes}m ${seconds}s`;
                } else {
                  countdownStr = `${minutes}m ${seconds}s`;
                }
              }

              // Status badges
              let badgeBg = 'bg-primary/10 text-primary border-primary/30';
              let badgeText = 'Locked';
              let Icon = LockIcon;

              if (lock.claimed) {
                badgeBg = 'bg-green-500/10 text-green-400 border-green-500/30';
                badgeText = 'Claimed';
                Icon = CheckSquare;
              } else if (isTimeMilestonePassed) {
                badgeBg = 'bg-secondary/10 text-secondary border-secondary/30';
                badgeText = 'Claimable';
                Icon = Unlock;
              }

              return (
                <motion.div
                  key={lock.id.toString()}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="bg-card-bg border border-card-border rounded-3xl p-6 flex flex-col justify-between hover:border-secondary/50 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Card glow indicator */}
                  {!lock.claimed && isTimeMilestonePassed && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl -z-10 pointer-events-none" />
                  )}

                  <div>
                    {/* Header line of card */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-gray-400 font-black tracking-wide uppercase">
                        Lock #{lock.id.toString()}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 border ${badgeBg}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {badgeText}
                      </span>
                    </div>

                    {/* Amount Block */}
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-3xl font-black text-white tracking-tight">
                        {amountFormatted}
                      </span>
                      <span className="text-lg font-extrabold" style={{ color: tokenDetails.color }}>
                        {tokenDetails.symbol}
                      </span>
                    </div>

                    {/* Meta addresses info */}
                    <div className="space-y-1.5 border-t border-white/5 pt-4 pb-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-semibold">From Parent:</span>
                        <span className="text-white font-mono">{lock.parent.substring(0, 6)}...{lock.parent.substring(38)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-semibold">To Child:</span>
                        <span className="text-white font-mono">{lock.child.substring(0, 6)}...{lock.child.substring(38)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer actions / stats */}
                  <div className="border-t border-white/5 pt-4 mt-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-300">
                      <span className="flex items-center gap-1 font-semibold text-gray-400">
                        <Calendar className="w-3.5 h-3.5 text-secondary" />
                        Milestone Date:
                      </span>
                      <span className="font-bold text-white text-right">{formattedDate}</span>
                    </div>

                    {/* Active countdown or claim button */}
                    {!lock.claimed && (
                      <div className="pt-2">
                        {!isTimeMilestonePassed ? (
                          <div className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-white/5 border border-white/5 text-gray-300 text-xs font-extrabold uppercase tracking-wide">
                            <Timer className="w-4 h-4 text-primary animate-pulse" />
                            Unlocks in: <span className="text-secondary font-black tracking-tight font-mono">{countdownStr}</span>
                          </div>
                        ) : activeTab === 'received' ? (
                          <button
                            onClick={() => handleClaimLock(lock.id)}
                            disabled={claimingLockId !== null}
                            className={`w-full py-3 rounded-xl bg-secondary text-dark-bg hover:bg-secondary/90 font-black text-sm transition-all duration-300 hover:scale-[1.01] active:scale-95 shadow-lg shadow-secondary/15 flex items-center justify-center gap-2 cursor-pointer`}
                          >
                            {claimingLockId === lock.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Claiming...
                              </>
                            ) : (
                              <>
                                <Unlock className="w-4 h-4" />
                                Claim Pocket Money
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-secondary/15 border border-secondary/30 text-secondary text-xs font-extrabold uppercase tracking-wide">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            Claimable by child
                          </div>
                        )}
                      </div>
                    )}

                    {lock.claimed && (
                      <div className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-500/5 border border-green-500/10 text-green-400/80 text-xs font-bold uppercase tracking-wider">
                        <CheckSquare className="w-3.5 h-3.5 text-green-500" />
                        Funds Disbursed
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
