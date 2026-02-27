'use client';

/**
 * DAO Governance Component
 * Phase 8: Web3 & Decentralized Vibe Economy
 * 
 * Features:
 * - View active proposals
 * - Cast votes
 * - View voting power
 * - Create proposals (for eligible users)
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Vote, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users,
  TrendingUp,
  Shield,
  ArrowRight,
  ChevronRight,
  Scale,
  Crown
} from 'lucide-react';
import { DAO_CONFIG } from '@/lib/contracts/dao-governance';

interface DAOGoveranceProps {
  votingPower?: number;
  proposals?: Proposal[];
  onVote?: (proposalId: string, support: 'for' | 'against' | 'abstain') => void;
  onCreateProposal?: () => void;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  type: string;
  status: 'pending' | 'active' | 'queued' | 'executed' | 'defeated';
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  totalVotes: number;
  quorumRequired: number;
  endsAt: Date;
}

// Mock proposals
const mockProposals: Proposal[] = [
  {
    id: '1',
    title: 'Expand to Bali',
    description: 'Vote for the next city expansion - Bali or Surabaya?',
    type: 'city_expansion',
    status: 'active',
    forVotes: 150000,
    againstVotes: 50000,
    abstainVotes: 10000,
    totalVotes: 210000,
    quorumRequired: 500000,
    endsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    title: 'DJ of the Month - February',
    description: 'Vote for your favorite DJ to be featured this month',
    type: 'dj_of_month',
    status: 'active',
    forVotes: 80000,
    againstVotes: 20000,
    abstainVotes: 5000,
    totalVotes: 105000,
    quorumRequired: 200000,
    endsAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    title: 'New Feature: Social Rooms',
    description: 'Proposal to add video chat rooms for users to connect before events',
    type: 'feature_proposal',
    status: 'pending',
    forVotes: 0,
    againstVotes: 0,
    abstainVotes: 0,
    totalVotes: 0,
    quorumRequired: 300000,
    endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  },
];

export default function DAOGoverance({
  votingPower = 1500,
  proposals = mockProposals,
  onVote,
  onCreateProposal,
}: DAOGoveranceProps) {
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [votingFor, setVotingFor] = useState<string | null>(null);
  
  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'executed': return 'bg-blue-500/20 text-blue-400';
      case 'defeated': return 'bg-red-500/20 text-red-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'queued': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };
  
  const getTimeRemaining = (endsAt: Date) => {
    const now = new Date();
    const diff = endsAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };
  
  const handleVote = async (proposalId: string, support: 'for' | 'against' | 'abstain') => {
    setVotingFor(proposalId);
    try {
      await onVote?.(proposalId, support);
    } finally {
      setVotingFor(null);
    }
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Scale className="w-8 h-8 text-purple-400" />
          The City Council
        </h2>
        <p className="text-white/60">Decentralized governance for NightLife</p>
      </div>
      
      {/* Voting Power Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20"
        >
          <div className="flex items-center justify-between mb-4">
            <Vote className="w-8 h-8 text-purple-400" />
            <span className="text-purple-400/60 text-xs">Your Power</span>
          </div>
          <p className="text-3xl font-bold text-white">{votingPower.toLocaleString()}</p>
          <p className="text-white/60 text-sm">Voting Power</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-400" />
            <span className="text-blue-400/60 text-xs">Threshold</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {(DAO_CONFIG.governance.proposalThreshold / 1000).toFixed(0)}K
          </p>
          <p className="text-white/60 text-sm">To Create Proposal</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/20"
        >
          <div className="flex items-center justify-between mb-4">
            <Crown className="w-8 h-8 text-yellow-400" />
            <span className="text-yellow-400/60 text-xs">Quorum</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {(DAO_CONFIG.governance.quorumThreshold / 1000).toFixed(0)}K
          </p>
          <p className="text-white/60 text-sm">Votes Required</p>
        </motion.div>
      </div>
      
      {/* Proposals */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Active Proposals</h3>
          {votingPower >= DAO_CONFIG.governance.proposalThreshold && (
            <button
              onClick={onCreateProposal}
              className="px-4 py-2 rounded-xl bg-purple-500 text-white text-sm font-medium hover:bg-purple-400 transition-colors flex items-center gap-2"
            >
              <Vote className="w-4 h-4" />
              New Proposal
            </button>
          )}
        </div>
        
        {proposals.map((proposal) => {
          const forPercentage = proposal.totalVotes > 0 
            ? (proposal.forVotes / proposal.totalVotes * 100) 
            : 0;
          const againstPercentage = proposal.totalVotes > 0 
            ? (proposal.againstVotes / proposal.totalVotes * 100) 
            : 0;
          const quorumProgress = Math.min(
            (proposal.totalVotes / proposal.quorumRequired) * 100,
            100
          );
          
          return (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(proposal.status)}`}>
                      {proposal.status.toUpperCase()}
                    </span>
                    <span className="text-white/40 text-xs uppercase">
                      {proposal.type.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold text-white">{proposal.title}</h4>
                  <p className="text-white/60 text-sm mt-1">{proposal.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {getTimeRemaining(proposal.endsAt)}
                  </p>
                </div>
              </div>
              
              {/* Progress Bars */}
              <div className="mb-4">
                <div className="flex h-3 rounded-full overflow-hidden bg-white/10">
                  <div 
                    className="bg-green-500" 
                    style={{ width: `${forPercentage}%` }}
                  />
                  <div 
                    className="bg-red-500" 
                    style={{ width: `${againstPercentage}%` }}
                  />
                  <div 
                    className="bg-gray-500" 
                    style={{ width: `${100 - forPercentage - againstPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-white/60">
                  <span>For: {proposal.forVotes.toLocaleString()}</span>
                  <span>Against: {proposal.againstVotes.toLocaleString()}</span>
                  <span>Abstain: {proposal.abstainVotes.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Quorum Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-white/60">Quorum Progress</span>
                  <span className="text-white">{quorumProgress.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      quorumProgress >= 100 ? 'bg-green-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${quorumProgress}%` }}
                  />
                </div>
              </div>
              
              {/* Vote Actions */}
              {proposal.status === 'active' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVote(proposal.id, 'for')}
                    disabled={votingFor === proposal.id}
                    className="flex-1 py-2 px-4 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Vote For
                  </button>
                  <button
                    onClick={() => handleVote(proposal.id, 'against')}
                    disabled={votingFor === proposal.id}
                    className="flex-1 py-2 px-4 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Vote Against
                  </button>
                  <button
                    onClick={() => handleVote(proposal.id, 'abstain')}
                    disabled={votingFor === proposal.id}
                    className="flex-1 py-2 px-4 rounded-xl bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Scale className="w-4 h-4" />
                    Abstain
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Governance Info */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-400" />
          <div>
            <p className="text-white font-medium">How It Works</p>
            <p className="text-white/60 text-sm">
              Diamond & Platinum members get voting power based on token holdings. 
              Proposals need {DAO_CONFIG.governance.quorumThreshold.toLocaleString()} votes to pass.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
