/**
 * WEB3 HOOKS
 * Phase 8: Web3 & Decentralized Vibe Economy
 * 
 * Custom hooks for Web3 functionality
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWeb3, useWallet } from './context';
import { 
  VIBE_TOKEN_CONFIG, 
  SBT_CONFIG, 
  NFT_PASS_CONFIG,
  DAO_CONFIG 
} from '@/lib/contracts';

/**
 * Hook to connect wallet with auto-retry
 */
export function useWalletConnect() {
  const { connect, isConnecting, error } = useWallet();
  const [isRetrying, setIsRetrying] = useState(false);
  
  const connectWithRetry = useCallback(async (retries: number = 3) => {
    setIsRetrying(true);
    for (let i = 0; i < retries; i++) {
      try {
        await connect();
        setIsRetrying(false);
        return true;
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    setIsRetrying(false);
    return false;
  }, [connect]);
  
  return { connect: connectWithRetry, isConnecting: isConnecting || isRetrying, error };
}

/**
 * Hook for VIBE token balance
 */
export function useVIBEBalance() {
  const { wallet } = useWeb3();
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!wallet.isConnected || !wallet.address) {
      setBalance(null);
      return;
    }
    
    const fetchBalance = async () => {
      setLoading(true);
      try {
        // In production, call smart contract
        // For demo, return mock balance
        setBalance('1000');
      } catch (err) {
        console.error('Error fetching VIBE balance:', err);
        setBalance(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBalance();
  }, [wallet.isConnected, wallet.address]);
  
  return { balance, loading };
}

/**
 * Hook for Soulbound Token data
 */
export function useSBT() {
  const { wallet } = useWeb3();
  const [sbtData, setSbtData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!wallet.isConnected || !wallet.address) {
      setSbtData(null);
      return;
    }
    
    const fetchSBT = async () => {
      setLoading(true);
      try {
        // In production, fetch from contract
        // For demo, return mock data
        setSbtData({
          tokenId: 1,
          reputationScore: 250,
          tier: 'influencer',
          achievements: ['first_steps', 'social_butterfly'],
          verifications: {
            age_21_plus: true,
          }
        });
      } catch (err) {
        console.error('Error fetching SBT:', err);
        setSbtData(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSBT();
  }, [wallet.isConnected, wallet.address]);
  
  return { sbtData, loading };
}

/**
 * Hook for NFT Passes
 */
export function useNFTPasses(venueId?: string) {
  const [passes, setPasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchPasses = async () => {
      setLoading(true);
      try {
        // In production, fetch from contract/database
        // For demo, return mock data
        setPasses([
          {
            id: '1',
            tier: 'gold',
            name: 'Gold Pass',
            venueName: 'Club XYZ',
            utilities: NFT_PASS_CONFIG.tiers.gold.utilities,
            isActive: true,
          }
        ]);
      } catch (err) {
        console.error('Error fetching NFT passes:', err);
        setPasses([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPasses();
  }, [venueId]);
  
  return { passes, loading };
}

/**
 * Hook for DAO governance
 */
export function useGovernance() {
  const { wallet } = useWeb3();
  const [proposals, setProposals] = useState<any[]>([]);
  const [votingPower, setVotingPower] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchProposals = async () => {
      setLoading(true);
      try {
        // Fetch active proposals
        setProposals([
          {
            id: 1,
            title: 'Expand to Bali',
            description: 'Vote for next city expansion',
            proposalType: 'city_expansion',
            status: 'active',
            forVotes: 150000,
            againstVotes: 50000,
            endBlock: Date.now() + 2 * 24 * 60 * 60 * 1000,
          }
        ]);
        
        // Fetch voting power
        if (wallet.isConnected) {
          setVotingPower(1000); // Mock
        }
      } catch (err) {
        console.error('Error fetching proposals:', err);
        setProposals([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProposals();
  }, [wallet.isConnected]);
  
  return { proposals, votingPower, loading };
}

/**
 * Hook for staking positions
 */
export function useStaking() {
  const { wallet } = useWeb3();
  const [positions, setPositions] = useState<any[]>([]);
  const [totalStaked, setTotalStaked] = useState<number>(0);
  const [pendingRewards, setPendingRewards] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchStaking = async () => {
      if (!wallet.isConnected) {
        setPositions([]);
        return;
      }
      
      setLoading(true);
      try {
        // Fetch staking positions
        setPositions([
          {
            venueId: '1',
            venueName: 'Club XYZ',
            amount: 500,
            pendingRewards: 25,
            lockEndTime: Date.now() + 5 * 24 * 60 * 60 * 1000,
            multiplier: 2,
          }
        ]);
        
        setTotalStaked(500);
        setPendingRewards(25);
      } catch (err) {
        console.error('Error fetching staking:', err);
        setPositions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStaking();
  }, [wallet.isConnected, wallet.address]);
  
  return { positions, totalStaked, pendingRewards, loading };
}

/**
 * Hook for gas estimation
 */
export function useGasEstimate() {
  const [gasPrice, setGasPrice] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchGasPrice = async () => {
      setLoading(true);
      try {
        const ethereum = (window as any).ethereum;
        if (ethereum) {
          const price = await ethereum.request({ 
            method: 'eth_gasPrice' 
          });
          setGasPrice((parseInt(price, 16) / 1e9).toFixed(2));
        }
      } catch (err) {
        console.error('Error fetching gas price:', err);
        setGasPrice('50'); // Default fallback
      } finally {
        setLoading(false);
      }
    };
    
    fetchGasPrice();
    const interval = setInterval(fetchGasPrice, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const estimateTransaction = (baseGas: number): string => {
    const gas = baseGas * parseFloat(gasPrice);
    return (gas / 1e9).toFixed(6); // Convert to MATIC
  };
  
  return { gasPrice, loading, estimateTransaction };
}

/**
 * Hook for network status
 */
export function useNetworkStatus() {
  const { wallet, switchChain } = useWeb3();
  
  const isCorrectNetwork = wallet.chainId === 137; // Polygon
  const isSupported = wallet.chainId === 137 || wallet.chainId === 80001; // Polygon or Mumbai
  
  const ensureCorrectNetwork = useCallback(async () => {
    if (!isCorrectNetwork) {
      await switchChain(137);
    }
  }, [isCorrectNetwork, switchChain]);
  
  return {
    isCorrectNetwork,
    isSupported,
    chainId: wallet.chainId,
    ensureCorrectNetwork,
  };
}

/**
 * Hook for transaction history
 */
export function useTransactionHistory() {
  const { wallet } = useWeb3();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!wallet.isConnected || !wallet.address) {
      setTransactions([]);
      return;
    }
    
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        // In production, fetch from indexer
        setTransactions([
          {
            hash: '0x123...',
            type: 'squad_table',
            amount: 500,
            status: 'settled',
            timestamp: Date.now() - 24 * 60 * 60 * 1000,
          }
        ]);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [wallet.isConnected, wallet.address]);
  
  return { transactions, loading };
}
