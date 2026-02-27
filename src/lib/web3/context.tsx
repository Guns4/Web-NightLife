'use client';

/**
 * Web3 Context Provider
 * Phase 8: Web3 & Decentralized Vibe Economy
 * 
 * Provides:
 * - Wallet connection state
 * - Smart wallet management
 * - Token balances
 * - Transaction handling
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  DEFAULT_WALLET_STATE, 
  WalletState,
  NETWORK_CONFIG 
} from '@/lib/contracts';

// Types
interface Web3ContextType {
  // Wallet state
  wallet: WalletState;
  isConnecting: boolean;
  error: string | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
  
  // Smart wallet
  smartWalletAddress: string | null;
  isSmartWalletDeployed: boolean;
  
  // Balances
  maticBalance: string | null;
  vibeBalance: string | null;
  sbtData: any | null;
  
  // Actions
  sendTransaction: (to: string, amount: string) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(DEFAULT_WALLET_STATE);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [smartWalletAddress, setSmartWalletAddress] = useState<string | null>(null);
  const [isSmartWalletDeployed, setIsSmartWalletDeployed] = useState(false);
  const [maticBalance, setMaticBalance] = useState<string | null>(null);
  const [vibeBalance, setVibeBalance] = useState<string | null>(null);
  const [sbtData, setSbtData] = useState<any>(null);

  // Check for existing wallet on mount
  useEffect(() => {
    const checkExistingWallet = async () => {
      if (typeof window === 'undefined') return;
      
      // Check for injected provider (Metamask, etc.)
      const ethereum = (window as any).ethereum;
      if (ethereum) {
        try {
          const accounts = await ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const chainId = await ethereum.request({ method: 'eth_chainId' });
            setWallet({
              isConnected: true,
              address: accounts[0],
              chainId: parseInt(chainId, 16),
              balance: null,
            });
            
            // Fetch balance
            const balance = await ethereum.request({
              method: 'eth_getBalance',
              params: [accounts[0], 'latest']
            });
            setWallet(prev => ({
              ...prev,
              balance: (parseInt(balance, 16) / 1e18).toFixed(4)
            }));
          }
        } catch (err) {
          console.error('Error checking existing wallet:', err);
        }
      }
    };
    
    checkExistingWallet();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;
    
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== wallet.address) {
        setWallet(prev => ({
          ...prev,
          address: accounts[0]
        }));
      }
    };
    
    const handleChainChanged = (chainId: string) => {
      setWallet(prev => ({
        ...prev,
        chainId: parseInt(chainId, 16)
      }));
    };
    
    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);
    
    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [wallet.address]);

  const connect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        throw new Error('No wallet found. Please install MetaMask or another Web3 wallet.');
      }
      
      // Request account access
      const accounts = await ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      // Get chain ID
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      
      // Get balance
      const balance = await ethereum.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest']
      });
      
      setWallet({
        isConnected: true,
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        balance: (parseInt(balance, 16) / 1e18).toFixed(4)
      });
      
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setWallet(DEFAULT_WALLET_STATE);
    setSmartWalletAddress(null);
    setIsSmartWalletDeployed(false);
    setMaticBalance(null);
    setVibeBalance(null);
    setSbtData(null);
  };

  const switchChain = async (chainId: number) => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;
    
    const networkConfig = Object.values(NETWORK_CONFIG).find(n => n.chainId === chainId);
    if (!networkConfig) {
      throw new Error('Unsupported network');
    }
    
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
    } catch (err: any) {
      // Chain not added, add it
      if (err.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${chainId.toString(16)}`,
            chainName: networkConfig.name,
            nativeCurrency: networkConfig.nativeCurrency,
            rpcUrls: [networkConfig.rpc],
            blockExplorerUrls: [networkConfig.explorer]
          }]
        });
      } else {
        throw err;
      }
    }
  };

  const sendTransaction = async (to: string, amount: string): Promise<string> => {
    const ethereum = (window as any).ethereum;
    if (!ethereum || !wallet.address) {
      throw new Error('Wallet not connected');
    }
    
    const tx = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: wallet.address,
        to,
        value: `0x${(parseFloat(amount) * 1e18).toString(16)}`
      }]
    });
    
    return tx;
  };

  const signMessage = async (message: string): Promise<string> => {
    const ethereum = (window as any).ethereum;
    if (!ethereum || !wallet.address) {
      throw new Error('Wallet not connected');
    }
    
    const signature = await ethereum.request({
      method: 'personal_sign',
      params: [message, wallet.address]
    });
    
    return signature;
  };

  return (
    <Web3Context.Provider
      value={{
        wallet,
        isConnecting,
        error,
        connect,
        disconnect,
        switchChain,
        smartWalletAddress,
        isSmartWalletDeployed,
        maticBalance,
        vibeBalance,
        sbtData,
        sendTransaction,
        signMessage,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

export function useWallet() {
  const { wallet, isConnecting, error, connect, disconnect, switchChain } = useWeb3();
  return { wallet, isConnecting, error, connect, disconnect, switchChain };
}

export function useSmartWallet() {
  const { smartWalletAddress, isSmartWalletDeployed, connect } = useWeb3();
  return { smartWalletAddress, isSmartWalletDeployed, connect };
}

export function useBalances() {
  const { maticBalance, vibeBalance, sbtData } = useWeb3();
  return { maticBalance, vibeBalance, sbtData };
}

export function useWeb3Actions() {
  const { sendTransaction, signMessage } = useWeb3();
  return { sendTransaction, signMessage };
}
