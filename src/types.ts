import { type Chain } from 'viem';

export const CONTRACT_ADDRESS = '0xE01E81a2114C87c89DD5599286720829A72A6C0e' as const;
export const OWNER_ADDRESS = '0xa8f8d0f7fb6ee13bfd6ed494065c4751d301ec1f' as const;
export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000' as const;
export const EURC_ADDRESS = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' as const;

export const TOKEN_LIST = [
  { symbol: 'USDC', address: USDC_ADDRESS, decimals: 6, color: '#FFD93D' },
  { symbol: 'EURC', address: EURC_ADDRESS, decimals: 6, color: '#FF6B6B' },
];

export interface Lock {
  id: bigint;
  parent: string;
  child: string;
  amount: bigint;
  token: string;
  unlockTime: bigint;
  claimed: boolean;
  createdAt: bigint;
}

export const arcTestnet: Chain = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { decimals: 6, name: 'USDC', symbol: 'USDC' },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
};

export const ARC_TROAD_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "name": "child", "type": "address" },
      { "name": "token", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "sendDirect",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "child", "type": "address" },
      { "name": "token", "type": "address" },
      { "name": "amount", "type": "uint256" },
      { "name": "unlockTime", "type": "uint256" }
    ],
    "name": "createLock",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "lockId", "type": "uint256" }
    ],
    "name": "claimLock",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "lockId", "type": "uint256" }
    ],
    "name": "getLock",
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "id", "type": "uint256" },
          { "name": "parent", "type": "address" },
          { "name": "child", "type": "address" },
          { "name": "amount", "type": "uint256" },
          { "name": "token", "type": "address" },
          { "name": "unlockTime", "type": "uint256" },
          { "name": "claimed", "type": "bool" },
          { "name": "createdAt", "type": "uint256" }
        ]
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "parent", "type": "address" }
    ],
    "name": "getParentLocks",
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "child", "type": "address" }
    ],
    "name": "getChildLocks",
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lockCounter",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const ERC20_ABI = [
  {
    "type": "function",
    "name": "balanceOf",
    "stateMutability": "view",
    "inputs": [{ "name": "account", "type": "address" }],
    "outputs": [{ "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "approve",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [{ "type": "bool" }]
  },
  {
    "type": "function",
    "name": "allowance",
    "stateMutability": "view",
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "spender", "type": "address" }
    ],
    "outputs": [{ "type": "uint256" }]
  },
  {
    "type": "function",
    "name": "symbol",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "type": "string" }]
  }
] as const;
