import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, isAddress } from 'viem';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Clock, ShieldCheck, AlertCircle, Sparkles, CheckCircle2, ArrowRight, Loader2, Coins, ArrowLeft, ExternalLink } from 'lucide-react';
import { CONTRACT_ADDRESS, ARC_TROAD_ABI, ERC20_ABI, TOKEN_LIST } from '../types';
import ConnectWalletPrompt from '../components/ConnectWalletPrompt';

type TxStep = 'idle' | 'approving' | 'approved' | 'executing' | 'success' | 'failed';

export default function SendPage() {
  const { address: connectedAddress, isConnected } = useAccount();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') === 'lock' ? 'lock' : 'direct';

  const [childAddress, setChildAddress] = useState('');
  const [selectedToken, setSelectedToken] = useState(TOKEN_LIST[0]);
  const [amount, setAmount] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [unlockTime, setUnlockTime] = useState('12:00');

  // Transaction state tracking
  const [txStep, setTxStep] = useState<TxStep>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [approveHash, setApproveHash] = useState<`0x${string}` | undefined>(undefined);
  const [executeHash, setExecuteHash] = useState<`0x${string}` | undefined>(undefined);

  const { writeContract } = useWriteContract();

  // Read current balance of selected token
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: selectedToken.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: connectedAddress ? [connectedAddress] : undefined,
    query: {
      enabled: !!connectedAddress && !!selectedToken.address,
    }
  });

  // Read allowance of selected token for the contract
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: selectedToken.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: connectedAddress ? [connectedAddress, CONTRACT_ADDRESS] : undefined,
    query: {
      enabled: !!connectedAddress && !!selectedToken.address,
    }
  });

  // Wait for approval transaction
  const { isSuccess: isApproveConfirmed, isError: isApproveFailed } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Wait for execution transaction
  const { isSuccess: isExecuteConfirmed, isError: isExecuteFailed } = useWaitForTransactionReceipt({
    hash: executeHash,
  });

  // Synchronize URL search params with local state
  const setTab = (tab: 'direct' | 'lock') => {
    setSearchParams({ tab });
    resetForm();
  };

  const resetForm = () => {
    setChildAddress('');
    setAmount('');
    setUnlockDate('');
    setUnlockTime('12:00');
    setTxStep('idle');
    setErrorMessage('');
    setApproveHash(undefined);
    setExecuteHash(undefined);
  };

  // Convert entered amount to BigInt
  let parsedAmount = 0n;
  try {
    if (amount && !isNaN(Number(amount))) {
      parsedAmount = parseUnits(amount, selectedToken.decimals);
    }
  } catch (e) {
    // Silently ignore parsing errors for incomplete input
  }

  // Handle Token Approval Confirmation
  useEffect(() => {
    if (isApproveConfirmed && txStep === 'approving') {
      setTxStep('approved');
      // Proceed to execution
      executePocketMoney();
    }
  }, [isApproveConfirmed]);

  // Handle Transaction Execution Confirmation
  useEffect(() => {
    if (isExecuteConfirmed && txStep === 'executing') {
      setTxStep('success');
      refetchBalance();
      refetchAllowance();
    }
  }, [isExecuteConfirmed]);

  // Handle transaction confirmation failures
  useEffect(() => {
    if (isApproveFailed && txStep === 'approving') {
      setTxStep('failed');
      setErrorMessage('Approval transaction was rejected or failed on-chain.');
    }
    if (isExecuteFailed && txStep === 'executing') {
      setTxStep('failed');
      setErrorMessage('Execution transaction failed on-chain.');
    }
  }, [isApproveFailed, isExecuteFailed]);

  // Validations
  const isAddressValid = isAddress(childAddress);
  const isAmountValid = parsedAmount > 0n && (balance !== undefined ? balance >= parsedAmount : true);

  // Parse unlock timestamp for time lock
  let unlockTimestamp = 0n;
  let isDateValid = true;
  if (activeTabParam === 'lock') {
    if (unlockDate) {
      const fullDateTime = new Date(`${unlockDate}T${unlockTime}`);
      const now = new Date();
      if (fullDateTime <= now) {
        isDateValid = false;
      }
      unlockTimestamp = BigInt(Math.floor(fullDateTime.getTime() / 1000));
    } else {
      isDateValid = false;
    }
  }

  const isFormValid = isAddressValid && isAmountValid && (activeTabParam === 'direct' ? true : isDateValid);

  // Start pocket money workflow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !connectedAddress) return;

    setErrorMessage('');

    // Check if we need to approve first
    const currentAllowance = allowance !== undefined ? allowance : 0n;

    if (currentAllowance >= parsedAmount) {
      // Direct call
      executePocketMoney();
    } else {
      // Approve flow
      setTxStep('approving');
      try {
        writeContract({
          address: selectedToken.address,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CONTRACT_ADDRESS, parsedAmount],
        }, {
          onSuccess: (hash) => {
            setApproveHash(hash);
          },
          onError: (err: any) => {
            setTxStep('failed');
            setErrorMessage(err.shortMessage || err.message || 'Token approval rejected.');
          }
        });
      } catch (err: any) {
        setTxStep('failed');
        setErrorMessage(err.message || 'Error occurred during approval setup.');
      }
    }
  };

  // Perform sendDirect or createLock
  const executePocketMoney = () => {
    setTxStep('executing');
    try {
      if (activeTabParam === 'direct') {
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: ARC_TROAD_ABI,
          functionName: 'sendDirect',
          args: [childAddress as `0x${string}`, selectedToken.address as `0x${string}`, parsedAmount],
        }, {
          onSuccess: (hash) => {
            setExecuteHash(hash);
          },
          onError: (err: any) => {
            setTxStep('failed');
            setErrorMessage(err.shortMessage || err.message || 'Direct send failed.');
          }
        });
      } else {
        writeContract({
          address: CONTRACT_ADDRESS,
          abi: ARC_TROAD_ABI,
          functionName: 'createLock',
          args: [childAddress as `0x${string}`, selectedToken.address as `0x${string}`, parsedAmount, unlockTimestamp],
        }, {
          onSuccess: (hash) => {
            setExecuteHash(hash);
          },
          onError: (err: any) => {
            setTxStep('failed');
            setErrorMessage(err.shortMessage || err.message || 'Creating time lock failed.');
          }
        });
      }
    } catch (err: any) {
      setTxStep('failed');
      setErrorMessage(err.message || 'Error occurred during contract execution.');
    }
  };

  if (!isConnected) {
    return (
      <div className="py-12">
        <ConnectWalletPrompt
          title="Connect Wallet to Send Money"
          description="Authenticate your parent wallet to send real-time pocket money or schedule robust smart-contract locks."
        />
      </div>
    );
  }

  // Token Balance String
  const balanceString = balance !== undefined
    ? Number(formatUnits(balance, selectedToken.decimals)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })
    : '...';

  return (
    <div className="max-w-xl mx-auto py-8 px-4 relative">
      {/* Decorative Blur Bubble */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] -z-10" />

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
          Send Pocket Money
        </h2>
        <p className="text-sm text-gray-400 mt-2">
          Securely distribute on-chain allowance to your children on Arc Testnet.
        </p>
      </div>

      {/* Custom Tabs */}
      <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl mb-8">
        <button
          onClick={() => setTab('direct')}
          disabled={txStep !== 'idle' && txStep !== 'success' && txStep !== 'failed'}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer ${
            activeTabParam === 'direct'
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Send className="w-4 h-4" />
          Direct Send
        </button>
        <button
          onClick={() => setTab('lock')}
          disabled={txStep !== 'idle' && txStep !== 'success' && txStep !== 'failed'}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer ${
            activeTabParam === 'lock'
              ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Lock for Later
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-card-bg border border-card-border rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <AnimatePresence mode="wait">
          {txStep === 'idle' ? (
            <motion.form
              key="send-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Token Selector */}
              <div>
                <label className="block text-xs font-black text-gray-300 uppercase tracking-wider mb-2">
                  Select Currency Token
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {TOKEN_LIST.map((tk) => {
                    const isTkSelected = selectedToken.address === tk.address;
                    return (
                      <button
                        key={tk.symbol}
                        type="button"
                        onClick={() => {
                          setSelectedToken(tk);
                          setAmount('');
                        }}
                        className={`flex items-center justify-center gap-2.5 py-3.5 rounded-xl border-2 transition-all duration-300 font-extrabold text-sm cursor-pointer ${
                          isTkSelected
                            ? 'border-secondary bg-secondary/10 text-white shadow-md'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <Coins className="w-4 h-4" style={{ color: tk.color }} />
                        {tk.symbol}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Child Address */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="childAddress" className="block text-xs font-black text-gray-300 uppercase tracking-wider">
                    Child's Wallet Address
                  </label>
                  {childAddress && (
                    <span className={`text-[10px] font-bold ${isAddressValid ? 'text-green-400' : 'text-primary'}`}>
                      {isAddressValid ? 'Valid Address' : 'Invalid format'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  id="childAddress"
                  required
                  placeholder="0x..."
                  value={childAddress}
                  onChange={(e) => setChildAddress(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-secondary transition-colors text-sm font-medium"
                />
              </div>

              {/* Amount */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="amount" className="block text-xs font-black text-gray-300 uppercase tracking-wider">
                    Amount to Send
                  </label>
                  <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                    Balance: <span className="text-secondary">{balanceString} {selectedToken.symbol}</span>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    id="amount"
                    required
                    step="any"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-16 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-secondary transition-colors text-sm font-bold"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg text-xs font-black text-white">
                    {selectedToken.symbol}
                  </div>
                </div>
                {amount && !isAmountValid && balance !== undefined && (
                  <p className="text-xs text-primary font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Insufficient balance
                  </p>
                )}
              </div>

              {/* Unlock Date (for Lock tab only) */}
              {activeTabParam === 'lock' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="unlockDate" className="block text-xs font-black text-gray-300 uppercase tracking-wider mb-2">
                      Unlock Date
                    </label>
                    <input
                      type="date"
                      id="unlockDate"
                      required
                      value={unlockDate}
                      onChange={(e) => setUnlockDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-secondary transition-colors text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label htmlFor="unlockTime" className="block text-xs font-black text-gray-300 uppercase tracking-wider mb-2">
                      Unlock Time
                    </label>
                    <input
                      type="time"
                      id="unlockTime"
                      required
                      value={unlockTime}
                      onChange={(e) => setUnlockTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-secondary transition-colors text-sm font-semibold"
                    />
                  </div>
                  {unlockDate && !isDateValid && (
                    <p className="col-span-2 text-xs text-primary font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Unlock time must be in the future
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid}
                className={`w-full py-4 rounded-xl text-dark-bg font-extrabold text-base transition-all duration-300 shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                  isFormValid
                    ? 'bg-secondary hover:scale-[1.01] active:scale-95 shadow-secondary/15'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                {activeTabParam === 'direct' ? (
                  <>
                    <Send className="w-5 h-5" />
                    Send {amount || '...'} {selectedToken.symbol}
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5" />
                    Lock {amount || '...'} {selectedToken.symbol}
                  </>
                )}
              </button>
            </motion.form>
          ) : txStep === 'success' ? (
            <motion.div
              key="success-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-6 flex flex-col items-center"
            >
              <div className="p-4 bg-green-500/15 rounded-full text-green-400 mb-6 border border-green-500/30">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <h3 className="text-2xl font-black text-white tracking-tight mb-2">
                Pocket Money Sent!
              </h3>
              <p className="text-sm text-gray-300 max-w-sm mb-8 leading-relaxed">
                Your transaction has been mined successfully on Arc Testnet.
                {activeTabParam === 'direct'
                  ? ` Instantly transferred ${amount} ${selectedToken.symbol} to child address.`
                  : ` Safely locked ${amount} ${selectedToken.symbol} until the unlock milestone is reached.`}
              </p>

              {/* Details card */}
              <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2 mb-8 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Recipient:</span>
                  <span className="text-white font-mono">{childAddress.substring(0, 6)}...{childAddress.substring(38)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-bold">{amount} {selectedToken.symbol}</span>
                </div>
                {activeTabParam === 'lock' && unlockDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Unlock Date:</span>
                    <span className="text-secondary font-bold">{unlockDate} {unlockTime}</span>
                  </div>
                )}
                {executeHash && (
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-gray-400">Tx Receipt:</span>
                    <a
                      href={`https://testnet.arcscan.app/tx/${executeHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary hover:text-primary flex items-center gap-0.5 underline font-semibold"
                    >
                      View on ArcScan <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <button
                onClick={resetForm}
                className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
              >
                Send More Allowance
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="loading-error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-10 text-center"
            >
              {txStep === 'failed' ? (
                <>
                  <div className="p-4 bg-primary/10 rounded-full text-primary mb-6 border border-primary/30">
                    <AlertCircle className="w-12 h-12" />
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight mb-2">
                    Transaction Failed
                  </h3>
                  <p className="text-sm text-gray-300 max-w-sm mb-6 leading-relaxed">
                    {errorMessage || 'An error occurred during transaction execution.'}
                  </p>
                  <button
                    onClick={() => setTxStep('idle')}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Try Again
                  </button>
                </>
              ) : (
                <div className="space-y-6 w-full max-w-sm">
                  <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                  </div>

                  <h3 className="text-xl font-black text-white tracking-tight">
                    Confirming Transaction
                  </h3>

                  {/* Progressive Step display */}
                  <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-5 text-left text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-2 text-gray-300">
                        {txStep === 'approving' ? (
                          <Loader2 className="w-3.5 h-3.5 text-secondary animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        )}
                        Step 1: Approve Token Spend
                      </span>
                      {approveHash && (
                        <a
                          href={`https://testnet.arcscan.app/tx/${approveHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-secondary hover:underline flex items-center gap-0.5 font-semibold"
                        >
                          Tx <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`font-bold flex items-center gap-2 ${txStep === 'executing' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {txStep === 'executing' ? (
                          <Loader2 className="w-3.5 h-3.5 text-secondary animate-spin" />
                        ) : txStep === 'approved' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-gray-600" />
                        )}
                        Step 2: Smart Contract Deposit
                      </span>
                      {executeHash && (
                        <a
                          href={`https://testnet.arcscan.app/tx/${executeHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-secondary hover:underline flex items-center gap-0.5 font-semibold"
                        >
                          Tx <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 animate-pulse font-medium">
                    Please approve and confirm the transaction prompts in your wallet software. Do not close this page.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Parental Guarantee Box */}
      <div className="mt-8 flex items-center gap-3 bg-secondary/10 border border-secondary/20 rounded-2xl p-4 text-xs text-secondary max-w-md mx-auto">
        <ShieldCheck className="w-6 h-6 shrink-0 text-primary" />
        <p className="leading-relaxed">
          <strong>Smart Milestone Commitment:</strong> Once locked, funds can only be claimed by the child address when the unlock time is reached. The parent cannot override or withdraw early.
        </p>
      </div>
    </div>
  );
}
